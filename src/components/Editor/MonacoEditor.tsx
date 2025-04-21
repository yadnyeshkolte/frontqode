// src/components/Editor/MonacoEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import { MonacoLanguageClient } from 'monaco-languageclient';
import {CloseAction, ErrorAction} from 'vscode-languageclient';
import {toSocket, WebSocketMessageReader, WebSocketMessageWriter} from '@codingame/monaco-jsonrpc';
import path from "path";

// Initialize Monaco environment
self.MonacoEnvironment = {
    getWorkerUrl: function (_moduleId, label) {
        if (label === 'json') {
            return './json.worker.js';
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return './css.worker.js';
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return './html.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
            return './ts.worker.js';
        }
        return './editor.worker.js';
    }
};

interface MonacoEditorProps {
    filePath: string;
    content: string;
    onChange: (content: string) => void;
    onSave: () => void;
    projectRoot?: string; // Add project root for workspace context
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
                                                       filePath,
                                                       content,
                                                       onChange,
                                                       onSave,
                                                       projectRoot
                                                   }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const monacoEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const langClientRef = useRef<MonacoLanguageClient | null>(null);
    const [lspStatus, setLSPStatus] = useState<string>('');

    // Function to clean up any existing language client
    const cleanupLanguageClient = () => {
        if (langClientRef.current) {
            langClientRef.current.stop().catch(console.error);
            langClientRef.current = null;
        }
    };

    // Set up editor when component mounts or filePath changes
    useEffect(() => {
        // Clean up any existing editor before creating a new one
        if (monacoEditorRef.current) {
            cleanupLanguageClient();
            monacoEditorRef.current.dispose();
            monacoEditorRef.current = null;
        }

        if (editorRef.current) {
            // Determine language based on file extension
            const ext = path.extname(filePath).toLowerCase();
            let language = 'plaintext';

            // Map file extensions to Monaco languages
            const languageMap: Record<string, string> = {
                '.js': 'javascript',
                '.jsx': 'javascript',
                '.ts': 'typescript',
                '.tsx': 'typescript',
                '.html': 'html',
                '.css': 'css',
                '.json': 'json',
                '.md': 'markdown',
                '.py': 'python',
                '.java': 'java',
                '.c': 'c',
                '.cpp': 'cpp',
                '.cs': 'csharp',
                '.go': 'go',
                '.php': 'php',
                '.rb': 'ruby',
                '.rs': 'rust',
                '.swift': 'swift',
            };

            if (ext in languageMap) {
                language = languageMap[ext];
            }

            // Set up workspace context if project root is provided
            if (projectRoot) {
                monaco.editor.createModel('', 'plaintext', monaco.Uri.parse('file:///workspace.json'));
            }

            // Create editor model with URI based on file path
            const uri = monaco.Uri.file(filePath);
            let model = monaco.editor.getModel(uri);

            if (!model) {
                model = monaco.editor.createModel(content, language, uri);
            } else {
                model.setValue(content);
            }

            // Create editor
            monacoEditorRef.current = monaco.editor.create(editorRef.current, {
                model,
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: {
                    enabled: true
                },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                roundedSelection: false,
                selectOnLineNumbers: true,
                wordWrap: 'on',
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
            });

            // Set up editor change event
            monacoEditorRef.current.onDidChangeModelContent(() => {
                const newValue = monacoEditorRef.current?.getValue() || '';
                onChange(newValue);
            });

            // Set up Ctrl+S for save
            monacoEditorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                onSave();
            });

            // Set up LSP if needed for this file type
            if (['typescript', 'javascript', 'html', 'css', 'json', 'python'].includes(language)) {
                setupLSP(language, uri).catch(console.error);
            }
        }

        // Clean up editor when component unmounts or when filePath changes
        return () => {
            if (monacoEditorRef.current) {
                cleanupLanguageClient();
                monacoEditorRef.current.dispose();
                monacoEditorRef.current = null;
            }
        };
    }, [filePath]); // Re-create editor when file path changes

    // Update content when it changes externally
    useEffect(() => {
        if (monacoEditorRef.current) {
            const currentValue = monacoEditorRef.current.getValue();
            if (content !== currentValue) {
                // Use model.setValue to avoid triggering onDidChangeModelContent
                const model = monacoEditorRef.current.getModel();
                if (model) {
                    model.setValue(content);
                } else {
                    monacoEditorRef.current.setValue(content);
                }
            }
        }
    }, [content]);

    // Set up LSP connection for the editor
    const setupLSP = async (language: string, documentUri: monaco.Uri) => {
        try {
            setLSPStatus(`Connecting to ${language} language server...`);

            // More detailed logging
            console.log(`Setting up LSP for ${language} at ${documentUri.toString()}`);

            // Get info about language server from the main process
            const serverInfo = await window.electronAPI.getLSPServerInfo(language);
            console.log(`Server info for ${language}:`, serverInfo);

            if (!serverInfo?.success) {
                if (serverInfo?.isInstalled === false) {
                    setLSPStatus(`${language} language server is not installed. Please install it from the LSP Manager.`);
                } else {
                    setLSPStatus(`Failed to connect to ${language} language server: ${serverInfo?.error || 'Unknown error'}`);
                }
                return;
            }

            // Create WebSocket connection to language server via proxy
            const webSocketUrl = `ws://localhost:${serverInfo.port}/${language}`;
            console.log(`Connecting to WebSocket at ${webSocketUrl}`);

            const webSocket = new WebSocket(webSocketUrl);

            let isConnected = false;

            // Add timeout for connection
            const connectionTimeout = setTimeout(() => {
                if (!isConnected) {
                    console.error(`Connection timeout for ${language} language server`);
                    setLSPStatus(`Connection timeout for ${language} language server`);
                    webSocket.close();
                }
            }, 10000); // 10 seconds timeout

            // Handle WebSocket errors
            webSocket.onerror = (error) => {
                console.error(`WebSocket error for ${language}:`, error);
                setLSPStatus(`WebSocket connection error for ${language} language server`);
                clearTimeout(connectionTimeout);
            };

            webSocket.onopen = () => {
                isConnected = true;
                clearTimeout(connectionTimeout);
                console.log(`WebSocket connection established for ${language}`);
                setLSPStatus(`Connected to ${language} language server`);
            };

            // Continue with your existing code...
            const socket = toSocket(webSocket);
            const reader = new WebSocketMessageReader(socket);
            const writer = new WebSocketMessageWriter(socket);

            // Create language client
            try {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const languageClient = new MonacoLanguageClient({
                    name: `${language} Language Client`,
                    clientOptions: {
                        documentSelector: [{ language }],
                        errorHandler: {
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            error: () => {
                                console.log(`Error in ${language} language client`);
                                return ErrorAction.Continue;
                            },
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            closed: () => {
                                console.log(`Connection closed for ${language} language client`);
                                return CloseAction.DoNotRestart;
                            }
                        },
                        workspaceFolder: projectRoot ? {
                            uri: monaco.Uri.file(projectRoot),
                            name: path.basename(projectRoot),
                            index: 0
                        } : undefined,
                    },
                    connectionProvider: {
                        get: () => {
                            return Promise.resolve({
                                reader,
                                writer
                            });
                        }
                    }
                });

                console.log(`Starting ${language} language client...`);
                await languageClient.start();
                langClientRef.current = languageClient;
                console.log(`${language} language client started successfully`);

                // Set up cleanup when WebSocket closes
                webSocket.onclose = (event) => {
                    console.log(`WebSocket connection closed for ${language} with code ${event.code}`);
                    setLSPStatus(`Disconnected from ${language} language server`);
                    cleanupLanguageClient();
                };
            } catch (error) {
                console.error(`Error creating language client for ${language}:`, error);
                setLSPStatus(`Error creating language client: ${error.message}`);
                webSocket.close();
            }
        } catch (error) {
            console.error(`Failed to set up LSP for ${language}:`, error);
            setLSPStatus(`Error connecting to language server: ${error.message}`);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {lspStatus && (
                <div className="lsp-status-bar">
                    <span>{lspStatus}</span>
                </div>
            )}
            <div
                ref={editorRef}
                style={{
                    width: '100%',
                    height: '100%',
                    flexGrow: 1
                }}
            />
        </div>
    );
};

export default MonacoEditor;