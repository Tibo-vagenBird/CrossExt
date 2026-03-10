import * as vscode from 'vscode';
import * as path from 'path';

export type ProjectType = 'C' | 'ASM';

export interface CrossExtConfig {
    call51Dir: string;
    c51Exe: string;
    a51Exe: string;
    l51Exe: string;
    stdIncDir: string;
    stdLibDir: string;
    defineFile: string;
    defineDir: string;
    stdIncMcs51Dir: string;
    libs: string[];
    flashToolPath: string;
    serialPort: string;
    mcuModel: string;
    memoryModel: string;
    projectType: ProjectType;
    extraCompilerArgs: string[];
    flashArgs: string[];
    autoBuildOnFlash: boolean;
    projectPath: string;
}

export function getConfig(extensionPath: string): CrossExtConfig {
    const cfg = vscode.workspace.getConfiguration('crossext');

    const call51Dir = cfg.get<string>('call51Path') || path.join(extensionPath, 'toolchain', 'Call51');
    const memoryModel = cfg.get<string>('memoryModel') || 'Small';
    const mcuModel = cfg.get<string>('mcuModel') || 'MODEFM8LB1';
    const projectType = (cfg.get<string>('projectType') || 'C') as ProjectType;

    const stdLibDir = path.join(call51Dir, 'LiB', memoryModel);
    const libs = [
        path.join(stdLibDir, 'libint.lib'),
        path.join(stdLibDir, 'liblong.lib'),
        path.join(stdLibDir, 'libfloat.lib'),
        path.join(stdLibDir, 'libc51.lib'),
    ];

    const extraStr = cfg.get<string>('extraCompilerArgs') || '';
    const extraCompilerArgs = extraStr.trim() ? extraStr.trim().split(/\s+/) : [];

    const flashArgsStr = cfg.get<string>('flashArgs') || '-f -r';
    const flashArgs = flashArgsStr.trim() ? flashArgsStr.trim().split(/\s+/) : [];

    return {
        call51Dir,
        c51Exe: path.join(call51Dir, 'Bin', 'c51.exe'),
        a51Exe: path.join(call51Dir, 'Bin', 'a51.exe'),
        l51Exe: path.join(call51Dir, 'Bin', 'l51.exe'),
        stdIncDir: path.join(call51Dir, 'Include'),
        stdLibDir,
        defineFile: path.join(call51Dir, 'Define', mcuModel),
        defineDir: path.join(call51Dir, 'Define'),
        stdIncMcs51Dir: path.join(call51Dir, 'Include', 'mcs51'),
        libs,
        flashToolPath: cfg.get<string>('flashToolPath') || path.join(extensionPath, 'toolchain', 'EFM8_prog', 'EFM8_prog.exe'),
        serialPort: cfg.get<string>('serialPort') || 'COM3',
        mcuModel,
        memoryModel,
        projectType,
        extraCompilerArgs,
        flashArgs,
        autoBuildOnFlash: cfg.get<boolean>('autoBuildOnFlash') ?? true,
        projectPath: cfg.get<string>('projectPath') || '',
    };
}
