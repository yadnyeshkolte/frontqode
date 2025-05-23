// src/types/electron.d.ts

interface GroqError {
    success: false;
    error: string;
    errorType?: 'connection' | 'api-key' | 'rate-limit' | 'token-limit' | 'server-error' | 'unknown';
    details?: string;
}

interface TerminalOutput {
    id: string;
    timestamp: Date;
    type: 'stdout' | 'stderr' | 'input' | 'system';
    data: string;
}

interface PlatformInfo {
    platform: string;  // 'win32', 'darwin', 'linux', etc.
    osName: string;    // 'Windows_NT', 'Darwin', 'Linux', etc.
    version: string;   // OS version string
}

interface LanguageServerInfo {
    id: string;
    name: string;
    description: string;
    installed: boolean;
}

interface ProxyInfo {
    port: number;
    status: 'running' | 'stopped';
}


interface ElectronAPI {
    createProject: (projectName: string) => Promise<{ success: boolean; projectPath?: string; error?: string }>;
    openProjectDialog: () => Promise<{ success: boolean; projectPath?: string; error?: string }>;
    listProjects: () => Promise<{ success: boolean; projects?: string[]; error?: string }>;
    readDirectory: (dirPath: string) => Promise<{ success: boolean; contents?: any[]; error?: string }>;
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
    getProjectsDir: () => Promise<{ success: boolean; projectsDir?: string; error?: string }>;

    // Platform detection
    getPlatform: () => Promise<PlatformInfo>;

    //Documentation operations

    selectDirectory: (options: {
        title?: string;
        defaultPath?: string;
        properties?: string[];
    }) => Promise<{ success: boolean; path?: string; error?: string }>;

    saveProjectSetting: (projectPath: string, settingKey: string, settingValue: any) =>
        Promise<{ success: boolean; error?: string }>;

    // Git operations
    isGitInstalled: () => Promise<{ success: boolean; isInstalled?: boolean; error?: string }>;
    cloneRepository: (repoUrl: string, projectName?: string) =>
        Promise<{ success: boolean; projectPath?: string; error?: string }>;

    // Terminal operations
    terminalExecuteCommand: (command: string) =>
        Promise<{ success: boolean; output?: TerminalOutput[]; error?: string }>;
    terminalGetCurrentDir: () =>
        Promise<{ success: boolean; currentDir?: string; error?: string }>;
    terminalGetGitBranch: () =>
        Promise<{ success: boolean; gitBranch?: string | null; error?: string }>;
    terminalChangeDirectory: (newDir: string) =>
        Promise<{ success: boolean; path?: string; error?: string }>;
    terminalClearHistory: () =>
        Promise<{ success: boolean; error?: string }>;
    terminalGetHistory: () =>
        Promise<{ success: boolean; history?: TerminalOutput[]; error?: string }>;

    // LSP operations
    getAvailableLanguageServers: () => Promise<{
        success: boolean;
        servers?: LanguageServerInfo[];
        error?: string
    }>;
    isLSPServerInstalled: (languageId: string) =>
        Promise<{ success: boolean; installed?: boolean; error?: string }>;
    getLSPServerInfo: (languageId: string) =>
        Promise<{
            success: boolean;
            isInstalled: boolean;
            port?: number;
            languageId?: string;
            error?: string
        }>;
    startLSPServer: (languageId: string) =>
        Promise<{
            success: boolean;
            port?: number;
            languageId?: string;
            error?: string
        }>;
    stopLSPServer: (languageId: string) =>
        Promise<{ success: boolean; error?: string }>;
    installLSPServer: (languageId: string) =>
        Promise<{ success: boolean; error?: string }>;

    // Groq operations

    groqSetApiKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
    groqGetApiKey: () => Promise<{
        isDefault: boolean;
        success: boolean;
        apiKey?: string;
        userKey?: string;
        error?: string
    }>;
    groqUseDefaultApiKey: () =>
        Promise<{ success: boolean; error?: string }>;
    groqUseDefaultWithUserKey: (apiKey: string) =>
        Promise<{ success: boolean; error?: string }>;
    groqHasDefaultApiKey: () =>
        Promise<{ success: boolean; hasDefault?: boolean; error?: string }>;
    groqRemoveUserApiKey: () =>
        Promise<{ success: boolean; error?: string }>;
    groqGetCompletion: (prompt: string, maxTokens?: number, model?: string) =>
        Promise<{ success: boolean; completion?: string; error?: string; errorType?: string; details?: string }>;
    groqGetChatCompletion: (messages: ({
        role: string;
        content: string
    })[], maxTokens?: number, model?: string) =>
        Promise<{ success: boolean; completion?: string; error?: string; errorType?: string; details?: string }>;

    // Menu event listeners
    onMenuNewProject: (callback: () => void) => () => void;
    onMenuOpenProject: (callback: (projectPath: string) => void) => () => void;
    onMenuCloneRepo: (callback: () => void) => () => void;
    onMenuSaveFile: (callback: () => void) => () => void;
    onMenuSaveFileAs: (callback: () => void) => () => void;
    onMenuFormatDocument: (callback: () => void) => () => void;
    onMenuCommentSelection: (callback: () => void) => () => void;
    onMenuGotoFile: (callback: () => void) => () => void;
    onMenuGotoLine: (callback: () => void) => () => void;
    onMenuGitInit: (callback: () => void) => () => void;
    onMenuGitCommit: (callback: () => void) => () => void;
    onMenuGitPush: (callback: () => void) => () => void;
    onMenuGitPull: (callback: () => void) => () => void;
    onMenuOpenSettings: (callback: () => void) => () => void;
    onMenuOpenExtensions: (callback: () => void) => () => void;
    onMenuOpenLSPManager: (callback: () => void) => () => void;
    onMenuClearRecentFiles: (callback: () => void) => () => void;

    // File system operations
    createDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
    renameFile: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
    deleteItem: (itemPath: string, isDirectory: boolean) => Promise<{ success: boolean; error?: string }>;
    copyOrMoveItem: (
        sourcePath: string,
        destPath: string,
        isDirectory: boolean,
        isCut: boolean
    ) => Promise<{ success: boolean; error?: string }>;
    openInExplorer: (itemPath: string) => Promise<{ success: boolean; error?: string }>;

    // Dialog operations
    showSaveDialog: (options: {
        defaultPath: string;
        filters: { name: string; extensions: string[] }[];
    }) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    showOpenDialog: (options: {
        properties?: string[];
        filters?: { name: string; extensions: string[] }[];
    }) => Promise<{ success: boolean; filePaths?: string[]; error?: string }>;

    // Recent files operations
    getRecentFiles: () => Promise<string[]>;
    addRecentFile: (filePath: string) => Promise<{ success: boolean }>;
    clearRecentFiles: () => Promise<{ success: boolean }>;

    checkIfDirectoryExists: (dirPath: string) => Promise<{ exists: boolean; error?: string }>;
    listFilesInDirectory: (dirPath: string) => Promise<{ success: boolean; files?: string[]; error?: string }>;
    scanDirectory: (dirPath: string, ignoreDirectories?: string[]) =>
        Promise<{ success: boolean; files?: string[]; error?: string }>;

    // UI Automation
    uiAutomationConnect: (hostPort?: string) =>
        Promise<{ success: boolean; error?: string }>;
    uiAutomationLaunchBrowser: (url: string) =>
        Promise<{ success: boolean; error?: string }>;
    uiAutomationClick: (selector: string) =>
        Promise<{ success: boolean; error?: string }>;
    uiAutomationType: (selector: string, text: string) =>
        Promise<{ success: boolean; error?: string }>;
    uiAutomationWaitForElement: (selector: string, timeout?: number) =>
        Promise<{ success: boolean; error?: string }>;

    restartApplication: () => Promise<{ success: boolean; error?: string }>;
    async


}

interface Window {
    electronAPI: ElectronAPI;
}