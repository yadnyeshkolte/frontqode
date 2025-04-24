// src/components/Documentation/Documentation.tsx
import React, { useState, useEffect, useRef } from 'react';
import './Documentation.css';
import AlertModal from '../AlertModal/AlertModal';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import FileContextSelector, { FileContext } from '../AIAssistant/FileContextSelector/FileContextSelector';
import DocsExplorer from './DocsExplorer';
import DocsContextMenu from './DocsContextMenu';
import HoverChat from './HoverChat';
import DocGenChatOverlay from './DocGenChatOverlay';
import * as path from 'path';

interface DocumentationProps {
    isOpen: boolean;
    onClose: () => void;
    projectPath: string;
}

const Documentation: React.FC<DocumentationProps> = ({ isOpen, onClose, projectPath }) => {
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    const [docContent, setDocContent] = useState<string>('');
    const [currentDocPath, setCurrentDocPath] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FileContext[]>([]);
    const [showFileSelector, setShowFileSelector] = useState(false);
    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info' as 'info' | 'warning' | 'error' | 'success',
        onConfirm: null as (() => void) | null
    });
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [docFiles, setDocFiles] = useState<string[]>([]);

    // New state for context menu
    const [contextMenu, setContextMenu] = useState<{
        show: boolean;
        x: number;
        y: number;
        filePath: string;
        isDirectory: boolean;
    }>({
        show: false,
        x: 0,
        y: 0,
        filePath: '',
        isDirectory: false
    });

    // New state for hover chat
    const [hoverChat, setHoverChat] = useState<{
        show: boolean;
        x: number;
        y: number;
        selectionContext: string;
    }>({
        show: false,
        x: 0,
        y: 0,
        selectionContext: ''
    });

    // New state for doc generation overlay
    const [showDocGenOverlay, setShowDocGenOverlay] = useState(false);
    const [additionalDocGenContext, setAdditionalDocGenContext] = useState('');

    const clearSelectedFiles = () => {
        setSelectedFiles([]);
    };

    useEffect(() => {
        if (projectPath) {
            // Check if docs directory exists, if not create it
            checkDocsDirectory();
            // Load list of existing doc files
            loadDocFiles();
        }
    }, [projectPath]);

    const checkDocsDirectory = async () => {
        if (!projectPath) return;

        const docsPath = path.join(projectPath, 'docs');
        try {
            const result = await window.electronAPI.checkIfDirectoryExists(docsPath);
            if (!result.exists) {
                // Create docs directory if it doesn't exist
                await window.electronAPI.createDirectory(docsPath);
                console.log('Created docs directory');
            }
        } catch (error) {
            console.error('Error checking/creating docs directory:', error);
        }
    };

    const loadDocFiles = async () => {
        if (!projectPath) return;

        const docsPath = path.join(projectPath, 'docs');
        try {
            const result = await window.electronAPI.listFilesInDirectory(docsPath);
            if (result.success) {
                // Filter to only include markdown files
                const markdownFiles = result.files.filter((file: string) =>
                    file.toLowerCase().endsWith('.md'));
                setDocFiles(markdownFiles);
            }
        } catch (error) {
            console.error('Error loading doc files:', error);
        }
    };

    const openDocFile = async (filePath: string) => {
        try {
            const result = await window.electronAPI.readFile(filePath);
            if (result.success) {
                setDocContent(result.content);
                setCurrentDocPath(filePath);
            } else {
                setAlertState({
                    isOpen: true,
                    title: 'Error',
                    message: `Failed to open documentation file: ${result.error}`,
                    type: 'error',
                    onConfirm: null
                });
            }
        } catch (error) {
            console.error('Error opening doc file:', error);
        }
    };

    const saveCurrentDoc = async () => {
        if (!currentDocPath || !docContent) return;

        try {
            const result = await window.electronAPI.writeFile(currentDocPath, docContent);
            if (!result.success) {
                setAlertState({
                    isOpen: true,
                    title: 'Error',
                    message: `Failed to save documentation file: ${result.error}`,
                    type: 'error',
                    onConfirm: null
                });
            }
        } catch (error) {
            console.error('Error saving doc file:', error);
        }
    };

    const generateProjectDocs = async () => {
        // Show chat overlay to get additional context before generating docs
        setShowDocGenOverlay(true);
    };

    const handleGenerateDocsWithContext = async (additionalContext: string) => {
        if (!projectPath) return;

        setIsProcessing(true);
        try {
            // First, scan project to get file structure (excluding node_modules, etc.)
            const projectFiles = await scanProject();

            // Generate documentation using Groq
            const prompt = `Generate comprehensive markdown documentation for a project with the following structure:
    
${projectFiles.map(file => `- ${file}`).join('\n')}

${selectedFiles.length > 0 ? '\nHere are some key files with their content for context:' : ''}
${selectedFiles.map(file => `
File: ${file.path}
\`\`\`
${file.content}
\`\`\`
`).join('\n')}

${additionalContext ? `\nAdditional context from user:\n${additionalContext}` : ''}

