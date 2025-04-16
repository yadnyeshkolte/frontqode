// src/menu.ts
import { app, Menu, BrowserWindow, dialog, shell } from 'electron';
import FileSystemService from './services/FileSystemService';

const fileSystemService = new FileSystemService();

export function setupApplicationMenu(mainWindow: BrowserWindow) {
    const isMac = process.platform === 'darwin';

    const template: Electron.MenuItemConstructorOptions[] = [
        // File Menu
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Project',
                    accelerator: 'CmdOrCtrl+N',
                    click: async () => {
                        mainWindow.webContents.send('menu-new-project');
                    }
                },
                {
                    label: 'Open Project',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        try {
                            const projectPath = fileSystemService.openProjectDialog();
                            if (projectPath) {
                                mainWindow.webContents.send('menu-open-project', projectPath);
                            }
                        } catch (error) {
                            console.error('Failed to open project:', error);
                        }
                    }
                },
                {
                    label: 'Clone Repository',
                    click: () => {
                        mainWindow.webContents.send('menu-clone-repo');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow.webContents.send('menu-save-file');
                    }
                },
                {
                    label: 'Save As...',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => {
                        mainWindow.webContents.send('menu-save-file-as');
                    }
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },

        // Edit Menu
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'delete' },
                { type: 'separator' },
                { role: 'selectAll' }
            ]
        },

        // View Menu
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },

        // Code Menu
        {
            label: 'Code',
            submenu: [
                {
                    label: 'Format Document',
                    accelerator: 'Alt+Shift+F',
                    click: () => {
                        mainWindow.webContents.send('menu-format-document');
                    }
                },
                {
                    label: 'Comment Selection',
                    accelerator: 'CmdOrCtrl+/',
                    click: () => {
                        mainWindow.webContents.send('menu-comment-selection');
                    }
                }
            ]
        },

        // Navigate Menu
        {
            label: 'Navigate',
            submenu: [
                {
                    label: 'Go to File',
                    accelerator: 'CmdOrCtrl+P',
                    click: () => {
                        mainWindow.webContents.send('menu-goto-file');
                    }
                },
                {
                    label: 'Go to Line',
                    accelerator: 'CmdOrCtrl+G',
                    click: () => {
                        mainWindow.webContents.send('menu-goto-line');
                    }
                }
            ]
        },

        // Git Menu
        {
            label: 'Git',
            submenu: [
                {
                    label: 'Initialize Repository',
                    click: () => {
                        mainWindow.webContents.send('menu-git-init');
                    }
                },
                {
                    label: 'Commit Changes',
                    click: () => {
                        mainWindow.webContents.send('menu-git-commit');
                    }
                },
                {
                    label: 'Push',
                    click: () => {
                        mainWindow.webContents.send('menu-git-push');
                    }
                },
                {
                    label: 'Pull',
                    click: () => {
                        mainWindow.webContents.send('menu-git-pull');
                    }
                }
            ]
        },

        // Tools Menu
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'Settings',
                    click: () => {
                        mainWindow.webContents.send('menu-open-settings');
                    }
                },
                {
                    label: 'Extensions',
                    click: () => {
                        mainWindow.webContents.send('menu-open-extensions');
                    }
                }
            ]
        },

        // Help Menu
        {
            role: 'help',
            submenu: [
                {
                    label: 'Documentation',
                    click: async () => {
                        await shell.openExternal('https://frontqode.example.com/docs');
                    }
                },
                {
                    label: 'About Front Qode IDE',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            title: 'About Front Qode IDE',
                            message: 'Front Qode IDE v1.0.0',
                            detail: 'A lightweight IDE for front-end development.\nCreated with Electron.',
                            buttons: ['OK']
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}