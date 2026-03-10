import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CrossExtConfig } from './ConfigurationService';
import { execute } from './ProcessExecutor';
import { parseAndSet } from './DiagnosticParser';

export interface CompileResult {
    success: boolean;
    hexPath: string;
    errorCount: number;
}

export async function compile(
    config: CrossExtConfig,
    workspaceRoot: string,
    outputChannel: vscode.OutputChannel,
    token?: vscode.CancellationToken
): Promise<CompileResult> {
    const buildDir = path.join(workspaceRoot, 'build');
    if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true, force: true });
    }
    fs.mkdirSync(buildDir, { recursive: true });

    if (config.projectType === 'ASM') {
        return compileAsm(config, workspaceRoot, buildDir, outputChannel, token);
    } else {
        return compileC(config, workspaceRoot, buildDir, outputChannel, token);
    }
}

async function compileC(
    config: CrossExtConfig,
    workspaceRoot: string,
    buildDir: string,
    outputChannel: vscode.OutputChannel,
    token?: vscode.CancellationToken
): Promise<CompileResult> {
    // Find all .c files — check src/ first, then workspace root
    const srcDir = fs.existsSync(path.join(workspaceRoot, 'src'))
        ? path.join(workspaceRoot, 'src')
        : workspaceRoot;

    const cFiles = fs.readdirSync(srcDir)
        .filter(f => f.endsWith('.c'))
        .map(f => path.join(srcDir, f));

    if (cFiles.length === 0) {
        outputChannel.appendLine('ERROR: No .c files found.');
        return { success: false, hexPath: '', errorCount: 1 };
    }

    // Check for project-local inc/ directory
    const incDir = fs.existsSync(path.join(workspaceRoot, 'inc'))
        ? path.join(workspaceRoot, 'inc')
        : null;

    let allOutput = '';
    const objFiles: string[] = [];

    // Compile each .c file
    for (const cFile of cFiles) {
        const baseName = path.basename(cFile, '.c');
        const objFile = path.join(buildDir, `${baseName}.obj`);
        objFiles.push(objFile);

        const args: string[] = ['-c'];

        if (incDir) {
            args.push(`-I${incDir}`);
        }
        args.push(`-I${config.stdIncDir}`);
        args.push(`-I${config.stdIncMcs51Dir}`);
        args.push(`-I${config.defineDir}`);

        // Extra user args
        args.push(...config.extraCompilerArgs);

        args.push('-o', objFile, cFile);

        outputChannel.appendLine(`--- Compiling ${path.basename(cFile)} ---`);
        const result = await execute(config.c51Exe, args, workspaceRoot, outputChannel, token);
        allOutput += result.stdout + '\n' + result.stderr + '\n';

        if (result.exitCode !== 0) {
            const errorCount = parseAndSet(allOutput, workspaceRoot);
            outputChannel.appendLine(`\nCompilation FAILED (${errorCount} error(s)).`);
            return { success: false, hexPath: '', errorCount: Math.max(errorCount, 1) };
        }
    }

    return link(config, objFiles, buildDir, workspaceRoot, allOutput, outputChannel, token);
}