Create a well-structured markdown document that includes:
1. Project overview
2. Main components/modules description 
3. Architecture diagram (described in text)
4. Key functions and classes documentation
5. Setup instructions based on visible configuration files
`;

            const result = await window.electronAPI.groqGetCompletion(prompt, 10000);

            if (result.success && result.completion) {
                // Create a main documentation file
                const mainDocPath = path.join(projectPath, 'docs', 'project-documentation.md');
                await window.electronAPI.writeFile(mainDocPath, result.completion);

                // Refresh and open the new file
                await loadDocFiles();
                openDocFile(mainDocPath);

                // Clear selected files after successful generation
                clearSelectedFiles();
                // Clear additional context
                setAdditionalDocGenContext('');

                setAlertState({
                    isOpen: true,
                    title: 'Success',
                    message: 'Project documentation has been generated successfully!',
                    type: 'success',
                    onConfirm: null
                });
            } else {
                throw new Error(result.error || 'Unknown error generating documentation');
            }
        } catch (error) {
            console.error('Error generating documentation:', error);
            setAlertState({
                isOpen: true,
                title: 'Error',
                message: `Failed to generate documentation: ${error.message}`,
                type: 'error',
                onConfirm: null
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const scanProject = async () => {
        // Get all files in project, excluding common directories to ignore
        const ignoreDirectories = ['node_modules', '.git', '.idea', '.webpack', 'dist', 'build'];

        try {
            const result = await window.electronAPI.scanDirectory(projectPath, ignoreDirectories);
            if (result.success) {
                return result.files;
            }
            return [];
        } catch (error) {
            console.error('Error scanning project:', error);
            return [];
        }
    };

    const handleOpenFileSelector = () => {
        if (projectPath) {
            setShowFileSelector(true);
        } else {
            setAlertState({
                isOpen: true,
                title: 'No Project Open',
                message: 'Please open a project first to select files for context.',
                type: 'warning',
                onConfirm: null
            });
        }
    };

    const handleFileSelectionConfirm = (files: FileContext[]) => {
        setSelectedFiles(files);
        setShowFileSelector(false);
    };

    const handleFileSelectionCancel = () => {
        setShowFileSelector(false);
        // Don't change selected files when cancelled
    };

    const documentSelectedCode = async (additionalContext = '') => {
        if (!editorRef.current || !currentDocPath) return;

        const selection = editorRef.current.value.substring(
            editorRef.current.selectionStart,
            editorRef.current.selectionEnd
        );

        if (!selection) {
            setAlertState({
                isOpen: true,
                title: 'No Selection',
                message: 'Please select some text to document.',
                type: 'warning',
                onConfirm: null
            });
            return;
        }

        // If no additional context provided, show the hover chat
        if (!additionalContext) {
            // Get cursor position for hover chat
            const textarea = editorRef.current;
            const cursorPosition = textarea.selectionStart;

            // Calculate position based on textarea
            const textareaRect = textarea.getBoundingClientRect();
            // Approximate position based on character position (this is simplified)
            const lines = textarea.value.substr(0, cursorPosition).split('\n');
            const lineHeight = 18; // Approximate line height in pixels
            const currentLine = lines.length;

            // Position the hover chat near the cursor
            const x = textareaRect.left + 50; // Offset from textarea left
            const y = textareaRect.top + currentLine * lineHeight;

            setHoverChat({
                show: true,
                x,
                y,
                selectionContext: selection
            });
            return;
        }

        setIsProcessing(true);
        try {
            const prompt = `Document the following code selection in markdown format. Provide a clear explanation of what it does, parameters, return values, and usage examples if applicable:

\`\`\`
${selection}
\`\`\`

${additionalContext ? `Additional context from user:\n${additionalContext}\n\n` : ''}

${selectedFiles.length > 0 ? 'Additional context from project files:' : ''}
${selectedFiles.map(file => `
File: ${file.path}
\`\`\`
${file.content}
\`\`\`
`).join('\n')}

