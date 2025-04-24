// src/components/Documentation/DocGenChatOverlay.tsx
import React, { useState } from 'react';
import './DocGenChatOverlay.css';

interface DocGenChatOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (additionalContext: string) => void;
    isProcessing: boolean;
}

const DocGenChatOverlay: React.FC<DocGenChatOverlayProps> = ({
                                                                 isOpen,
                                                                 onClose,
                                                                 onSubmit,
                                                                 isProcessing
                                                             }) => {
    const [context, setContext] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(context);
    };

    if (!isOpen) return null;

    return (
        <div className="doc-gen-overlay">
            <div className="doc-gen-panel">
                <div className="doc-gen-header">
                    <h3>Add Context for Documentation Generation</h3>
                    <button onClick={onClose} disabled={isProcessing} title="Close">
                        <span className="material-icons">close</span>
                    </button>
                </div>
                <div className="doc-gen-content">
                    <p>
                        Add any additional context or instructions to guide the AI when generating
                        documentation for your project. This can include specific areas to focus on,
                        architectural details, or any other relevant information.
                    </p>
                    <form onSubmit={handleSubmit}>
            <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="E.g., Focus on the React component structure, describe how the routing works, explain the state management pattern..."
                rows={8}
                disabled={isProcessing}
            />
                        <div className="doc-gen-actions">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isProcessing}
                                className="cancel-button"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="generate-button"
                            >
                                {isProcessing ? (
                                    <>
                                        <span className="material-icons rotating">refresh</span>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons">auto_awesome</span>
                                        Generate Documentation
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DocGenChatOverlay;