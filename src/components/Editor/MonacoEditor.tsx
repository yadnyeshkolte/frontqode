// src/components/Editor/MonacoEditor.tsx
import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import * as path from 'path';

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
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ filePath, content, onChange, onSave }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const monacoEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    // Set up editor when component mounts
    useEffect(() => {
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

            // Create editor
            monacoEditorRef.current = monaco.editor.create(editorRef.current, {
                value: content,
                language,
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
            if (['typescript', 'javascript', 'html', 'css', 'json'].includes(language)) {
                setupLSP(language, filePath);
            }
        }

        // Clean up editor when component unmounts
        return () => {
            if (monacoEditorRef.current) {
                monacoEditorRef.current.dispose();
            }
        };
    }, [filePath]); // Re-create editor when file path changes

    // Update content when it changes externally
    useEffect(() => {
        if (monacoEditorRef.current) {
            const currentValue = monacoEditorRef.current.getValue();
            if (content !== currentValue) {
                monacoEditorRef.current.setValue(content);
            }
        }
    }, [content]);

    // Set up LSP connection for the editor
    const setupLSP = async (language: string, filePath: string) => {
        try {
            // This is where you would connect to a language server
            // You'll need to implement this separately for each language
            // For example, for TypeScript you might use typescript-language-server

            // This is a placeholder for the actual LSP connection setup
            const serverInfo = await window.electronAPI.getLSPServerInfo(language);

            if (!serverInfo?.success) {
                console.error(`No LSP server available for ${language}`);
                return;
            }

            // Create Monaco services and connect to language server
            const { port, languageId } = serverInfo;

            // This is simplified - you'd need to implement the actual connection
            console.log(`LSP connected for ${languageId} on port ${port}`);
        } catch (error) {
            console.error('Failed to set up LSP:', error);
        }
    };

    return (
        <div
            ref={editorRef}
            style={{
                width: '100%',
                height: '100%'
            }}
        />
    );
};

export default MonacoEditor;