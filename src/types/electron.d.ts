// src/types/electron.d.ts
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
}

interface Window {
    electronAPI: ElectronAPI;
}