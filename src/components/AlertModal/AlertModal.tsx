// src/components/AlertModal/AlertModal.tsx
import React, { useEffect } from 'react';
import './AlertModal.css';

type AlertType = 'info' | 'warning' | 'error' | 'success';

interface AlertModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: AlertType;
    onClose: () => void;
    onConfirm?: () => void;
    confirmButtonText?: string;
    cancelButtonText?: string;
    showCancelButton?: boolean;
}

const AlertModal: React.FC<AlertModalProps> = ({
                                                   isOpen,
                                                   title,
                                                   message,
                                                   type = 'info',
                                                   onClose,
                                                   onConfirm,
                                                   confirmButtonText = 'OK',
                                                   cancelButtonText = 'Cancel',
                                                   showCancelButton = false
                                               }) => {
    useEffect(() => {
        // Handle Escape key press to close the modal
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscKey);
        return () => window.removeEventListener('keydown', handleEscKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="alert-modal-overlay">
            <div className={`alert-modal ${type}`}>
                <div className="alert-modal-header">
                    <h3>{title}</h3>
                    <button className="close-button" onClick={onClose}>
                        <span className="material-icons">close</span>
                    </button>
                </div>
                <div className="alert-modal-content">
                    <p>{message}</p>
                </div>
                <div className="alert-modal-actions">
                    {showCancelButton && (
                        <button className="cancel-button" onClick={onClose}>
                            {cancelButtonText}
                        </button>
                    )}
                    <button
                        className={`confirm-button ${type}`}
                        onClick={() => {
                            if (onConfirm) onConfirm();
                            onClose();
                        }}
                    >
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;