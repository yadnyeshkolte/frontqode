// src/managers/FileOperationsManager.ts
import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as path from 'path';
import FileSystemService from '../services/FileSystemService';

/**
 * Manages file operations for the application
 */
class FileOperationsManager {
    private fileSystemService: FileSystemService;
    private mainWindow: BrowserWindow;
    private recentFiles: string[] = [];
    private readonly MAX_RECENT_FILES = 10;

    constructor(mainWindow: BrowserWindow) {
        this.fileSystemService = new FileSystemService();
        this.mainWindow = mainWindow;

        // Load recent files from storage
        this.loadRecentFiles();

        // Set up IPC handlers
        this.setupIpcHandlers();
    }

    /**
     * Set up IPC handlers for file operations
     */
    private setupIpcHandlers(): void {
        // Read file
        ipcMain.handle('read-file', (_, filePath: string) => {
            try {
                const content = this.fileSystemService.readFile(filePath);
                this.addRecentFile(filePath);
                return { success: true, content };
            } catch (error) {
                console.error(`Error reading file ${filePath}:`, error);
                return { success: false, error: error.message };
            }
        });

        // Write file
        ipcMain.handle('write-file', (_, filePath: string, content: string) => {
            try {
                this.fileSystemService.writeFile(filePath, content);
                this.addRecentFile(filePath);
                return { success: true };
            } catch (error) {
                console.error(`Error writing file ${filePath}:`, error);
                return { success: false, error: error.message };
            }
        });

        // Show save dialog
        ipcMain.handle('show-save-dialog', async (_, options) => {
            try {
                const result = await dialog.showSaveDialog(this.mainWindow, options);
                if (!result.canceled && result.filePath) {
                    this.addRecentFile(result.filePath);
                }
                return {
                    success: !result.canceled,
                    filePath: result.filePath,
                };
            } catch (error) {
                console.error('Error showing save dialog:', error);
                return { success: false, error: error.message };
            }
        });

        // Show open dialog
        ipcMain.handle('show-open-dialog', async (_, options) => {
            try {
                const result = await dialog.showOpenDialog(this.mainWindow, options);
                if (!result.canceled && result.filePaths.length > 0) {
                    result.filePaths.forEach(filePath => this.addRecentFile(filePath));
                }
                return {
                    success: !result.canceled,
                    filePaths: result.filePaths,
                };
            } catch (error) {
                console.error('Error showing open dialog:', error);
                return { success: false, error: error.message };
            }
        });

        // Get recent files
        ipcMain.handle('get-recent-files', () => {
            return this.recentFiles;
        });

        // Add recent file
        ipcMain.handle('add-recent-file', (_, filePath: string) => {
            this.addRecentFile(filePath);
            return { success: true };
        });

        // Clear recent files
        ipcMain.handle('clear-recent-files', () => {
            this.recentFiles = [];
            this.saveRecentFiles();
            return { success: true };
        });

        // Handle menu-open-recent-file
        ipcMain.on('menu-clear-recent-files', () => {
            this.recentFiles = [];
            this.saveRecentFiles();
            this.updateRecentFilesMenu();
        });
    }

    /**
     * Add a file to recent files
     */
    addRecentFile(filePath: string): void {
        // Remove if exists to avoid duplicates
        this.recentFiles = this.recentFiles.filter(path => path !== filePath);

        // Add to front of list
        this.recentFiles.unshift(filePath);

        // Trim list to max size
        if (this.recentFiles.length > this.MAX_RECENT_FILES) {
            this.recentFiles = this.recentFiles.slice(0, this.MAX_RECENT_FILES);
        }

        // Save recent files
        this.saveRecentFiles();

        // Update menu
        this.updateRecentFilesMenu();
    }

    /**
     * Save recent files to persistent storage
     */
    private saveRecentFiles(): void {
        // In a real implementation, save to electron-store or similar
        // For now, we'll just keep in memory
    }

    /**
     * Load recent files from persistent storage
     */
    private loadRecentFiles(): void {
        // In a real implementation, load from electron-store or similar
        this.recentFiles = [];
    }

    /**
     * Update the recent files menu
     */
    private updateRecentFilesMenu(): void {
        // Import update function from menu.ts
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { updateRecentFilesMenu } = require('../menu');
        updateRecentFilesMenu(this.mainWindow, this.recentFiles);
    }
}

export default FileOperationsManager;