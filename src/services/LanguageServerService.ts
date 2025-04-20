// src/services/LanguageServerService.ts
import { spawn, ChildProcess, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { getAppDataPath } from '../utils/appPaths';

interface LanguageServer {
    process: ChildProcess;
    port: number;
    languageId: string;
}

interface ServerConfig {
    name: string;
    description: string;
    installCommand: string;
    startCommand: string;
    args: string[];
    binary: string;
}

class LanguageServerService {
    private servers: Map<string, LanguageServer> = new Map();
    private serverConfigs: Map<string, ServerConfig> = new Map();
    private readonly serversPath: string;
    private nextPort = 8000;

    constructor() {
        this.serversPath = path.join(getAppDataPath(), 'language-servers');
        // Ensure the directory exists
        if (!fs.existsSync(this.serversPath)) {
            fs.mkdirSync(this.serversPath, { recursive: true });
        }
        this.initializeServerConfigs();
    }

    private initializeServerConfigs() {
        // TypeScript server
        const tsConfig: ServerConfig = {
            name: 'TypeScript/JavaScript',
            description: 'Language server for TypeScript and JavaScript',
            installCommand: 'npm install --prefix ' + this.serversPath + ' typescript-language-server typescript',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '.bin', 'typescript-language-server')
        };
        this.serverConfigs.set('typescript', tsConfig);
        this.serverConfigs.set('javascript', tsConfig);

        // HTML server
        this.serverConfigs.set('html', {
            name: 'HTML',
            description: 'Language server for HTML',
            installCommand: 'npm install --prefix ' + this.serversPath + ' vscode-html-languageserver-bin',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '.bin', 'html-languageserver')
        });

        // CSS server
        this.serverConfigs.set('css', {
            name: 'CSS',
            description: 'Language server for CSS',
            installCommand: 'npm install --prefix ' + this.serversPath + ' vscode-css-languageserver-bin',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '.bin', 'css-languageserver')
        });

        // JSON server
        this.serverConfigs.set('json', {
            name: 'JSON',
            description: 'Language server for JSON',
            installCommand: 'npm install --prefix ' + this.serversPath + ' vscode-json-languageserver-bin',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '.bin', 'json-languageserver')
        });

        // Python server
        this.serverConfigs.set('python', {
            name: 'Python',
            description: 'Language server for Python',
            installCommand: 'npm install --prefix ' + this.serversPath + ' pyright',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '.bin', 'pyright-langserver')
        });
    }

    public getAvailableServers(): Array<{ id: string, name: string, description: string, installed: boolean }> {
        const result = [];
        for (const [languageId, config] of this.serverConfigs.entries()) {
            result.push({
                id: languageId,
                name: config.name,
                description: config.description,
                installed: this.isServerInstalled(languageId)
            });
        }
        return result;
    }

    public isServerInstalled(languageId: string): boolean {
        const config = this.serverConfigs.get(languageId);
        if (!config) return false;
        return fs.existsSync(config.binary);
    }

    public async startServer(languageId: string): Promise<{ port: number, languageId: string } | null> {
        try {
            // Check if server is already running
            if (this.servers.has(languageId)) {
                const server = this.servers.get(languageId);
                return {
                    port: server.port,
                    languageId
                };
            }

            // Check if server is installed
            if (!this.isServerInstalled(languageId)) {
                console.error(`Language server not installed for ${languageId}`);
                return null;
            }

            const config = this.serverConfigs.get(languageId);
            if (!config) {
                console.error(`No configuration found for ${languageId}`);
                return null;
            }

            // Log more information to diagnose issues
            console.log(`Starting ${languageId} language server...`);
            console.log(`Binary path: ${config.binary}`);
            console.log(`Arguments: ${config.args.join(' ')}`);

            // Verify binary exists before attempting to spawn
            if (!fs.existsSync(config.binary)) {
                console.error(`Binary not found at path: ${config.binary}`);
                return null;
            }

            // Allocate a port for web socket connection
            const port = this.nextPort++;

            // Start server process with better error handling
            const serverProcess = spawn(config.binary, config.args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, NODE_ENV: process.env.NODE_ENV }
            });

            // Handle server output
            serverProcess.stdout.on('data', (data) => {
                console.log(`${languageId} server output: ${data.toString().trim()}`);
            });

            serverProcess.stderr.on('data', (data) => {
                console.error(`${languageId} server error: ${data.toString().trim()}`);
            });

            serverProcess.on('error', (error) => {
                console.error(`Error starting ${languageId} server:`, error);
                this.servers.delete(languageId);
            });

            serverProcess.on('close', (code) => {
                console.log(`${languageId} server exited with code ${code}`);
                this.servers.delete(languageId);
            });

            // Store server info
            const server = {
                process: serverProcess,
                port,
                languageId
            };
            this.servers.set(languageId, server);

            console.log(`Successfully started ${languageId} language server on port ${port}`);
            return { port, languageId };
        } catch (error) {
            console.error(`Failed to start language server for ${languageId}:`, error);
            return null;
        }
    }

    public async stopServer(languageId: string): Promise<boolean> {
        const server = this.servers.get(languageId);
        if (!server) {
            return false;
        }

        // Kill server process
        server.process.kill();
        this.servers.delete(languageId);
        return true;
    }
    public getServerInfo(languageId: string): { port: number, languageId: string } | null {
        const server = this.servers.get(languageId);
        if (!server) {
            return null;
        }

        return {
            port: server.port,
            languageId: server.languageId
        };
    }

    public async installServer(languageId: string): Promise<boolean> {
        const config = this.serverConfigs.get(languageId);
        if (!config) {
            console.error(`No configuration found for ${languageId}`);
            return false;
        }

        try {
            console.log(`Installing language server for ${languageId}...`);
            console.log(`Running command: ${config.installCommand}`);

            return new Promise<boolean>((resolve, reject) => {
                exec(config.installCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Installation error: ${error.message}`);
                        console.error(`stderr: ${stderr}`);
                        reject(error);
                        return;
                    }
                    console.log(`stdout: ${stdout}`);
                    console.log(`Installation of ${languageId} server completed.`);
                    resolve(true);
                });
            });
        } catch (error) {
            console.error(`Failed to install language server for ${languageId}:`, error);
            return false;
        }
    }
}

export default LanguageServerService;