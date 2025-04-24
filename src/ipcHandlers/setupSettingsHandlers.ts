import { ipcMain, dialog } from 'electron';
import fs from 'fs';
import path from 'path';

export const setupSettingsHandlers = () => {
    // Handler for selecting a directory
    ipcMain.handle('select-directory', async (_, options) => {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openDirectory'],
                title: options.title || 'Select Directory',
                defaultPath: options.defaultPath || undefined,
                ...options
            });

            if (result.canceled) {
                return { success: false, error: 'Operation canceled' };
            }

            return { success: true, path: result.filePaths[0] };
        } catch (error) {
            console.error('Failed to select directory:', error);
            return { success: false, error: error.message };
        }
    });

    // Handler for saving project settings
    ipcMain.handle('save-project-setting', async (_, projectPath, settingKey, settingValue) => {
        try {
            const settingsFilePath = path.join(projectPath, '.project-settings.json');

            // Define a type for settings
            type Settings = Record<string, any>;

            // Load existing settings or create new object
            let settings: Settings = {};
            if (fs.existsSync(settingsFilePath)) {
                const fileContent = fs.readFileSync(settingsFilePath, 'utf8');
                settings = JSON.parse(fileContent);
            }

            // Update setting
            settings[settingKey as string] = settingValue;

            // Save settings
            fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf8');

            return { success: true };
        } catch (error) {
            console.error('Failed to save project setting:', error);
            return { success: false, error: error.message };
        }
    });
};