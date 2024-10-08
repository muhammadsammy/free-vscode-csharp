/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ITestAssetWorkspace } from '../../../lsptoolshost/integrationTests/testAssets/testAssets';

const workspace: ITestAssetWorkspace = {
    description: 'Basic Razor app',
    projects: [
        {
            relativeFilePath: 'BasicRazorApp2_1.csproj',
        },
    ],
};

export default workspace;
