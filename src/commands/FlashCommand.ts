import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getConfig } from '../services/ConfigurationService';
import { flash } from '../services/FlashService';
import { showAndClear } from '../services/OutputChannelService';

export function register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('crossext.flash', async () => {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('CrossExt: No workspace folder open.');
            return false;
        }

        const config = getConfig(context.extensionPath);
        const projectRoot = config.projectPath || workspaceRoot;
        const hexPath = path.join(projectRoot, 'build', 'main.hex');

        if (!fs.existsSync(hexPath)) {
            vscode.window.showErrorMessage('CrossExt: No build/main.hex found. Compile first.');
            return false;
        }

        const outputChannel = showAndClear();
        outputChannel.appendLine('CrossExt: Starting flash...\n');

        const result = await flash(config, hexPath, projectRoot, outputChannel);

        if (result.success) {
            vscode.window.showInformationMessage('CrossExt: Flash succeeded.');
        } else {
            vscode.window.showErrorMessage('CrossExt: Flash failed.');
        }

        return result.success;
    });
}
