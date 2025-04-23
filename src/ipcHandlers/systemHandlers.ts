// src/ipcHandlers/systemHandlers.ts
import { app, ipcMain } from 'electron';

export const setupSystemHandlers = () => {
    // Handler for restarting the application
    ipcMain.handle('restart-application', async () => {
        try {
            console.log('Restarting application...');
            app.relaunch();
            app.exit(0);
            return { success: true };
        } catch (error) {
            console.error('Failed to restart application:', error);
            return { success: false, error: error.message };
        }
    });
};