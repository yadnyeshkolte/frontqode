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

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, projectPath }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I\'m your coding assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [showApiKeyForm, setShowApiKeyForm] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load API key on component mount
        window.electronAPI.groqGetApiKey().then(result => {
            if (result.success && result.apiKey) {
                setApiKey(result.apiKey);
            } else {
                setShowApiKeyForm(true);
            }
        });
    }, []);

    useEffect(() => {
        // Scroll to bottom when messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            setShowApiKeyForm(false);
            setApiKeyInput('');
        } else {
            alert(`Failed to set API key: ${result.error}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="ai-assistant-overlay">
            <div className="ai-assistant-panel">
                <div className="ai-assistant-header">
                    <h3>AI Coding Assistant</h3>
                    <div className="ai-assistant-actions">
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
                                    <div className="message-content">{msg.content}</div>
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