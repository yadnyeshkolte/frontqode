// src/components/FileExplorer/FileExplorer.tsx
import React, { useEffect, useState, useRef } from 'react';
import * as path from 'path';
import {
    FileTreeItem,
    processFileTree,
    updateExpandedState
} from '../../utils/FileExplorerUtils';
import { getFileIconInfo, getDirectoryIcon } from '../../utils/IconUtils';
import './FileExplorer.css';
import { ContextMenu, ContextMenuItem } from '../../utils/ContextMenuUtils';

interface FileExplorerProps {
    projectPath: string;
    onFileOpen: (filePath: string) => void;
}

interface ContextMenuPosition {
    x: number;
    y: number;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ projectPath, onFileOpen }) => {
    const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const resizeHandleRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const fileExplorerRef = useRef<HTMLDivElement>(null);

    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        position: ContextMenuPosition;
        targetPath: string;
        isDirectory: boolean;
    }>({
        visible: false,
        position: { x: 0, y: 0 },
        targetPath: '',
        isDirectory: false,
    });
    const [clipboard, setClipboard] = useState<{
        action: 'copy' | 'cut' | null;
        path: string;
        isDirectory: boolean;
    }>({
        action: null,
        path: '',
        isDirectory: false,
    });
    const [isRenaming, setIsRenaming] = useState<{
        path: string;
        newName: string;
    }>({ path: '', newName: '' });
    const [isCreatingNew, setIsCreatingNew] = useState<{
        parentPath: string;
        type: 'file' | 'folder';
        name: string;
    }>({ parentPath: '', type: 'file', name: '' });

    const handleContextMenu = (e: React.MouseEvent, itemPath: string, isDir: boolean) => {
        e.preventDefault();
        e.stopPropagation();

        setContextMenu({
            visible: true,
            position: { x: e.clientX, y: e.clientY },
            targetPath: itemPath,
            isDirectory: isDir,
        });
    };

