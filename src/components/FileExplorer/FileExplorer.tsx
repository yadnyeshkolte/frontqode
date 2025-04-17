// src/components/FileExplorer/FileExplorer.tsx
import React, { useEffect, useState } from 'react';
import * as path from 'path';
import {
    FileTreeItem,
    processFileTree,
    updateExpandedState
} from '../../utils/FileExplorerUtils';
import './FileExplorer.css';

interface FileExplorerProps {
    projectPath: string;
    onFileOpen: (filePath: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ projectPath, onFileOpen }) => {
    const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Load file tree on component mount or when project path changes
    useEffect(() => {
        if (projectPath) {
            loadFileTree();
        }
    }, [projectPath]);

    // Function to load file tree
    const loadFileTree = async () => {
        try {
            const result = await window.electronAPI.readDirectory(projectPath);

            if (result.success && result.contents) {
                const initialTree = [
                    {
                        name: path.basename(projectPath),
                        path: projectPath,
                        isDirectory: true,
                        children: result.contents
                    }
                ];

                // Process the tree to set initial expanded state
                const processedTree = processFileTree(initialTree);
                setFileTree(processedTree);
            }
        } catch (error) {
            console.error('Failed to load file tree:', error);
        }
    };

    // Toggle directory expanded state
    const toggleDirectory = (itemPath: string) => {
        const updatedTree = updateExpandedState(fileTree, itemPath);
        setFileTree(updatedTree);
    };

    // Filter file tree based on search term
    const filterTree = (items: FileTreeItem[], term: string): FileTreeItem[] => {
        if (!term) return items;

        return items.map(item => {
            // Keep this item if its name matches the search term
            const nameMatches = item.name.toLowerCase().includes(term.toLowerCase());

            // If it has children, filter them too
            let filteredChildren: FileTreeItem[] = [];
            if (item.children && item.children.length > 0) {
                filteredChildren = filterTree(item.children, term);
            }

            // If name matches or it has matching children, keep this item
            if (nameMatches || (filteredChildren.length > 0)) {
                return {
                    ...item,
                    // Always expand directories that match or have matching children
                    expanded: nameMatches || filteredChildren.length > 0 ? true : item.expanded,
                    children: filteredChildren
                };
            }

            // Otherwise, don't include this item
            return null;
        }).filter((item): item is NonNullable<typeof item> => item !== null);
    };

    // Render file tree recursively
    const renderFileTree = (items: FileTreeItem[], indent = 0) => {
        const filteredItems = searchTerm ? filterTree(items, searchTerm) : items;

        return filteredItems.map((item) => (
            <React.Fragment key={item.path}>
                <li
                    className={`file-tree-item ${item.isDirectory ? 'directory' : 'file'}`}
                    style={{ paddingLeft: `${indent * 16}px` }}
                >
                    {item.isDirectory ? (
                        <div
                            className="directory-content"
                            onClick={() => toggleDirectory(item.path)}
                        >
                            <span className={`expand-icon ${item.expanded ? 'expanded' : 'collapsed'}`}>
                                {item.expanded ? '▼' : '►'}
                            </span>
                            <span className="directory-icon">📁</span>
                            <span className="item-name">{item.name}</span>
                        </div>
                    ) : (
                        <div
                            className="file-content"
                            onClick={() => onFileOpen(item.path)}
                        >
                            <span className="file-icon">📄</span>
                            <span className="item-name">
        {searchTerm ? highlightMatch(item.name, searchTerm) : item.name}
    </span>
                        </div>
                    )}
                </li>
                {item.isDirectory && item.expanded && item.children &&
                    renderFileTree(item.children, indent + 1)}
            </React.Fragment>
        ));
    };

    const highlightMatch = (text: string, searchTerm: string) => {
        if (!searchTerm) return text;

        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, i) => {
            if (part.toLowerCase() === searchTerm.toLowerCase()) {
                return <span key={i} className="highlight-match">{part}</span>;
            }
            return part;
        });
    };

    return (
        <div className="file-explorer">
            <div className="file-explorer-header">
                <h3>Explorer</h3>
                <div className="file-explorer-actions">
                    <button
                        className="refresh-button"
                        onClick={loadFileTree}
                        title="Refresh File Tree"
                    >
                        🔄
                    </button>
                </div>
            </div>
            <div className="file-explorer-search">
                <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="file-explorer-content">
                <ul className="file-tree">
                    {fileTree.length > 0 && renderFileTree(fileTree)}
                </ul>
            </div>
        </div>
    );
};

export default FileExplorer;