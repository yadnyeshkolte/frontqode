// src/ipcHandlers/groqHandlers.ts
import { ipcMain } from 'electron';
import GroqService, { ChatMessage } from '../services/GroqService';

const groqService = new GroqService();

export const setupGroqHandlers = () => {
    ipcMain.handle('groq-get-completion', async (_, prompt: string, maxTokens = 50000, model = 'deepseek-r1-distill-llama-70b') => {
        try {
            const completion = await groqService.getCompletion(prompt, maxTokens, model);
            return { success: true, completion };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('groq-get-chat-completion', async (_, messages: ChatMessage[], maxTokens = 50000, model = 'deepseek-r1-distill-llama-70b') => {
        try {
            const completion = await groqService.getChatCompletion(messages, maxTokens, model);
            return { success: true, completion };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Other handlers remain unchanged...
    ipcMain.handle('groq-set-api-key', async (_, apiKey: string) => {
        try {
            const result = groqService.setApiKey(apiKey);
            return { success: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('groq-use-default-api-key', async () => {
        try {
            const result = groqService.useDefaultApiKey();
            return { success: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('groq-use-default-with-user-key', async (_, apiKey: string) => {
        try {
            const result = groqService.setUseDefaultWithUserKey(apiKey);
            return { success: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('groq-remove-user-api-key', async () => {
        try {
            const result = groqService.removeUserApiKey();
            return { success: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('groq-get-api-key', async () => {
        try {
            const apiKeyInfo = groqService.getApiKey();
            return {
                success: true,
                apiKey: apiKeyInfo.key,
                isDefault: apiKeyInfo.isDefault,
                userKey: apiKeyInfo.userKey
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('groq-has-default-api-key', async () => {
        try {
            const hasDefault = groqService.hasDefaultApiKey();
            return { success: true, hasDefault };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
};