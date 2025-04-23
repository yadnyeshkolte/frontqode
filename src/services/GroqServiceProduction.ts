// src/services/GroqService.ts - Fixed version
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
    private userApiKey: string | null = null;
    private baseUrl = 'https://api.groq.com/openai/v1';
    private readonly configPath: string;
    // Always ensure we have a default API key
    private readonly defaultApiKey: string = 'gsk_put_api_key_here';
    private isUsingDefault = false;

    constructor() {
        // Default path for storing config
        this.configPath = path.join(
            app.getPath('userData'),
            'groq-config.json'
        );

        // Try to get API key from environment variables first, fallback to hardcoded key
        if (process.env.GROQ_API_KEY) {
            this.defaultApiKey = process.env.GROQ_API_KEY;
        }

        // Load saved configuration
        this.loadApiKey();
    }

    private loadApiKey(): void {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf8');
                const config = JSON.parse(configData);

                this.userApiKey = config.userApiKey || null;
                this.isUsingDefault = config.useDefault || false;

                // Set active API key based on configuration
                if (this.isUsingDefault) {
                    this.apiKey = this.defaultApiKey;
                } else {
                    this.apiKey = this.userApiKey;
                }
            } else {
                // If no saved config exists, use the default key
                this.isUsingDefault = true;
                this.apiKey = this.defaultApiKey;
                this.saveApiKeyConfig();
            }
        } catch (error) {
            console.error('Error loading API key:', error);
            // Fallback to default key on error
            this.isUsingDefault = true;
            this.apiKey = this.defaultApiKey;
        }
    }

    private saveApiKeyConfig(): boolean {
        try {
            fs.writeFileSync(
                this.configPath,
                JSON.stringify({
                    userApiKey: this.userApiKey,
                    useDefault: this.isUsingDefault
                }),
                'utf8'
            );
            return true;
        } catch (error) {
            console.error('Error saving API key configuration:', error);
            return false;
        }
    }

    setApiKey(apiKey: string): boolean {
        this.userApiKey = apiKey;
        this.apiKey = apiKey;
        this.isUsingDefault = false;
        return this.saveApiKeyConfig();
    }

    useDefaultApiKey(): boolean {
        this.isUsingDefault = true;
        this.apiKey = this.defaultApiKey;
        return this.saveApiKeyConfig();
    }

    setUseDefaultWithUserKey(apiKey: string): boolean {
        this.userApiKey = apiKey;
        this.isUsingDefault = true;
        this.apiKey = this.defaultApiKey;
        return this.saveApiKeyConfig();
    }

    removeUserApiKey(): boolean {
        this.userApiKey = null;
        // Always fall back to default key since we always have one
        this.isUsingDefault = true;
        this.apiKey = this.defaultApiKey;
        return this.saveApiKeyConfig();
    }

    getApiKey(): { key: string | null; isDefault: boolean; userKey: string | null } {
        return {
            key: this.apiKey,
            isDefault: this.isUsingDefault,
            userKey: this.userApiKey
        };
    }

    hasDefaultApiKey(): boolean {
        // We always have a default API key now
        return true;
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