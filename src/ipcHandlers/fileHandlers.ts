import { ipcMain, dialog, shell } from 'electron';
import FileSystemService from '../services/FileSystemService';
import * as fs from "node:fs";
import * as path from "node:path";

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

    ipcMain.handle('check-if-directory-exists', async (_, dirPath: string) => {
        try {
            const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
            return { exists };
        } catch (error) {
            return { exists: false, error: error.message };
        }
    });


// List files in a directory
    ipcMain.handle('list-files-in-directory', async (_, dirPath: string) => {
        try {
            if (!fs.existsSync(dirPath)) {
                return { success: false, error: 'Directory does not exist', files: [] };
            }

            const files = fs.readdirSync(dirPath);
            return { success: true, files };
        } catch (error) {
            return { success: false, error: error.message, files: [] };
        }
    });

// Scan a directory recursively
    ipcMain.handle('scan-directory', async (_, dirPath: string, ignoreDirectories: string[] = []) => {
        try {
            const files: string[] = [];

            // eslint-disable-next-line no-inner-declarations
            function scanDir(currentPath: string, relativePath = '') {
                const entries = fs.readdirSync(currentPath);

                for (const entry of entries) {
                    const entryPath = path.join(currentPath, entry);
                    const entryRelativePath = path.join(relativePath, entry);

                    if (fs.statSync(entryPath).isDirectory()) {
                        // Skip directories in the ignore list
                        if (ignoreDirectories.includes(entry)) {
                            continue;
                        }

                        scanDir(entryPath, entryRelativePath);
                    } else {
                        files.push(entryRelativePath);
                    }
                }
            }

            scanDir(dirPath);
            return { success: true, files };
        } catch (error) {
            return { success: false, error: error.message, files: [] };
        }
    });
};
