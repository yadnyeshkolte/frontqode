// src/components/Documentation/DocsExplorer.tsx
import React, { useState, useEffect } from 'react';
import * as path from 'path';
import './DocsExplorer.css';

interface DocsExplorerProps {
    projectPath: string;
    onFileSelect: (filePath: string) => void;
    currentDocPath: string | null;
    onContextMenu?: (filePath: string, isDirectory: boolean, e: React.MouseEvent) => void;
    onChangeDocsFolder?: () => void; // New prop
}

interface FileItem {
    name: string;
    isDirectory: boolean;
    path: string;
    children?: FileItem[];
    isExpanded?: boolean;
}

const DocsExplorer: React.FC<DocsExplorerProps> = ({ projectPath, onFileSelect, currentDocPath, onContextMenu, onChangeDocsFolder }) => {
    const [structure, setStructure] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (projectPath) {
            loadDocsStructure();
        }
    }, [projectPath]);

    const loadDocsStructure = async () => {
        setLoading(true);
        try {
            const docsPath = path.join(projectPath, 'docs');
            const fileStructure = await buildFileTree(docsPath);
            setStructure(fileStructure);
        } catch (error) {
            console.error('Error loading docs structure:', error);
        } finally {
            setLoading(false);
        }
    };

    const buildFileTree = async (dirPath: string, relativePath = ''): Promise<FileItem[]> => {
        try {
            const result = await window.electronAPI.readDirectory(dirPath);
            if (!result.success) return [];

            const items: FileItem[] = [];
            for (const item of result.contents) {
                const itemRelativePath = path.join(relativePath, item.name);
                const fullPath = path.join(dirPath, item.name);

                if (item.isDirectory) {
                    const children = await buildFileTree(fullPath, itemRelativePath);
                    items.push({
                        name: item.name,
                        isDirectory: true,
                        path: fullPath,
                        children,
                        isExpanded: false
                    });
                } else if (item.name.endsWith('.md')) {
                    items.push({
                        name: item.name,
                        isDirectory: false,
                        path: fullPath
                    });
                }
            }
            return items;
        } catch (error) {
            console.error('Error building file tree:', error);
            return [];
        }
    };

    const toggleDirectory = (item: FileItem) => {
        // Create a new structure with the toggled item
        const toggleItem = (items: FileItem[]): FileItem[] => {
            return items.map(i => {
                if (i.path === item.path) {
                    return { ...i, isExpanded: !i.isExpanded };
                } else if (i.children) {
                    return { ...i, children: toggleItem(i.children) };
                }
                return i;
            });
        };

        setStructure(toggleItem(structure));
    };

    const handleItemContextMenu = (item: FileItem, e: React.MouseEvent) => {
        if (onContextMenu) {
            onContextMenu(item.path, item.isDirectory, e);
        }
    };

    const renderTree = (items: FileItem[]) => {
        return (
            <ul className="docs-tree">
                {items.map((item, index) => (
                    <li key={index} className={item.isDirectory ? 'directory' : 'file'}>
                        {item.isDirectory ? (
                            <div
                                className="tree-item directory-item"
                                onClick={() => toggleDirectory(item)}
                                onContextMenu={(e) => handleItemContextMenu(item, e)}
                            >
                                <span className="material-icons">
                                  {item.isExpanded ? 'folder_open' : 'folder'}
                                </span>
                                <span className="item-name">{item.name}</span>
                            </div>
                        ) : (
                            <div
                                className={`tree-item file-item ${currentDocPath === item.path ? 'active' : ''}`}
                                onClick={() => onFileSelect(item.path)}
                                onContextMenu={(e) => handleItemContextMenu(item, e)}
                            >
                                <span className="material-icons">description</span>
                                <span className="item-name">{item.name}</span>
                            </div>
                        )}
                        {item.isDirectory && item.isExpanded && item.children && renderTree(item.children)}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="docs-explorer">
            <div className="docs-explorer-header">
                <h4>Documentation Files</h4>
                <button className="refresh-button" onClick={loadDocsStructure} title="Refresh">
                    <span className="material-icons">refresh</span>
                </button>
                <button className="folder-button" onClick={onChangeDocsFolder} title="Change Docs Folder">
                    <span className="material-icons">folder_open</span>
                </button>
            </div>
            <div className="docs-explorer-content">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : structure.length === 0 ? (
                    <p className="no-docs">No documentation files</p>
                ) : (
                    renderTree(structure)
                )}
            </div>
        </div>
    );
};

export default DocsExplorer;