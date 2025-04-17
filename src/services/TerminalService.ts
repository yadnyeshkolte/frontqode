// src/services/TerminalService.ts
import { exec, spawn } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { ipcMain } from 'electron';
import * as fs from "node:fs";

const execAsync = promisify(exec);

interface TerminalOutput {
    id: string;
    timestamp: Date;
    type: 'stdout' | 'stderr' | 'input' | 'system';
    data: string;
}

class TerminalService {
    private currentDir: string;
    private shell: string;
    private outputHistory: TerminalOutput[] = [];
    private gitBranch: string | null = null;

    constructor() {
        this.currentDir = os.homedir();

        // Determine the default shell based on the platform
        if (process.platform === 'win32') {
            this.shell = process.env.COMSPEC || 'cmd.exe';
        } else {
            this.shell = process.env.SHELL || '/bin/bash';
        }
    }

    /**
     * Initializes the terminal with a specific directory
     */
    async initializeWithDirectory(directory: string): Promise<{ success: boolean; path?: string; error?: string }> {
        return this.changeDirectory(directory);
    }

    /**
     * Gets the current working directory
     */
    getCurrentDir(): string {
        return this.currentDir;
    }

    /**
     * Changes the current working directory
     */
    async changeDirectory(newDir: string): Promise<{ success: boolean; path?: string; error?: string }> {
        try {
            // If path is relative, resolve it based on current directory
            const absolutePath = path.isAbsolute(newDir)
                ? newDir
                : path.resolve(this.currentDir, newDir);

            // Check if directory exists
            const stats = await fs.promises.stat(absolutePath);
            if (!stats.isDirectory()) {
                return { success: false, error: 'Not a directory' };
            }

            this.currentDir = absolutePath;
            await this.updateGitBranch();
            return { success: true, path: this.currentDir };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Updates the current Git branch information
     */
    private async updateGitBranch(): Promise<void> {
        try {
            const { stdout } = await execAsync('git branch --show-current', { cwd: this.currentDir });
            this.gitBranch = stdout.trim() || null;
        } catch {
            this.gitBranch = null;
        }
    }

    /**
     * Gets the current Git branch
     */
    getGitBranch(): string | null {
        return this.gitBranch;
    }

    /**
     * Executes a command in the terminal
     */
    executeCommand(command: string): Promise<TerminalOutput[]> {
        return new Promise((resolve, reject) => {
            const output: TerminalOutput[] = [];

            // Handle cd command specially
            if (command.toLowerCase().startsWith('cd ')) {
                const newDir = command.slice(3).trim();
                this.changeDirectory(newDir)
                    .then(result => {
                        if (result.success) {
                            output.push({
                                id: Date.now().toString(),
                                timestamp: new Date(),
                                type: 'system',
                                data: `Changed directory to: ${result.path}\n`
                            });
                        } else {
                            output.push({
                                id: Date.now().toString(),
                                timestamp: new Date(),
                                type: 'stderr',
                                data: `cd: ${result.error}\n`
                            });
                        }
                        resolve(output);
                    });
                return;
            }

            // Execute other commands
            const shell = spawn(command, [], {
                shell: this.shell,
                cwd: this.currentDir,
                env: process.env
            });

            shell.stdout.on('data', (data) => {
                output.push({
                    id: Date.now().toString(),
                    timestamp: new Date(),
                    type: 'stdout',
                    data: data.toString()
                });
            });

            shell.stderr.on('data', (data) => {
                output.push({
                    id: Date.now().toString(),
                    timestamp: new Date(),
                    type: 'stderr',
                    data: data.toString()
                });
            });

            shell.on('close', (code) => {
                if (code !== 0) {
                    output.push({
                        id: Date.now().toString(),
                        timestamp: new Date(),
                        type: 'system',
                        data: `Process exited with code ${code}\n`
                    });
                }
                this.outputHistory.push(...output);
                // Update git branch after command execution
                this.updateGitBranch().then(() => resolve(output));
            });

            shell.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Clears the terminal output history
     */
    clearHistory(): void {
        this.outputHistory = [];
    }

    /**
     * Gets all output history
     */
    getHistory(): TerminalOutput[] {
        return this.outputHistory;
    }
}

export default TerminalService;