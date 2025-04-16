// src/services/FileSystemService.ts
import { app, dialog } from 'electron';
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
        const httpsMatch = repoUrl.match(/\/([^\/]+)\.git$/);
        const sshMatch = repoUrl.match(/:([^\/]+)\.git$/);
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