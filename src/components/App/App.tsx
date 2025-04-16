// src/components/App/App.tsx
import React, { useEffect, useState } from 'react';
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

    useEffect(() => {
        if (projectPath) {
            // Extract project name from path
            const name = path.basename(projectPath);
            setProjectName(name);

            // Open readme.md by default
            const readmePath = path.join(projectPath, 'readme.md');
            openFile(readmePath);

            // Here you would typically load the file tree
            // For now, let's just create a simple structure
            setFileTree([
                {
                    name: name,
                    path: projectPath,
                    isDirectory: true,
                    children: [
                        {
                            name: 'readme.md',
                            path: readmePath,
                            isDirectory: false
                        }
                    ]
                }
            ]);
        }
    }, [projectPath]);

    const openFile = async (filePath: string) => {
        try {
            const result = await window.electronAPI.readFile(filePath);

            if (result.success && result.content !== undefined) {
                // Add file to open files if not already there
                if (!openFiles.includes(filePath)) {
                    setOpenFiles([...openFiles, filePath]);
                }

                setActiveFile(filePath);
                setFileContent(result.content);
            }
        } catch (error) {
            console.error('Failed to open file:', error);
        }
    };

    const saveFile = async () => {
        if (activeFile) {
            try {
                await window.electronAPI.writeFile(activeFile, fileContent);
                // You could add a saved indicator here
            } catch (error) {
                console.error('Failed to save file:', error);
            }
        }
    };

    const handleFileContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFileContent(e.target.value);
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
                    <div className="sidebar-header">Explorer</div>
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
                                onClick={() => openFile(file)}
                            >
                                {path.basename(file)}
                            </div>
                        ))}
                    </div>
                    <div className="editor-content">
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
                    </div>
                </div>
            </div>
            <div className="status-bar">
                <div>{activeFile ? `Editing: ${path.basename(activeFile)}` : 'Ready'}</div>
                <div>UTF-8</div>
                <div onClick={saveFile} style={{ cursor: 'pointer' }}>Save (Ctrl+S)</div>
            </div>
        </div>
    );
};

export default App;