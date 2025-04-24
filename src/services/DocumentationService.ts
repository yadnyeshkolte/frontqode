// src/services/DocumentationService.ts
import * as path from 'path';
import { FileContext } from '../components/AIAssistant/FileContextSelector/FileContextSelector';

export default class DocumentationService {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    async ensureDocsFolder(): Promise<boolean> {
        const docsPath = path.join(this.projectPath, 'docs');
        try {
            // Check if docs directory exists
            const result = await window.electronAPI.readDirectory(docsPath);
            if (!result.success) {
                // Create docs directory if it doesn't exist
                const createResult = await window.electronAPI.createDirectory(docsPath);
                return createResult.success;
            }
            return true;
        } catch (error) {
            console.error('Error ensuring docs folder:', error);
            // Try to create the directory if it doesn't exist
            try {
                const createResult = await window.electronAPI.createDirectory(docsPath);
                return createResult.success;
            } catch (innerError) {
                console.error('Failed to create docs folder:', innerError);
                return false;
            }
        }
    }

    async getAvailableDocs(): Promise<string[]> {
        const docsPath = path.join(this.projectPath, 'docs');
        try {
            const result = await window.electronAPI.readDirectory(docsPath);
            if (result.success && result.contents) {
                return result.contents
                    .filter(item => !item.isDirectory && item.name.endsWith('.md'))
                    .map(item => item.name);
            }
            return [];
        } catch (error) {
            console.error('Error loading available docs:', error);
            return [];
        }
    }

    async saveDocumentation(title: string, content: string): Promise<{success: boolean, path?: string, error?: string}> {
        if (!title.trim()) {
            return { success: false, error: 'Empty document title' };
        }

        await this.ensureDocsFolder();

        const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
        const filePath = path.join(this.projectPath, 'docs', fileName);

        try {
            const result = await window.electronAPI.writeFile(filePath, content);
            if (result.success) {
                return { success: true, path: filePath };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error saving documentation:', error);
            return { success: false, error: error.message };
        }
    }

    async loadDocumentation(fileName: string): Promise<{success: boolean, content?: string, error?: string}> {
        const filePath = path.join(this.projectPath, 'docs', fileName);
        try {
            const result = await window.electronAPI.readFile(filePath);
            if (result.success && result.content !== undefined) {
                return { success: true, content: result.content };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error loading documentation:', error);
            return { success: false, error: error.message };
        }
    }

    async generateDocumentation(title: string, selectedFiles: FileContext[]): Promise<{success: boolean, content?: string, error?: string}> {
        if (selectedFiles.length === 0) {
            return { success: false, error: 'No files selected' };
        }

        try {
            // Extract file contents for context
            const fileContexts = selectedFiles.map(file => {
                return `File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\``;
            }).join('\n\n');

            const systemPrompt = {
                role: 'system',
                content: `You are an AI technical documentation expert. Your task is to generate comprehensive markdown documentation for the provided code files. 
                Create clear, well-structured documentation that includes:
                1. Overview of what the code does
                2. Main components/functions and their purpose
                3. Usage examples where appropriate
                4. Dependencies and relationships between components
                5. Important notes or considerations
                
                Format the documentation with proper markdown, including headers, code blocks, lists, and emphasis where appropriate.`
            };

            const userPrompt = {
                role: 'user',
                content: `Please generate documentation for ${title}. Here is the code context:\n\n${fileContexts}`
            };

            const response = await window.electronAPI.groqGetChatCompletion(
                [systemPrompt, userPrompt],
                50000, // Adjust token limit as needed
                'deepseek-r1-distill-llama-70b' // Use your preferred model
            );

            if (response.success && response.completion) {
                return { success: true, content: response.completion };
            } else {
                return { success: false, error: response.error };
            }
        } catch (error) {
            console.error('Error in documentation generation:', error);
            return { success: false, error: error.message };
        }
    }

    // Parse source code to extract functions and classes for documentation
    async extractFunctionsAndClasses(filePath: string): Promise<string[]> {
        try {
            const result = await window.electronAPI.readFile(filePath);
            if (!result.success || !result.content) {
                return [];
            }

            const content = result.content;
            const foundItems: string[] = [];

            // Simple regex patterns to find functions and classes
            // These would need refinement for real production use
            const functionPattern = /function\s+(\w+)\s*\(/g;
            const classPattern = /class\s+(\w+)/g;
            const arrowFunctionPattern = /const\s+(\w+)\s*=\s*(\([^)]*\)|[^=]+)=>/g;
            const componentPattern = /const\s+(\w+):\s*React\.FC/g;

            let match;
            while ((match = functionPattern.exec(content)) !== null) {
                foundItems.push(match[1]);
            }

            while ((match = classPattern.exec(content)) !== null) {
                foundItems.push(match[1]);
            }

            while ((match = arrowFunctionPattern.exec(content)) !== null) {
                foundItems.push(match[1]);
            }

            while ((match = componentPattern.exec(content)) !== null) {
                foundItems.push(match[1]);
            }

            return foundItems;
        } catch (error) {
            console.error('Error extracting functions and classes:', error);
            return [];
        }
    }
}