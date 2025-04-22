// src/components/App/App.tsx
import React, { useEffect, useState, useRef } from 'react';
import '../../styles/App.css';
import * as path from 'path';
import Terminal from '../Terminal/Terminal';
import FileExplorer from '../FileExplorer/FileExplorer';
import MonacoEditor from '../Editor/MonacoEditor';
import LSPManager from '../../managers/LSPManager';
import FileOperationsService from '../../services/FileOperationsService';
import AIAssistant from '../AIAssistant/AIAssistant';



interface AppProps {
    projectPath: string;
}

const App: React.FC<AppProps> = ({ projectPath }) => {
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [projectName, setProjectName] = useState<string>('');
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [isTerminalExpanded, setIsTerminalExpanded] = useState<boolean>(true);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [isLSPManagerOpen, setIsLSPManagerOpen] = useState<boolean>(false);
    const [editorKey] = useState<number>(0); // Add a key to force re-render of editor
    const fileOpsService = useRef(new FileOperationsService()).current;
    const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);

    // Load project data when the project path changes
    useEffect(() => {
        if (projectPath) {
            // Extract project name from path
            const name = path.basename(projectPath);
            setProjectName(name);

            // Change terminal directory to project path
            window.electronAPI.terminalChangeDirectory(projectPath).then(() => {
                //will add later
            });

            // Look for a readme.md file to open by default
            const readmePath = path.join(projectPath, 'readme.md');
            try {
                // Check if readme.md exists and open it
                window.electronAPI.readFile(readmePath)
                    .then(result => {
                        if (result.success) {
                            openFile(readmePath).then(() => {
                                //will add later
                            });
                        }
                    })
                    .catch(() => {
                        // No readme.md file found, that's fine
                    });
            } catch (error) {
                console.error('Error checking for readme.md:', error);
            }
        }
    }, [projectPath]);

    // Set up menu event listeners
    useEffect(() => {
        // Handle app-save-file custom event (for menu integration)
        const handleAppSaveFile = () => {
            if (activeFile) {
                saveFile().then(() => {
                    // will add later
                });
            }
        };

        // Add event listener for custom event from renderer.ts
        window.addEventListener('app-save-file', handleAppSaveFile);

        // Clean up event listener
        return () => {
            window.removeEventListener('app-save-file', handleAppSaveFile);
        };
    }, [activeFile, fileContent]);

    const saveFile = async () => {
        if (activeFile && isDirty) {
            try {
                const result = await fileOpsService.saveFile(activeFile, fileContent);

                if (result.success) {
                    setIsDirty(false);
                    // Show a brief success message, maybe through a toast notification or status bar
                    console.log(`File ${path.basename(activeFile)} saved successfully.`);
                    return true;
                } else {
                    console.error(`Failed to save file: ${result.error}`);
                    return false;
                }
            } catch (error) {
                console.error('Failed to save file:', error);
                return false;
            }
        }
        return true; // Return true if no save was needed
    };

    // Modified openFile to automatically save the current file before switching
    const openFile = async (filePath: string) => {
        try {
            // Don't do anything if clicking the same file
            if (filePath === activeFile) {
                return;
            }

            // Auto-save: Always save the current file before switching
            if (activeFile && isDirty) {
                await saveFile();
            }

            const result = await fileOpsService.openFile(filePath);

            if (result.success && result.content !== undefined) {
                // Add file to open files if not already there
                if (!openFiles.includes(filePath)) {
                    setOpenFiles([...openFiles, filePath]);
                }

                // Set active file and content
                setActiveFile(filePath);
                setFileContent(result.content);
                setIsDirty(false);
            } else {
                console.error(`Failed to open file: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to open file:', error);
        }
    };

    const saveFileAs = async () => {
        if (activeFile) {
            try {
                const result = await fileOpsService.saveFileAs(activeFile, fileContent);

                if (result.success && result.newPath) {
                    // Update our file references
                    const newPath = result.newPath;

                    // If the old file was in our list, remove it and add the new one
                    const newOpenFiles = openFiles.filter(file => file !== activeFile);
                    newOpenFiles.push(newPath);
                    setOpenFiles(newOpenFiles);

                    // Set the new file as active
                    setActiveFile(newPath);
                    setIsDirty(false);
                } else if (!result.success) {
                    console.error(`Failed to save file as: ${result.error}`);
                }
            } catch (error) {
                console.error('Failed to save file as:', error);
            }
        }
    };

    const handleFileContentChange = (content: string) => {
        setFileContent(content);
        setIsDirty(true);

        if (activeFile) {
            fileOpsService.updateFileContent(activeFile, content);
        }
    };

    const closeFile = async (filePath: string) => {
        // Auto-save: Always save the file before closing
        if (filePath === activeFile && isDirty) {
            await saveFile();
        }

        // Remove from our service
        fileOpsService.closeFile(filePath);

        // Remove from open files
        const newOpenFiles = openFiles.filter(file => file !== filePath);
        setOpenFiles(newOpenFiles);

        // If it was the active file, set a new active file
        if (activeFile === filePath) {
            if (newOpenFiles.length > 0) {
                // Open the first file in the list
                await openFile(newOpenFiles[0]);
            } else {
                // No files left open
                setActiveFile(null);
                setFileContent('');
                setIsDirty(false);
            }
        }
    };

    useEffect(() => {
        const removeOpenLSPManagerListener = window.electronAPI.onMenuOpenLSPManager(() => {
            setIsLSPManagerOpen(true);
        });

        return () => {
            removeOpenLSPManagerListener();
        };
    }, []);

    useEffect(() => {
        const removeSaveFileListener = window.electronAPI.onMenuSaveFile(() => {
            saveFile().then(() => {
                //will add later
            });
        });

        const removeSaveFileAsListener = window.electronAPI.onMenuSaveFileAs(() => {
            saveFileAs().then(() => {
                //will add later
            });
        });

        // Add proper keyboard shortcut handler for the whole app
        const handleKeyDown = (e: KeyboardEvent) => {
            // Save - Ctrl+S
            if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
                e.preventDefault();
                saveFile().then(() => {
                    // will add later
                });
            }

            // Save As - Ctrl+Shift+S
            if ((e.ctrlKey || e.metaKey) && e.key === 's' && e.shiftKey) {
                e.preventDefault();
                saveFileAs().then(() => {
                    //will add later
                });
            }
        };

        // Add the global keyboard listener
        window.addEventListener('keydown', handleKeyDown);

        // Clean up all listeners
        return () => {
            removeSaveFileListener();
            removeSaveFileAsListener();
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeFile, fileContent, isDirty]); // Add all deps needed for the callbacks

    return (
        <div className="app-container">
            <div className="app-header">
                <h1>Front Qode IDE - {projectName}</h1>
                <div className="app-header-actions">
                    <button
                        className="ai-assistant-button"
                        onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
                        title="AI Assistant"
                    >
                        <span className="material-icons">smart_toy</span>
                    </button>
                </div>
            </div>
            <div className={`app-content ${isTerminalExpanded ? 'with-terminal' : ''}`}>
                <div className="sidebar" ref={sidebarRef}>
                    <FileExplorer
                        projectPath={projectPath}
                        onFileOpen={openFile}
                    />
                </div>
                <div className="editor">
                    <div className="editor-tabs">
                        {openFiles.map((file) => (
                            <div
                                key={file}
                                className={`tab ${activeFile === file ? 'active' : ''}`}
                            >
                                <span onClick={() => openFile(file)}>
                                    {isDirty && activeFile === file ? '* ' : ''}
                                    {path.basename(file)}
                                </span>
                                <span
                                    className="close-tab"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeFile(file).then(() => {
                                            //will add later
                                        });
                                    }}
                                >
                                    ×
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="editor-content">
                        {activeFile ? (
                            <MonacoEditor
                                key={`${activeFile}-${editorKey}`} // Add key to force re-render
                                filePath={activeFile}
                                content={fileContent}
                                onChange={handleFileContentChange}
                                onSave={saveFile}
                            />
                        ) : (
                            <div className="no-file-open">No file open</div>
                        )}
                    </div>
                </div>
            </div>
            <div className="status-bar">
                <div>
                    {activeFile
                        ? `Editing: ${path.basename(activeFile)}${isDirty ? ' (unsaved)' : ''}`
                        : 'Ready'
                    }
                </div>
                <div>UTF-8</div>
                <div>
                    <span className="status-message">Auto-save enabled</span>
                    <span onClick={saveFile} style={{ cursor: 'pointer', marginLeft: '10px' }}>
                        Save (Ctrl+S)
                    </span>
                </div>
            </div>
            <Terminal
                isExpanded={isTerminalExpanded}
                onToggle={() => setIsTerminalExpanded(!isTerminalExpanded)}
                projectPath={projectPath}
            />
            {isLSPManagerOpen && (
                <LSPManager onClose={() => setIsLSPManagerOpen(false)} />
            )}
            {isAIAssistantOpen && (
                <AIAssistant
                    isOpen={isAIAssistantOpen}
                    onClose={() => setIsAIAssistantOpen(false)}
                    projectPath={projectPath}
                />
            )}
        </div>
    );
};

export default App;