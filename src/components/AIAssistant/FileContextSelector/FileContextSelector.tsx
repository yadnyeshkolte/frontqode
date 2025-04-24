// src/components/FileContextSelector/FileContextSelector.tsx
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

const FileContextSelector: React.FC<FileContextSelectorProps> = ({
                                                                     isOpen,
                                                                     projectPath,
                                                                     onClose,
                                                                     onConfirmSelection,
                                                                     initialSelectedFiles = [],
                                                                 }) => {
    const [projectFiles, setProjectFiles] = useState<string[]>([]);
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

    // Function to get all files recursively in a project directory
    const fetchProjectFiles = async (dirPath: string) => {
        setIsLoadingFiles(true);
        try {
            const result = await window.electronAPI.readDirectory(dirPath);
            if (result.success && result.contents) {
                // Flatten the file structure and collect all file paths
                const files: string[] = [];

                const processDirectory = async (contents: any[], basePath: string) => {
                    for (const item of contents) {
                        const itemPath = `${basePath}/${item.name}`;
                        if (item.isDirectory) {
                            const subDirResult = await window.electronAPI.readDirectory(itemPath);
                            if (subDirResult.success && subDirResult.contents) {
                                await processDirectory(subDirResult.contents, itemPath);
                            }
                        } else {
                            // Skip node_modules, .git directories and non-code files
                            if (!itemPath.includes('node_modules') &&
                                !itemPath.includes('.git') &&
                                !item.name.endsWith('.png') &&
                                !item.name.endsWith('.jpg') &&
                                !item.name.endsWith('.jpeg') &&
                                !item.name.endsWith('.gif') &&
                                !item.name.endsWith('.svg') &&
                                !item.name.endsWith('.ico')) {
                                files.push(itemPath);
                            }
                        }
                    }
                };

                await processDirectory(result.contents, dirPath);
                setProjectFiles(files);
            }
        } catch (error) {
            console.error('Error fetching project files:', error);
        }
        setIsLoadingFiles(false);
    };

    // Function to toggle file selection
    const toggleFileSelection = async (filePath: string) => {
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
    };

    const handleConfirm = () => {
        onConfirmSelection(selectedFiles);
        onClose();
    };

    // Filter files based on search query
    const filteredFiles = projectFiles.filter(file =>
        file.toLowerCase().includes(fileSearchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="file-selector">
            <div className="file-selector-header">
                <h4>Select files to include as context</h4>
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
                ) : filteredFiles.length > 0 ? (
                    filteredFiles.map((file, index) => {
                        const isSelected = selectedFiles.some(f => f.path === file);
                        const fileName = file.split('/').pop() || file;

                        return (
                            <div
                                key={index}
                                className={`file-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleFileSelection(file)}
                            >
                                <span className="material-icons">
                                    {isSelected ? 'check_box' : 'check_box_outline_blank'}
                                </span>
                                <span className="file-name" title={file}>{fileName}</span>
                            </div>
                        );
                    })
                ) : (
                    <div className="no-files">No files found matching your search</div>
                )}
            </div>

            <div className="file-selector-actions">
                <div className="selected-files-count">
                    {selectedFiles.length} file(s) selected
                </div>
                <div className="file-selector-buttons">
                    <button onClick={onClose}>Cancel</button>
                    <button
                        onClick={handleConfirm}
                        className="confirm-button"
                    >
                        Confirm Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileContextSelector;