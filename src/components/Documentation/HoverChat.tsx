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

    // Use state to track adjusted position
    const [adjustedPosition, setAdjustedPosition] = useState({ x: position.x, y: position.y });

    useEffect(() => {
        // Adjust position if popup would go off-screen
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            let newX = position.x;
            let newY = position.y;

            // Horizontal adjustment
            if (position.x + rect.width > window.innerWidth) {
                newX = Math.max(10, window.innerWidth - rect.width - 10);
            }

            // Vertical adjustment
            if (position.y + rect.height > window.innerHeight) {
                newY = Math.max(10, window.innerHeight - rect.height - 10);
            }

            // Set adjusted position
            if (newX !== adjustedPosition.x || newY !== adjustedPosition.y) {
                setAdjustedPosition({ x: newX, y: newY });
            }
        }

        // Focus input
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [position, containerRef.current]);

    // Prevent click outside from closing immediately when component mounts
    const [isInitialRender, setIsInitialRender] = useState(true);
    useEffect(() => {
        if (isInitialRender) {
            setIsInitialRender(false);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onAddContext(input);
            onClose();
        }
    };

    const handleClickOutside = (e: React.MouseEvent) => {
        if (!isInitialRender && containerRef.current && !containerRef.current.contains(e.target as Node)) {
            onClose();
        }
        e.stopPropagation();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Close on escape key
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div
            className="hover-chat-overlay"
            onClick={handleClickOutside}
            onKeyDown={handleKeyDown}
        >
            <div
                className="hover-chat-container"
                ref={containerRef}
                style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
            >
                <div className="hover-chat-header">
                    <h4>Add Context</h4>
                    <button className="close-button" onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}>
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