// src/components/Documentation/HoverChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import './HoverChat.css';

interface HoverChatProps {
    position: { x: number, y: number };
    onClose: () => void;
    onAddContext: (context: string) => void;
}

const HoverChat: React.FC<HoverChatProps> = ({ position, onClose, onAddContext }) => {
    const [input, setInput] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // Adjust position if popup would go off-screen
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            if (position.x + rect.width > window.innerWidth) {
                containerRef.current.style.left = `${position.x - rect.width}px`;
            }
            if (position.y + rect.height > window.innerHeight) {
                containerRef.current.style.top = `${position.y - rect.height}px`;
            }
        }

        // Focus input
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [position]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onAddContext(input);
            onClose();
        }
    };

    const handleClickOutside = (e: React.MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    return (
        <div className="hover-chat-overlay" onClick={handleClickOutside}>
            <div
                className="hover-chat-container"
                ref={containerRef}
                style={{ left: position.x, top: position.y }}
            >
                <div className="hover-chat-header">
                    <h4>Add Context</h4>
                    <button className="close-button" onClick={onClose}>
                        <span className="material-icons">close</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
          <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Provide additional context for documenting this code..."
              rows={4}
          />
                    <div className="hover-chat-actions">
                        <button type="submit" disabled={!input.trim()}>
                            Add Context
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HoverChat;