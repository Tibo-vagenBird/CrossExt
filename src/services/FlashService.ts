import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CrossExtConfig } from './ConfigurationService';
import { execute } from './ProcessExecutor';

export interface FlashResult {
    success: boolean;
}

export async function flash(
    config: CrossExtConfig,
    hexPath: string,
    workspaceRoot: string,
    outputChannel: vscode.OutputChannel,
    token?: vscode.CancellationToken
): Promise<FlashResult> {
    if (!fs.existsSync(hexPath)) {
        outputChannel.appendLine(`ERROR: Hex file not found: ${hexPath}`);
        return { success: false };
    }

    if (!fs.existsSync(config.flashToolPath)) {
        outputChannel.appendLine(`ERROR: Flash tool not found: ${config.flashToolPath}`);
        return { success: false };
    }

    const args: string[] = [
        `-p${config.serialPort}`,
        ...config.flashArgs,
        hexPath,
    ];

    // EFM8_prog may need ftd2xx.dll in its working directory or PATH
    const flashToolDir = path.dirname(config.flashToolPath);

    outputChannel.appendLine(`\n--- Flashing ${path.basename(hexPath)} ---`);
    const result = await execute(config.flashToolPath, args, flashToolDir, outputChannel, token);

    if (result.exitCode !== 0) {
        outputChannel.appendLine(`\nFlash FAILED (exit code ${result.exitCode}).`);
        return { success: false };
    }

    outputChannel.appendLine(`\nFlash succeeded.`);
    return { success: true };
}
