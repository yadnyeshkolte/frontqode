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
});