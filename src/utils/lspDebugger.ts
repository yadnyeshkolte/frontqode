// src/utils/lspDebugger.ts
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

/**
 * A utility class to help with debugging LSP servers in production
 */
export class LSPDebugger {
    private readonly logFile: string;

    constructor() {
        // Create logs directory in user data folder
        const logsDir = path.join(app.getPath('userData'), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        this.logFile = path.join(logsDir, 'lsp-debug.log');

        // Initialize log file with header
        this.log('LSP DEBUG LOG - ' + new Date().toISOString());
        this.log(`App path: ${app.getAppPath()}`);
        this.log(`User data path: ${app.getPath('userData')}`);
        this.log(`Node version: ${process.version}`);
        this.log(`Electron version: ${process.versions.electron}`);
        this.log(`OS: ${process.platform} (${process.arch})`);
        this.log(`Process resource path: ${process.resourcesPath}`);
        this.log(`Running from ASAR: ${this.isRunningFromAsar()}`);
        this.log(`Environment: ${process.env.NODE_ENV}`);
        this.log('-------------------------------------------');
    }

    public log(message: string): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;

        // Append to log file
        fs.appendFileSync(this.logFile, logMessage);
    }

    public logError(error: Error | string): void {
        const errorMessage = error instanceof Error
            ? `ERROR: ${error.message}\n${error.stack || 'No stack trace'}`
            : `ERROR: ${error}`;

        this.log(errorMessage);
    }

    public getLogFilePath(): string {
        return this.logFile;
    }

    private isRunningFromAsar(): boolean {
        return (app.getAppPath() || '').includes('app.asar');
    }

    public checkBinaryExistence(binaryPath: string): boolean {
        const exists = fs.existsSync(binaryPath);
        this.log(`Checking binary: ${binaryPath} - Exists: ${exists}`);
        return exists;
    }

    public logEnvironmentPath(): void {
        this.log(`PATH: ${process.env.PATH}`);
    }
}

// Export singleton instance
export default new LSPDebugger();