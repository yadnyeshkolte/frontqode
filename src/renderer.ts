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

    // Common event handlers that apply to all application states
    const setupCommonMenuHandlers = () => {
        // These handlers are relevant regardless of which component is active
        removeMenuEventListeners.push(
            window.electronAPI.onMenuNewProject(() => {
                console.log("Menu new project event received");
                setIsProjectDialogOpen(true);
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuOpenProject((projectPath) => {
                console.log("Menu open project event received", projectPath);
                if (projectPath) {
                    handleNewProject(projectPath);
                }
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuCloneRepo(() => {
                console.log("Menu clone repo event received");
                setIsCloneRepoDialogOpen(true);
            })
        );
    };

    // Menu event handlers for different application states
    const setupAppStarterMenuHandlers = () => {
        // Clean up any existing listeners first
        cleanupMenuEventListeners();

        // Setup common handlers
        setupCommonMenuHandlers();

        // Any AppStarter specific handlers would go here
    };

    const setupAppMenuHandlers = () => {
        // Clean up any existing listeners first
        cleanupMenuEventListeners();

        // Setup common handlers
        setupCommonMenuHandlers();

        // Set up specific listeners for App component
        removeMenuEventListeners.push(
            window.electronAPI.onMenuSaveFile(() => {
                console.log("Menu save file event received");
                window.dispatchEvent(new CustomEvent('app-save-file'));
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuSaveFileAs(() => {
                console.log("Menu save file as event received");
                window.dispatchEvent(new CustomEvent('app-save-file-as'));
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuFormatDocument(() => {
                console.log("Menu format document event received");
                window.dispatchEvent(new CustomEvent('app-format-document'));
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuCommentSelection(() => {
                console.log("Menu comment selection event received");
                window.dispatchEvent(new CustomEvent('app-comment-selection'));
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuGotoFile(() => {
                console.log("Menu goto file event received");
                window.dispatchEvent(new CustomEvent('app-goto-file'));
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuGotoLine(() => {
                console.log("Menu goto line event received");
                window.dispatchEvent(new CustomEvent('app-goto-line'));
            })
        );

        // Git menu handlers
        removeMenuEventListeners.push(
            window.electronAPI.onMenuGitInit(() => {
                console.log("Menu git init event received");
                window.dispatchEvent(new CustomEvent('app-git-init'));
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuGitCommit(() => {
                console.log("Menu git commit event received");
                window.dispatchEvent(new CustomEvent('app-git-commit'));
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuGitPush(() => {
                console.log("Menu git push event received");
                window.dispatchEvent(new CustomEvent('app-git-push'));
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuGitPull(() => {
                console.log("Menu git pull event received");
                window.dispatchEvent(new CustomEvent('app-git-pull'));
            })
        );

        // Tools menu handlers
        removeMenuEventListeners.push(
            window.electronAPI.onMenuOpenSettings(() => {
                console.log("Menu open settings event received");
                window.dispatchEvent(new CustomEvent('app-open-settings'));
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuOpenExtensions(() => {
                console.log("Menu open extensions event received");
                window.dispatchEvent(new CustomEvent('app-open-extensions'));
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuOpenLSPManager(() => {
                console.log("Menu open LSP manager event received");
                window.dispatchEvent(new CustomEvent('app-open-lsp-manager'));
            })
        );

        removeMenuEventListeners.push(
            window.electronAPI.onMenuClearRecentFiles(() => {
                console.log("Menu clear recent files event received");
                window.dispatchEvent(new CustomEvent('app-clear-recent-files'));
            })
        );
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
        console.log("Opening project:", projectPath);

        // Store the current project path
        currentProjectPath = projectPath;

        // Set current component to App
        currentComponent = 'App';
        setupAppMenuHandlers();
        renderCurrentComponent();
    };

    const handleProjectCreate = async (projectName: string) => {
        try {
            console.log("Creating project:", projectName);

            const result = await window.electronAPI.createProject(projectName);

            if (result.success && result.projectPath) {
                setIsProjectDialogOpen(false);
                handleNewProject(result.projectPath);
            } else {
                throw new Error(result.error || 'Failed to create project');
            }
        } catch (err) {
            console.error('Failed to create project:', err);
            alert(`Failed to create project: ${err.message}`);
        }
    };

    const handleRepoClone = async (repoUrl: string, projectName: string) => {
        try {
            console.log("Cloning repo:", repoUrl, "as", projectName);

            const result = await window.electronAPI.cloneRepository(repoUrl, projectName);

            if (result.success && result.projectPath) {
                setIsCloneRepoDialogOpen(false);
                handleNewProject(result.projectPath);
            } else {
                throw new Error(result.error || 'Failed to clone repository');
            }
        } catch (err) {
            console.error('Failed to clone repository:', err);
            alert(`Failed to clone repository: ${err.message}`);
        }
    };

    // Start with AppInit
    currentComponent = 'AppInit';
    renderCurrentComponent();
}