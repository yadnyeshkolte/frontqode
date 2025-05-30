// src/components/Editor/MonacoEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import * as path from 'path';
import 'vscode/localExtensionHost';
import debounce from 'lodash/debounce';
import './AISuggetion.css';

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
    projectRoot?: string;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
                                                       filePath,
                                                       content,
                                                       onChange,
                                                       onSave
                                                   }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const monacoEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const [lspStatus, setLSPStatus] = useState<string>('');
    const socketRef = useRef<WebSocket | null>(null);
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [codeSuggestions, setCodeSuggestions] = useState<string>('');
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

    const debouncedGetSuggestions = useRef(
        debounce(async (code: string, lang: string) => {
            try {
                const result = await window.electronAPI.groqGetCompletion(
                    `Suggest code improvements or completions for the following ${lang} code:\n\n${code}`,
                    200 // Smaller token limit for suggestions
                );
                if (result.success && result.completion) {
                    setCodeSuggestions(result.completion);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error('Error getting code suggestions:', error);
            }
        }, 800)
    ).current;

    // Clean up function for LSP connections
    const cleanupLSP = () => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }

        setLSPStatus('');
    };

    // Set up editor when component mounts or filePath changes
    useEffect(() => {
        // Clean up any existing editor before creating a new one
        if (monacoEditorRef.current) {
            monacoEditorRef.current.dispose();
            monacoEditorRef.current = null;
        }

        cleanupLSP();

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
                // Add support for new languages
                '.java': 'java',
                '.kt': 'kotlin',
                '.cpp': 'cpp',
                '.c': 'c',
                '.h': 'c',
                '.hpp': 'cpp',
                '.cc': 'cpp',
                '.cxx': 'cpp',
                '.go': 'go',
                '.rs': 'rust',
                '.php': 'php',
                '.rb': 'ruby',
                '.swift': 'swift',
                '.vue': 'vue',
                '.yaml': 'yaml',
                '.yml': 'yaml',
                '.py': 'python',
            };

            if (ext in languageMap) {
                language = languageMap[ext];
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
                minimap: { enabled: true },
                scrollBeyondLastLine: true,
                fontSize: 14,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                wordWrap: 'on',
                quickSuggestions: true,
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

            // Add Alt+D command for documenting selected code
            monacoEditorRef.current.addCommand(
                monaco.KeyMod.Alt | monaco.KeyCode.KeyD,
                () => {
                    // Get the selected text
                    const selection = monacoEditorRef.current?.getModel()?.getValueInRange(
                        monacoEditorRef.current.getSelection()
                    );

                    if (selection) {
                        // Trigger event for documenting selected code
                        const event = new CustomEvent('document-selected-code', {
                            detail: { code: selection, language: monacoEditorRef.current?.getModel()?.getLanguageId() }
                        });
                        window.dispatchEvent(event);
                    }
                }
            );

            // Try to initialize LSP for supported languages
            const supportedLanguages = [
                'typescript', 'javascript', 'html', 'css', 'json', 'python',
                'java', 'kotlin', 'cpp', 'c', 'go', 'rust', 'php', 'ruby', 'swift', 'vue', 'yaml'
            ];

            if (supportedLanguages.includes(language)) {
                initLanguageServer(language, uri).then(() => {
                    //will add later when implementing Full LSP
                });
            }
        }

        return cleanupLSP;
    }, [filePath]);

    // Update content when it changes externally
    useEffect(() => {
        if (monacoEditorRef.current) {
            const currentValue = monacoEditorRef.current.getValue();
            if (content !== currentValue) {
                const model = monacoEditorRef.current.getModel();
                if (model) {
                    model.setValue(content);
                }
            }
        }
    }, [content]);

    // Initialize language server
    const initLanguageServer = async (language: string, documentUri: monaco.Uri) => {
        try {
            console.log(`Setting up LSP for ${language} at ${documentUri.toString()}`);
            setLSPStatus(`Initializing ${language} language support...`);

            // Get language server info from main process
            const serverInfo = await window.electronAPI.getLSPServerInfo(language);
            console.log(`Server info for ${language}:`, serverInfo);

            if (!serverInfo?.success) {
                setLSPStatus(`${language} language server is not available`);
                return;
            }

            // Use built-in Monaco capabilities rather than full LSP for now
            // Monaco has good support for TypeScript without LSP
            setLSPStatus(`Using built-in ${language} language support`);

            // Set language features - future enhancement to connect to LSP
            // would be implemented here with proper VSCode API setup
        } catch (error) {
            console.error(`Error setting up ${language} language support:`, error);
            setLSPStatus(`Error: ${error.message}`);
        }
    };

    useEffect(() => {
        if (monacoEditorRef.current && content) {
            const model = monacoEditorRef.current.getModel();
            if (model) {
                const language = model.getLanguageId();
                debouncedGetSuggestions(content, language);
            }
        }
    }, [content]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {lspStatus && (
                <div className="lsp-status-bar">
                    <span>{lspStatus}</span>
                </div>
            )}
            <div
                ref={editorRef}
                style={{ width: '100%', height: '100%', flexGrow: 1 }}
            />
            {showSuggestions && codeSuggestions && (
                <div className="code-suggestions">
                    <div className="suggestions-header">
                        <h4>AI Suggestion</h4>
                        <button onClick={() => setShowSuggestions(false)} aria-label="Close suggestions">
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                    <div className="suggestions-content">
                        <pre>{codeSuggestions}</pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonacoEditor;