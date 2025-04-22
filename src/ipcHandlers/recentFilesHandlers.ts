import { ipcMain } from 'electron';

// Recent files storage
let recentFiles: string[] = [];
const MAX_RECENT_FILES = 10;

export const setupRecentFilesHandlers = () => {
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
};
