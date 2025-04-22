import { ipcMain, dialog } from 'electron';
import FileSystemService from '../services/FileSystemService';

const fileSystemService = new FileSystemService();

export const setupProjectHandlers = () => {
    // Create a new project
    ipcMain.handle('create-project', async (_, projectName: string) => {
        try {
            const projectPath = fileSystemService.createProject(projectName);
            return { success: true, projectPath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Open project dialog
    ipcMain.handle('open-project-dialog', async () => {
        try {
            const projectPath = fileSystemService.openProjectDialog();
            return { success: true, projectPath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // List all projects
    ipcMain.handle('list-projects', async () => {
        try {
            const projects = fileSystemService.listProjects();
            return { success: true, projects };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Get projects directory
    ipcMain.handle('get-projects-dir', async () => {
        try {
            const projectsDir = fileSystemService.getProjectsDir();
            return { success: true, projectsDir };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
};