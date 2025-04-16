// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Project operations
    createProject: (projectName: string) => ipcRenderer.invoke('create-project', projectName),
    listProjects: () => ipcRenderer.invoke('list-projects'),

    // File operations
    readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),

    // Utility operations
    getProjectsDir: () => ipcRenderer.invoke('get-projects-dir'),
});