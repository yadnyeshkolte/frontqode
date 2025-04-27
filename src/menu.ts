import { Menu, BrowserWindow, dialog, shell, app } from 'electron';
import FileSystemService from './services/FileSystemService';

const fileSystemService = new FileSystemService();

export function setupApplicationMenu(mainWindow: BrowserWindow) {
    const isMac = process.platform === 'darwin';

    const updateRecentProjects = async () => {
        try {
            // Get recent projects (assuming you have such functionality)
            const recentProjects = await fileSystemService.getRecentProjects();
            const recentProjectsSubmenu = recentProjects.map((project: { name: any; path: any; }) => ({
                label: project.name,
                click: () => {
                    mainWindow.webContents.send('menu-open-project', project.path);
                }
            }));

            // Insert separator before the clear option
            if (recentProjectsSubmenu.length > 0) {
                recentProjectsSubmenu.push({ type: 'separator' });
            }

            // Add the clear option
            recentProjectsSubmenu.push({
                label: 'Clear Recent',
                enabled: recentProjects.length > 0,
                click: () => {
                    mainWindow.webContents.send('menu-clear-recent-files');
                }
            });

            // Rebuild menu with updated recent projects
            const newMenu = Menu.buildFromTemplate(getMenuTemplate(recentProjectsSubmenu));
            Menu.setApplicationMenu(newMenu);
        } catch (error) {
            console.error('Failed to update recent projects menu:', error);
        }
    };

    const getMenuTemplate = (recentProjectsSubmenu: Electron.MenuItemConstructorOptions[] = []) => {
        const template: Electron.MenuItemConstructorOptions[] = [
            // File Menu
            {
                label: 'File',
                submenu: [
                    {
                        label: 'New Project',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => {
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
                                dialog.showErrorBox('Error', `Failed to open project: ${error.message}`);
                            }
                        }
                    },
                    {
                        label: 'Open Recent',
                        submenu: recentProjectsSubmenu.length > 0
                            ? recentProjectsSubmenu
                            : [{ label: 'No Recent Projects', enabled: false }]
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
                    },
                    {
                        label: 'Language Servers',
                        click: () => {
                            mainWindow.webContents.send('menu-open-lsp-manager');
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
                            await shell.openExternal('https://github.com/yadnyeshkolte/frontqode');
                        }
                    },
                    {
                        label: 'About Front Qode',
                        click: () => {
                            dialog.showMessageBox(mainWindow, {
                                title: 'About Front Qode',
                                message: 'Front Qode v1.0.0',
                                detail: 'A lightweight Code Editor for development.',
                                buttons: ['OK']
                            });
                        }
                    }
                ]
            }
        ];

        // Add macOS-specific menu items
        if (isMac) {
            template.unshift({
                label: app.name,
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    { role: 'services' },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideOthers' },
                    { role: 'unhide' },
                    { type: 'separator' },
                    { role: 'quit' }
                ]
            });
        }

        return template;
    };

    // Initial menu setup
    const menu = Menu.buildFromTemplate(getMenuTemplate());
    Menu.setApplicationMenu(menu);

    // Update recent projects in menu
    updateRecentProjects().catch(console.error);

    // Return the updateRecentProjects function so it can be called when the list changes
    return { updateRecentProjects };
}
