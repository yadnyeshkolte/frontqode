// src/services/FileOperationsService.ts
import path from 'path';

/**
 * A service to handle file operations in the IDE
 */
class FileOperationsService {
    private openFiles: Map<string, { content: string, isDirty: boolean }> = new Map();
    private activeFile: string | null = null;
    private recentFiles: string[] = [];
    private maxRecentFiles = 10;

    /**
     * Opens a file and returns its content
     */
    async openFile(filePath: string): Promise<{ success: boolean, content?: string, error?: string }> {
        try {
            // Get file content from main process
            const result = await window.electronAPI.readFile(filePath);

            if (result.success && result.content !== undefined) {
                // Store file in openFiles map
                this.openFiles.set(filePath, { content: result.content, isDirty: false });
                this.activeFile = filePath;

                // Add to recent files
                this.addToRecentFiles(filePath);

                return { success: true, content: result.content };
            } else {
                return { success: false, error: result.error || 'Failed to read file' };
            }
        } catch (error) {
            console.error('Error opening file:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Saves the current file
     */
    async saveFile(filePath: string, content: string): Promise<{ success: boolean, error?: string }> {
        try {
            const result = await window.electronAPI.writeFile(filePath, content);

            if (result.success) {
                // Update file in openFiles map
                this.openFiles.set(filePath, { content, isDirty: false });
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error saving file:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Save file with a new name/path
     */
    async saveFileAs(oldFilePath: string, content: string): Promise<{ success: boolean, newPath?: string, error?: string }> {
        try {
            // Show save dialog in main process
            const result = await window.electronAPI.showSaveDialog({
                defaultPath: oldFilePath,
                filters: [
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (result.success && result.filePath) {
                // Save to new location
                const saveResult = await this.saveFile(result.filePath, content);

                if (saveResult.success) {
                    // Add to open files and recent files
                    this.addToRecentFiles(result.filePath);
                    return { success: true, newPath: result.filePath };
                } else {
                    return { success: false, error: saveResult.error };
                }
            } else if (!result.success) {
                return { success: false, error: result.error };
            } else {
                // User canceled the dialog
                return { success: false, error: 'Operation canceled' };
            }
        } catch (error) {
            console.error('Error in save as operation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Updates content without saving
     */
    updateFileContent(filePath: string, content: string): void {
        const currentFile = this.openFiles.get(filePath);
        if (currentFile) {
            this.openFiles.set(filePath, { content, isDirty: true });
        }
    }

    /**
     * Checks if the file has unsaved changes
     */
    isFileDirty(filePath: string): boolean {
        return this.openFiles.get(filePath)?.isDirty || false;
    }

    /**
     * Returns all files with unsaved changes
     */
    getDirtyFiles(): string[] {
        return Array.from(this.openFiles.entries())
            .filter(([_, { isDirty }]) => isDirty)
            .map(([filePath]) => filePath);
    }

    /**
     * Closes a file
     */
    closeFile(filePath: string): void {
        this.openFiles.delete(filePath);

        // If we closed the active file, set active to null
        if (this.activeFile === filePath) {
            this.activeFile = null;
        }
    }

    /**
     * Gets content of a file from memory
     */
    getFileContent(filePath: string): string | null {
        return this.openFiles.get(filePath)?.content || null;
    }

    /**
     * Sets the active file
     */
    setActiveFile(filePath: string): void {
        this.activeFile = filePath;
    }

    /**
     * Gets the active file
     */
    getActiveFile(): string | null {
        return this.activeFile;
    }

    /**
     * Adds a file to recent files list
     */
    private addToRecentFiles(filePath: string): void {
        // Remove if already exists to avoid duplicates
        this.recentFiles = this.recentFiles.filter(path => path !== filePath);

        // Add to front of list
        this.recentFiles.unshift(filePath);

        // Trim list to max size
        if (this.recentFiles.length > this.maxRecentFiles) {
            this.recentFiles = this.recentFiles.slice(0, this.maxRecentFiles);
        }
    }

    /**
     * Gets the list of recent files
     */
    getRecentFiles(): string[] {
        return [...this.recentFiles];
    }
}

export default FileOperationsService;