// src/utils/appPaths.ts
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { app } from 'electron';

// Get the application data directory
export const getAppDataPath = (): string => {
    // Use Electron's app.getPath('userData') if available
    if (app) {
        return app.getPath('userData');
    }

    // Otherwise fallback to platform-specific paths
    const appName = 'code-editor';

    switch (process.platform) {
        case 'win32':
            return path.join(process.env.APPDATA || '', appName);
        case 'darwin':
            return path.join(os.homedir(), 'Library', 'Application Support', appName);
        case 'linux':
            return path.join(os.homedir(), '.config', appName);
        default:
            return path.join(os.homedir(), '.config', appName);
    }
};

// Get the projects directory
export const getProjectsDir = (): string => {
    const projectsDir = path.join(getAppDataPath(), 'projects');

    // Ensure the directory exists
    if (!fs.existsSync(projectsDir)) {
        fs.mkdirSync(projectsDir, { recursive: true });
    }

    return projectsDir;
};