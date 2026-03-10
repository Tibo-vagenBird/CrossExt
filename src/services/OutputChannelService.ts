import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel | undefined;

export function getOutputChannel(): vscode.OutputChannel {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('CrossExt');
    }
    return outputChannel;
}

export function showAndClear(): vscode.OutputChannel {
    const ch = getOutputChannel();
    ch.clear();
    ch.show(true);
    return ch;
}

export function dispose(): void {
    outputChannel?.dispose();
    outputChannel = undefined;
}
