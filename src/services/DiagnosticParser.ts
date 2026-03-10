import * as vscode from 'vscode';
import * as path from 'path';

const ERROR_PATTERN = /^(.+?):(\d+):\s*(error|warning)\s+\d+:\s*(.+)$/;

let diagnosticCollection: vscode.DiagnosticCollection | undefined;

export function getDiagnosticCollection(): vscode.DiagnosticCollection {
    if (!diagnosticCollection) {
        diagnosticCollection = vscode.languages.createDiagnosticCollection('crossext');
    }
    return diagnosticCollection;
}

export function parseAndSet(output: string, workspaceRoot: string): number {
    const collection = getDiagnosticCollection();
    collection.clear();

    const diagnosticsMap = new Map<string, vscode.Diagnostic[]>();
    let errorCount = 0;

    // Parse both stdout and stderr combined
    for (const line of output.split(/\r?\n/)) {
        const match = line.match(ERROR_PATTERN);
        if (!match) continue;

        const [, rawFile, lineStr, severity, message] = match;
        const lineNum = Math.max(0, parseInt(lineStr, 10) - 1);
        const filePath = path.isAbsolute(rawFile) ? rawFile : path.join(workspaceRoot, rawFile);

        const diag = new vscode.Diagnostic(
            new vscode.Range(lineNum, 0, lineNum, 1000),
            message.trim(),
            severity === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
        );
        diag.source = 'c51';

        if (!diagnosticsMap.has(filePath)) {
            diagnosticsMap.set(filePath, []);
        }
        diagnosticsMap.get(filePath)!.push(diag);

        if (severity === 'error') errorCount++;
    }

    for (const [filePath, diags] of diagnosticsMap) {
        collection.set(vscode.Uri.file(filePath), diags);
    }

    return errorCount;
}

export function dispose(): void {
    diagnosticCollection?.dispose();
    diagnosticCollection = undefined;
}
