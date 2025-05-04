// Updated LSPWebSocketProxy.ts
import * as WebSocket from 'ws';
import { ChildProcess } from 'child_process';
import http = require('http');
import lspDebugger from '../utils/lspDebugger';

export interface ProxyInfo {
    port: number;
    status: 'running' | 'stopped';
}

class LSPWebSocketProxy {
    private readonly server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    private wss: WebSocket.Server;
    private connections: Map<string, Set<WebSocket>> = new Map();
    private serverProcesses: Map<string, ChildProcess> = new Map();
    private port = 8080;
    private status: 'running' | 'stopped' = 'stopped';

    constructor() {
        // Create HTTP server
        this.server = http.createServer();

        // Create WebSocket server
        this.wss = new WebSocket.Server({ server: this.server });

        // Log initialization
        lspDebugger.log('LSP WebSocket Proxy initialized');

        // Handle WebSocket connections
        this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
            const url = new URL(req.url || '', `http://localhost`);
            const languageId = url.pathname.substring(1); // Remove leading slash

            console.log(`New WebSocket connection for ${languageId}`);

            // Add connection to set of connections for this language
            if (!this.connections.has(languageId)) {
                this.connections.set(languageId, new Set());
            }
            this.connections.get(languageId)?.add(ws);

            // Get server process
            const serverProcess = this.serverProcesses.get(languageId);
            if (!serverProcess) {
                console.error(`No language server process found for ${languageId}`);
                ws.close(1011, `No language server process found for ${languageId}`);
                return;
            }

            // Set up server process output handling if not already set up
            if (serverProcess.stdout && !serverProcess.stdout.listenerCount('data')) {
                serverProcess.stdout.on('data', (data) => {
                    const connections = this.connections.get(languageId);
                    if (connections) {
                        const message = data.toString();
                        console.log(`${languageId} server output: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);

                        // Send message to all connected clients for this language
                        for (const client of connections) {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(message);
                            }
                        }
                    }
                });
            }

            if (serverProcess.stderr && !serverProcess.stderr.listenerCount('data')) {
                serverProcess.stderr.on('data', (data) => {
                    console.error(`${languageId} server error:`, data.toString());
                });
            }

            // Handle messages from client
            ws.on('message', (message: Buffer) => {
                if (serverProcess && serverProcess.stdin) {
                    // Forward message to language server
                    const messageStr = message.toString();
                    console.log(`Sending message to ${languageId} server: ${messageStr.substring(0, 100)}${messageStr.length > 100 ? '...' : ''}`);
                    serverProcess.stdin.write(messageStr + '\n');
                }
            });

            // Handle client disconnection
            ws.on('close', () => {
                console.log(`WebSocket connection closed for ${languageId}`);
                const connections = this.connections.get(languageId);
                if (connections) {
                    connections.delete(ws);
                }
            });
        });
    }

    public start(port: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.port = port;
            lspDebugger.log(`Attempting to start LSP proxy on port ${port}`);

            (this.server as any).listen(port, () => {
                console.log(`LSP WebSocket proxy server listening on port ${port}`);
                lspDebugger.log(`LSP WebSocket proxy server started on port ${port}`);
                this.status = 'running';
                resolve();
            }).on('error', (error: any) => {
                console.error('Failed to start LSP WebSocket proxy server:', error);
                lspDebugger.logError(`Failed to start proxy on port ${port}: ${error.message}`);

                // In production, try alternative port if the default is taken
                if (process.env.NODE_ENV === 'production' && error.code === 'EADDRINUSE') {
                    const fallbackPort = port + 1;
                    lspDebugger.log(`Attempting to use fallback port ${fallbackPort}`);
                    console.log(`Attempting to use fallback port ${fallbackPort}`);

                    (this.server as any).listen(fallbackPort, () => {
                        console.log(`LSP WebSocket proxy server listening on fallback port ${fallbackPort}`);
                        lspDebugger.log(`LSP WebSocket proxy started successfully on fallback port ${fallbackPort}`);
                        this.port = fallbackPort;
                        this.status = 'running';
                        resolve();
                    }).on('error', (fallbackError: { message: any; }) => {
                        lspDebugger.logError(`Failed to start on fallback port: ${fallbackError.message}`);
                        reject(fallbackError);
                    });
                } else {
                    reject(error);
                }
            });
        });
    }

    // Get proxy information
    public getProxyInfo(): ProxyInfo {
        return {
            port: this.port,
            status: this.status
        };
    }

    // Register a server process with the proxy
    public registerServer(languageId: string, process: ChildProcess): void {
        console.log(`Registering ${languageId} server process with WebSocket proxy`);
        this.serverProcesses.set(languageId, process);

        // Clean up when process exits
        process.on('exit', () => {
            console.log(`${languageId} server process exited, removing from proxy`);
            this.serverProcesses.delete(languageId);

            // Close all connections for this language
            const connections = this.connections.get(languageId);
            if (connections) {
                for (const client of connections) {
                    client.close(1000, `${languageId} server process exited`);
                }
                this.connections.delete(languageId);
            }
        });
    }

    // Check if server is registered for a language
    public isServerRegistered(languageId: string): boolean {
        return this.serverProcesses.has(languageId);
    }

    // Stop the WebSocket proxy server
    public stop(): Promise<void> {
        return new Promise((resolve) => {
            // Close all WebSocket connections
            for (const clients of this.connections.values()) {
                for (const client of clients) {
                    client.close();
                }
            }

            // Close the server
            (this.server as any).close(() => {
                console.log('LSP WebSocket proxy server stopped');
                this.status = 'stopped';
                resolve();
            });
        });
    }
}

export default LSPWebSocketProxy;