// Add this function to close context menu
    const closeContextMenu = () => {
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

// Add these operation functions
    const handleNewItem = (type: 'file' | 'folder') => {
        const targetPath = contextMenu.targetPath;
        const parentPath = contextMenu.isDirectory ? targetPath : path.dirname(targetPath);

        setIsCreatingNew({
            parentPath,
            type,
            name: type === 'file' ? 'new-file.txt' : 'new-folder',
        });

        closeContextMenu();
    };

    const handleCreateNewItem = async () => {
        try {
            const { parentPath, type, name } = isCreatingNew;
            const newPath = path.join(parentPath, name);

            let result;
            if (type === 'file') {
                result = await window.electronAPI.writeFile(newPath, '');
            } else {
                result = await window.electronAPI.createDirectory(newPath);
            }

            if (result.success) {
                loadFileTree();
                setIsCreatingNew({ parentPath: '', type: 'file', name: '' });
            } else {
                console.error(`Failed to create ${type}:`, result.error);
            }
        } catch (error) {
            console.error(`Error creating new ${isCreatingNew.type}:`, error);
        }
    };

    const handleRename = () => {
        const name = path.basename(contextMenu.targetPath);
        setIsRenaming({
            path: contextMenu.targetPath,
            newName: name,
        });
        closeContextMenu();
    };

    const handleRenameConfirm = async () => {
        try {
            const oldPath = isRenaming.path;
            const dirPath = path.dirname(oldPath);
            const newPath = path.join(dirPath, isRenaming.newName);

            const result = await window.electronAPI.renameFile(oldPath, newPath);

            if (result.success) {
                loadFileTree();
                setIsRenaming({ path: '', newName: '' });
            } else {
                console.error('Failed to rename:', result.error);
            }
        } catch (error) {
            console.error('Error renaming:', error);
        }
    };

    const handleDelete = async () => {
        try {
            const confirmDelete = window.confirm(
                `Are you sure you want to delete ${path.basename(contextMenu.targetPath)}?`
            );

            if (confirmDelete) {
                const result = await window.electronAPI.deleteItem(
                    contextMenu.targetPath,
                    contextMenu.isDirectory
                );

                if (result.success) {
                    loadFileTree();
                } else {
                    console.error('Failed to delete:', result.error);
                }
            }

            closeContextMenu();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const handleCopyOrCut = (action: 'copy' | 'cut') => {
        setClipboard({
            action,
            path: contextMenu.targetPath,
            isDirectory: contextMenu.isDirectory,
        });
        closeContextMenu();
    };

    const handlePaste = async () => {
        try {
            if (!clipboard.action || !clipboard.path) return;

            const targetDir = contextMenu.isDirectory
                ? contextMenu.targetPath
                : path.dirname(contextMenu.targetPath);

            const sourcePath = clipboard.path;
            const fileName = path.basename(sourcePath);
            const destPath = path.join(targetDir, fileName);

            // Don't paste into itself
            if (sourcePath === destPath) {
                closeContextMenu();
                return;
            }

            const result = await window.electronAPI.copyOrMoveItem(
                sourcePath,
                destPath,
                clipboard.isDirectory,
                clipboard.action === 'cut'
            );

            if (result.success) {
                loadFileTree();
                if (clipboard.action === 'cut') {
                    // Reset clipboard after cut & paste
                    setClipboard({ action: null, path: '', isDirectory: false });
                }
            } else {
                console.error('Failed to paste:', result.error);
            }

            closeContextMenu();
        } catch (error) {
            console.error('Error pasting:', error);
        }
    };

    const handleOpenInExplorer = async () => {
        try {
            await window.electronAPI.openInExplorer(contextMenu.targetPath);
            closeContextMenu();
        } catch (error) {
            console.error('Error opening in file explorer:', error);
        }
    };
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

    useEffect(() => {
        const handleClickOutside = () => {
            closeContextMenu();
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // Render file tree recursively
    const renderFileTree = (items: FileTreeItem[], indent = 0) => {
        const filteredItems = searchTerm ? filterTree(items, searchTerm) : items;

        return filteredItems.map((item) => {
            // Get icon info for file items
            const iconInfo = !item.isDirectory ? getFileIconInfo(item.path) : null;

            return (
                <React.Fragment key={item.path}>
                    <li
                        className={`file-tree-item ${item.isDirectory ? 'directory' : 'file'}`}
                        style={{ paddingLeft: `${indent * 16}px` }}
                    >
                        {item.isDirectory ? (
                            <div
                                className="directory-content"
                                onClick={() => toggleDirectory(item.path)}
                                onContextMenu={(e) => handleContextMenu(e, item.path, true)}
                            >
                                <span className={`expand-icon ${item.expanded ? 'expanded' : 'collapsed'}`}>
                                    {item.expanded ? '▼' : '►'}
                                </span>
                                <span className="material-icons directory-icon">
                                    {getDirectoryIcon(item.expanded)}
                                </span>
                                <span className="item-name">
                                    {searchTerm ? highlightMatchedText(item.name, searchTerm) : item.name}
                                </span>
                            </div>
                        ) : (
                            <div
                                className="file-content"
                                onClick={() => onFileOpen(item.path)}
                                onContextMenu={(e) => handleContextMenu(e, item.path, false)}
                            >
                                <span className={`material-icons file-icon ${iconInfo?.cssClass || ''}`}>
                                    {iconInfo?.icon || 'description'}
                                </span>
                                <span className="item-name">
                                    {searchTerm ? highlightMatchedText(item.name, searchTerm) : item.name}
                                </span>
                            </div>
                        )}
                    </li>
                    {item.isDirectory && item.expanded && item.children &&
                        renderFileTree(item.children, indent + 1)}
                </React.Fragment>
            );
        });
    };

    return (
        <div className="file-explorer" ref={fileExplorerRef}>
            <div className="file-explorer-header">
                <h3>Explorer</h3>
                <div className="file-explorer-actions">
                    <button
                        className="refresh-button"
                        title="Refresh File Tree"
                        onClick={loadFileTree}
                    >
                        <span className="material-icons">refresh</span>
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
            {contextMenu.visible && (
                <ContextMenu
                    position={contextMenu.position}
                    onClose={closeContextMenu}
                >
                    {contextMenu.isDirectory && (
                        <>
                            <ContextMenuItem onClick={() => handleNewItem('file')}>
                                <span className="material-icons">insert_drive_file</span>New File
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => handleNewItem('folder')}>
                                <span className="material-icons">create_new_folder</span>New Folder
                            </ContextMenuItem>
                            <ContextMenuItem divider />
                        </>
                    )}
                    <ContextMenuItem onClick={handleRename}>
                        <span className="material-icons">drive_file_rename_outline</span>Rename
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleDelete}>
                        <span className="material-icons">delete</span>Delete
                    </ContextMenuItem>
                    <ContextMenuItem divider />
                    <ContextMenuItem onClick={() => handleCopyOrCut('copy')}>
                        <span className="material-icons">content_copy</span>Copy
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleCopyOrCut('cut')}>
                        <span className="material-icons">content_cut</span>Cut
                    </ContextMenuItem>
                    {clipboard.action && (
                        <ContextMenuItem onClick={handlePaste}>
                            <span className="material-icons">content_paste</span>Paste
                        </ContextMenuItem>
                    )}
                    <ContextMenuItem divider />
                    <ContextMenuItem onClick={loadFileTree}>
                        <span className="material-icons">refresh</span>Refresh
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleOpenInExplorer}>
                        <span className="material-icons">folder_open</span>Open in File Explorer
                    </ContextMenuItem>
                </ContextMenu>
            )}

            {isRenaming.path && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Rename</h3>
                        <input
                            type="text"
                            value={isRenaming.newName}
                            onChange={(e) => setIsRenaming(prev => ({ ...prev, newName: e.target.value }))}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button onClick={() => setIsRenaming({ path: '', newName: '' })}>Cancel</button>
                            <button onClick={handleRenameConfirm}>Rename</button>
                        </div>
                    </div>
                </div>
            )}

            {isCreatingNew.parentPath && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Create New {isCreatingNew.type === 'file' ? 'File' : 'Folder'}</h3>
                        <input
                            type="text"
                            value={isCreatingNew.name}
                            onChange={(e) => setIsCreatingNew(prev => ({ ...prev, name: e.target.value }))}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button onClick={() => setIsCreatingNew({ parentPath: '', type: 'file', name: '' })}>Cancel</button>
                            <button onClick={handleCreateNewItem}>Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileExplorer;