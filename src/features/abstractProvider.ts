/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { OmniSharpServer } from '../omnisharp/server';
import CompositeDisposable from '../compositeDisposable';
import { LanguageMiddlewareFeature } from '../omnisharp/languageMiddlewareFeature';

<<<<<<< HEAD
export default abstract class AbstractProvider {
    protected _server: OmniSharpServer;
    protected _languageMiddlewareFeature: LanguageMiddlewareFeature;
    private _disposables: CompositeDisposable;

    constructor(server: OmniSharpServer, languageMiddlewareFeature: LanguageMiddlewareFeature) {
=======
import {OmniSharpServer} from '../omnisharp/server';
import {Disposable} from 'vscode';

export default class AbstractProvider {

    protected _server: OmniSharpServer;
    protected _disposables: Disposable[];

    constructor(server: OmniSharpServer) {
>>>>>>> origin/future
        this._server = server;
        this._languageMiddlewareFeature = languageMiddlewareFeature;
        this._disposables = new CompositeDisposable();
    }

    protected addDisposables(disposables: CompositeDisposable) {
        this._disposables.add(disposables);
    }

    dispose = () => {
        this._disposables.dispose();
    };
}
