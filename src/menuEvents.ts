// src/menuEvents.ts
import { ipcRenderer } from 'electron';

export const setupMenuEvents = () => {
    const createEventHandler = (eventName: string, callback: (...args: any[]) => void) => {
        // Create a handler function that we can use for both adding and removing
        const handler = (_: any, ...args: any[]) => callback(...args);

        // Add the event listener
        ipcRenderer.on(eventName, handler);

        // Return function to remove this specific event listener
        return () => {
            ipcRenderer.removeListener(eventName, handler);
        };
    };

    return {
        // Menu event listeners
        onMenuNewProject: (callback: () => void) =>
            createEventHandler('menu-new-project', callback),

        onMenuOpenProject: (callback: (projectPath: string) => void) =>
            createEventHandler('menu-open-project', callback),

        onMenuCloneRepo: (callback: () => void) =>
            createEventHandler('menu-clone-repo', callback),

        onMenuSaveFile: (callback: () => void) =>
            createEventHandler('menu-save-file', callback),

        onMenuSaveFileAs: (callback: () => void) =>
            createEventHandler('menu-save-file-as', callback),

        onMenuFormatDocument: (callback: () => void) =>
            createEventHandler('menu-format-document', callback),

        onMenuCommentSelection: (callback: () => void) =>
            createEventHandler('menu-comment-selection', callback),

        onMenuGotoFile: (callback: () => void) =>
            createEventHandler('menu-goto-file', callback),

        onMenuGotoLine: (callback: () => void) =>
            createEventHandler('menu-goto-line', callback),

        // Git menu handlers
        onMenuGitInit: (callback: () => void) =>
            createEventHandler('menu-git-init', callback),

        onMenuGitCommit: (callback: () => void) =>
            createEventHandler('menu-git-commit', callback),

        onMenuGitPush: (callback: () => void) =>
            createEventHandler('menu-git-push', callback),

        onMenuGitPull: (callback: () => void) =>
            createEventHandler('menu-git-pull', callback),

        // Tools menu handlers
        onMenuOpenSettings: (callback: () => void) =>
            createEventHandler('menu-open-settings', callback),

        onMenuOpenExtensions: (callback: () => void) =>
            createEventHandler('menu-open-extensions', callback),

        onMenuOpenLSPManager: (callback: () => void) =>
            createEventHandler('menu-open-lsp-manager', callback),

        onMenuClearRecentFiles: (callback: () => void) =>
            createEventHandler('menu-clear-recent-files', callback)
    };
};