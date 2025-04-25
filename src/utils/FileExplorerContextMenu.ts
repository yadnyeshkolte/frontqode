// src/utils/FileExplorerContextMenu.ts
import * as path from 'path';
import React, { useState, useEffect } from 'react';

interface ContextMenuPosition {
    x: number;
    y: number;
}

export interface ContextMenuState {
    visible: boolean;
    position: ContextMenuPosition;
    targetPath: string;
    isDirectory: boolean;
}

export interface ClipboardState {
    action: 'copy' | 'cut' | null;
    path: string;
    isDirectory: boolean;
}

export interface RenamingState {
    path: string;
    newName: string;
}

export interface CreatingNewState {
    parentPath: string;
    type: 'file' | 'folder';
    name: string;
}

export function useFileExplorerContextMenu(loadFileTree: () => void) {
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        position: { x: 0, y: 0 },
        targetPath: '',
        isDirectory: false,
    });

    const [clipboard, setClipboard] = useState<ClipboardState>({
        action: null,
        path: '',
        isDirectory: false,
    });

    const [isRenaming, setIsRenaming] = useState<RenamingState>({
        path: '',
        newName: ''
    });

    const [isCreatingNew, setIsCreatingNew] = useState<CreatingNewState>({
        parentPath: '',
        type: 'file',
        name: ''
    });

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

    const closeContextMenu = () => {
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    // Setup click and right-click handlers to close the context menu
    useEffect(() => {
        const handleMouseEvents = () => {
            closeContextMenu();
        };

        // Close on both left and right clicks
        document.addEventListener('click', handleMouseEvents);
        document.addEventListener('contextmenu', handleMouseEvents);

        return () => {
            document.removeEventListener('click', handleMouseEvents);
            document.removeEventListener('contextmenu', handleMouseEvents);
        };
    }, []);

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

    const cancelRename = () => {
        setIsRenaming({ path: '', newName: '' });
    };

    const cancelCreateNew = () => {
        setIsCreatingNew({ parentPath: '', type: 'file', name: '' });
    };

    return {
        contextMenu,
        clipboard,
        isRenaming,
        isCreatingNew,
        handleContextMenu,
        closeContextMenu,
        handleNewItem,
        handleCreateNewItem,
        handleRename,
        handleRenameConfirm,
        handleDelete,
        handleCopyOrCut,
        handlePaste,
        handleOpenInExplorer,
        setIsRenaming,
        setIsCreatingNew,
        cancelRename,
        cancelCreateNew
    };
}