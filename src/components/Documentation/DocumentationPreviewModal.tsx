// src/components/Documentation/DocumentationPreviewModal.tsx
import React, { useState } from 'react';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import './DocumentationPreviewModal.css';

interface DocumentationPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    onAccept: () => void;
    onRegenerate: () => void;
    onAddContext: (context: string) => void;
    isProcessing: boolean;
    isEmbedded?: boolean;
}

const DocumentationPreviewModal: React.FC<DocumentationPreviewModalProps> = ({
                                                                                 isOpen,
                                                                                 onClose,
                                                                                 content,
                                                                                 onAccept,
                                                                                 onRegenerate,
                                                                                 onAddContext,
                                                                                 isProcessing,
                                                                                 isEmbedded = false
                                                                             }) => {
    const [showContextInput, setShowContextInput] = useState(false);
    const [additionalContext, setAdditionalContext] = useState('');

    if (!isOpen) return null;

    const handleAddContext = () => {
        onAddContext(additionalContext);
        setAdditionalContext('');
        setShowContextInput(false);
    };

    const containerClass = isEmbedded
        ? "doc-preview-embedded"
        : "doc-preview-overlay";

    return (
        <div className={containerClass}>
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

                    {showContextInput && (
                        <div className="context-input-container">
                            <textarea
                                value={additionalContext}
                                onChange={(e) => setAdditionalContext(e.target.value)}
                                placeholder="Provide additional context for regeneration..."
                                className="context-input"
                            />
                            <div className="context-actions">
                                <button onClick={() => setShowContextInput(false)}>Cancel</button>
                                <button onClick={handleAddContext}>Submit & Regenerate</button>
                            </div>
                        </div>
                    )}

                    <div className="doc-preview-actions">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="cancel-button"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => setShowContextInput(true)}
                            disabled={isProcessing}
                            className="context-button"
                        >
                            <span className="material-icons">chat</span>
                            Add Context
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