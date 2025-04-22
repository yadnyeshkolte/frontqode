// src/services/GroqService.ts
import axios from 'axios';

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

    constructor() {
        // Try to get API key from environment variables
        this.apiKey = process.env.GROQ_API_KEY || null;
    }

    setApiKey(apiKey: string) {
        this.apiKey = apiKey;
        return true;
    }

    getApiKey(): string | null {
        return this.apiKey;
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