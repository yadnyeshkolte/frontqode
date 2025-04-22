// src/menuEvents.ts
import {ipcRenderer} from 'electron';

export const setupMenuEvents = () => {
    return {
        // Menu event listeners
        onMenuNewProject: (callback: () => void) => {
            ipcRenderer.on('menu-new-project', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-new-project');
            };
        },
        onMenuOpenProject: (callback: (projectPath: string) => void) => {
            ipcRenderer.on('menu-open-project', (_, projectPath) => callback(projectPath));
            return () => {
                ipcRenderer.removeAllListeners('menu-open-project');
            };
        },
        onMenuCloneRepo: (callback: () => void) => {
            ipcRenderer.on('menu-clone-repo', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-clone-repo');
            };
        },
        onMenuSaveFile: (callback: () => void) => {
            ipcRenderer.on('menu-save-file', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-save-file');
            };
        },
        onMenuSaveFileAs: (callback: () => void) => {
            ipcRenderer.on('menu-save-file-as', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-save-file-as');
            };
        },
        onMenuFormatDocument: (callback: () => void) => {
            ipcRenderer.on('menu-format-document', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-format-document');
            };
        },
        onMenuCommentSelection: (callback: () => void) => {
            ipcRenderer.on('menu-comment-selection', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-comment-selection');
            };
        },
        onMenuGotoFile: (callback: () => void) => {
            ipcRenderer.on('menu-goto-file', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-goto-file');
            };
        },
        onMenuGotoLine: (callback: () => void) => {
            ipcRenderer.on('menu-goto-line', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-goto-line');
            };
        },
        // Git menu handlers
        onMenuGitInit: (callback: () => void) => {
            ipcRenderer.on('menu-git-init', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-git-init');
            };
        },
        onMenuGitCommit: (callback: () => void) => {
            ipcRenderer.on('menu-git-commit', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-git-commit');
            };
        },
        onMenuGitPush: (callback: () => void) => {
            ipcRenderer.on('menu-git-push', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-git-push');
            };
        },
        onMenuGitPull: (callback: () => void) => {
            ipcRenderer.on('menu-git-pull', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-git-pull');
            };
        },
        // Tools menu handlers
        onMenuOpenSettings: (callback: () => void) => {
            ipcRenderer.on('menu-open-settings', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-open-settings');
            };
        },
        onMenuOpenExtensions: (callback: () => void) => {
            ipcRenderer.on('menu-open-extensions', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-open-extensions');
            };
        },
        onMenuOpenLSPManager: (callback: () => void) => {
            ipcRenderer.on('menu-open-lsp-manager', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-open-lsp-manager');
            };
        },
        onMenuClearRecentFiles: (callback: () => void) => {
            ipcRenderer.on('menu-clear-recent-files', () => callback());
            return () => {
                ipcRenderer.removeAllListeners('menu-clear-recent-files');
            };
        }
    };
};