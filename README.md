<picture><source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/github/ci/muhammadsammy/free-vscode-csharp.png?variant=outline&size=sm&mode=dark"><img alt="CI" src="https://www.shieldcn.dev/github/ci/muhammadsammy/free-vscode-csharp.png?variant=outline&size=sm&mode=light"></picture>
<picture><source media="(prefers-color-scheme: dark)" src="https://www.shieldcn.dev/openvsx/downloads/muhammad-sammy/csharp.png?variant=branded&size=sm&mode=dark"><img alt="Downloads" src="https://www.shieldcn.dev/openvsx/downloads/muhammad-sammy/csharp.png?variant=branded&size=sm&mode=light"></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/github/release/muhammadsammy/free-vscode-csharp.png?size=sm&mode=dark&variant=outline"><img alt="Release" src="https://www.shieldcn.dev/github/release/muhammadsammy/free-vscode-csharp.png?size=sm&mode=light&variant=outline"></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/github/open-issues/muhammadsammy/free-vscode-csharp.png?variant=outline&size=sm&mode=dark"><img alt="Open issues" src="https://www.shieldcn.dev/github/open-issues/muhammadsammy/free-vscode-csharp.png?variant=outline&size=sm&mode=light"></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/github/open-prs/muhammadsammy/free-vscode-csharp.png?variant=outline&size=sm&mode=dark"><img alt="Open PRs" src="https://www.shieldcn.dev/github/open-prs/muhammadsammy/free-vscode-csharp.png?variant=outline&size=sm&mode=light"></picture>

# free-csharp-vscode

The debugger included in the official C# extension is [proprietary](https://aka.ms/VSCode-DotNet-DbgLicense) and is licensed to only work with Microsoft versions of vscode. This extension replaces it with Samsung's [MIT-licensed](https://github.com/Samsung/netcoredbg/blob/master/LICENSE) alternative, [NetCoreDbg](https://github.com/Samsung/netcoredbg).

## Installation

### Get the VSIX file

-   #### Prebuilt binaries

    -   This extension is published at [Open VSX](https://open-vsx.org/extension/muhammad-sammy/csharp).

    -   Download the vsix file from the [latest release](https://github.com/muhammadsammy/free-vscode-csharp/releases/latest) assests.

    -   Download the extension vsix from [latest commit CI](https://github.com/muhammadsammy/free-vscode-csharp/actions/workflows/ci.yml).

-   #### Build from source

    ```bash
    git clone https://github.com/muhammadsammy/free-vscode-csharp.git

    cd free-vscode-csharp

    # Make sure you have NodeJS (https://nodejs.org) installed.

    npm install

    npm run vscode:prepublish

    npm run vsix:release:package

    ```

### Install the extension

Open the editor then run `Extensions: Install from VSIX` from the command pallete and select the `csharp-VERSION_NUMBER.vsix` file.
