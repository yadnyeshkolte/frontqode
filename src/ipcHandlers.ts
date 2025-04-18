// src/ipcHandlers.ts
import { ipcMain, dialog } from 'electron';
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
            const result = await terminalService.changeDirectory(newDir);
            return result;
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