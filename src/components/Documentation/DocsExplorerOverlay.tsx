// src/components/Documentation/DocsExplorerOverlay.tsx
import React, { useRef, useEffect } from 'react';
import DocsExplorer from './DocsExplorer';
import './DocsExplorerOverlay.css';

interface DocsExplorerOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    projectPath: string;
    onFileSelect: (filePath: string) => void;
    currentDocPath: string | null;
    onContextMenu?: (filePath: string, isDirectory: boolean, e: React.MouseEvent) => void;
    onChangeDocsFolder?: () => void;
}

const DocsExplorerOverlay: React.FC<DocsExplorerOverlayProps> = ({
                                                                     isOpen,
                                                                     onClose,
                                                                     projectPath,
                                                                     onFileSelect,
                                                                     currentDocPath,
                                                                     onContextMenu,
                                                                     onChangeDocsFolder
                                                                 }) => {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
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

    const handleFileSelect = (filePath: string) => {
        onFileSelect(filePath);
        onClose(); // Close the explorer after selecting a file
    };

    return (
        <div className="docs-explorer-overlay">
            <div className="docs-explorer-panel" ref={panelRef}>
                <div className="docs-explorer-overlay-header">
                    <h3>Documentation Files</h3>
                    <button onClick={onClose} title="Close">
                        <span className="material-icons">close</span>
                    </button>
                </div>
                <div className="docs-explorer-overlay-content">
                    <DocsExplorer
                        projectPath={projectPath}
                        onFileSelect={handleFileSelect}
                        currentDocPath={currentDocPath}
                        onContextMenu={onContextMenu}
                        onChangeDocsFolder={onChangeDocsFolder}
                    />
                </div>
            </div>
        </div>
    );
};

export default DocsExplorerOverlay;