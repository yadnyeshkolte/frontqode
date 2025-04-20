// src/services/FileSystemService.ts
import { dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

// Promisify exec for better async handling
const execAsync = promisify(exec);

class FileSystemService {
    private readonly projectsDir: string;

    constructor() {
        // Create the FrontqodeProjects directory in user's home if it doesn't exist
        this.projectsDir = path.join(os.homedir(), 'FrontqodeProjects');

        if (!fs.existsSync(this.projectsDir)) {
            fs.mkdirSync(this.projectsDir, { recursive: true });
        }
    }

    /**
     * Creates a new project directory with a readme.md file
     * @param projectName The name of the project
     * @returns The path to the created project
     */
    createProject(projectName: string): string {
        // Create a sanitized project name (remove special chars and spaces)
        const sanitizedName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');

        // Create the project directory path
        const projectPath = path.join(this.projectsDir, sanitizedName);

        // Check if the project directory already exists
        if (fs.existsSync(projectPath)) {
            throw new Error(`Project ${sanitizedName} already exists`);
        }

        // Create the project directory
        fs.mkdirSync(projectPath, { recursive: true });

        // Create a readme.md file in the project directory
        const readmePath = path.join(projectPath, 'readme.md');
        const readmeContent = `# ${projectName}\n\nCreated with Front Qode IDE on ${new Date().toLocaleDateString()}\n`;

        fs.writeFileSync(readmePath, readmeContent);

        return projectPath;
    }

    /**
     * Opens a dialog to select a project directory
     * @returns The path to the selected directory
     */
    openProjectDialog(): string | null {
        const result = dialog.showOpenDialogSync({
            properties: ['openDirectory'],
            title: 'Select Project Folder',
            buttonLabel: 'Open Project'
        });

        return result && result.length > 0 ? result[0] : null;
    }

    /**
     * Lists all projects in the FrontqodeProjects directory
     * @returns An array of project names
     */
    listProjects(): string[] {
        if (!fs.existsSync(this.projectsDir)) {
            return [];
        }

        return fs.readdirSync(this.projectsDir).filter(item =>
            fs.statSync(path.join(this.projectsDir, item)).isDirectory()
        );
    }

    /**
     * Reads the content of a file
     * @param filePath The path to the file
     * @returns The content of the file
     */
    readFile(filePath: string): string {
        return fs.readFileSync(filePath, 'utf-8');
    }

    /**
     * Writes content to a file
     * @param filePath The path to the file
     * @param content The content to write
     */
    writeFile(filePath: string, content: string): void {
        fs.writeFileSync(filePath, content);
    }

    /**
     * Gets the projects directory path
     * @returns The projects directory path
     */
    getProjectsDir(): string {
        return this.projectsDir;
    }

    /**
     * Reads a directory and returns its structure
     * @param dirPath The path to the directory
     * @returns An array of file tree items
     */
    readDirectory(dirPath: string): any[] {
        const items = fs.readdirSync(dirPath);

        return items.map(item => {
            const itemPath = path.join(dirPath, item);
            const isDirectory = fs.statSync(itemPath).isDirectory();

            const fileItem = {
                name: item,
                path: itemPath,
                isDirectory
            };

            if (isDirectory) {
                try {
                    const children = this.readDirectory(itemPath);
                    return {
                        ...fileItem,
                        children
                    };
                } catch (error) {
                    console.error(`Error reading directory ${itemPath}:`, error);
                    return {
                        ...fileItem,
                        children: []
                    };
                }
            }

            return fileItem;
        });
    }

    /**
     * Creates a new directory at the specified path
     * @param dirPath The path where the directory should be created
     * @throws Error if directory creation fails
     */
    createDirectory(dirPath: string): void {
        if (fs.existsSync(dirPath)) {
            throw new Error(`Directory already exists: ${dirPath}`);
        }

        fs.mkdirSync(dirPath, { recursive: true });
    }

    /**
     * Renames a file or directory
     * @param oldPath The current path of the file or directory
     * @param newPath The new path of the file or directory
     * @throws Error if the file/directory doesn't exist or if renaming fails
     */
    renameFile(oldPath: string, newPath: string): void {
        if (!fs.existsSync(oldPath)) {
            throw new Error(`Path does not exist: ${oldPath}`);
        }

        if (fs.existsSync(newPath)) {
            throw new Error(`Destination already exists: ${newPath}`);
        }

        fs.renameSync(oldPath, newPath);
    }

    /**
     * Removes a file at the specified path
     * @param filePath The path of the file to remove
     * @throws Error if the file doesn't exist or if removal fails
     */
    removeFile(filePath: string): void {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File does not exist: ${filePath}`);
        }

        if (fs.statSync(filePath).isDirectory()) {
            throw new Error(`Cannot use removeFile on a directory: ${filePath}`);
        }

        fs.unlinkSync(filePath);
    }

    /**
     * Removes a directory and all its contents recursively
     * @param dirPath The path of the directory to remove
     * @throws Error if the directory doesn't exist or if removal fails
     */
    removeDirectory(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            throw new Error(`Directory does not exist: ${dirPath}`);
        }

        if (!fs.statSync(dirPath).isDirectory()) {
            throw new Error(`Not a directory: ${dirPath}`);
        }

        fs.rmSync(dirPath, { recursive: true, force: true });
    }

    /**
     * Copies a file from one location to another
     * @param sourcePath The source file path
     * @param destPath The destination file path
     * @throws Error if the source doesn't exist or if copying fails
     */
    copyFile(sourcePath: string, destPath: string): void {
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source file does not exist: ${sourcePath}`);
        }

        if (fs.statSync(sourcePath).isDirectory()) {
            throw new Error(`Cannot use copyFile on a directory: ${sourcePath}`);
        }

        // Create destination directory if it doesn't exist
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        fs.copyFileSync(sourcePath, destPath);
    }

    /**
     * Moves a file from one location to another
     * @param sourcePath The source file path
     * @param destPath The destination file path
     * @throws Error if the source doesn't exist or if moving fails
     */
    moveFile(sourcePath: string, destPath: string): void {
        // Copy the file first
        this.copyFile(sourcePath, destPath);

        // Then remove the original
        this.removeFile(sourcePath);
    }

    /**
     * Recursively copies a directory and all its contents
     * @param sourcePath The source directory path
     * @param destPath The destination directory path
     * @throws Error if the source doesn't exist or if copying fails
     */
    copyDirectory(sourcePath: string, destPath: string): void {
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source directory does not exist: ${sourcePath}`);
        }

        if (!fs.statSync(sourcePath).isDirectory()) {
            throw new Error(`Source is not a directory: ${sourcePath}`);
        }

        // Create the destination directory if it doesn't exist
        if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
        }

        // Read all items in the source directory
        const items = fs.readdirSync(sourcePath);

        // Copy each item
        for (const item of items) {
            const srcItemPath = path.join(sourcePath, item);
            const destItemPath = path.join(destPath, item);

            if (fs.statSync(srcItemPath).isDirectory()) {
                // Recursively copy subdirectories
                this.copyDirectory(srcItemPath, destItemPath);
            } else {
                // Copy files
                fs.copyFileSync(srcItemPath, destItemPath);
            }
        }
    }

    /**
     * Moves a directory and all its contents
     * @param sourcePath The source directory path
     * @param destPath The destination directory path
     * @throws Error if the source doesn't exist or if moving fails
     */
    moveDirectory(sourcePath: string, destPath: string): void {
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source directory does not exist: ${sourcePath}`);
        }

        if (!fs.statSync(sourcePath).isDirectory()) {
            throw new Error(`Source is not a directory: ${sourcePath}`);
        }

        // Try to use rename first, which is more efficient if on the same filesystem
        try {
            fs.renameSync(sourcePath, destPath);
        } catch (error) {
            // If rename fails (e.g., cross-device), fall back to copy and delete
            this.copyDirectory(sourcePath, destPath);
            this.removeDirectory(sourcePath);
        }
    }

    /**
     * Checks if Git is installed
     * @returns Whether Git is available
     */
    async isGitInstalled(): Promise<boolean> {
        try {
            await execAsync('git --version');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Extracts the repository name from a Git URL
     * @param repoUrl Git repository URL
     * @returns The repository name
     */
    extractRepoName(repoUrl: string): string {
        // Extract the repo name from the URL (handles both HTTPS and SSH formats)
        const httpsMatch = repoUrl.match(/\/([^/]+)\.git$/);
        const sshMatch = repoUrl.match(/:([^/]+)\.git$/);
        const nameMatch = httpsMatch || sshMatch;

        if (nameMatch && nameMatch[1]) {
            return nameMatch[1];
        }

        // Fallback - use last part of URL without .git if present
        const parts = repoUrl.split('/');
        let lastPart = parts[parts.length - 1];

        if (lastPart.endsWith('.git')) {
            lastPart = lastPart.slice(0, -4);
        }

        return lastPart || 'git-project';
    }

    /**
     * Clones a Git repository
     * @param repoUrl The URL of the repository to clone
     * @param projectName Optional custom name for the project folder
     * @returns The path to the cloned repository
     */
    async cloneRepository(repoUrl: string, projectName?: string): Promise<string> {
        // Check if Git is installed
        const gitInstalled = await this.isGitInstalled();
        if (!gitInstalled) {
            throw new Error('Git is not installed. Please install Git to use this feature.');
        }

        // Use provided project name or extract from URL
        const folderName = projectName || this.extractRepoName(repoUrl);
        const sanitizedName = folderName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const projectPath = path.join(this.projectsDir, sanitizedName);

        // Check if the directory already exists
        if (fs.existsSync(projectPath)) {
            throw new Error(`Project ${sanitizedName} already exists`);
        }

        try {
            // Clone the repository
            await execAsync(`git clone "${repoUrl}" "${projectPath}"`);
            return projectPath;
        } catch (error) {
            throw new Error(`Failed to clone repository: ${error.message}`);
        }
    }
}

export default FileSystemService;