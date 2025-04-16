// src/components/AppStarter/AppStarter.tsx
import React, { useState } from 'react';
import '../../styles/AppStarter.css';
import ProjectDialog from '../ProjectDialog/ProjectDialog';

interface AppStarterProps {
    onNewProject: (projectPath: string) => void;
}

const AppStarter: React.FC<AppStarterProps> = ({ onNewProject }) => {
    const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
    const [error, setError] = useState('');

    const handleNewProjectClick = () => {
        setIsProjectDialogOpen(true);
    };

    const handleOpenProjectClick = async () => {
        try {
            const result = await window.electronAPI.openProjectDialog();

            if (result.success && result.projectPath) {
                onNewProject(result.projectPath);
            } else if (result.error) {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleProjectDialogClose = () => {
        setIsProjectDialogOpen(false);
        setError('');
    };

    const handleProjectCreate = async (projectName: string) => {
        try {
            const result = await window.electronAPI.createProject(projectName);

            if (result.success && result.projectPath) {
                setIsProjectDialogOpen(false);
                onNewProject(result.projectPath);
            } else {
                throw new Error(result.error || 'Failed to create project');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="app-starter-container">
            <div className="app-starter-content">
                <h1>Front Qode IDE</h1>
                <p>Choose an option to get started</p>

                {error && <div className="error-message">{error}</div>}

                <div className="starter-options">
                    <button className="starter-button" onClick={handleNewProjectClick}>
                        <span className="starter-button-icon">+</span>
                        New Project
                    </button>

                    <button className="starter-button starter-button-disabled">
                        <span className="starter-button-icon">⚙️</span>
                        Customize
                    </button>

                    <button className="starter-button" onClick={handleOpenProjectClick}>
                        <span className="starter-button-icon">📂</span>
                        Open Project
                    </button>

                    <button className="starter-button starter-button-disabled">
                        <span className="starter-button-icon">📥</span>
                        Clone Repository
                    </button>
                </div>

                <ProjectDialog
                    isOpen={isProjectDialogOpen}
                    onClose={handleProjectDialogClose}
                    onConfirm={handleProjectCreate}
                    title="Create New Project"
                />
            </div>
        </div>
    );
};

export default AppStarter;