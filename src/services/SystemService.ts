// src/services/systemService.ts

/**
 * Service for handling system-level operations
 */
const SystemService = {
    /**
     * Restart the IDE application
     * @returns Promise that resolves when restart is initiated
     */
    restartApplication: async (): Promise<{ success: boolean; error?: string }> => {
        try {
            // Call the electron API to restart the application
            const result = await window.electronAPI.restartApplication();
            return result;
        } catch (error) {
            console.error('Failed to restart application:', error);
            return { success: false, error: error.message };
        }
    }
};

export default SystemService;