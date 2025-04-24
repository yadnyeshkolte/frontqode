// src/components/Documentation/DocsExplorerOverlay.tsx
import React from 'react';
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
    if (!isOpen) return null;

    return (
        <div className="docs-explorer-overlay">
            <div className="docs-explorer-panel">
                <div className="docs-explorer-overlay-header">
                    <h3>Documentation Files</h3>
                    <button onClick={onClose} title="Close">
                        <span className="material-icons">close</span>
                    </button>
                </div>
                <div className="docs-explorer-overlay-content">
                    <DocsExplorer
                        projectPath={projectPath}
                        onFileSelect={onFileSelect}
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