// src/services/GroqService.ts
import axios, { AxiosError } from 'axios';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export interface GroqCompletionResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface GroqErrorResponse {
    errorType: 'connection' | 'api-key' | 'rate-limit' | 'token-limit' | 'server-error' | 'unknown';
    message: string;
    details?: string;
    original?: any;
}

export default class GroqService {
    private apiKey: string | null = null;
    private userApiKey: string | null = null;
    private baseUrl = 'https://api.groq.com/openai/v1';
    private readonly configPath: string;
    // Always ensure we have a default API key
    private readonly defaultApiKey: string = 'api key';
    private isUsingDefault = false;

    // Custom friendly error messages
    private static readonly ERROR_MESSAGES = {
        CONNECTION: 'Unable to connect to Groq API. Please check your internet connection and try again.',
        OFFLINE: 'The AI service is currently offline. Please check your connection and try again later.',
        API_KEY_INVALID: 'Your API key appears to be invalid. Please check your API key in the settings.',
        API_KEY_MISSING: 'No API key configured. Please add your Groq API key in the settings.',
        RATE_LIMIT: 'Rate limit exceeded. Please wait a moment before trying again.',
        TOKEN_LIMIT: 'Your request exceeds the maximum token limit. Please try with a shorter message or fewer files.',
        SERVER_ERROR: 'The Groq API service is experiencing issues. Please try again later.',
        FILE_TOO_LARGE: 'The files you selected exceed the maximum size limit. Please select fewer or smaller files.',
        DEFAULT: 'An unexpected error occurred while communicating with the AI service.'
    };

    constructor() {
        // Load environment variables from .env file
        dotenv.config();

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

    // Enhanced error handling method
    private handleApiError(error: any): GroqErrorResponse {
        console.error('Groq API error:', error);

        // Check if it's an axios error with response
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;

            // No connection / network error
            if (!axiosError.response) {
                return {
                    errorType: 'connection',
                    message: GroqService.ERROR_MESSAGES.OFFLINE,
                    details: error.message,
                    original: error
                };
            }

            // Response received with error status
            const status = axiosError.response.status;
            const data = axiosError.response.data as any;

            // Check for common error cases
            if (status === 401) {
                return {
                    errorType: 'api-key',
                    message: GroqService.ERROR_MESSAGES.API_KEY_INVALID,
                    details: data?.error?.message || 'Authentication failed',
                    original: error
                };
            } else if (status === 429) {
                return {
                    errorType: 'rate-limit',
                    message: GroqService.ERROR_MESSAGES.RATE_LIMIT,
                    details: data?.error?.message || 'Rate limit exceeded',
                    original: error
                };
            } else if (status === 413 || (data?.error?.code === 'context_length_exceeded')) {
                return {
                    errorType: 'token-limit',
                    message: GroqService.ERROR_MESSAGES.TOKEN_LIMIT,
                    details: data?.error?.message || 'Token limit exceeded',
                    original: error
                };
            } else if (status >= 500) {
                return {
                    errorType: 'server-error',
                    message: GroqService.ERROR_MESSAGES.SERVER_ERROR,
                    details: data?.error?.message || 'Server error',
                    original: error
                };
            }

            // Default error with response
            return {
                errorType: 'unknown',
                message: data?.error?.message || GroqService.ERROR_MESSAGES.DEFAULT,
                details: `Status ${status}: ${JSON.stringify(data)}`,
                original: error
            };
        }

        // Not an axios error or unexpected error structure
        return {
            errorType: 'unknown',
            message: GroqService.ERROR_MESSAGES.DEFAULT,
            details: error.message || String(error),
            original: error
        };
    }

    // Helper method to check if input is too large (rough estimate)
    private isContentTooLarge(messages: ChatMessage[]): boolean {
        // Rough estimate: each character is approximately 1/4 of a token
        // Set a very conservative limit of ~100K chars (approx. 25K tokens)
        const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
        return totalChars > 100000;
    }

    // getCompletion to pass the model parameter
    async getCompletion(prompt: string, maxTokens = 2000, model = 'deepseek-r1-distill-llama-70b'): Promise<string> {
        return this.getChatCompletion([{ role: 'user', content: prompt }], maxTokens, model);
    }

    async getChatCompletion(messages: ChatMessage[], maxTokens = 2000, model = 'deepseek-r1-distill-llama-70b'): Promise<string> {
        if (!this.apiKey) {
            throw {
                errorType: 'api-key',
                message: GroqService.ERROR_MESSAGES.API_KEY_MISSING
            };
        }

        // Check if content is too large
        if (this.isContentTooLarge(messages)) {
            throw {
                errorType: 'token-limit',
                message: GroqService.ERROR_MESSAGES.FILE_TOO_LARGE
            };
        }

        try {
            const response = await axios.post<GroqCompletionResponse>(
                `${this.baseUrl}/chat/completions`,
                {
                    model: model,
                    messages: messages,
                    max_tokens: maxTokens
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            let content = response.data.choices[0].message.content;

            // Clean up any internal tags that might appear in the response
            content = this.cleanupInternalTags(content);

            return content;
        } catch (error) {
            throw this.handleApiError(error);
        }
    }

    // Helper method to clean up any internal tags from the model's response
    private cleanupInternalTags(content: string): string {
        // Remove <think> tags and their contents
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '');

        // Remove any other potentially problematic tags (add more as needed)
        content = content.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '');
        content = content.replace(/<reflection>[\s\S]*?<\/reflection>/g, '');

        // Remove any standalone opening or closing tags
        content = content.replace(/<\/?think>/g, '');
        content = content.replace(/<\/?reasoning>/g, '');
        content = content.replace(/<\/?reflection>/g, '');

        return content.trim();
    }

    async getCodeCompletion(code: string, language: string): Promise<string> {
        const prompt = `Complete the following ${language} code:\n\n${code}`;
        return this.getCompletion(prompt, 1000);
    }
}