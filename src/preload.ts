// src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Project operations
    createProject: (projectName: string) => ipcRenderer.invoke('create-project', projectName),
    openProjectDialog: () => ipcRenderer.invoke('open-project-dialog'),
    listProjects: () => ipcRenderer.invoke('list-projects'),
    readDirectory: (dirPath: string) => ipcRenderer.invoke('read-directory', dirPath),

    // Git operations
    isGitInstalled: () => ipcRenderer.invoke('is-git-installed'),
    cloneRepository: (repoUrl: string, projectName?: string) =>
        ipcRenderer.invoke('clone-repository', repoUrl, projectName),

    // File operations
    readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),

    // Utility operations
    getProjectsDir: () => ipcRenderer.invoke('get-projects-dir'),

    // File dialog operations
    showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),

// Recent files operations
    getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
    addRecentFile: (filePath: string) => ipcRenderer.invoke('add-recent-file', filePath),
    clearRecentFiles: () => ipcRenderer.invoke('clear-recent-files'),

    createDirectory: (dirPath: string) => ipcRenderer.invoke('create-directory', dirPath),
    renameFile: (oldPath: string, newPath: string) => ipcRenderer.invoke('rename-file', oldPath, newPath),
    deleteItem: (itemPath: string, isDirectory: boolean) => ipcRenderer.invoke('delete-item', itemPath, isDirectory),
    copyOrMoveItem: (sourcePath: string, destPath: string, isDirectory: boolean, isCut: boolean) =>
        ipcRenderer.invoke('copy-or-move-item', sourcePath, destPath, isDirectory, isCut),
    openInExplorer: (itemPath: string) => ipcRenderer.invoke('open-in-explorer', itemPath),

    // Terminal operations
    terminalExecuteCommand: (command: string) => ipcRenderer.invoke('terminal-execute-command', command),
    terminalGetCurrentDir: () => ipcRenderer.invoke('terminal-get-current-dir'),
    terminalGetGitBranch: () => ipcRenderer.invoke('terminal-get-git-branch'),
    terminalChangeDirectory: (newDir: string) => ipcRenderer.invoke('terminal-change-directory', newDir),
    terminalClearHistory: () => ipcRenderer.invoke('terminal-clear-history'),
    terminalGetHistory: () => ipcRenderer.invoke('terminal-get-history'),

    // LSP operations
    getAvailableLanguageServers: () => ipcRenderer.invoke('get-available-language-servers'),
    isLSPServerInstalled: (languageId: string) => ipcRenderer.invoke('is-lsp-server-installed', languageId),
    getLSPServerInfo: (languageId: string) => ipcRenderer.invoke('get-lsp-server-info', languageId),
    stopLSPServer: (languageId: string) => ipcRenderer.invoke('stop-lsp-server', languageId),
    installLSPServer: (languageId: string) => ipcRenderer.invoke('install-lsp-server', languageId),

    groqGetCompletion: (prompt: string, maxTokens?: number) =>
        ipcRenderer.invoke('groq-get-completion', prompt, maxTokens),
    groqSetApiKey: (apiKey: string) => ipcRenderer.invoke('groq-set-api-key', apiKey),
    groqGetApiKey: () => ipcRenderer.invoke('groq-get-api-key'),

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
});