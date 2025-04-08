/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as coreclrdebug from './coreclrDebug/activate';
import * as util from './common';
import * as vscode from 'vscode';
import { lt } from 'semver';
import { ActivationFailure } from './shared/loggingEvents';
import { CsharpChannelObserver } from './shared/observers/csharpChannelObserver';
import { CsharpLoggerObserver } from './shared/observers/csharpLoggerObserver';
import { EventStream } from './eventStream';
import { PlatformInformation } from './shared/platform';
import TelemetryReporter from '@vscode/extension-telemetry';
import { vscodeNetworkSettingsProvider } from './networkSettings';
import createOptionStream from './shared/observables/createOptionStream';
import { AbsolutePathPackage } from './packageManager/absolutePathPackage';
import { downloadAndInstallPackages } from './packageManager/downloadAndInstallPackages';
import IInstallDependencies from './packageManager/IInstallDependencies';
import { installRuntimeDependencies } from './installRuntimeDependencies';
import { isValidDownload } from './packageManager/isValidDownload';
import { MigrateOptions } from './shared/migrateOptions';
import { CSharpExtensionExports, OmnisharpExtensionExports } from './csharpExtensionExports';
import { getCSharpDevKit } from './utils/getCSharpDevKit';
import { commonOptions, omnisharpOptions } from './shared/options';
import { TelemetryEventNames } from './shared/telemetryEventNames';
import { checkDotNetRuntimeExtensionVersion } from './checkDotNetRuntimeExtensionVersion';
import { checkIsSupportedPlatform } from './checkSupportedPlatform';
import { activateOmniSharp } from './activateOmniSharp';
import { activateRoslyn } from './activateRoslyn';

