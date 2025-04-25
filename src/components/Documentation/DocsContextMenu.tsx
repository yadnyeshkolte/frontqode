// src/components/Documentation/DocsContextMenu.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ContextMenu, ContextMenuItem } from '../../utils/ContextMenuUtils';
import * as path from 'path';
import './ModalDialog.css';

interface DocsContextMenuProps {
    position: { x: number, y: number };
    onClose: () => void;
    filePath: string;
    isDirectory: boolean;
    onReload: () => void;
    projectPath: string;
}

// Dialogs for different operations
interface RenameDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    onConfirm: (newName: string) => void;
}

const RenameDialog: React.FC<RenameDialogProps> = ({ isOpen, onClose, currentName, onConfirm }) => {
    const [name, setName] = useState(currentName);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={(e) => e.stopPropagation()} // Add this to prevent event bubbling
        >
            <div
                className="modal-content"
                ref={modalRef}
                onClick={(e) => e.stopPropagation()} // Add this to prevent event bubbling
            >
                <h3>Rename</h3>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />
                <div className="modal-actions">
                    <button onClick={(e) => {
                        e.stopPropagation(); // Add this
                        onClose();
                    }}>Cancel</button>
                    <button onClick={(e) => {
                        e.stopPropagation(); // Add this
                        onConfirm(name);
                    }}>Rename</button>
                </div>
            </div>
        </div>
    );
};

interface DeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    itemName: string;
    onConfirm: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ isOpen, onClose, itemName, onConfirm }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className="modal-content"
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
            >
                <h3>Confirm Delete</h3>
                <p>Are you sure you want to delete "{itemName}"?</p>
                <div className="modal-actions">
                    <button onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}>Cancel</button>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        onConfirm();
                    }}>Delete</button>
                </div>
            </div>
        </div>
    );
};

interface CreateFileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (fileName: string) => void;
}

const CreateFileDialog: React.FC<CreateFileDialogProps> = ({ isOpen, onClose, onConfirm }) => {
    const [fileName, setFileName] = useState('newfile.md');
    const [error, setError] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!fileName.endsWith('.md')) {
            setError('File name must end with .md extension');
            return;
        }
        onConfirm(fileName);
        setError('');
    };

    return (
        <div
            className="modal-overlay"
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className="modal-content"
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
            >
                <h3>Create New File</h3>
                <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    autoFocus
                />
                {error && <p className="error-message">{error}</p>}
                <div className="modal-actions">
                    <button onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}>Cancel</button>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        handleConfirm();
                    }}>Create</button>
                </div>
            </div>
        </div>
    );
};

interface CreateFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (folderName: string) => void;
}

const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({ isOpen, onClose, onConfirm }) => {
    const [folderName, setFolderName] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className="modal-content"
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
            >
                <h3>Create New Folder</h3>
                <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    autoFocus
                />
                <div className="modal-actions">
                    <button onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}>Cancel</button>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        onConfirm(folderName);
                    }}>Create</button>
                </div>
            </div>
        </div>
    );
};

const DocsContextMenu: React.FC<DocsContextMenuProps> = ({
                                                             position,
                                                             onClose,
                                                             filePath,
                                                             isDirectory,
                                                             onReload
                                                         }) => {
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);
    const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const fileName = path.basename(filePath);
    const dirPath = path.dirname(filePath);

    const closeAllDialogs = () => {
        setRenameDialogOpen(false);
        setDeleteDialogOpen(false);
        setCreateFileDialogOpen(false);
        setCreateFolderDialogOpen(false);
        onClose();
    };

    const handleRename = async (newName: string) => {
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
        closeAllDialogs();
    };

    const handleDelete = async () => {
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
        closeAllDialogs();
    };

    const handleCreateFile = async (fileName: string) => {
        const targetDir = isDirectory ? filePath : path.dirname(filePath);

        if (fileName) {
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
        closeAllDialogs();
    };

    const handleCreateFolder = async (folderName: string) => {
        const targetDir = isDirectory ? filePath : path.dirname(filePath);

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
        closeAllDialogs();
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
        <>
            <div ref={menuRef}>
                <ContextMenu position={position} onClose={onClose}>
                    {isDirectory && (
                        <ContextMenuItem
                            onClick={() => {
                                setCreateFileDialogOpen(true);
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: '16px', marginRight: '5px' }}>note_add</span>
                            New File
                        </ContextMenuItem>
                    )}
                    {isDirectory && (
                        <ContextMenuItem
                            onClick={() => {
                                setCreateFolderDialogOpen(true);
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: '16px', marginRight: '5px' }}>create_new_folder</span>
                            New Folder
                        </ContextMenuItem>
                    )}
                    <ContextMenuItem
                        onClick={() => {
                            setRenameDialogOpen(true);
                        }}
                    >
                        <span className="material-icons" style={{ fontSize: '16px', marginRight: '5px' }}>edit</span>
                        Rename
                    </ContextMenuItem>
                    <ContextMenuItem
                        onClick={() => {
                            setDeleteDialogOpen(true);
                        }}
                    >
                        <span className="material-icons" style={{ fontSize: '16px', marginRight: '5px' }}>delete</span>
                        Delete
                    </ContextMenuItem>
                    <ContextMenuItem divider />
                    <ContextMenuItem
                        onClick={() => {
                            handleOpenInExplorer();
                        }}
                    >
                        <span className="material-icons" style={{ fontSize: '16px', marginRight: '5px' }}>folder_open</span>
                        Show in Explorer
                    </ContextMenuItem>
                </ContextMenu>
            </div>

            {/* Modal dialogs */}
            <RenameDialog
                isOpen={renameDialogOpen}
                onClose={() => setRenameDialogOpen(false)}
                currentName={fileName}
                onConfirm={handleRename}
            />

            <DeleteDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                itemName={fileName}
                onConfirm={handleDelete}
            />

            <CreateFileDialog
                isOpen={createFileDialogOpen}
                onClose={() => setCreateFileDialogOpen(false)}
                onConfirm={handleCreateFile}
            />

            <CreateFolderDialog
                isOpen={createFolderDialogOpen}
                onClose={() => setCreateFolderDialogOpen(false)}
                onConfirm={handleCreateFolder}
            />
        </>
    );
};

export default DocsContextMenu;