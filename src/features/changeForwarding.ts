/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

<<<<<<< HEAD
import { Uri, workspace } from 'vscode';
import { OmniSharpServer } from '../omnisharp/server';
=======
'use strict';

import {Disposable, Uri, workspace} from 'vscode';
import {OmniSharpServer} from '../omnisharp/server';
>>>>>>> origin/future
import * as serverUtils from '../omnisharp/utils';
import { FileChangeType } from '../omnisharp/protocol';
import { IDisposable } from '../disposable';
import CompositeDisposable from '../compositeDisposable';

<<<<<<< HEAD
function forwardDocumentChanges(server: OmniSharpServer): IDisposable {
    return workspace.onDidChangeTextDocument((event) => {
        const { document, contentChanges } = event;
        if (
            document.isUntitled ||
            document.languageId !== 'csharp' ||
            document.uri.scheme !== 'file' ||
            contentChanges.length === 0
        ) {
=======
function forwardDocumentChanges(server: OmniSharpServer): Disposable {

    return workspace.onDidChangeTextDocument(event => {

        let {document} = event;
        if (document.isUntitled || document.languageId !== 'csharp') {
>>>>>>> origin/future
            return;
        }

        if (!server.isRunning()) {
            return;
        }

        serverUtils.updateBuffer(server, { Buffer: document.getText(), FileName: document.fileName }).catch((err) => {
            console.error(err);
            return err;
        });
    });
}

<<<<<<< HEAD
function forwardFileChanges(server: OmniSharpServer): IDisposable {
    function onFileSystemEvent(changeType: FileChangeType): (uri: Uri) => void {
        return function (uri: Uri) {
            if (!server.isRunning()) {
                return;
            }
=======
function forwardFileChanges(server: OmniSharpServer): Disposable {
>>>>>>> origin/future

            const req = { FileName: uri.fsPath, changeType };

            serverUtils.filesChanged(server, [req]).catch((err) => {
                console.warn(`[o] failed to forward file change event for ${uri.fsPath}`, err);
                return err;
            });
        };
    }

    function onFolderEvent(changeType: FileChangeType): (uri: Uri) => void {
        return async function (uri: Uri) {
            if (!server.isRunning()) {
                return;
            }

            if (changeType === FileChangeType.Delete) {
                const requests = [{ FileName: uri.fsPath, changeType: FileChangeType.DirectoryDelete }];

                serverUtils.filesChanged(server, requests).catch((err) => {
                    console.warn(`[o] failed to forward file change event for ${uri.fsPath}`, err);
                    return err;
                });
            }
        };
    }

    const watcher = workspace.createFileSystemWatcher('**/*.*');
    const d1 = watcher.onDidCreate(onFileSystemEvent(FileChangeType.Create));
    const d2 = watcher.onDidDelete(onFileSystemEvent(FileChangeType.Delete));
    const d3 = watcher.onDidChange(onFileSystemEvent(FileChangeType.Change));

    const watcherForFolders = workspace.createFileSystemWatcher('**/');
    const d4 = watcherForFolders.onDidDelete(onFolderEvent(FileChangeType.Delete));

    return new CompositeDisposable(watcher, d1, d2, d3, watcherForFolders, d4);
}

<<<<<<< HEAD
export default function forwardChanges(server: OmniSharpServer): IDisposable {
=======
export default function forwardChanges(server: OmniSharpServer): Disposable {

>>>>>>> origin/future
    // combine file watching and text document watching
    return new CompositeDisposable(forwardDocumentChanges(server), forwardFileChanges(server));
}