export async function activate(
    context: vscode.ExtensionContext
): Promise<CSharpExtensionExports | OmnisharpExtensionExports | null> {
    // Start measuring the activation time
    const startActivation = process.hrtime();

    const csharpChannel = vscode.window.createOutputChannel('C#', { log: true });
    csharpChannel.trace('Activating C# Extension');

    util.setExtensionPath(context.extension.extensionPath);

    const aiKey = context.extension.packageJSON.contributes.debuggers[0].aiKey;
    const reporter = new TelemetryReporter(aiKey);
    // ensure it gets properly disposed. Upon disposal the events will be flushed.
    context.subscriptions.push(reporter);

    const eventStream = new EventStream();
    const csharpchannelObserver = new CsharpChannelObserver(csharpChannel);
    const csharpLogObserver = new CsharpLoggerObserver(csharpChannel);
    eventStream.subscribe(csharpchannelObserver.post);
    eventStream.subscribe(csharpLogObserver.post);

    let platformInfo: PlatformInformation;
    try {
        platformInfo = await PlatformInformation.GetCurrent();
    } catch (error) {
        eventStream.post(new ActivationFailure());
        throw error;
    }

    // Verify that the current platform is supported by the extension and inform the user if not.
    if (!checkIsSupportedPlatform(context, platformInfo)) {
        return null;
    }

    await checkDotNetRuntimeExtensionVersion(context);

    await MigrateOptions(vscode);
    const optionStream = createOptionStream(vscode);

    const requiredPackageIds: string[] = ['Debugger', 'Razor'];

    const csharpDevkitExtension = getCSharpDevKit();
    const useOmnisharpServer = !csharpDevkitExtension && commonOptions.useOmnisharpServer;
    if (useOmnisharpServer) {
        requiredPackageIds.push('OmniSharp');
    }

    const networkSettingsProvider = vscodeNetworkSettingsProvider(vscode);
    const useFramework = useOmnisharpServer && omnisharpOptions.useModernNet !== true;
    const installDependencies: IInstallDependencies = async (dependencies: AbsolutePathPackage[]) =>
        downloadAndInstallPackages(dependencies, networkSettingsProvider, eventStream, isValidDownload);

    const runtimeDependenciesExist = await installRuntimeDependencies(
        context.extension.packageJSON,
        context.extension.extensionPath,
        installDependencies,
        eventStream,
        platformInfo,
        useFramework,
        requiredPackageIds
    );

    const getCoreClrDebugPromise = async (languageServerStartedPromise: Promise<void>) => {
        let coreClrDebugPromise = Promise.resolve();
        if (runtimeDependenciesExist) {
            // activate coreclr-debug
            coreClrDebugPromise = coreclrdebug.activate(
                context.extension,
                context,
                platformInfo,
                eventStream,
                csharpChannel,
                languageServerStartedPromise
            );
        }

        return coreClrDebugPromise;
    };

    let exports: CSharpExtensionExports | OmnisharpExtensionExports;
    if (!useOmnisharpServer) {
        exports = activateRoslyn(
            context,
            platformInfo,
            optionStream,
            eventStream,
            csharpChannel,
            reporter,
            csharpDevkitExtension,
            getCoreClrDebugPromise
        );
    } else {
        exports = activateOmniSharp(
            context,
            platformInfo,
            optionStream,
            networkSettingsProvider,
            eventStream,
            csharpChannel,
            dotnetTestChannel,
            dotnetChannel,
            reporter
        );

        if (!razorOptions.razorDevMode) {
            omnisharpRazorPromise = activateRazorExtension(
                context,
                context.extension.extensionPath,
                eventStream,
                undefined,
                platformInfo,
                /* useOmnisharpServer */ true
            );
        }
    }

    if (!isSupportedPlatform(platformInfo)) {
        // Check to see if VS Code is running remotely
        if (context.extension.extensionKind === vscode.ExtensionKind.Workspace) {
            const setupButton: ActionOption = {
                title: vscode.l10n.t('How to setup Remote Debugging'),
                action: async () => {
                    const remoteDebugInfoURL =
                        'https://github.com/dotnet/vscode-csharp/wiki/Remote-Debugging-On-Linux-Arm';
                    await vscode.env.openExternal(vscode.Uri.parse(remoteDebugInfoURL));
                },
            };
            const errorMessage = vscode.l10n.t(
                `The C# extension for Visual Studio Code is incompatible on {0} {1} with the VS Code Remote Extensions. To see avaliable workarounds, click on '{2}'.`,
                platformInfo.platform,
                platformInfo.architecture,
                setupButton.title
            );
            showErrorMessage(vscode, errorMessage, setupButton);
        } else {
            const errorMessage = vscode.l10n.t(
                'The C# extension for Visual Studio Code is incompatible on {0} {1}.',
                platformInfo.platform,
                platformInfo.architecture
            );
            showErrorMessage(vscode, errorMessage);
        }

        // Unsupported platform
        return null;
    }

    let coreClrDebugPromise = Promise.resolve();
    if (runtimeDependenciesExist) {
        // activate coreclr-debug
        coreClrDebugPromise = coreclrdebug.activate(
            context.extension,
            context,
            platformInfo,
            eventStream,
            csharpChannel,
            roslynLanguageServerStartedPromise ?? omnisharpLangServicePromise
        );
    }

    if (!useOmnisharpServer) {
        debugSessionTracker.initializeDebugSessionHandlers(context);

        tryGetCSharpDevKitExtensionExports(csharpLogObserver);

        // If we got here, the server should definitely have been created.
        util.isNotNull(roslynLanguageServerStartedPromise);
        util.isNotNull(projectInitializationCompletePromise);

        const languageServerExport = new RoslynLanguageServerExport(roslynLanguageServerStartedPromise);
        return {
            initializationFinished: async () => {
                await coreClrDebugPromise;
                await razorLanguageServerStartedPromise;
                await roslynLanguageServerStartedPromise;
                await projectInitializationCompletePromise;
            },
            profferBrokeredServices: (container) =>
                profferBrokeredServices(context, container, roslynLanguageServerStartedPromise!),
            logDirectory: context.logUri.fsPath,
            determineBrowserType: BlazorDebugConfigurationProvider.determineBrowserType,
            experimental: {
                sendServerRequest: async (t, p, ct) => await languageServerExport.sendRequest(t, p, ct),
                languageServerEvents: roslynLanguageServerEvents,
            },
            getComponentFolder: (componentName) => {
                return getComponentFolder(componentName, languageServerOptions);
            },
        };
    } else {
        return {
            initializationFinished: async () => {
                const langService = await omnisharpLangServicePromise;
                await langService!.server.waitForInitialize();
                await coreClrDebugPromise;

                if (omnisharpRazorPromise) {
                    await omnisharpRazorPromise;
                }
            },
            getAdvisor: async () => {
                const langService = await omnisharpLangServicePromise;
                return langService!.advisor;
            },
            getTestManager: async () => {
                const langService = await omnisharpLangServicePromise;
                return langService!.testManager;
            },
            eventStream,
            logDirectory: context.logUri.fsPath,
        };
    }
}

