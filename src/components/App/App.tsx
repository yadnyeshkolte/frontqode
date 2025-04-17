// src/components/App/App.tsx
import React, { useEffect, useState, useCallback } from 'react';
import '../../styles/App.css';
import * as path from 'path';
import Terminal from '../Terminal/Terminal';
import FileExplorer from '../FileExplorer/FileExplorer';

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

    // Load project data when the project path changes
    useEffect(() => {
        if (projectPath) {
            // Extract project name from path
            const name = path.basename(projectPath);
            setProjectName(name);

            // Change terminal directory to project path
            window.electronAPI.terminalChangeDirectory(projectPath);

            // Look for a readme.md file to open by default
            const readmePath = path.join(projectPath, 'readme.md');
            try {
                // Check if readme.md exists and open it
                window.electronAPI.readFile(readmePath)
                    .then(result => {
                        if (result.success) {
                            openFile(readmePath);
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
                saveFile();
            }
        };

        // Add event listener for custom event from renderer.ts
        window.addEventListener('app-save-file', handleAppSaveFile);

        // Clean up event listener
        return () => {
            window.removeEventListener('app-save-file', handleAppSaveFile);
        };
    }, [activeFile, fileContent]);

    const openFile = async (filePath: string) => {
        try {
            // If we have unsaved changes, confirm with user
            if (isDirty && activeFile) {
                const confirmSave = window.confirm(
                    `You have unsaved changes in ${path.basename(activeFile)}. Save before opening a new file?`
                );

                if (confirmSave) {
                    await saveFile();
                }
            }

            const result = await window.electronAPI.readFile(filePath);

            if (result.success && result.content !== undefined) {
                // Add file to open files if not already there
                if (!openFiles.includes(filePath)) {
                    setOpenFiles([...openFiles, filePath]);
                }

                setActiveFile(filePath);
                setFileContent(result.content);
                setIsDirty(false);
            }
        } catch (error) {
            console.error('Failed to open file:', error);
        }
    };

    const saveFile = async () => {
        if (activeFile) {
            try {
                await window.electronAPI.writeFile(activeFile, fileContent);
                setIsDirty(false);
            } catch (error) {
                console.error('Failed to save file:', error);
            }
        }
    };

    const handleFileContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFileContent(e.target.value);
        setIsDirty(true);
    };

    const closeFile = (filePath: string) => {
        // Remove from open files
        const newOpenFiles = openFiles.filter(file => file !== filePath);
        setOpenFiles(newOpenFiles);

        // If it was the active file, set a new active file
        if (activeFile === filePath) {
            if (newOpenFiles.length > 0) {
                // Open the first file in the list
                openFile(newOpenFiles[0]);
            } else {
                // No files left open
                setActiveFile(null);
                setFileContent('');
                setIsDirty(false);
            }
        }
    };

    const toggleTerminal = () => {
        setIsTerminalExpanded(!isTerminalExpanded);
    };

    return (
        <div className="app-container">
            <div className="app-header">
                <h1>Front Qode IDE - {projectName}</h1>
            </div>
            <div className={`app-content ${isTerminalExpanded ? 'with-terminal' : ''}`}>
                <div className="sidebar">
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
                                        closeFile(file);
                                    }}
                                >
                                    ×
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="editor-content">
                        {activeFile ? (
                            <textarea
                                value={fileContent}
                                onChange={handleFileContentChange}
                                onKeyDown={(e) => {
                                    // Save on Ctrl+S
                                    if (e.ctrlKey && e.key === 's') {
                                        e.preventDefault();
                                        saveFile();
                                    }
                                }}
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
                <div onClick={saveFile} style={{ cursor: 'pointer' }}>
                    Save (Ctrl+S)
                </div>
            </div>
            <Terminal isExpanded={isTerminalExpanded} onToggle={toggleTerminal} />
        </div>
    );
};

export default App;