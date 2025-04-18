// src/types/electron.d.ts

interface TerminalOutput {
    id: string;
    timestamp: Date;
    type: 'stdout' | 'stderr' | 'input' | 'system';
    data: string;
}

interface ElectronAPI {
    createProject: (projectName: string) => Promise<{ success: boolean; projectPath?: string; error?: string }>;
    openProjectDialog: () => Promise<{ success: boolean; projectPath?: string; error?: string }>;
    listProjects: () => Promise<{ success: boolean; projects?: string[]; error?: string }>;
    readDirectory: (dirPath: string) => Promise<{ success: boolean; contents?: any[]; error?: string }>;
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
    getProjectsDir: () => Promise<{ success: boolean; projectsDir?: string; error?: string }>;

    // Git operations
    isGitInstalled: () => Promise<{ success: boolean; isInstalled?: boolean; error?: string }>;
    cloneRepository: (repoUrl: string, projectName?: string) =>
        Promise<{ success: boolean; projectPath?: string; error?: string }>;

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
    getLSPServerInfo: (languageId: string) =>
        Promise<{ success: boolean; port?: number; languageId?: string; error?: string }>;
    stopLSPServer: (languageId: string) =>
        Promise<{ success: boolean; error?: string }>;
    installLSPServer: (languageId: string) =>
        Promise<{ success: boolean; error?: string }>;

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
    async

    showSaveDialog(param: {defaultPath: string; filters: {name: string; extensions: string[]}[]}): any;
}

interface Window {
    electronAPI: ElectronAPI;
}