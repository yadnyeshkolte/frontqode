import { ipcMain, dialog, shell } from 'electron';
import FileSystemService from '../services/FileSystemService';

const fileSystemService = new FileSystemService();

export const setupFileHandlers = () => {
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

    // Create directory
    ipcMain.handle('create-directory', async (_, dirPath: string) => {
        try {
            fileSystemService.createDirectory(dirPath);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Rename file
    ipcMain.handle('rename-file', async (_, oldPath: string, newPath: string) => {
        try {
            fileSystemService.renameFile(oldPath, newPath);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Delete item
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

    // Copy or move item
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

    // Open in explorer
    ipcMain.handle('open-in-explorer', async (_, itemPath: string) => {
        try {
            shell.showItemInFolder(itemPath);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Show save dialog
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
};
