// src/services/GroqService.ts
import axios from 'axios';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface GroqCompletionResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

export default class GroqService {
    private apiKey: string | null = null;
    private baseUrl = 'https://api.groq.com/openai/v1';
    private configPath: string;
    private defaultApiKey: string | null = null;

    constructor() {
        // Default path for storing config
        this.configPath = path.join(
            app.getPath('userData'),
            'groq-config.json'
        );

        // Try to get default API key from environment variables
        this.defaultApiKey = process.env.GROQ_API_KEY || null;

        // Try to load user's saved API key
        this.loadApiKey();
    }

    private loadApiKey(): void {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf8');
                const config = JSON.parse(configData);
                this.apiKey = config.apiKey || null;
            } else {
                // If no saved key exists, use the default key
                this.apiKey = this.defaultApiKey;
            }
        } catch (error) {
            console.error('Error loading API key:', error);
            // Fallback to default key on error
            this.apiKey = this.defaultApiKey;
        }
    }

    private saveApiKey(apiKey: string | null): boolean {
        try {
            fs.writeFileSync(
                this.configPath,
                JSON.stringify({ apiKey, useDefault: apiKey === null }),
                'utf8'
            );
            return true;
        } catch (error) {
            console.error('Error saving API key:', error);
            return false;
        }
    }

    setApiKey(apiKey: string): boolean {
        this.apiKey = apiKey;
        return this.saveApiKey(apiKey);
    }

    useDefaultApiKey(): boolean {
        this.apiKey = this.defaultApiKey;
        return this.saveApiKey(null);
    }

    getApiKey(): { key: string | null; isDefault: boolean } {
        return {
            key: this.apiKey,
            isDefault: this.apiKey === this.defaultApiKey
        };
    }

    hasDefaultApiKey(): boolean {
        return this.defaultApiKey !== null;
    }

    async getCompletion(prompt: string, maxTokens = 500): Promise<string> {
        if (!this.apiKey) {
            throw new Error('API key not configured');
        }

        try {
            const response = await axios.post<GroqCompletionResponse>(
                `${this.baseUrl}/chat/completions`,
                {
                    model: 'llama3-70b-8192',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: maxTokens
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Error getting completion from Groq:', error);
            throw error;
        }
    }

    async getCodeCompletion(code: string, language: string): Promise<string> {
        const prompt = `Complete the following ${language} code:\n\n${code}`;
        return this.getCompletion(prompt, 200);
    }
}