/**
 * This method will try to get the CSharpDevKitExports through a thenable promise,
 * awaiting `activate` will cause this extension's activation to hang.
 */
function tryGetCSharpDevKitExtensionExports(csharpLogObserver: CsharpLoggerObserver): void {
    const ext = getCSharpDevKit();
    ext?.activate().then(
        async (exports: CSharpDevKitExports) => {
            if (exports && exports.serviceBroker) {
                // When proffering this IServiceBroker into our own container,
                // we list the monikers of the brokered services we expect to find there.
                // This list must be a subset of the monikers previously registered with our own container
                // as defined in the getBrokeredServiceContainer function.
                getBrokeredServiceContainer().profferServiceBroker(exports.serviceBroker, [
                    Descriptors.dotnetDebugConfigurationService.moniker,
                ]);

                // Notify the vsdbg configuration provider that C# dev kit has been loaded.
                exports.serverProcessLoaded(async () => {
                    await debugSessionTracker.onCsDevKitInitialized(await exports.getBrokeredServiceServerPipeName());
                });

                await vscode.commands.executeCommand('setContext', 'dotnet.debug.serviceBrokerAvailable', true);
            } else {
                csharpLogObserver.logger.appendLine(
                    `[ERROR] '${csharpDevkitExtensionId}' activated but did not return expected Exports.`
                );
            }
        },
        () => {
            csharpLogObserver.logger.appendLine(`[ERROR] Failed to activate '${csharpDevkitExtensionId}'`);
        }
    );
}

function profferBrokeredServices(
    context: vscode.ExtensionContext,
    serviceContainer: GlobalBrokeredServiceContainer,
    languageServerPromise: Promise<RoslynLanguageServer>
) {
    context.subscriptions.push(
        serviceContainer.profferServiceFactory(
            Descriptors.solutionSnapshotProviderRegistration,
            (_mk, _op, _sb) => new SolutionSnapshotProvider(languageServerPromise)
        ),
        serviceContainer.profferServiceFactory(
            Descriptors.csharpExtensionBuildResultService,
            (_mk, _op, _sb) => new BuildResultDiagnostics(languageServerPromise)
        )
    );
}

function isSupportedPlatform(platform: PlatformInformation): boolean {
    if (platform.isWindows()) {
        return platform.architecture === 'x86_64' || platform.architecture === 'arm64';
    }

    if (platform.isMacOS()) {
        return true;
    }

    if (platform.isLinux()) {
        return (
            platform.architecture === 'x86_64' ||
            platform.architecture === 'x86' ||
            platform.architecture === 'i686' ||
            platform.architecture === 'arm64'
        );
    }

    return false;
}

async function ensureRuntimeDependencies(
    extension: vscode.Extension<CSharpExtensionExports>,
    eventStream: EventStream,
    platformInfo: PlatformInformation,
    installDependencies: IInstallDependencies,
    useFramework: boolean,
    requiredPackageIds: string[]
): Promise<boolean> {
    return installRuntimeDependencies(
        extension.packageJSON,
        extension.extensionPath,
        installDependencies,
        eventStream,
        platformInfo,
        useFramework,
        requiredPackageIds
    );
}

async function initializeDotnetPath(): Promise<void> {
    const dotnetPackApi = await getDotnetPackApi();
    if (dotnetPackApi !== undefined) {
        await dotnetPackApi.getDotnetPath();
    }
}