async function compileAsm(
    config: CrossExtConfig,
    workspaceRoot: string,
    buildDir: string,
    outputChannel: vscode.OutputChannel,
    token?: vscode.CancellationToken
): Promise<CompileResult> {
    // Find all .asm files — check src/ first, then workspace root
    const srcDir = fs.existsSync(path.join(workspaceRoot, 'src'))
        ? path.join(workspaceRoot, 'src')
        : workspaceRoot;

    const asmFiles = fs.readdirSync(srcDir)
        .filter(f => f.endsWith('.asm') || f.endsWith('.a51'))
        .map(f => path.join(srcDir, f));

    if (asmFiles.length === 0) {
        outputChannel.appendLine('ERROR: No .asm or .a51 files found.');
        return { success: false, hexPath: '', errorCount: 1 };
    }

    // Check for project-local inc/ directory
    const incDir = fs.existsSync(path.join(workspaceRoot, 'inc'))
        ? path.join(workspaceRoot, 'inc')
        : null;

    let allOutput = '';
    let lastHexPath = '';

    // Assemble each .asm file directly to .hex (no -c flag, no linker needed)
    // a51.exe produces .hex, .lst next to the source file
    for (const asmFile of asmFiles) {
        const ext = path.extname(asmFile);
        const baseName = path.basename(asmFile, ext);

        const args: string[] = [asmFile];

        outputChannel.appendLine(`--- Assembling ${path.basename(asmFile)} ---`);
        const result = await execute(config.a51Exe, args, srcDir, outputChannel, token);
        allOutput += result.stdout + '\n' + result.stderr + '\n';

        if (result.exitCode !== 0) {
            const errorCount = parseAndSet(allOutput, workspaceRoot);
            outputChannel.appendLine(`\nAssembly FAILED (${errorCount} error(s)).`);
            return { success: false, hexPath: '', errorCount: Math.max(errorCount, 1) };
        }

        // Move output files from src/ to build/
        const srcDirPath = path.dirname(asmFile);
        for (const outExt of ['.hex', '.lst', '.obj']) {
            const srcFile = path.join(srcDirPath, `${baseName}${outExt}`);
            const destFile = path.join(buildDir, `${baseName}${outExt}`);
            if (fs.existsSync(srcFile) && srcFile !== destFile) {
                fs.renameSync(srcFile, destFile);
            }
        }
        // Remove _a51.bat artifact
        const batFile = path.join(srcDirPath, '_a51.bat');
        if (fs.existsSync(batFile)) {
            fs.unlinkSync(batFile);
        }

        lastHexPath = path.join(buildDir, `${baseName}.hex`);
    }

    const errorCount = parseAndSet(allOutput, workspaceRoot);

    if (!lastHexPath || !fs.existsSync(lastHexPath)) {
        outputChannel.appendLine(`\nAssembly finished but no hex file produced.`);
        return { success: false, hexPath: '', errorCount: Math.max(errorCount, 1) };
    }

    // Copy/rename to main.hex for flash command consistency
    const mainHex = path.join(buildDir, 'main.hex');
    if (lastHexPath !== mainHex) {
        fs.copyFileSync(lastHexPath, mainHex);
    }

    outputChannel.appendLine(`\nBuild succeeded → ${mainHex}`);
    return { success: true, hexPath: mainHex, errorCount: 0 };
}

async function link(
    config: CrossExtConfig,
    objFiles: string[],
    buildDir: string,
    workspaceRoot: string,
    allOutput: string,
    outputChannel: vscode.OutputChannel,
    token?: vscode.CancellationToken
): Promise<CompileResult> {
    const hexPath = path.join(buildDir, 'main.hex');
    const mapPath = path.join(buildDir, 'main.map');

    const linkArgs = [
        ...objFiles,
        // Only include C standard libs for C projects, not ASM
        ...(config.projectType === 'C' ? config.libs : []),
        '-hex', hexPath,
        '-map', mapPath,
    ];

    outputChannel.appendLine(`\n--- Linking ---`);
    const linkResult = await execute(config.l51Exe, linkArgs, workspaceRoot, outputChannel, token);
    allOutput += linkResult.stdout + '\n' + linkResult.stderr + '\n';

    const errorCount = parseAndSet(allOutput, workspaceRoot);
    const linkOutput = linkResult.stdout + '\n' + linkResult.stderr;
    const hasLinkError = /LINK ERROR/i.test(linkOutput);

    if (linkResult.exitCode !== 0 || hasLinkError) {
        outputChannel.appendLine(`\nLinking FAILED.`);
        return { success: false, hexPath: '', errorCount: Math.max(errorCount, 1) };
    }

    if (!fs.existsSync(hexPath)) {
        outputChannel.appendLine(`\nLinking finished but no hex file produced.`);
        return { success: false, hexPath: '', errorCount: 1 };
    }

    outputChannel.appendLine(`\nBuild succeeded → ${hexPath}`);
    return { success: true, hexPath, errorCount: 0 };
}
