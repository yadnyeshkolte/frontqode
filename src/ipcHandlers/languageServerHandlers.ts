import { ipcMain } from 'electron';
import LanguageServerService from '../services/LanguageServerService';

const languageServerService = new LanguageServerService();

export const setupLanguageServerHandlers = () => {
    ipcMain.handle('get-available-language-servers', async () => {
        try {
            const servers = languageServerService.getAvailableServers();
            return { success: true, servers };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Check if language server is installed
    ipcMain.handle('is-lsp-server-installed', async (_, languageId: string) => {
        try {
            const isInstalled = languageServerService.isServerInstalled(languageId);
            return { success: true, isInstalled };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-lsp-server-info', async (_, languageId: string) => {
        try {
            // Check if server is running
            let serverInfo = languageServerService.getServerInfo(languageId);

            // Try to start server if it's not running but is installed
            if (!serverInfo && languageServerService.isServerInstalled(languageId)) {
                serverInfo = await languageServerService.startServer(languageId);
            }

            if (serverInfo) {
                return { success: true, ...serverInfo };
            } else {
                return {
                    success: false,
                    error: `Failed to get language server for ${languageId}. Is it installed?`,
                    isInstalled: languageServerService.isServerInstalled(languageId)
                };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('stop-lsp-server', async (_, languageId: string) => {
        try {
            const result = await languageServerService.stopServer(languageId);
            return { success: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('install-lsp-server', async (_, languageId: string) => {
        try {
            const result = await languageServerService.installServer(languageId);
            return { success: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
};
