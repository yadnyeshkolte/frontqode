// src/renderer.ts
import './index.css';
import './styles/App.css';
import './styles/AppInit.css';
import './styles/AppStarter.css';
import './components/ProjectDialog/ProjectDialog.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import AppInit from './components/AppInit/AppInit';
import AppStarter from './components/AppStarter/AppStarter';
import App from './components/App/App';
import ProjectDialog from './components/ProjectDialog/ProjectDialog';
import CloneRepoDialog from './components/CloneRepoDialog/CloneRepoDialog';

// First check if our renderer is loading at all
console.log('👋 Front Qode IDE renderer is loading');

// Get the root element
const container = document.getElementById('root');

if (container) {
    const root = createRoot(container);

    // Current project path
    let currentProjectPath = '';
    let currentComponent = '';
    let removeMenuEventListeners: (() => void)[] = [];

    // Function to clean up event listeners
    const cleanupMenuEventListeners = () => {
        removeMenuEventListeners.forEach(removeListener => removeListener());
        removeMenuEventListeners = [];
    };

    // Menu event handlers for different application states
    const setupAppStarterMenuHandlers = () => {
        // Clean up any existing listeners first
        cleanupMenuEventListeners();

        // Set up new listeners
        removeMenuEventListeners.push(
            window.electronAPI.onMenuNewProject(() => {
                setIsProjectDialogOpen(true);
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuOpenProject((projectPath) => {
                handleNewProject(projectPath);
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuCloneRepo(() => {
                setIsCloneRepoDialogOpen(true);
            })
        );
    };

    const setupAppMenuHandlers = () => {
        // Clean up any existing listeners first
        cleanupMenuEventListeners();

        // Set up new listeners specific to App component
        removeMenuEventListeners.push(
            window.electronAPI.onMenuSaveFile(() => {
                // We'll need to communicate with the App component
                window.dispatchEvent(new CustomEvent('app-save-file'));
            })
        );

        // Add other menu handlers for the App component as needed
    };

    // State for dialogs
    let isProjectDialogOpen = false;
    let isCloneRepoDialogOpen = false;

    const setIsProjectDialogOpen = (open: boolean) => {
        isProjectDialogOpen = open;
        renderCurrentComponent();
    };

    const setIsCloneRepoDialogOpen = (open: boolean) => {
        isCloneRepoDialogOpen = open;
        renderCurrentComponent();
    };

    // Function to render the current state
    const renderCurrentComponent = () => {
        if (currentComponent === 'AppInit') {
            root.render(React.createElement(AppInit, { onComplete: handleInitComplete }));
        } else if (currentComponent === 'AppStarter') {
            const appStarter = React.createElement(AppStarter, {
                onNewProject: handleNewProject,
                onOpenProjectClick: handleOpenProjectClick,
                onCloneRepoClick: handleCloneRepoClick
            });

            // Render with dialogs if they're open
            if (isProjectDialogOpen) {
                root.render(
                    React.createElement(
                        React.Fragment,
                        {},
                        appStarter,
                        React.createElement(ProjectDialog, {
                            isOpen: isProjectDialogOpen,
                            onClose: () => setIsProjectDialogOpen(false),
                            onConfirm: handleProjectCreate,
                            title: "Create New Project"
                        })
                    )
                );
            } else if (isCloneRepoDialogOpen) {
                root.render(
                    React.createElement(
                        React.Fragment,
                        {},
                        appStarter,
                        React.createElement(CloneRepoDialog, {
                            isOpen: isCloneRepoDialogOpen,
                            onClose: () => setIsCloneRepoDialogOpen(false),
                            onConfirm: handleRepoClone
                        })
                    )
                );
            } else {
                root.render(appStarter);
            }
        } else if (currentComponent === 'App') {
            const app = React.createElement(App, { projectPath: currentProjectPath });

            // Render with dialogs if they're open
            if (isProjectDialogOpen) {
                root.render(
                    React.createElement(
                        React.Fragment,
                        {},
                        app,
                        React.createElement(ProjectDialog, {
                            isOpen: isProjectDialogOpen,
                            onClose: () => setIsProjectDialogOpen(false),
                            onConfirm: handleProjectCreate,
                            title: "Create New Project"
                        })
                    )
                );
            } else if (isCloneRepoDialogOpen) {
                root.render(
                    React.createElement(
                        React.Fragment,
                        {},
                        app,
                        React.createElement(CloneRepoDialog, {
                            isOpen: isCloneRepoDialogOpen,
                            onClose: () => setIsCloneRepoDialogOpen(false),
                            onConfirm: handleRepoClone
                        })
                    )
                );
            } else {
                root.render(app);
            }
        }
    };

    // Flow: AppInit -> AppStarter -> App
    const handleInitComplete = () => {
        // Set current component to AppStarter
        currentComponent = 'AppStarter';
        setupAppStarterMenuHandlers();
        renderCurrentComponent();
    };

    const handleOpenProjectClick = async () => {
        try {
            const result = await window.electronAPI.openProjectDialog();

            if (result.success && result.projectPath) {
                handleNewProject(result.projectPath);
            }
        } catch (err) {
            console.error('Failed to open project:', err);
        }
    };

    const handleCloneRepoClick = () => {
        setIsCloneRepoDialogOpen(true);
    };

    const handleNewProject = (projectPath: string) => {
        // Store the current project path
        currentProjectPath = projectPath;

        // Set current component to App
        currentComponent = 'App';
        setupAppMenuHandlers();
        renderCurrentComponent();
    };

    const handleProjectCreate = async (projectName: string) => {
        try {
            const result = await window.electronAPI.createProject(projectName);

            if (result.success && result.projectPath) {
                setIsProjectDialogOpen(false);
                handleNewProject(result.projectPath);
            } else {
                throw new Error(result.error || 'Failed to create project');
            }
        } catch (err) {
            console.error('Failed to create project:', err);
        }
    };

    const handleRepoClone = async (repoUrl: string, projectName: string) => {
        try {
            const result = await window.electronAPI.cloneRepository(repoUrl, projectName);

            if (result.success && result.projectPath) {
                setIsCloneRepoDialogOpen(false);
                handleNewProject(result.projectPath);
            } else {
                throw new Error(result.error || 'Failed to clone repository');
            }
        } catch (err) {
            console.error('Failed to clone repository:', err);
        }
    };

    // Start with AppInit
    currentComponent = 'AppInit';
    renderCurrentComponent();
}