import * as vscode from 'vscode';

class ActionItem extends vscode.TreeItem {
    constructor(
        label: string,
        icon: string,
        options?: {
            command?: vscode.Command;
            description?: string;
            collapsible?: vscode.TreeItemCollapsibleState;
        }
    ) {
        super(label, options?.collapsible ?? vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon(icon);
        if (options?.command) {
            this.command = options.command;
        }
        if (options?.description) {
            this.description = options.description;
        }
        this.tooltip = options?.description || label;
    }
}

type TreeNode = ActionItem & { _children?: ActionItem[] };

export class SidebarProvider implements vscode.TreeDataProvider<TreeNode> {
    private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    getTreeItem(element: TreeNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeNode): TreeNode[] {
        if (element?._children) {
            return element._children;
        }
        if (element) {
            return [];
        }

        const config = vscode.workspace.getConfiguration('crossext');
        const port = config.get<string>('serialPort', 'COM3');
        const mcu = config.get<string>('mcuModel', 'MODEFM8LB1');
        const memModel = config.get<string>('memoryModel', 'Small');
        const projectType = config.get<string>('projectType', 'C');
        const flashArgs = config.get<string>('flashArgs', '-f -r');
        const extraArgs = config.get<string>('extraCompilerArgs', '');

        // Actions
        const compileItem = this.makeAction('Compile', 'crossext.compile', 'gear', 'Ctrl+Shift+B');
        const flashItem = this.makeAction('Flash', 'crossext.flash', 'zap', 'Ctrl+Shift+F');

        // Settings group
        const settingsGroup = new ActionItem('Settings', 'settings-gear', {
            collapsible: vscode.TreeItemCollapsibleState.Expanded
        }) as TreeNode;

        settingsGroup._children = [
            this.makeSetting('Project Path', this.shortenPath(config.get<string>('projectPath', '')) || '(workspace)', 'root-folder', 'crossext.projectPath'),
            this.makeSetting('Project Type', projectType, 'file-code', 'crossext.projectType'),
            this.makeSetting('Serial Port', port, 'plug', 'crossext.serialPort'),
            this.makeSetting('MCU Model', mcu, 'cpu', 'crossext.mcuModel'),
            this.makeSetting('Memory Model', memModel, 'database', 'crossext.memoryModel'),
            this.makeSetting('Flash Args', flashArgs, 'terminal', 'crossext.flashArgs'),
            this.makeSetting('Compiler Args', extraArgs || '(none)', 'code', 'crossext.extraCompilerArgs'),
            this.makeSetting('Call51 Path', this.shortenPath(config.get<string>('call51Path', '')) || '(bundled)', 'folder', 'crossext.call51Path'),
            this.makeSetting('Flash Tool Path', this.shortenPath(config.get<string>('flashToolPath', '')) || '(bundled)', 'folder', 'crossext.flashToolPath'),
        ];

        return [compileItem, flashItem, settingsGroup];
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    private makeAction(label: string, commandId: string, icon: string, desc: string): TreeNode {
        return new ActionItem(label, icon, {
            command: { command: commandId, title: label },
            description: desc
        }) as TreeNode;
    }

    private makeSetting(label: string, value: string, icon: string, settingId: string): TreeNode {
        return new ActionItem(label, icon, {
            command: {
                command: 'workbench.action.openSettings',
                title: `Open ${label}`,
                arguments: [settingId]
            },
            description: value
        }) as TreeNode;
    }

    private shortenPath(p: string): string {
        if (!p) { return ''; }
        const parts = p.replace(/\\/g, '/').split('/');
        return parts.length > 2 ? '...' + '/' + parts.slice(-2).join('/') : p;
    }
}
