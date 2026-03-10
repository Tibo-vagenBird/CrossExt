import { ChildProcess, spawn } from 'child_process';
import * as vscode from 'vscode';

export interface ProcessResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}

export function execute(
    exe: string,
    args: string[],
    cwd: string,
    outputChannel: vscode.OutputChannel,
    token?: vscode.CancellationToken
): Promise<ProcessResult> {
    return new Promise((resolve, reject) => {
        outputChannel.appendLine(`> ${exe} ${args.join(' ')}`);

        const proc: ChildProcess = spawn(exe, args, { cwd, shell: false });
        let stdout = '';
        let stderr = '';

        if (token) {
            token.onCancellationRequested(() => {
                proc.kill();
                reject(new Error('Cancelled'));
            });
        }

        proc.stdout?.on('data', (data: Buffer) => {
            const text = data.toString();
            stdout += text;
            outputChannel.append(text);
        });

        proc.stderr?.on('data', (data: Buffer) => {
            const text = data.toString();
            stderr += text;
            outputChannel.append(text);
        });

        proc.on('error', (err) => {
            reject(new Error(`Failed to start ${exe}: ${err.message}`));
        });

        proc.on('close', (code) => {
            resolve({ exitCode: code ?? 1, stdout, stderr });
        });
    });
}
