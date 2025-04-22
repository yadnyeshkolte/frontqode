import { ipcMain } from 'electron';
import GroqService from '../services/GroqService';

const groqService = new GroqService();

export const setupGroqHandlers = () => {
    ipcMain.handle('groq-get-completion', async (_, prompt: string, maxTokens = 500) => {
        try {
            const completion = await groqService.getCompletion(prompt, maxTokens);
            return { success: true, completion };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('groq-set-api-key', async (_, apiKey: string) => {
        try {
            const result = groqService.setApiKey(apiKey);
            return { success: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('groq-get-api-key', async () => {
        try {
            const apiKey = groqService.getApiKey();
            return { success: true, apiKey };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
};