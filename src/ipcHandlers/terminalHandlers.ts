import { ipcMain } from 'electron';
import TerminalService from '../services/TerminalService';

const terminalService = new TerminalService();

export const setupTerminalHandlers = () => {
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
};
