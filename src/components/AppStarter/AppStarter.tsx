// src/components/AppStarter/AppStarter.tsx
import React, { useState, useEffect } from 'react';
import '../../styles/AppStarter.css';
import ProjectDialog from '../ProjectDialog/ProjectDialog';
import CloneRepoDialog from '../CloneRepoDialog/CloneRepoDialog';

interface ProjectItem {
    name: string;
    path: string;
}

interface AppStarterProps {
    onNewProject: (projectPath: string) => void;
    onOpenProjectClick?: () => void;
    onCloneRepoClick?: () => void;
}

const AppStarter: React.FC<AppStarterProps> = ({
                                                   onNewProject,
                                                   onOpenProjectClick: externalOpenProjectHandler,
                                                   onCloneRepoClick: externalCloneRepoHandler
                                               }) => {
    const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
    const [isCloneRepoDialogOpen, setIsCloneRepoDialogOpen] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [projectsDir, setProjectsDir] = useState('');
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [hoveredProject, setHoveredProject] = useState<string | null>(null);

    // Fetch projects on component mount
    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setIsLoading(true);

            // Get projects directory
            const dirResult = await window.electronAPI.getProjectsDir();
            if (dirResult.success && dirResult.projectsDir) {
                setProjectsDir(dirResult.projectsDir);
            }

            // List all projects
            const result = await window.electronAPI.listProjects();
            if (result.success && result.projects) {
                const projectItems: ProjectItem[] = result.projects.map(name => ({
                    name,
                    path: `${dirResult.projectsDir}/${name}`
                }));
                setProjects(projectItems);
            } else if (result.error) {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewProjectClick = () => {
        setIsProjectDialogOpen(true);
    };

    const handleOpenProjectClick = async () => {
        // If external handler is provided, use it
        if (externalOpenProjectHandler) {
            externalOpenProjectHandler();
            return;
        }

        // Otherwise use the internal implementation
        try {
            setIsLoading(true);
            const result = await window.electronAPI.openProjectDialog();

            if (result.success && result.projectPath) {
                onNewProject(result.projectPath);
            } else if (result.error) {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloneRepoClick = () => {
        // If external handler is provided, use it
        if (externalCloneRepoHandler) {
            externalCloneRepoHandler();
            return;
        }

        // Otherwise use internal implementation
        setIsCloneRepoDialogOpen(true);
    };

    const handleProjectDialogClose = () => {
        setIsProjectDialogOpen(false);
        setError('');
    };

    const handleCloneRepoDialogClose = () => {
        setIsCloneRepoDialogOpen(false);
        setError('');
    };

    const handleProjectCreate = async (projectName: string) => {
        try {
            setIsLoading(true);
            const result = await window.electronAPI.createProject(projectName);

            if (result.success && result.projectPath) {
                setIsProjectDialogOpen(false);
                onNewProject(result.projectPath);
            } else {
                throw new Error(result.error || 'Failed to create project');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRepoClone = async (repoUrl: string, projectName: string) => {
        try {
            setIsLoading(true);
            const result = await window.electronAPI.cloneRepository(repoUrl, projectName);

            if (result.success && result.projectPath) {
                setIsCloneRepoDialogOpen(false);
                onNewProject(result.projectPath);
            } else {
                throw new Error(result.error || 'Failed to clone repository');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProjectClick = (project: ProjectItem) => {
        setSelectedProject(project.path);
        onNewProject(project.path);
    };

    return (
        <div className="app-starter-container">
            <div className="app-starter-wrapper">
                <div className="app-starter-content">
                    <div className="app-starter-header">
                        <div className="logo-container">
                            <h1>Front Qode</h1>
                            <span className="logo-version">v1.0</span>
                        </div>
                        <p className="app-starter-subtitle">Modern Code Editor for Development</p>

                        {error && <div className="error-message">{error}</div>}

                        {isLoading && (
                            <div className="loading-indicator">
                                <div className="spinner"></div>
                                <p>Processing...</p>
                            </div>
                        )}

                        <div className="starter-options">
                            <button
                                className="starter-button"
                                onClick={handleNewProjectClick}
                                disabled={isLoading}
                            >
                                <span className="starter-button-icon">+</span>
                                <span className="starter-button-label">New Project</span>
                            </button>

                            <button
                                className="starter-button"
                                onClick={handleOpenProjectClick}
                                disabled={isLoading}
                            >
                                <span className="starter-button-icon">📂</span>
                                <span className="starter-button-label">Open Project</span>
                            </button>

                            <button
                                className="starter-button"
                                onClick={handleCloneRepoClick}
                                disabled={isLoading}
                            >
                                <span className="starter-button-icon">📥</span>
                                <span className="starter-button-label">Clone Repository</span>
                            </button>

                            <button className="starter-button starter-button-disabled">
                                <span className="starter-button-icon">⚙️</span>
                                <span className="starter-button-label">Customize</span>
                            </button>
                        </div>
                    </div>

                    <div className="recent-projects-section">
                        <div className="recent-projects-header">
                            <h2>Recent Activity</h2>
                        </div>
                        <div className="recent-projects-placeholder">
                            <p>Your recent projects will appear here</p>
                        </div>
                    </div>
                </div>

                <div className="projects-explorer">
                    <div className="projects-explorer-header">
                        <h2>Projects Explorer</h2>
                        <span className="projects-path">{projectsDir}</span>
                    </div>

                    <div className="projects-list-container">
                        {projects.length > 0 ? (
                            <ul className="projects-list">
                                {projects.map((project) => (
                                    <li
                                        key={project.path}
                                        className={`project-item ${selectedProject === project.path ? 'selected' : ''} ${hoveredProject === project.path ? 'hovered' : ''}`}
                                        onClick={() => handleProjectClick(project)}
                                        onMouseEnter={() => setHoveredProject(project.path)}
                                        onMouseLeave={() => setHoveredProject(null)}
                                    >
                                        <span className="project-icon">📁</span>
                                        <span className="project-name">{project.name}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="no-projects">
                                <p>No projects found</p>
                                <button
                                    className="create-first-project-btn"
                                    onClick={handleNewProjectClick}
                                >
                                    Create your first project
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ProjectDialog
                isOpen={isProjectDialogOpen}
                onClose={handleProjectDialogClose}
                onConfirm={handleProjectCreate}
                title="Create New Project"
            />

            <CloneRepoDialog
                isOpen={isCloneRepoDialogOpen}
                onClose={handleCloneRepoDialogClose}
                onConfirm={handleRepoClone}
            />
        </div>
    );
};

export default AppStarter;