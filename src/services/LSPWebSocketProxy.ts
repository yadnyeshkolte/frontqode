// src/services/LSPWebSocketProxy.ts
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
            const url = new URL(req.url || '', 'http://localhost');
            const languageId = url.pathname.substring(1); // Remove leading slash

            // Add connection to set of connections for this language
            if (!this.connections.has(languageId)) {
                this.connections.set(languageId, new Set());
            }
            this.connections.get(languageId)?.add(ws);

            // Handle messages from client
            ws.on('message', (message: Buffer) => {
                const serverProcess = this.serverProcesses.get(languageId);
                if (serverProcess && serverProcess.stdin) {
                    // Forward message to language server
                    serverProcess.stdin.write(`${message}\n`);
                }
            });

            // Handle client disconnection
            ws.on('close', () => {
                const connections = this.connections.get(languageId);
                if (connections) {
                    connections.delete(ws);

                    // If no more connections for this language, stop the server
                    if (connections.size === 0) {
                        this.stopServerProcess(languageId);
                    }
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

    // Stop the WebSocket proxy server
    public stop(): Promise<void> {
        return new Promise((resolve) => {
            // Stop all server processes
            for (const languageId of this.serverProcesses.keys()) {
                this.stopServerProcess(languageId);
            }

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
    // Stop a language server process
    private stopServerProcess(languageId: string): void {
        const process = this.serverProcesses.get(languageId);
        if (process) {
            process.kill();
            this.serverProcesses.delete(languageId);
            console.log(`Stopped language server process for ${languageId}`);
        }
    }
}

export default LSPWebSocketProxy;