Format the documentation properly for a markdown document.`;

            const result = await window.electronAPI.groqGetCompletion(prompt, 2000);

            if (result.success && result.completion) {
                // Insert the documentation at the current cursor position
                const docStart = editorRef.current.selectionStart;
                const currentValue = editorRef.current.value;

                const newContent =
                    currentValue.substring(0, docStart) +
                    '\n\n' + result.completion + '\n\n' +
                    currentValue.substring(docStart);

                setDocContent(newContent);

                // Save the updated content
                await window.electronAPI.writeFile(currentDocPath, newContent);
            } else {
                throw new Error(result.error || 'Unknown error documenting code');
            }
        } catch (error) {
            console.error('Error documenting selected code:', error);
            setAlertState({
                isOpen: true,
                title: 'Error',
                message: `Failed to document code: ${error.message}`,
                type: 'error',
                onConfirm: null
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // New method to handle hover chat context submission
    const handleHoverChatSubmit = (context: string) => {
        setHoverChat(prev => ({ ...prev, show: false }));
        documentSelectedCode(context);
    };

    // New method to handle right-click in docs explorer
    const handleDocsContextMenu = (filePath: string, isDirectory: boolean, e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({
            show: true,
            x: e.clientX,
            y: e.clientY,
            filePath,
            isDirectory
        });
    };

    // New method to close context menu
    const closeContextMenu = () => {
        setContextMenu(prev => ({ ...prev, show: false }));
    };

    // New method to reload docs after context menu actions
    const handleDocsReload = () => {
        loadDocFiles();
    };

    const closeAlert = () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
    };

    if (!isOpen) return null;

    return (
        <div className={`documentation-overlay ${isExpanded ? 'expanded' : ''}`}>
            <div className="documentation-panel">
                <div className="documentation-header">
                    <h3>Documentation</h3>
                    <div className="documentation-actions">
                        <button onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Shrink" : "Expand"}>
                            <span className="material-icons">{isExpanded ? "fullscreen_exit" : "fullscreen"}</span>
                        </button>
                        <button onClick={onClose} title="Close">
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                </div>

                <div className="documentation-sidebar">
                    <div className="doc-actions">
                        <button onClick={generateProjectDocs} title="Auto-Generate Project Documentation" disabled={isProcessing}>
                            <span className={`material-icons ${isProcessing ? "rotating" : ""}`}>
                                {isProcessing ? "refresh" : "auto_awesome"}
                            </span>
                        </button>
                        <button onClick={handleOpenFileSelector} title="Add Context Files">
                            <span className="material-icons">attach_file</span>
                            {selectedFiles.length > 0 && (
                                <span className="files-badge">{selectedFiles.length}</span>
                            )}
                        </button>
                    </div>

                    {/* Replace the old docs-files-list with the new DocsExplorer component */}
                    <DocsExplorer
                        projectPath={projectPath}
                        onFileSelect={openDocFile}
                        currentDocPath={currentDocPath}
                        onContextMenu={handleDocsContextMenu}
                    />
                </div>

                <div className="documentation-content">
                    <div className="documentation-tabs">
                        <button
                            className={activeTab === 'editor' ? 'active' : ''}
                            onClick={() => setActiveTab('editor')}
                        >
                            Editor
                        </button>
                        <button
                            className={activeTab === 'preview' ? 'active' : ''}
                            onClick={() => setActiveTab('preview')}
                        >
                            Preview
                        </button>
                        {activeTab === 'editor' && (
                            <button
                                className="doc-code-button"
                                onClick={() => documentSelectedCode()}
                                title="Document Selected Code (Alt+D)"
                                disabled={isProcessing}
                            >
                                <span className="material-icons">code</span> Document Selection
                            </button>
                        )}
                        <button
                            className="save-doc-button"
                            onClick={saveCurrentDoc}
                            disabled={!currentDocPath}
                        >
                            <span className="material-icons">save</span> Save
                        </button>
                    </div>

                    {activeTab === 'editor' ? (
                        <textarea
                            ref={editorRef}
                            className="documentation-editor"
                            value={docContent}
                            onChange={(e) => setDocContent(e.target.value)}
                            placeholder="# Start your documentation here..."
                            onKeyDown={(e) => {
                                // Alt+D shortcut for document selection
                                if (e.altKey && e.key === 'd') {
                                    e.preventDefault();
                                    documentSelectedCode();
                                }
                            }}
                        />
                    ) : (
                        <div className="documentation-preview">
                            <MarkdownRenderer content={docContent} />
                        </div>
                    )}
                </div>

                {/* Context menu for docs explorer */}
                {contextMenu.show && (
                    <DocsContextMenu
                        position={{ x: contextMenu.x, y: contextMenu.y }}
                        onClose={closeContextMenu}
                        filePath={contextMenu.filePath}
                        isDirectory={contextMenu.isDirectory}
                        onReload={handleDocsReload}
                        projectPath={projectPath}
                    />
                )}

                {/* Hover chat for documenting code */}
                {hoverChat.show && (
                    <HoverChat
                        position={{ x: hoverChat.x, y: hoverChat.y }}
                        onClose={() => setHoverChat(prev => ({ ...prev, show: false }))}
                        onAddContext={handleHoverChatSubmit}
                    />
                )}

                {/* Doc generation chat overlay */}
                <DocGenChatOverlay
                    isOpen={showDocGenOverlay}
                    onClose={() => setShowDocGenOverlay(false)}
                    onSubmit={handleGenerateDocsWithContext}
                    isProcessing={isProcessing}
                />

                <FileContextSelector
                    isOpen={showFileSelector}
                    projectPath={projectPath}
                    onClose={handleFileSelectionCancel}
                    onConfirmSelection={handleFileSelectionConfirm}
                    initialSelectedFiles={selectedFiles}
                />

                {/* Alert Modal */}
                <AlertModal
                    isOpen={alertState.isOpen}
                    title={alertState.title}
                    message={alertState.message}
                    type={alertState.type}
                    onClose={closeAlert}
                    onConfirm={alertState.onConfirm ? () => alertState.onConfirm?.() : undefined}
                    confirmButtonText="OK"
                    showCancelButton={alertState.onConfirm !== null}
                />
            </div>
        </div>
    );
};

export default Documentation;