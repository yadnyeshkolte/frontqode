// src/types/electron.d.ts
interface ElectronAPI {
    createProject: (projectName: string) => Promise<{ success: boolean; projectPath?: string; error?: string }>;
    listProjects: () => Promise<{ success: boolean; projects?: string[]; error?: string }>;
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
    getProjectsDir: () => Promise<{ success: boolean; projectsDir?: string; error?: string }>;
}

interface Window {
    electronAPI: ElectronAPI;
}