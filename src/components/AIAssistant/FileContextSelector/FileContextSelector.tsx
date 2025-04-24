
import React, { useState, useEffect } from 'react';
import './FileContextSelector.css';

interface FileContextSelectorProps {
    isOpen: boolean;
    projectPath: string;
    onClose: () => void;
    onConfirmSelection: (selectedFiles: FileContext[]) => void;
    initialSelectedFiles?: FileContext[];
}

export interface FileContext {
    path: string;
    content: string;
    selected: boolean;
}

// Interface for file tree nodes
interface FileTreeNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children: FileTreeNode[];
    expanded: boolean;
}

// List of folders to exclude
const EXCLUDED_FOLDERS = [
    'node_modules',
    '.git',
    '.idea',
    '.webpack',
    'dist',
    'build',
    'out',
    'target',
    'bin',
    'obj',
    '.next',
    '.vscode',
    '.vs',
    'vendor',
    'coverage',
    '__pycache__',
    '.gradle',
    'venv',
    'env',
    '.env'
];

// List of file extensions to exclude
const EXCLUDED_FILE_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.ttf', '.woff', '.woff2', '.eot', '.mp3', '.mp4',
    '.mov', '.avi', '.zip', '.tar', '.gz', '.7z',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
];

const FileContextSelector: React.FC<FileContextSelectorProps> = ({
                                                                     isOpen,
                                                                     projectPath,
                                                                     onClose,
                                                                     onConfirmSelection,
                                                                     initialSelectedFiles = [],
                                                                 }) => {
    const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<FileContext[]>(initialSelectedFiles);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [fileSearchQuery, setFileSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen && projectPath) {
            fetchProjectFiles(projectPath);
        }
    }, [isOpen, projectPath]);

    useEffect(() => {
        // Update selected files when initialSelectedFiles prop changes
        if (initialSelectedFiles) {
            setSelectedFiles(initialSelectedFiles);
        }
    }, [initialSelectedFiles]);

    // Function to build the file tree structure
    const buildFileTree = (files: string[], basePath: string): FileTreeNode[] => {
        const tree: FileTreeNode[] = [];
        const paths = new Map<string, FileTreeNode>();

        files.forEach(filePath => {
            // Remove base path to get relative path
            const relativePath = filePath.replace(basePath + '/', '');
            const pathParts = relativePath.split('/');

            let currentPath = '';
            let parentPath = '';

            pathParts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                const fullPath = `${basePath}/${currentPath}`;

                if (!paths.has(fullPath)) {
                    const isDir = index < pathParts.length - 1;
                    const node: FileTreeNode = {
                        name: part,
                        path: fullPath,
                        isDirectory: isDir,
                        children: [],
                        expanded: false // Start with directories collapsed
                    };

                    paths.set(fullPath, node);

                    if (parentPath) {
                        const parent = paths.get(`${basePath}/${parentPath}`);
                        if (parent) {
                            parent.children.push(node);
                        }
                    } else {
                        tree.push(node);
                    }
                }

                parentPath = currentPath;
            });
        });

        return tree;
    };

    // Function to get all files recursively in a project directory
    const fetchProjectFiles = async (dirPath: string) => {
        setIsLoadingFiles(true);
        try {
            const allFiles: string[] = [];
            await processDirectory(dirPath, allFiles);

            // Build file tree from collected files
            const tree = buildFileTree(allFiles, dirPath);
            setFileTree(tree);
        } catch (error) {
            console.error('Error fetching project files:', error);
        }
        setIsLoadingFiles(false);
    };

    // Recursive function to process directories
    const processDirectory = async (dirPath: string, filesList: string[]) => {
        try {
            const result = await window.electronAPI.readDirectory(dirPath);
            if (result.success && result.contents) {
                for (const item of result.contents) {
                    const itemPath = `${dirPath}/${item.name}`;

                    // Skip excluded folders
                    if (item.isDirectory) {
                        if (!EXCLUDED_FOLDERS.some(folder => item.name === folder)) {
                            await processDirectory(itemPath, filesList);
                        }
                    } else {
                        // Skip excluded file types
                        if (!EXCLUDED_FILE_EXTENSIONS.some(ext => item.name.endsWith(ext))) {
                            filesList.push(itemPath);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing directory ${dirPath}:`, error);
        }
    };

    // Function to toggle file selection
    const toggleFileSelection = async (filePath: string, isDirectory: boolean) => {
        if (isDirectory) {
            // If it's a directory, toggle all files within it
            await toggleDirectorySelection(filePath);
        } else {
            // Check if the file is already in selectedFiles
            const fileIndex = selectedFiles.findIndex(file => file.path === filePath);

            if (fileIndex >= 0) {
                // File already selected, remove it
                setSelectedFiles(prev => prev.filter(file => file.path !== filePath));
            } else {
                // File not selected, add it with content
                try {
                    const fileResult = await window.electronAPI.readFile(filePath);
                    if (fileResult.success && fileResult.content) {
                        setSelectedFiles(prev => [
                            ...prev,
                            {
                                path: filePath,
                                content: fileResult.content || '',
                                selected: true
                            }
                        ]);
                    }
                } catch (error) {
                    console.error('Error reading file content:', error);
                }
            }
        }
    };

    // Function to toggle selection of all files in a directory
    const toggleDirectorySelection = async (dirPath: string) => {
        // Check if all files in this directory are already selected
        const dirFiles: string[] = [];
        await collectFilesInDirectory(dirPath, dirFiles);

        // Count how many are already selected
        const selectedCount = dirFiles.filter(file =>
            selectedFiles.some(sf => sf.path === file)
        ).length;

        // If all files are selected, unselect them all
        if (selectedCount === dirFiles.length && selectedCount > 0) {
            setSelectedFiles(prev =>
                prev.filter(file => !dirFiles.includes(file.path))
            );
        } else {
            // Otherwise, select all files in the directory
            const newSelectedFiles = [...selectedFiles];

            for (const filePath of dirFiles) {
                // Skip if already selected
                if (selectedFiles.some(sf => sf.path === filePath)) continue;

                try {
                    const fileResult = await window.electronAPI.readFile(filePath);
                    if (fileResult.success && fileResult.content) {
                        newSelectedFiles.push({
                            path: filePath,
                            content: fileResult.content || '',
                            selected: true
                        });
                    }
                } catch (error) {
                    console.error('Error reading file content:', error);
                }
            }

            setSelectedFiles(newSelectedFiles);
        }
    };

    // Helper function to collect all files within a directory
    const collectFilesInDirectory = async (dirPath: string, filesList: string[]) => {
        try {
            const result = await window.electronAPI.readDirectory(dirPath);
            if (result.success && result.contents) {
                for (const item of result.contents) {
                    const itemPath = `${dirPath}/${item.name}`;

                    if (item.isDirectory) {
                        if (!EXCLUDED_FOLDERS.some(folder => item.name === folder)) {
                            await collectFilesInDirectory(itemPath, filesList);
                        }
                    } else {
                        if (!EXCLUDED_FILE_EXTENSIONS.some(ext => item.name.endsWith(ext))) {
                            filesList.push(itemPath);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error collecting files in directory ${dirPath}:`, error);
        }
    };

    // Toggle expansion of a directory node
    const toggleDirectoryExpansion = (nodePath: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering file selection

        // Create a deep copy of the file tree to ensure React detects the state change
        const updateFileTreeNode = (nodes: FileTreeNode[], path: string): FileTreeNode[] => {
            return nodes.map(node => {
                if (node.path === path) {
                    return { ...node, expanded: !node.expanded };
                }
                if (node.isDirectory && node.children.length > 0) {
                    return { ...node, children: updateFileTreeNode(node.children, path) };
                }
                return node;
            });
        };

        setFileTree(prevTree => updateFileTreeNode(prevTree, nodePath));
    };

    // Clear all selected files
    const clearSelectedFiles = () => {
        setSelectedFiles([]);
    };

    const handleConfirm = () => {
        onConfirmSelection(selectedFiles);
        onClose();
    };

    // Helper function to check if a directory has any children matching the search query
    const hasMatchingChildren = (node: FileTreeNode, query: string): boolean => {
        if (!node.isDirectory) return false;

        return node.children.some(child =>
            child.name.toLowerCase().includes(query.toLowerCase()) ||
            hasMatchingChildren(child, query)
        );
    };

    // Recursive component to render the file tree
    const renderFileTree = (nodes: FileTreeNode[], depth = 0) => {
        if (!nodes) return null;

        // Filter nodes based on search query
        const filteredNodes = fileSearchQuery ?
            nodes.filter(node =>
                node.name.toLowerCase().includes(fileSearchQuery.toLowerCase()) ||
                (node.isDirectory && hasMatchingChildren(node, fileSearchQuery))
            ) : nodes;

        return filteredNodes.map((node) => {
            const isSelected = selectedFiles.some(f => f.path === node.path);
            const fileName = node.name;
            const paddingLeft = `${depth * 16}px`;

            return (
                <React.Fragment key={node.path}>
                    <div
                        className={`file-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleFileSelection(node.path, node.isDirectory)}
                        style={{ paddingLeft }}
                    >
                        {node.isDirectory ? (
                            <span
                                className="material-icons expand-icon"
                                onClick={(e) => toggleDirectoryExpansion(node.path, e)}
                            >
                                {node.expanded ? 'folder_open' : 'folder'}
                            </span>
                        ) : (
                            <span className="material-icons">description</span>
                        )}

                        <span
                            className="file-name"
                            title={node.path}
                        >
                            {fileName}
                        </span>

                        <span className="material-icons checkbox-icon">
                            {isSelected ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                    </div>

                    {node.isDirectory && node.expanded && renderFileTree(node.children, depth + 1)}
                </React.Fragment>
            );
        });
    };

    if (!isOpen) return null;

    return (
        <div className="file-selector">
            <div className="file-selector-header">
                <h4>Select files to include as context)</h4>
                <p className="p-color">Click on Folder Icons to Expand and Collapse folder</p>
                <input
                    type="text"
                    placeholder="Search files..."
                    value={fileSearchQuery}
                    onChange={(e) => setFileSearchQuery(e.target.value)}
                    className="file-search-input"
                />
            </div>

            <div className="file-list">
                {isLoadingFiles ? (
                    <div className="loading-files">Loading project files...</div>
                ) : fileTree.length > 0 ? (
                    renderFileTree(fileTree)
                ) : (
                    <div className="no-files">No files found matching your search</div>
                )}
            </div>

            <div className="file-selector-actions">
                <div className="selected-files-count">
                    {selectedFiles.length} file(s) selected
                </div>
                <div className="file-selector-buttons">
                    <button
                        onClick={clearSelectedFiles}
                        disabled={selectedFiles.length === 0}
                        className="clear-button"
                    >
                        Clear Selection
                    </button>
                    <button onClick={onClose}>Cancel</button>
                    <button
                        onClick={handleConfirm}
                        className="confirm-button"
                        disabled={selectedFiles.length === 0}
                    >
                        Confirm Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileContextSelector;