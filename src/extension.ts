import * as vscode from 'vscode';
import * as CompileCommand from './commands/CompileCommand';
import * as FlashCommand from './commands/FlashCommand';
import { SidebarProvider } from './views/SidebarProvider';
import { dispose as disposeOutput } from './services/OutputChannelService';
import { dispose as disposeDiagnostics } from './services/DiagnosticParser';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(CompileCommand.register(context));
    context.subscriptions.push(FlashCommand.register(context));

    const sidebarProvider = new SidebarProvider();
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('crossext.actionsView', sidebarProvider)
    );

    // Refresh sidebar when settings change
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('crossext')) {
                sidebarProvider.refresh();
            }
        })
    );

    console.log('CrossExt activated');
}

export function deactivate() {
    disposeOutput();
    disposeDiagnostics();
}
