// src/components/CloneRepoDialog/CloneRepoDialog.tsx
import React, { useState, useEffect } from 'react';
import '../../styles/CloneRepoDialog.css';

interface CloneRepoDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (repoUrl: string, projectName: string) => void;
}

const CloneRepoDialog: React.FC<CloneRepoDialogProps> = ({ isOpen, onClose, onConfirm }) => {
    const [repoUrl, setRepoUrl] = useState('');
    const [projectName, setProjectName] = useState('');
    const [error, setError] = useState('');
    const [isGitInstalled, setIsGitInstalled] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        checkGitInstallation();
    }, [isOpen]);

    useEffect(() => {
        // Extract project name from repo URL
        if (repoUrl) {
            try {
                const url = new URL(repoUrl);
                const pathParts = url.pathname.split('/');
                let name = pathParts[pathParts.length - 1];
                if (name.endsWith('.git')) {
                    name = name.slice(0, -4);
                }
                setProjectName(name);
            } catch (err) {
                // Not a valid URL, try to extract from common Git formats
                const sshMatch = repoUrl.match(/:([^\/]+)\/([^\/]+)\.git$/);
                if (sshMatch && sshMatch[2]) {
                    setProjectName(sshMatch[2]);
                }
            }
        }
    }, [repoUrl]);

    const checkGitInstallation = async () => {
        if (isOpen) {
            setIsChecking(true);
            try {
                const result = await window.electronAPI.isGitInstalled();
                setIsGitInstalled(result.success && result.isInstalled);
            } catch (err) {
                setIsGitInstalled(false);
            } finally {
                setIsChecking(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate inputs
        if (!repoUrl.trim()) {
            setError('Repository URL cannot be empty');
            return;
        }

        if (!projectName.trim()) {
            setError('Project name cannot be empty');
            return;
        }

        // Reset error and call onConfirm
        setError('');
        onConfirm(repoUrl, projectName);
    };

    const resetForm = () => {
        setRepoUrl('');
        setProjectName('');
        setError('');
    };

    // Close dialog and reset form
    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    if (isChecking) {
        return (
            <div className="repo-dialog-overlay">
                <div className="repo-dialog">
                    <h2>Clone Repository</h2>
                    <p>Checking Git installation...</p>
                </div>
            </div>
        );
    }

    if (!isGitInstalled) {
        return (
            <div className="repo-dialog-overlay">
                <div className="repo-dialog">
                    <h2>Git Not Found</h2>
                    <p>
                        Git is not installed or not available in your PATH.
                        Please install Git and restart the application to use this feature.
                    </p>
                    <div className="dialog-buttons">
                        <button type="button" className="confirm-button" onClick={handleClose}>
                            OK
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="repo-dialog-overlay">
            <div className="repo-dialog">
                <h2>Clone Git Repository</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="repoUrl">Repository URL:</label>
                        <input
                            type="text"
                            id="repoUrl"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/username/repository.git"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="projectName">Project Name:</label>
                        <input
                            type="text"
                            id="projectName"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Project name (auto-filled)"
                        />
                        <small>This will be the folder name in your projects directory</small>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="dialog-buttons">
                        <button type="button" className="cancel-button" onClick={handleClose}>
                            Cancel
                        </button>
                        <button type="submit" className="confirm-button">
                            Clone
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CloneRepoDialog;