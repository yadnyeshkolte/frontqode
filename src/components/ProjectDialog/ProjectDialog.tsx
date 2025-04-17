// src/components/ProjectDialog/ProjectDialog.tsx
import React, { useState } from 'react';
import './ProjectDialog.css';

interface ProjectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (projectName: string) => void;
    title: string;
}

const ProjectDialog: React.FC<ProjectDialogProps> = ({ isOpen, onClose, onConfirm, title }) => {
    const [projectName, setProjectName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate project name
        if (!projectName.trim()) {
            setError('Project name cannot be empty');
            return;
        }

        // Reset error and call onConfirm
        setError('');
        onConfirm(projectName);
        setProjectName('');
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="project-dialog-overlay">
            <div className="project-dialog">
                <h2>{title}</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="projectName">Project Name:</label>
                        <input
                            type="text"
                            id="projectName"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Enter project name"
                            autoFocus
                        />
                        {error && <div className="error-message">{error}</div>}
                    </div>

                    <div className="dialog-buttons">
                        <button type="button" className="cancel-button" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="confirm-button">
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectDialog;