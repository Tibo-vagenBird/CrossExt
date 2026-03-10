# CrossExt — 8051 Compile & Flash

A VSCode extension that bundles the Call51 compiler toolchain and EFM8_prog flash programmer, providing one-click compilation and flashing for 8051/EFM8 microcontroller projects. Designed for course use — no manual toolchain setup required.

## Features

- **One-click compile** — Compile C or Assembly projects for 8051-compatible MCUs directly from VSCode
- **One-click flash** — Program the compiled `.hex` file to your board via serial/USB
- **Inline diagnostics** — Compiler errors and warnings appear directly in the editor
- **Bundled toolchain** — Call51 compiler and EFM8_prog are included; no separate installation needed
- **Sidebar panel** — Quick-access buttons for compile, flash, and settings

## Supported MCUs

The default target is **EFM8LB1 (Silicon Labs EFM8 Lazy Bee)**. Other supported targets include:

- Standard 8051/8052 (MOD51, MOD52)
- EFM8LB1 (Silicon Labs)
- N76E003 (Nuvoton)
- F38x (SiLabs C8051F38x)
- AT89 series, ADuC8xx, and more

See the full list in `toolchain/Call51/Define/`.

## Installation

1. Download the `.vsix` file from Releases (or build it yourself).
2. In VSCode, open the Command Palette (`Ctrl+Shift+P`) and run **Extensions: Install from VSIX...**.
3. Select the downloaded `crossext-x.x.x.vsix` file.
4. Reload VSCode.

### Driver Setup

The flash programmer uses FTDI USB. If your board connects via an FTDI chip, install the [FTDI VCP driver](https://ftdichip.com/drivers/vcp-drivers/) and note the assigned COM port.

## Quick Start

1. Open your project folder in VSCode. The folder should have this structure:

   ```
   your-project/
   ├── src/          # Source files (.c or .asm/.a51)
   └── inc/          # Header files (.h) (optional)
   ```

2. Open the **CrossExt** sidebar (chip icon in the activity bar).
3. Click **Compile** (or press `Ctrl+Shift+B`).
4. Click **Flash** (or press `Ctrl+Shift+F`).

Compiled output is placed in a `build/` directory inside your project.

## Configuration

All settings are under `crossext.*` in VSCode Settings (`Ctrl+,`).

| Setting | Default | Description |
|---------|---------|-------------|
| `crossext.projectPath` | workspace root | Path to project folder containing `src/` and `inc/` |
| `crossext.serialPort` | `COM3` | Serial port for flashing |
| `crossext.mcuModel` | `MODEFM8LB1` | MCU model (matches a file in `Call51/Define/`) |
| `crossext.memoryModel` | `Small` | Memory model: `Small`, `Medium`, or `Large` |
| `crossext.projectType` | `C` | Project type: `C` or `ASM` |
| `crossext.extraCompilerArgs` | (empty) | Additional flags passed to `c51.exe` |
| `crossext.flashArgs` | `-f -r` | Additional flags passed to `EFM8_prog.exe` |
| `crossext.call51Path` | (bundled) | Override path to Call51 directory |
| `crossext.flashToolPath` | (bundled) | Override path to `EFM8_prog.exe` |

### Switching MCU Target

Change `crossext.mcuModel` to match the definition file name in `toolchain/Call51/Define/`. For example, set it to `MODN76E003` for a Nuvoton N76E003 board.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+B` | Compile |
| `Ctrl+Shift+F` | Flash |

## Project Structure (for developers)

```
crossext/
├── src/
│   ├── extension.ts                  # Entry point
│   ├── commands/
│   │   ├── CompileCommand.ts         # Compile command handler
│   │   └── FlashCommand.ts           # Flash command handler
│   ├── services/
│   │   ├── CompilationService.ts     # C/ASM compilation & linking
│   │   ├── FlashService.ts           # Serial flash programming
│   │   ├── ConfigurationService.ts   # Settings & path resolution
│   │   ├── DiagnosticParser.ts       # Error/warning parsing
│   │   ├── ProcessExecutor.ts        # Child process execution
│   │   └── OutputChannelService.ts   # Output channel management
│   └── views/
│       └── SidebarProvider.ts        # Sidebar tree view
├── toolchain/
│   ├── Call51/                       # 8051 C compiler & assembler
│   ├── EFM8_prog/                    # Flash programmer
│   └── ftd2xx.dll                    # FTDI USB driver
├── media/
│   └── icon.svg                      # Extension icon
└── package.json                      # Extension manifest
```

## Build from Source

```bash
npm install
npm run compile
npx @vscode/vsce package
```

This produces a `.vsix` file you can install.

## Troubleshooting

**"Serial port not found" or flash fails**
- Check that the correct COM port is set in `crossext.serialPort`.
- Verify the FTDI driver is installed and the board is connected.
- Open Device Manager to confirm the port number.

**Compilation errors not showing in editor**
- Make sure source files are inside the `src/` folder of your project.
- Check the **CrossExt** output channel (`View > Output`, select "CrossExt") for raw compiler output.

**Wrong MCU registers / undefined SFR**
- Change `crossext.mcuModel` to match your target board.

## Toolchain Credits

- **Call51** — 8051 C compiler and assembler (GNU GPL v2). Documentation in `toolchain/Call51/Doc/`.
- **EFM8_prog** — EFM8 flash programmer using FTDI FTD2XX library.

## License

See [LICENSE](LICENSE) for details. The bundled Call51 toolchain is distributed under the GNU GPL v2.
