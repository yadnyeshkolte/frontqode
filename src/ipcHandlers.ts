// src/ipcHandlers.ts
import {dialog, ipcMain, shell} from 'electron';
import FileSystemService from './services/FileSystemService';
import TerminalService from './services/TerminalService';
import LanguageServerService from './services/LanguageServerService';

const fileSystemService = new FileSystemService();
const terminalService = new TerminalService();
const languageServerService = new LanguageServerService();

export const setupIpcHandlers = () => {
    // Existing handlers...

    // Create a new project
    ipcMain.handle('create-project', async (_, projectName: string) => {
        try {
            const projectPath = fileSystemService.createProject(projectName);
            return { success: true, projectPath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Open project dialog
    ipcMain.handle('open-project-dialog', async () => {
        try {
            const projectPath = fileSystemService.openProjectDialog();
            return { success: true, projectPath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Check if Git is installed
    ipcMain.handle('is-git-installed', async () => {
        try {
            const isInstalled = await fileSystemService.isGitInstalled();
            return { success: true, isInstalled };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Clone a Git repository
    ipcMain.handle('clone-repository', async (_, repoUrl: string, projectName?: string) => {
        try {
            const projectPath = await fileSystemService.cloneRepository(repoUrl, projectName);
            return { success: true, projectPath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // List all projects
    ipcMain.handle('list-projects', async () => {
        try {
            const projects = fileSystemService.listProjects();
            return { success: true, projects };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Read directory contents
    ipcMain.handle('read-directory', async (_, dirPath: string) => {
        try {
            const contents = fileSystemService.readDirectory(dirPath);
            return { success: true, contents };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Read a file
    ipcMain.handle('read-file', async (_, filePath: string) => {
        try {
            const content = fileSystemService.readFile(filePath);
            return { success: true, content };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Write to a file
    ipcMain.handle('write-file', async (_, filePath: string, content: string) => {
        try {
            fileSystemService.writeFile(filePath, content);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Get projects directory
    ipcMain.handle('get-projects-dir', async () => {
        try {
            const projectsDir = fileSystemService.getProjectsDir();
            return { success: true, projectsDir };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });


    ipcMain.handle('show-save-dialog', async (_, options) => {
        try {
            const result = await dialog.showSaveDialog(options);
            return {
                success: !result.canceled,
                filePath: result.filePath,
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

// Show open dialog
    ipcMain.handle('show-open-dialog', async (_, options) => {
        try {
            const result = await dialog.showOpenDialog(options);
            return {
                success: !result.canceled,
                filePaths: result.filePaths,
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

// Recent files storage
    let recentFiles: string[] = [];
    const MAX_RECENT_FILES = 10;

    ipcMain.handle('get-recent-files', () => {
        return recentFiles;
    });

    ipcMain.handle('add-recent-file', (_, filePath: string) => {
        // Remove if exists to avoid duplicates
        recentFiles = recentFiles.filter(path => path !== filePath);

        // Add to front of list
        recentFiles.unshift(filePath);

        // Trim list to max size
        if (recentFiles.length > MAX_RECENT_FILES) {
            recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
        }

        return { success: true };
    });

    ipcMain.handle('clear-recent-files', () => {
        recentFiles = [];
        return { success: true };
    });

    ipcMain.handle('create-directory', async (_, dirPath: string) => {
        try {
            fileSystemService.createDirectory(dirPath);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('rename-file', async (_, oldPath: string, newPath: string) => {
        try {
            fileSystemService.renameFile(oldPath, newPath);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('delete-item', async (_, itemPath: string, isDirectory: boolean) => {
        try {
            if (isDirectory) {
                fileSystemService.removeDirectory(itemPath);
            } else {
                fileSystemService.removeFile(itemPath);
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('copy-or-move-item', async (_, sourcePath: string, destPath: string, isDirectory: boolean, isCut: boolean) => {
        try {
            if (isDirectory) {
                if (isCut) {
                    fileSystemService.moveDirectory(sourcePath, destPath);
                } else {
                    fileSystemService.copyDirectory(sourcePath, destPath);
                }
            } else {
                if (isCut) {
                    fileSystemService.moveFile(sourcePath, destPath);
                } else {
                    fileSystemService.copyFile(sourcePath, destPath);
                }
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('open-in-explorer', async (_, itemPath: string) => {
        try {
            // Use shell to show the item in the file explorer
            shell.showItemInFolder(itemPath);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Terminal operations
    ipcMain.handle('terminal-execute-command', async (_, command: string) => {
        try {
            const output = await terminalService.executeCommand(command);
            return { success: true, output };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('terminal-get-current-dir', async () => {
        try {
            const currentDir = terminalService.getCurrentDir();
            return { success: true, currentDir };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('terminal-get-git-branch', async () => {
        try {
            const gitBranch = terminalService.getGitBranch();
            return { success: true, gitBranch };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('terminal-change-directory', async (_, newDir: string) => {
        try {
            return await terminalService.changeDirectory(newDir);
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('terminal-clear-history', async () => {
        try {
            terminalService.clearHistory();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('terminal-get-history', async () => {
        try {
            const history = terminalService.getHistory();
            return { success: true, history };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // New Language Server Protocol handlers
    ipcMain.handle('get-lsp-server-info', async (_, languageId: string) => {
        try {
            // Check if server is running
            let serverInfo = languageServerService.getServerInfo(languageId);

            // Start server if it's not running
            if (!serverInfo) {
                serverInfo = await languageServerService.startServer(languageId);
            }

            if (serverInfo) {
                return { success: true, ...serverInfo };
            } else {
                return { success: false, error: `Failed to start language server for ${languageId}` };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('stop-lsp-server', async (_, languageId: string) => {
        try {
            const result = await languageServerService.stopServer(languageId);
            return { success: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('install-lsp-server', async (_, languageId: string) => {
        try {
            const result = await languageServerService.installServer(languageId);
            return { success: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
};