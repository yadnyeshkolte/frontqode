// src/components/Documentation/DocsContextMenu.tsx
import React, { useState } from 'react';
import { ContextMenu, ContextMenuItem } from '../../utils/ContextMenuUtils';
import * as path from 'path';

interface DocsContextMenuProps {
    position: { x: number, y: number };
    onClose: () => void;
    filePath: string;
    isDirectory: boolean;
    onReload: () => void;
    projectPath: string;
}

const DocsContextMenu: React.FC<DocsContextMenuProps> = ({
                                                             position,
                                                             onClose,
                                                             filePath,
                                                             isDirectory,
                                                             onReload,
                                                             projectPath
                                                         }) => {
    const handleRename = async () => {
        const fileName = path.basename(filePath);
        const dirPath = path.dirname(filePath);
        const newName = prompt('Enter new name:', fileName);

        if (newName && newName !== fileName) {
            try {
                const newPath = path.join(dirPath, newName);
                const result = await window.electronAPI.renameFile(filePath, newPath);
                if (result.success) {
                    onReload();
                } else {
                    alert(`Failed to rename: ${result.error}`);
                }
            } catch (error) {
                console.error('Error renaming file:', error);
            }
        }
        onClose();
    };

    const handleDelete = async () => {
        const fileName = path.basename(filePath);
        const confirmDelete = confirm(`Are you sure you want to delete ${fileName}?`);

        if (confirmDelete) {
            try {
                const result = await window.electronAPI.deleteItem(filePath, isDirectory);
                if (result.success) {
                    onReload();
                } else {
                    alert(`Failed to delete: ${result.error}`);
                }
            } catch (error) {
                console.error('Error deleting item:', error);
            }
        }
        onClose();
    };

    const handleCreateFile = async () => {
        const targetDir = isDirectory ? filePath : path.dirname(filePath);
        const fileName = prompt('Enter file name (with .md extension):', 'newfile.md');

        if (fileName) {
            if (!fileName.endsWith('.md')) {
                alert('File name must end with .md extension');
                onClose();
                return;
            }

            try {
                const newFilePath = path.join(targetDir, fileName);
                const result = await window.electronAPI.writeFile(newFilePath, '# New Documentation\n\n');
                if (result.success) {
                    onReload();
                } else {
                    alert(`Failed to create file: ${result.error}`);
                }
            } catch (error) {
                console.error('Error creating file:', error);
            }
        }
        onClose();
    };

    const handleCreateFolder = async () => {
        const targetDir = isDirectory ? filePath : path.dirname(filePath);
        const folderName = prompt('Enter folder name:');

        if (folderName) {
            try {
                const newFolderPath = path.join(targetDir, folderName);
                const result = await window.electronAPI.createDirectory(newFolderPath);
                if (result.success) {
                    onReload();
                } else {
                    alert(`Failed to create folder: ${result.error}`);
                }
            } catch (error) {
                console.error('Error creating folder:', error);
            }
        }
        onClose();
    };

    const handleOpenInExplorer = async () => {
        try {
            await window.electronAPI.openInExplorer(filePath);
        } catch (error) {
            console.error('Error opening in explorer:', error);
        }
        onClose();
    };

    return (
        <ContextMenu position={position} onClose={onClose}>
            {isDirectory && (
                <ContextMenuItem onClick={handleCreateFile}>
                    <span className="material-icons" style={{ fontSize: '16px', marginRight: '5px' }}>note_add</span>
                    New File
                </ContextMenuItem>
            )}
            {isDirectory && (
                <ContextMenuItem onClick={handleCreateFolder}>
                    <span className="material-icons" style={{ fontSize: '16px', marginRight: '5px' }}>create_new_folder</span>
                    New Folder
                </ContextMenuItem>
            )}
            <ContextMenuItem onClick={handleRename}>
                <span className="material-icons" style={{ fontSize: '16px', marginRight: '5px' }}>edit</span>
                Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={handleDelete}>
                <span className="material-icons" style={{ fontSize: '16px', marginRight: '5px' }}>delete</span>
                Delete
            </ContextMenuItem>
            <ContextMenuItem divider />
            <ContextMenuItem onClick={handleOpenInExplorer}>
                <span className="material-icons" style={{ fontSize: '16px', marginRight: '5px' }}>folder_open</span>
                Show in Explorer
            </ContextMenuItem>
        </ContextMenu>
    );
};

export default DocsContextMenu;