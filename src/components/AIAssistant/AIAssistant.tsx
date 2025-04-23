// src/components/AIAssistant/AIAssistant.tsx
import React, { useState, useEffect, useRef } from 'react';
import './AIAssistant.css';

interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    projectPath: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// Store messages outside component to persist between renders
let persistentMessages: Message[] = [
    { role: 'assistant', content: 'Hello! I\'m your coding assistant. How can I help you today?' }
];

// Helper function to format code blocks in a message
const formatMessageContent = (content: string): React.ReactNode => {
    if (!content) return '';

    // Split the content by code block markers
    const parts = content.split(/```([a-zA-Z]*)\n([\s\S]*?)```/g);

    if (parts.length === 1) {
        // No code blocks found, return plain text with line breaks preserved
        return content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
                {i < content.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    }

    const result: React.ReactNode[] = [];

    for (let i = 0; i < parts.length; i++) {
        if (i % 3 === 0) {
            // Regular text
            if (parts[i].trim()) {
                result.push(
                    <span key={`text-${i}`}>
                        {parts[i].split('\n').map((line, j) => (
                            <React.Fragment key={j}>
                                {line}
                                {j < parts[i].split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </span>
                );
            }
        } else if (i % 3 === 1) {
            // This is the language identifier - we don't need to render it

        } else if (i % 3 === 2) {
            // This is the code block content
            const language = parts[i-1] || 'plaintext';
            result.push(
                <div key={`code-${i}`} className="code-block">
                    <div className="code-header">
                        <span className="code-language">{language}</span>
                    </div>
                    <pre>
                        <code>{parts[i]}</code>
                    </pre>
                </div>
            );
        }
    }

    return result;
};

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose}) => {
    const [messages, setMessages] = useState<Message[]>(persistentMessages);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [showApiKeyForm, setShowApiKeyForm] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [hasDefaultKey, setHasDefaultKey] = useState(false);
    const [isUsingDefaultKey, setIsUsingDefaultKey] = useState(false);

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
            if (result.success && result.apiKey) {
                setApiKey(result.apiKey);
                setIsUsingDefaultKey(result.isDefault || false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;

        const userMessage = input.trim();
        setInput('');
        setIsProcessing(true);

        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            const result = await window.electronAPI.groqGetCompletion(userMessage);
            if (result.success && result.completion) {
                setMessages(prev => [...prev, { role: 'assistant', content: result.completion }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${result.error || 'Unknown error'}` }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveApiKey = async () => {
        if (!apiKeyInput.trim()) return;

        const result = await window.electronAPI.groqSetApiKey(apiKeyInput);
        if (result.success) {
            setApiKey(apiKeyInput);
            setIsUsingDefaultKey(false);
            setShowApiKeyForm(false);
            setApiKeyInput('');
        } else {
            alert(`Failed to set API key: ${result.error}`);
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
            alert(`Failed to use default API key: ${result.error}`);
        }
    };

    const handleDeleteChat = () => {
        // Reset chat to initial message
        const initialMessage = {
            role: 'assistant' as const,
            content: 'Hello! I\'m your coding assistant. How can I help you today?'
        };
        setMessages([initialMessage]);
        // Also update the persistent messages
        persistentMessages = [initialMessage];
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
                        <p>Enter your Groq API key to use the AI coding assistant.</p>

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
                            <button onClick={handleSaveApiKey}>Save</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="ai-assistant-messages">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`message ${msg.role}`}>
                                    <div className="message-content">
                                        {formatMessageContent(msg.content)}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSubmit} className="ai-assistant-input">
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
            </div>
        </div>
    );
};

export default AIAssistant;