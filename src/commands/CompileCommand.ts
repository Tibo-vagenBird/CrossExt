import * as vscode from 'vscode';
import * as path from 'path';
import { getConfig } from '../services/ConfigurationService';
import { compile } from '../services/CompilationService';
import { showAndClear } from '../services/OutputChannelService';

export function register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('crossext.compile', async () => {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('CrossExt: No workspace folder open.');
            return false;
        }

        // Auto-save
        await vscode.workspace.saveAll(false);

        const config = getConfig(context.extensionPath);
        const projectRoot = config.projectPath || workspaceRoot;
        const outputChannel = showAndClear();
        outputChannel.appendLine(`CrossExt: Starting compilation in ${projectRoot}...\n`);

        const result = await compile(config, projectRoot, outputChannel);

        if (result.success) {
            vscode.window.showInformationMessage('CrossExt: Build succeeded.');
        } else {
            vscode.window.showErrorMessage(`CrossExt: Build failed (${result.errorCount} error(s)).`);
        }

        return result.success;
    });
}
