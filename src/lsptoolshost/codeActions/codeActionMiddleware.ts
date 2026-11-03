/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { ProvideCodeActionsSignature } from 'vscode-languageclient';
import { languageServerOptions } from '../../shared/options';

export async function provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken,
    next: ProvideCodeActionsSignature
) {
    const result = await next(document, range, context, token);
    return filterCodeActions(result, languageServerOptions.codeActionsExclude);
}

/**
 * Removes the code actions whose title matches one of the regular expressions (case-insensitive).
 * A pattern that is not a valid regular expression is ignored.
 */
export function filterCodeActions<T extends vscode.Command | vscode.CodeAction>(
    actions: T[] | null | undefined,
    patterns: readonly string[] | null | undefined
): T[] | null | undefined {
    if (!actions || !patterns || patterns.length === 0) {
        return actions;
    }

    const excluded: RegExp[] = [];
    for (const pattern of patterns) {
        try {
            excluded.push(new RegExp(pattern, 'i'));
        } catch {
            // Ignore an invalid pattern, the other ones still apply.
        }
    }

    return excluded.length === 0
        ? actions
        : actions.filter((action) => !excluded.some((regex) => regex.test(action.title)));
}
