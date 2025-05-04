// src/services/LanguageServerService.ts
import { spawn, ChildProcess, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { getAppDataPath } from '../utils/appPaths';
import LSPWebSocketProxy from './LSPWebSocketProxy';

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

export interface LanguageServerInfo {
    id: string;
    name: string;
    description: string;
    installed: boolean;
}

class LanguageServerService {
    private servers: Map<string, LanguageServer> = new Map();
    private serverConfigs: Map<string, ServerConfig> = new Map();
    private readonly serversPath: string;
    private nextPort = 8000;
    private lspProxy: LSPWebSocketProxy;
    private proxyPort = 8080; // Default WebSocket proxy port

    constructor() {
        this.serversPath = path.join(getAppDataPath(), 'language-servers');
        this.lspProxy = new LSPWebSocketProxy();
        // Ensure the directory exists
        if (!fs.existsSync(this.serversPath)) {
            fs.mkdirSync(this.serversPath, { recursive: true });
        }
        this.initializeServerConfigs();
        this.lspProxy.start(this.proxyPort).catch(err => {
            console.error('Failed to start LSP WebSocket proxy:', err);
        });
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

        // Java server - Eclipse JDT Language Server
        this.serverConfigs.set('java', {
            name: 'Java',
            description: 'Language server for Java based on Eclipse JDT',
            installCommand: 'npm install --prefix ' + this.serversPath + ' java-language-server',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '.bin', 'java-language-server')
        });

        // Kotlin server - Kotlin Language Server
        this.serverConfigs.set('kotlin', {
            name: 'Kotlin',
            description: 'Language server for Kotlin',
            installCommand: 'npm install --prefix ' + this.serversPath + ' kotlin-language-server',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '.bin', 'kotlin-language-server')
        });

        // C/C++ server - clangd
        const cppConfig: ServerConfig = {
            name: 'C/C++',
            description: 'Language server for C and C++ based on clangd',
            installCommand: 'npm install --prefix ' + this.serversPath + ' @clangd/clangd-extension',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '@clangd', 'clangd-extension', 'bin', 'clangd')
        };
        this.serverConfigs.set('cpp', cppConfig);
        this.serverConfigs.set('c', cppConfig);

        // Go server - gopls
        this.serverConfigs.set('go', {
            name: 'Go',
            description: 'Language server for Go (gopls)',
            installCommand: 'npm install --prefix ' + this.serversPath + ' vscode-go-langserver',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '.bin', 'gopls')
        });

        // Rust server - rust-analyzer
        this.serverConfigs.set('rust', {
            name: 'Rust',
            description: 'Language server for Rust (rust-analyzer)',
            installCommand: 'npm install --prefix ' + this.serversPath + ' rust-analyzer',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '.bin', 'rust-analyzer')
        });

        // PHP server - intelephense
        this.serverConfigs.set('php', {
            name: 'PHP',
            description: 'Language server for PHP (intelephense)',
            installCommand: 'npm install --prefix ' + this.serversPath + ' intelephense',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '.bin', 'intelephense')
        });

        // Ruby server - solargraph
        this.serverConfigs.set('ruby', {
            name: 'Ruby',
            description: 'Language server for Ruby (solargraph)',
            installCommand: 'npm install --prefix ' + this.serversPath + ' solargraph-utils',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '.bin', 'solargraph')
        });

        // Swift server - sourcekit-lsp
        this.serverConfigs.set('swift', {
            name: 'Swift',
            description: 'Language server for Swift (sourcekit-lsp)',
            installCommand: 'npm install --prefix ' + this.serversPath + ' sourcekit-lsp',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '.bin', 'sourcekit-lsp')
        });

        // Vue server
        this.serverConfigs.set('vue', {
            name: 'Vue',
            description: 'Language server for Vue.js files',
            installCommand: 'npm install --prefix ' + this.serversPath + ' vls',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '.bin', 'vls')
        });

        // YAML server
        this.serverConfigs.set('yaml', {
            name: 'YAML',
            description: 'Language server for YAML files',
            installCommand: 'npm install --prefix ' + this.serversPath + ' yaml-language-server',
            startCommand: '',
            args: ['--stdio'],
            binary: path.join(this.serversPath, 'node_modules', '.bin', 'yaml-language-server')
        });
    }

    public getAvailableServers(): LanguageServerInfo[] {
        const result: LanguageServerInfo[] = [];
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
                    port: this.proxyPort, // Return proxy port instead of server-specific port
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

            // Adjust binary path for production
            let binaryPath = config.binary;
            if (process.env.NODE_ENV === 'production') {
                // Check if path contains app.asar and replace with app.asar.unpacked
                binaryPath = binaryPath.replace('app.asar', 'app.asar.unpacked');
            }

            // Log more information to diagnose issues
            console.log(`Starting ${languageId} language server...`);
            console.log(`Binary path: ${config.binary}`);
            console.log(`Arguments: ${config.args.join(' ')}`);

            // Verify binary exists before attempting to spawn
            if (!fs.existsSync(binaryPath)) {
                console.error(`Binary not found at path: ${binaryPath}`);
                return null;
            }

            // Allocate a port for web socket connection
            const port = this.nextPort++;

            // Start server process with adjusted path
            const serverProcess = spawn(config.binary, config.args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    NODE_ENV: process.env.NODE_ENV,
                    ELECTRON_RUN_AS_NODE: '1'  // Help child process access files
                }
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

            // Register server with the WebSocket proxy
            this.lspProxy.registerServer(languageId, serverProcess);

            const server = {
                process: serverProcess,
                port: this.proxyPort, // Use the proxy port
                languageId
            };
            this.servers.set(languageId, server);

            console.log(`Successfully started ${languageId} language server, available via proxy on port ${this.proxyPort}`);
            return { port: this.proxyPort, languageId };
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

    public getServerInfo(languageId: string): { port: number, languageId: string, isInstalled: boolean } | null {
        const server = this.servers.get(languageId);
        if (!server) {
            return {
                port: this.proxyPort,
                languageId,
                isInstalled: this.isServerInstalled(languageId)
            };
        }

        return {
            port: server.port,
            languageId: server.languageId,
            isInstalled: true
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