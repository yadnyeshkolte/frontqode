// src/services/LanguageServerService.ts
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { getAppDataPath } from '../utils/appPaths';

interface LanguageServer {
    process: ChildProcess;
    port: number;
    languageId: string;
}

class LanguageServerService {
    private servers: Map<string, LanguageServer> = new Map();
    private serverBinaries: Map<string, string> = new Map();
    private nextPort = 8000;

    constructor() {
        this.initializeServerPaths();
    }

    private initializeServerPaths() {
        // Set default paths for language servers
        // In a real app, these would be configurable and installed properly
        const serversPath = path.join(getAppDataPath(), 'language-servers');

        // Ensure the directory exists
        if (!fs.existsSync(serversPath)) {
            fs.mkdirSync(serversPath, { recursive: true });
        }

        // TypeScript server (typescript-language-server)
        this.serverBinaries.set('typescript', path.join(serversPath, 'node_modules', '.bin', 'typescript-language-server'));
        this.serverBinaries.set('javascript', path.join(serversPath, 'node_modules', '.bin', 'typescript-language-server'));

        // HTML server (vscode-html-languageserver)
        this.serverBinaries.set('html', path.join(serversPath, 'node_modules', '.bin', 'html-languageserver'));

        // CSS server (vscode-css-languageserver)
        this.serverBinaries.set('css', path.join(serversPath, 'node_modules', '.bin', 'css-languageserver'));

        // JSON server (vscode-json-languageserver)
        this.serverBinaries.set('json', path.join(serversPath, 'node_modules', '.bin', 'json-languageserver'));
    }

    public async startServer(languageId: string): Promise<{ port: number, languageId: string } | null> {
        // Check if server is already running
        if (this.servers.has(languageId)) {
            return {
                port: this.servers.get(languageId)?.port,
                languageId
            };
        }

        // Get server path
        const serverPath = this.serverBinaries.get(languageId);
        if (!serverPath || !fs.existsSync(serverPath)) {
            console.error(`Language server not found for ${languageId}`);
            return null;
        }

        try {
            // Allocate a port
            const port = this.nextPort++;

            // Start server process
            const serverProcess = spawn(serverPath, ['--stdio']);

            // Handle server output
            serverProcess.stdout.on('data', (data) => {
                console.log(`${languageId} server: ${data}`);
            });

            serverProcess.stderr.on('data', (data) => {
                console.error(`${languageId} server error: ${data}`);
            });

            serverProcess.on('close', (code) => {
                console.log(`${languageId} server exited with code ${code}`);
                this.servers.delete(languageId);
            });

            // Store server info
            this.servers.set(languageId, {
                process: serverProcess,
                port,
                languageId
            });

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

    public async stopAllServers(): Promise<void> {
        for (const [languageId, server] of this.servers.entries()) {
            server.process.kill();
        }
        this.servers.clear();
    }

    public isServerRunning(languageId: string): boolean {
        return this.servers.has(languageId);
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

    public installServer(languageId: string): Promise<boolean> {
        // In a real app, this would download and install the language server
        // For now, this is just a placeholder
        return Promise.resolve(false);
    }
}

export default LanguageServerService;