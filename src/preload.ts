// src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import { setupMenuEvents } from './menuEvents';

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

    groqGetCompletion: (prompt: string, maxTokens?: number, model?: string) =>
        ipcRenderer.invoke('groq-get-completion', prompt, maxTokens, model),
    groqSetApiKey: (apiKey: string) =>
        ipcRenderer.invoke('groq-set-api-key', apiKey),
    groqGetApiKey: () =>
        ipcRenderer.invoke('groq-get-api-key'),
    groqUseDefaultApiKey: () =>
        ipcRenderer.invoke('groq-use-default-api-key'),
    groqUseDefaultWithUserKey: (apiKey: string) =>
        ipcRenderer.invoke('groq-use-default-with-user-key', apiKey),
    groqHasDefaultApiKey: () =>
        ipcRenderer.invoke('groq-has-default-api-key'),
    groqRemoveUserApiKey: () =>
        ipcRenderer.invoke('groq-remove-user-api-key'),
    groqGetChatCompletion: (messages: any[], maxTokens?: number, model?: string) =>
        ipcRenderer.invoke('groq-get-chat-completion', messages, maxTokens, model),

    // Add these to the electronAPI object in preload.ts
    checkIfDirectoryExists: (dirPath: string) => ipcRenderer.invoke('check-if-directory-exists', dirPath),
    listFilesInDirectory: (dirPath: string) => ipcRenderer.invoke('list-files-in-directory', dirPath),
    scanDirectory: (dirPath: string, ignoreDirectories: string[] = []) =>
        ipcRenderer.invoke('scan-directory', dirPath, ignoreDirectories),

    //Documentation operations
    selectDirectory: (options: any) => ipcRenderer.invoke('select-directory', options),
    saveProjectSetting: (projectPath: string, settingKey: string, settingValue: any) =>
        ipcRenderer.invoke('save-project-setting', projectPath, settingKey, settingValue),

    // UI Automation
    uiAutomationConnect: (hostPort?: string) =>
        ipcRenderer.invoke('ui-automation-connect', hostPort),
    uiAutomationLaunchBrowser: (url: string) =>
        ipcRenderer.invoke('ui-automation-launch-browser', url),
    uiAutomationClick: (selector: string) =>
        ipcRenderer.invoke('ui-automation-click', selector),
    uiAutomationType: (selector: string, text: string) =>
        ipcRenderer.invoke('ui-automation-type', selector, text),
    uiAutomationWaitForElement: (selector: string, timeout?: number) =>
        ipcRenderer.invoke('ui-automation-wait-for-element', selector, timeout),
    getPlatform: () => ipcRenderer.invoke('get-platform-info'),
    restartApplication: () => ipcRenderer.invoke('restart-application'),

    // Set up menu event listeners
    ...setupMenuEvents()
});