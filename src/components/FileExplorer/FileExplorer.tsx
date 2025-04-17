// src/components/FileExplorer/FileExplorer.tsx
import React, { useEffect, useState, useRef } from 'react';
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
    const resizeHandleRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const fileExplorerRef = useRef<HTMLDivElement>(null);

    // Load file tree on component mount or when project path changes
    useEffect(() => {
        if (projectPath) {
            loadFileTree();
        }
    }, [projectPath]);

    // Set up resize event listeners
    useEffect(() => {
        const resizeHandle = resizeHandleRef.current;
        const sidebar = document.querySelector('.sidebar') as HTMLElement;

        if (!resizeHandle || !sidebar) return;

        let isResizing = false;

        const startResize = (e: MouseEvent) => {
            isResizing = true;
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
            // Prevent text selection during resize
            document.body.style.userSelect = 'none';
        };

        const resize = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = e.clientX;
            // Enforce min-width from CSS
            if (newWidth >= 180) {
                sidebar.style.width = `${newWidth}px`;
            }
        };

        const stopResize = () => {
            isResizing = false;
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            document.body.style.userSelect = '';
        };

        resizeHandle.addEventListener('mousedown', startResize);

        return () => {
            resizeHandle.removeEventListener('mousedown', startResize);
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        };
    }, []);

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

    // Highlight text that matches search term
    const highlightMatchedText = (text: string, searchTerm: string) => {
        if (!searchTerm) return text;

        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) =>
            regex.test(part) ?
                <span key={index} className="highlighted-text">{part}</span> :
                <span key={index}>{part}</span>
        );
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
                            <span className="item-name">
                                {searchTerm ? highlightMatchedText(item.name, searchTerm) : item.name}
                            </span>
                        </div>
                    ) : (
                        <div
                            className="file-content"
                            onClick={() => onFileOpen(item.path)}
                        >
                            <span className="file-icon">📄</span>
                            <span className="item-name">
                                {searchTerm ? highlightMatchedText(item.name, searchTerm) : item.name}
                            </span>
                        </div>
                    )}
                </li>
                {item.isDirectory && item.expanded && item.children &&
                    renderFileTree(item.children, indent + 1)}
            </React.Fragment>
        ));
    };

    return (
        <div className="file-explorer" ref={fileExplorerRef}>
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
            <div className="resize-handle" ref={resizeHandleRef}></div>
        </div>
    );
};

export default FileExplorer;