// src/components/Documentation/DocumentationPreviewModal.tsx
import React from 'react';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import './DocumentationPreviewModal.css';

interface DocumentationPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    onAccept: () => void;
    onRegenerate: () => void;
    isProcessing: boolean;
}

const DocumentationPreviewModal: React.FC<DocumentationPreviewModalProps> = ({
                                                                                 isOpen,
                                                                                 onClose,
                                                                                 content,
                                                                                 onAccept,
                                                                                 onRegenerate,
                                                                                 isProcessing
                                                                             }) => {
    if (!isOpen) return null;

    return (
        <div className="doc-preview-overlay">
            <div className="doc-preview-panel">
                <div className="doc-preview-header">
                    <h3>Preview Documentation</h3>
                    <button onClick={onClose} disabled={isProcessing} title="Close">
                        <span className="material-icons">close</span>
                    </button>
                </div>
                <div className="doc-preview-content">
                    <div className="doc-preview-markdown">
                        <MarkdownRenderer content={content} />
                    </div>
                    <div className="doc-preview-actions">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="cancel-button"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onRegenerate}
                            disabled={isProcessing}
                            className="regenerate-button"
                        >
                            {isProcessing ? (
                                <>
                                    <span className="material-icons rotating">refresh</span>
                                    Regenerating...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons">refresh</span>
                                    Regenerate
                                </>
                            )}
                        </button>
                        <button
                            onClick={onAccept}
                            disabled={isProcessing}
                            className="accept-button"
                        >
                            <span className="material-icons">check</span>
                            Accept
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentationPreviewModal;