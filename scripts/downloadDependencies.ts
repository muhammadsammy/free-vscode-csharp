/**
 * Standalone script to download all runtime dependencies declared in package.json.
 * Wraps the same modules the extension uses at runtime so that unpacking logic is identical.
 *
 * Usage:
 *   npm run download-dependencies
 *
 * The dependencies are installed under the `dist/` directory at the repository root so that
 * the resulting VSIX can be used in air-gapped environments without any further network access.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventStream } from '../src/eventStream';
import { downloadAndInstallPackages } from '../src/packageManager/downloadAndInstallPackages';
import { getRuntimeDependenciesPackages } from '../src/tools/runtimeDependencyPackageUtils';
import { AbsolutePathPackage } from '../src/packageManager/absolutePathPackage';
import { filterPlatformPackages } from '../src/packageManager/packageFilterer';
import { isValidDownload } from '../src/packageManager/isValidDownload';
import { PlatformInformation } from '../src/shared/platform';
import NetworkSettings from '../src/networkSettings';
import type { NetworkSettingsProvider } from '../src/networkSettings';
import {
    BaseEvent,
    DownloadStart,
    DownloadSuccess,
    DownloadFailure,
    DownloadProgress,
    DownloadSizeObtained,
    InstallationFailure,
    IntegrityCheckFailure,
    DownloadFallBack,
} from '../src/shared/loggingEvents';
import { EventType } from '../src/shared/eventType';

const packageJSON = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
) as Record<string, unknown>;

/** Output directory – all packages are installed relative to this path. */
const distPath = path.resolve(__dirname, '..', 'dist');

/**
 * Target platform for dependency filtering.
 * To override, replace `PlatformInformation.GetCurrent()` with a custom instance, e.g.:
 * ```ts
 * new PlatformInformation('linux', 'x86_64')
 * ```
 */
const platformInfo = PlatformInformation.GetCurrent();

/** Maps EventStream events to human-readable console output. */
function logEvent(event: BaseEvent): void {
    switch (event.type) {
        case EventType.PackageInstallStart:
            console.log('\nStarting dependency downloads...');
            break;

        case EventType.DownloadStart:
            process.stdout.write(`\nDownloading ${(event as DownloadStart).packageDescription}...`);
            break;

        case EventType.DownloadSizeObtained: {
            const mb = ((event as DownloadSizeObtained).packageSize / 1024 / 1024).toFixed(1);
            process.stdout.write(` (${mb} MB)`);
            break;
        }

        case EventType.DownloadProgress: {
            const pct = Math.floor((event as DownloadProgress).downloadPercentage);
            if (pct % 10 === 0) {
                process.stdout.write(` ${pct}%`);
            }
            break;
        }

        case EventType.DownloadSuccess:
            console.log(` ✓ ${(event as DownloadSuccess).message}`);
            break;

        case EventType.DownloadFailure:
            console.error(` ✗ ${(event as DownloadFailure).message}`);
            break;

        case EventType.DownloadFallBack:
            console.log(`\n  Trying fallback URL: ${(event as DownloadFallBack).fallbackUrl}`);
            break;

        case EventType.InstallationFailure: {
            const e = event as InstallationFailure;
            console.error(`\nInstallation failed at stage '${e.stage}': ${e.error}`);
            break;
        }

        case EventType.IntegrityCheckFailure: {
            const e = event as IntegrityCheckFailure;
            console.warn(
                `\n  Integrity check failed for ${e.packageDescription}${e.retry ? ' – retrying' : ''}`
            );
            break;
        }

        case EventType.InstallationSuccess:
            console.log('  Installed successfully.');
            break;
    }
}

async function main(): Promise<void> {
    const eventStream = new EventStream();
    eventStream.subscribe(logEvent);

    // Honour standard proxy environment variables; fall back to no proxy.
    const proxy = process.env['HTTP_PROXY'] ?? process.env['http_proxy'] ?? '';
    const networkSettingsProvider: NetworkSettingsProvider = () => new NetworkSettings(proxy, true);

    // Retrieve every package declared in runtimeDependencies
    const packages = getRuntimeDependenciesPackages(packageJSON);
    const absolutePackages = packages.map((pkg) =>
        AbsolutePathPackage.getAbsolutePathPackage(pkg, distPath)
    );
    const filteredPackages = filterPlatformPackages(absolutePackages, platformInfo);

    console.log(
        `Installing ${filteredPackages.length} of ${absolutePackages.length} runtime dependencies` +
        ` for ${platformInfo.platform}/${platformInfo.architecture} to '${distPath}'...`
    );

    const results = await downloadAndInstallPackages(
        filteredPackages,
        networkSettingsProvider,
        eventStream,
        isValidDownload
    );

    const failed = Object.entries(results)
        .filter(([, ok]) => !ok)
        .map(([id]) => id);

    if (failed.length > 0) {
        console.error(`\nFailed to install: ${failed.join(', ')}`);
        process.exit(1);
    }

    console.log('\nAll runtime dependencies downloaded successfully!');
}

main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
});
