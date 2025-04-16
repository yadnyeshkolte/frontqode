// src/components/App/App.tsx
import React, { useEffect, useState, useCallback } from 'react';
import '../../styles/App.css';
import * as path from 'path';

interface AppProps {
    projectPath: string;
}

interface FileTreeItem {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileTreeItem[];
}

const App: React.FC<AppProps> = ({ projectPath }) => {
    const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [projectName, setProjectName] = useState<string>('');
    const [isDirty, setIsDirty] = useState<boolean>(false);

    // Function to load file tree
    const loadFileTree = async () => {
        try {
            const result = await window.electronAPI.readDirectory(projectPath);

            if (result.success && result.contents) {
                setFileTree([
                    {
                        name: path.basename(projectPath),
                        path: projectPath,
                        isDirectory: true,
                        children: result.contents
                    }
                ]);
            }
        } catch (error) {
            console.error('Failed to load file tree:', error);
        }
    };

    // Load project data when the project path changes
    useEffect(() => {
        if (projectPath) {
            // Extract project name from path
            const name = path.basename(projectPath);
            setProjectName(name);

            // Load the file tree for the project
            loadFileTree();

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
                // Refresh the file tree after saving to show any new files
                await loadFileTree();
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

    const refreshFileTree = async () => {
        await loadFileTree();
    };

    const renderFileTree = (items: FileTreeItem[], indent = 0) => {
        return items.map((item) => (
            <React.Fragment key={item.path}>
                <li
                    className={`file-tree-item ${item.isDirectory ? 'directory' : 'file'}`}
                    style={{ paddingLeft: `${indent * 16}px` }}
                    onClick={() => !item.isDirectory && openFile(item.path)}
                >
                    {item.isDirectory ? '📁' : '📄'} {item.name}
                </li>
                {item.children && renderFileTree(item.children, indent + 1)}
            </React.Fragment>
        ));
    };

    return (
        <div className="app-container">
            <div className="app-header">
                <h1>Front Qode IDE - {projectName}</h1>
            </div>
            <div className="app-content">
                <div className="sidebar">
                    <div className="sidebar-header">
                        Explorer
                        <button
                            className="refresh-button"
                            onClick={refreshFileTree}
                            title="Refresh File Tree"
                        >
                            🔄
                        </button>
                    </div>
                    <div className="sidebar-content">
                        <ul className="file-tree">
                            {fileTree.length > 0 && renderFileTree(fileTree)}
                        </ul>
                    </div>
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
        </div>
    );
};

export default App;