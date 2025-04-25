// src/components/AIAssistant/AIAssistant.tsx
import React, { useState, useEffect, useRef } from 'react';
import './AIAssistant.css';
import AlertModal from '../AlertModal/AlertModal';
import SystemService from '../../services/SystemService';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import FileContextSelector, { FileContext } from './FileContextSelector/FileContextSelector';

interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    projectPath: string;
}

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    id: string; // Add unique ID for messages
}

interface GroqModelInfo {
    id: string;
    name: string;
    tokensPerMinute: number;
}

const GROQ_MODELS: GroqModelInfo[] = [
    { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill LLaMA 70B', tokensPerMinute: 6000 },
    { id: 'allam-2-7b', name: 'Allam 2 7B', tokensPerMinute: 6000 },
    { id: 'compound-beta', name: 'Compound Beta', tokensPerMinute: 70000 },
    { id: 'compound-beta-mini', name: 'Compound Beta Mini', tokensPerMinute: 70000 },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B', tokensPerMinute: 15000 },
    { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B Instant', tokensPerMinute: 6000 },
    { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B Versatile', tokensPerMinute: 12000 },
    { id: 'llama-guard-3-8b', name: 'LLaMA Guard 3 8B', tokensPerMinute: 15000 },
    { id: 'llama3-70b-8192', name: 'LLaMA 3 70B 8192', tokensPerMinute: 6000 },
    { id: 'llama3-8b-8192', name: 'LLaMA 3 8B 8192', tokensPerMinute: 6000 },
    { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'LLaMA 4 Maverick 17B', tokensPerMinute: 6000 },
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'LLaMA 4 Scout 17B', tokensPerMinute: 30000 },
    { id: 'mistral-saba-24b', name: 'Mistral Saba 24B', tokensPerMinute: 6000 },
    { id: 'qwen-qwq-32b', name: 'Qwen QWQ 32B', tokensPerMinute: 6000 }
];
// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Initial system message to instruct the AI
const systemMessage: Message = {
    role: 'system',
    content: 'You are a helpful coding assistant. Provide complete and thorough responses to code-related questions. Remember previous parts of our conversation to maintain context. Never use or include tags like <think>, <reasoning>, or <reflection> in your responses.',
    id: generateId()
};

// Store messages outside component to persist between renders
let persistentMessages: Message[] = [
    systemMessage,
    {
        role: 'assistant',
        content: 'Hello! I\'m your coding assistant. How can I help you today?',
        id: generateId()
    }
];

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, projectPath }) => {
    const [messages, setMessages] = useState<Message[]>(persistentMessages);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [showApiKeyForm, setShowApiKeyForm] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [hasDefaultKey, setHasDefaultKey] = useState(false);
    const [isUsingDefaultKey, setIsUsingDefaultKey] = useState(false);
    const [userStoredKey, setUserStoredKey] = useState<string | null>(null);
    const [copyButtonStates, setCopyButtonStates] = useState<{[key: string]: string}>({});
    const [tokenLimit, setTokenLimit] = useState(4000); // Increased default token limit
    const [selectedModel, setSelectedModel] = useState('deepseek-r1-distill-llama-70b');

    // New states for file context feature - reduced as per instructions
    const [showFileSelector, setShowFileSelector] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FileContext[]>([]);

    // Add alert state
    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info' as 'info' | 'warning' | 'error' | 'success',
        onConfirm: null as (() => void) | null
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check if default API key is available
        window.electronAPI.groqHasDefaultApiKey().then(result => {
            if (result.success) {
                setHasDefaultKey(result.hasDefault || false);
            }
        });

        // Load API key on component mount
        window.electronAPI.groqGetApiKey().then(result => {
            if (result.success) {
                setApiKey(result.apiKey || null);
                setIsUsingDefaultKey(result.isDefault || false);
                setUserStoredKey(result.userKey || null);

                if (!result.apiKey) {
                    setShowApiKeyForm(true);
                }
            } else {
                setShowApiKeyForm(true);
            }
        });
    }, []);

    useEffect(() => {
        // Scroll to bottom when messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Update persistent messages when the state changes
    useEffect(() => {
        persistentMessages = messages;
    }, [messages]);

    // Helper to clean up any potential internal tags in a message
    const cleanupInternalTags = (content: string): string => {
        // Remove <think> tags and their contents
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '');

        // Remove any other potentially problematic tags
        content = content.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '');
        content = content.replace(/<reflection>[\s\S]*?<\/reflection>/g, '');

        // Remove any standalone opening or closing tags
        content = content.replace(/<\/?think>/g, '');
        content = content.replace(/<\/?reasoning>/g, '');
        content = content.replace(/<\/?reflection>/g, '');

        return content.trim();
    };

    const copyToClipboard = (text: string, messageId: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                // Update copy button text
                setCopyButtonStates(prev => ({
                    ...prev,
                    [messageId]: 'Copied!'
                }));

                // Reset the button text after 2 seconds
                setTimeout(() => {
                    setCopyButtonStates(prev => ({
                        ...prev,
                        [messageId]: 'Copy'
                    }));
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy message:', err);

                // Show error state
                setCopyButtonStates(prev => ({
                    ...prev,
                    [messageId]: 'Failed'
                }));

                // Reset after 2 seconds
                setTimeout(() => {
                    setCopyButtonStates(prev => ({
                        ...prev,
                        [messageId]: 'Copy'
                    }));
                }, 2000);
            });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;

        const userMessage = input.trim();
        setInput('');
        setIsProcessing(true);

        const userMessageId = generateId();

        // Create the user message, possibly with file content
        let enhancedUserMessage = userMessage;

        // If files are selected, append their content to the message
        if (selectedFiles.length > 0) {
            enhancedUserMessage += "\n\nHere are relevant files from my project:\n\n";

            for (const file of selectedFiles) {
                const fileName = file.path.split('/').pop() || file.path;
                enhancedUserMessage += `File: ${fileName}\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
            }
        }

        // Add the enhanced message to the chat
        setMessages(prev => [...prev, { role: 'user', content: userMessage, id: userMessageId }]);

        try {
            // Convert messages to the format expected by the API
            // We'll only include the visible messages (not the system message)
            const chatMessages = messages
                .filter(msg => msg.role !== 'system') // Skip system message for display
                .map(msg => ({ role: msg.role, content: msg.content }));

            // Add the new user message with enhanced content
            chatMessages.push({ role: 'user', content: enhancedUserMessage });

            // Add system message at the beginning for context
            chatMessages.unshift({
                role: 'system',
                content: systemMessage.content
            });

            // Make API request with the full conversation history and selected model
            const result = await window.electronAPI.groqGetChatCompletion(chatMessages, tokenLimit, selectedModel);

            if (result.success && result.completion) {
                // Clean up any internal tags in the response
                const cleanedResponse = cleanupInternalTags(result.completion);

                const assistantMessageId = generateId();
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: cleanedResponse,
                    id: assistantMessageId
                }]);

                // Clear selected files after sending the message
                setSelectedFiles([]);
            } else {
                const errorMessageId = generateId();
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Error: ${result.error || 'Unknown error'}`,
                    id: errorMessageId
                }]);
            }
        } catch (error) {
            const errorMessageId = generateId();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${error.message}`,
                id: errorMessageId
            }]);
        } finally {
            setIsProcessing(false);
        }
    };

    // Updated function as per instructions
    const handleOpenFileSelector = () => {
        if (projectPath) {
            setShowFileSelector(true);
        } else {
            setAlertState({
                isOpen: true,
                title: 'No Project Open',
                message: 'Please open a project first to select files for context.',
                type: 'warning',
                onConfirm: null
            });
        }
    };

    // New function to handle file selection confirmation
    const handleFileSelectionConfirm = (files: FileContext[]) => {
        setSelectedFiles(files);
    };
    const handleSaveApiKey = async () => {
        if (!apiKeyInput.trim()) return;

        const result = await window.electronAPI.groqSetApiKey(apiKeyInput);
        if (result.success) {
            setApiKey(apiKeyInput);
            setUserStoredKey(apiKeyInput);
            setIsUsingDefaultKey(false);
            setShowApiKeyForm(false);
            setApiKeyInput('');
        } else {
            setAlertState({
                isOpen: true,
                title: 'Error',
                message: `Failed to set API key: ${result.error}`,
                type: 'error',
                onConfirm: null
            });
        }
    };

    const handleUseDefaultKey = async () => {
        const result = await window.electronAPI.groqUseDefaultApiKey();
        if (result.success) {
            // Refresh the API key
            const keyResult = await window.electronAPI.groqGetApiKey();
            if (keyResult.success && keyResult.apiKey) {
                setApiKey(keyResult.apiKey);
                setIsUsingDefaultKey(true);
                setShowApiKeyForm(false);
                setApiKeyInput('');
            }
        } else {
            setAlertState({
                isOpen: true,
                title: 'Error',
                message: `Failed to use default API key: ${result.error}`,
                type: 'error',
                onConfirm: null
            });
        }
    };

    const handleRemoveUserApiKey = async () => {
        setAlertState({
            isOpen: true,
            title: 'Remove API Key',
            message: 'Are you sure you want to remove your API key? The IDE will use the default key if available.',
            type: 'warning',
            onConfirm: async () => {
                const result = await window.electronAPI.groqRemoveUserApiKey();
                if (result.success) {
                    // Refresh API key info
                    const keyResult = await window.electronAPI.groqGetApiKey();
                    if (keyResult.success) {
                        // Force a re-render by setting apiKey first
                        setApiKey(keyResult.apiKey);
                        setUserStoredKey(null);
                        setIsUsingDefaultKey(keyResult.isDefault || false);

                        // Force input state to update as well
                        setInput('');

                        // If no default key is available and user key was removed, show the API key form
                        if (!keyResult.apiKey) {
                            setShowApiKeyForm(true);
                        }

                        // Show restart alert
                        setAlertState({
                            isOpen: true,
                            title: 'API Key Removed',
                            message: 'API key has been removed successfully. Please restart the IDE to apply changes.',
                            type: 'error',
                            onConfirm: async () => {
                                await SystemService.restartApplication();
                            }
                        });
                    }
                } else {
                    setAlertState({
                        isOpen: true,
                        title: 'Error',
                        message: `Failed to remove API key: ${result.error}`,
                        type: 'error',
                        onConfirm: null
                    });
                }
            }
        });
    };

    const closeAlert = () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
    };

    const handleDeleteChat = () => {
        // Reset chat to initial message, but keep system message
        const initialMessage = {
            role: 'assistant' as const,
            content: 'Hello! I\'m your coding assistant. How can I help you today?',
            id: generateId()
        };
        setMessages([systemMessage, initialMessage]);
        // Also update the persistent messages
        persistentMessages = [systemMessage, initialMessage];
    };

    if (!isOpen) return null;

    return (
        <div className="ai-assistant-overlay">
            <div className="ai-assistant-panel">
                <div className="ai-assistant-header">
                    <h3>AI Coding Assistant</h3>
                    <div className="ai-assistant-actions">
                        <button onClick={handleDeleteChat} title="Clear Chat">
                            <span className="material-icons">delete</span>
                        </button>
                        <button onClick={() => setShowApiKeyForm(!showApiKeyForm)} title="API Key Settings">
                            <span className="material-icons">settings</span>
                        </button>
                        <button onClick={onClose} title="Close">
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                </div>

                {showApiKeyForm ? (
                    <div className="api-key-form">
                        <h4>Configure Groq API Key</h4>

                        {hasDefaultKey && (
                            <div className="default-key-option">
                                <p>
                                    {isUsingDefaultKey
                                        ? "✓ Currently using the default API key"
                                        : "You can use the default API key included with the application:"}
                                </p>
                                {!isUsingDefaultKey && (
                                    <button
                                        className="default-key-button"
                                        onClick={handleUseDefaultKey}>
                                        Use Default API Key
                                    </button>
                                )}
                                <div className="divider">
                                    <span>OR</span>
                                </div>
                            </div>
                        )}

                        <p>Use your own API key:</p>
                        <input
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="Enter your Groq API key"
                        />

                        <div className="api-key-actions">
                            <button onClick={() => setShowApiKeyForm(false)}>Cancel</button>
                            <button onClick={handleSaveApiKey}>Use My Key Only</button>
                            <button
                                className="remove-key-button"
                                onClick={handleRemoveUserApiKey}>
                                Remove My API Key
                            </button>
                        </div>
                        {userStoredKey && (
                            <div className="stored-key-info">
                                <p>You have a stored API key {isUsingDefaultKey ? "(not currently in use)" : "(currently in use)"}
                                </p>
                            </div>
                        )}
                        <div className="advanced-settings">
                            <h4>Advanced Settings</h4>
                            <div className="token-limit-setting">
                                <label htmlFor="token-limit">Max Response Tokens:</label>
                                <select
                                    id="token-limit"
                                    value={tokenLimit}
                                    onChange={(e) => setTokenLimit(parseInt(e.target.value, 10))}
                                >
                                    <option value={1000}>1000 tokens (~750 words)</option>
                                    <option value={5000}>5000 tokens (~3,750 words)</option>
                                    <option value={10000}>10000 tokens (~7,500 words)</option>
                                    <option value={15000}>15000 tokens (~11,250 words)</option>
                                    <option value={20000}>20000 tokens (~15,000 words)</option>
                                </select>
                            </div>

                            <div className="model-selection-setting">
                                <label htmlFor="model-selection">Model (Select & Try it Out!):</label>
                                <select
                                    id="model-selection"
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                >
                                    {GROQ_MODELS.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name} ({model.tokensPerMinute.toLocaleString()} TPM free)
                                        </option>
                                    ))}
                                </select>
                                <div className="model-info-tooltip">
                                    <p className="model-info-text">
                                        TPM = Tokens Per Minute (free usage limit)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <FileContextSelector
                            isOpen={showFileSelector}
                            projectPath={projectPath}
                            onClose={() => setShowFileSelector(false)}
                            onConfirmSelection={handleFileSelectionConfirm}
                            initialSelectedFiles={selectedFiles}
                        />

                        {!showFileSelector && (
                            <>
                                <div className="ai-assistant-messages">
                                    {messages
                                        .filter(msg => msg.role !== 'system') // Don't display system message
                                        .map((msg) => (
                                            <div key={msg.id} className={`message ${msg.role}`}>
                                                {msg.role === 'assistant' && (
                                                    <div className="message-actions">
                                                        <button
                                                            className="copy-message-button"
                                                            onClick={() => copyToClipboard(msg.content, msg.id)}
                                                            title="Copy entire response"
                                                        >
                                                            {copyButtonStates[msg.id] || 'Copy'}
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="message-content">
                                                    {msg.role === 'assistant' ? (
                                                        <MarkdownRenderer content={msg.content} />
                                                    ) : (
                                                        // For user messages, keep the existing text formatting
                                                        msg.content.split('\n').map((line, i) => (
                                                            <React.Fragment key={i}>
                                                                {line}
                                                                {i < msg.content.split('\n').length - 1 && <br />}
                                                            </React.Fragment>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleSubmit} className="ai-assistant-input">
                                    <div className="input-actions">
                                        <button
                                            type="button"
                                            className="file-context-button"
                                            onClick={handleOpenFileSelector}
                                            title="Add files as context"
                                        >
                                            <span className="material-icons">attach_file</span>
                                            {selectedFiles.length > 0 && (
                                                <span className="files-badge">{selectedFiles.length}</span>
                                            )}
                                        </button>
                                    </div>
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask me anything about coding..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmit(e);
                                            }
                                        }}
                                        disabled={isProcessing || !apiKey}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isProcessing || !apiKey || !input.trim()}
                                    >
                                        {isProcessing ?
                                            <span className="material-icons rotating">refresh</span> :
                                            <span className="material-icons">send</span>
                                        }
                                    </button>
                                </form>
                            </>
                        )}
                    </>
                )}

                {/* Alert Modal */}
                <AlertModal
                    isOpen={alertState.isOpen}
                    title={alertState.title}
                    message={alertState.message}
                    type={alertState.type}
                    onClose={closeAlert}
                    onConfirm={alertState.onConfirm ? () => alertState.onConfirm?.() : undefined}
                    confirmButtonText="OK"
                    showCancelButton={alertState.onConfirm !== null}
                />
            </div>
        </div>
    );
};

export default AIAssistant;