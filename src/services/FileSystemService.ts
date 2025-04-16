// src/services/FileSystemService.ts
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
}

export default FileSystemService;