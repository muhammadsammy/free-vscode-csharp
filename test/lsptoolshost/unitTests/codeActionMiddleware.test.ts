/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, test, expect } from '@jest/globals';
import { filterCodeActions } from '../../../src/lsptoolshost/codeActions/codeActionMiddleware';

const actions = [
    { title: 'Extract base class...' },
    { title: 'Extract method' },
    { title: 'Extract local function' },
    { title: 'Generate constructor' },
];

// The filter only reads `title`, so plain objects stand in for vscode.CodeAction / vscode.Command.
const filter = (patterns: string[] | null | undefined) =>
    filterCodeActions(actions as never[], patterns)?.map((action: { title: string }) => action.title);

describe('filterCodeActions', () => {
    test('keeps everything without patterns', () => {
        expect(filter([])).toHaveLength(4);
        expect(filter(undefined)).toHaveLength(4);
        expect(filter(null)).toHaveLength(4);
    });

    test('removes the actions whose title matches a pattern', () => {
        expect(filter(['^Extract (base class|method)'])).toEqual(['Extract local function', 'Generate constructor']);
    });

    test('matches case-insensitively and with several patterns', () => {
        expect(filter(['extract local', 'CONSTRUCTOR$'])).toEqual(['Extract base class...', 'Extract method']);
    });

    test('ignores an invalid pattern and applies the others', () => {
        expect(filter(['(', '^Extract method'])).toEqual([
            'Extract base class...',
            'Extract local function',
            'Generate constructor',
        ]);
    });

    test('passes null and undefined results through', () => {
        expect(filterCodeActions(null, ['x'])).toBeNull();
        expect(filterCodeActions(undefined, ['x'])).toBeUndefined();
    });
});
