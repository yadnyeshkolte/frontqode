import { ipcMain } from 'electron';
import FileSystemService from '../services/FileSystemService';

const fileSystemService = new FileSystemService();

export const setupGitHandlers = () => {
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
};
