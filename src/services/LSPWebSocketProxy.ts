// Updated LSPWebSocketProxy.ts
import * as WebSocket from 'ws';
import { ChildProcess } from 'child_process';
import * as http from 'http';

class LSPWebSocketProxy {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private server: http.Server;
    private wss: WebSocket.Server;
    private connections: Map<string, Set<WebSocket>> = new Map();
    private serverProcesses: Map<string, ChildProcess> = new Map();

    constructor() {
        // Create HTTP server
        this.server = http.createServer();

        // Create WebSocket server
        this.wss = new WebSocket.Server({ server: this.server });

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

    // Start the WebSocket proxy server
    public start(port: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.listen(port, () => {
                console.log(`LSP WebSocket proxy server listening on port ${port}`);
                resolve();
            }).on('error', (error: any) => {
                console.error('Failed to start LSP WebSocket proxy server:', error);
                reject(error);
            });
        });
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
            this.server.close(() => {
                console.log('LSP WebSocket proxy server stopped');
                resolve();
            });
        });
    }
}

export default LSPWebSocketProxy;