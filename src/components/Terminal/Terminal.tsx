// src/components/Terminal/Terminal.tsx
import React, { useState, useEffect, useRef } from 'react';
import './Terminal.css';

interface TerminalOutput {
    id: string;
    timestamp: Date;
    type: 'stdout' | 'stderr' | 'input' | 'system';
    data: string;
}

interface TerminalProps {
    isExpanded: boolean;
    onToggle: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ isExpanded, onToggle }) => {
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [currentCommand, setCurrentCommand] = useState('');
    const [outputs, setOutputs] = useState<TerminalOutput[]>([]);
    const [currentDir, setCurrentDir] = useState('');
    const [gitBranch, setGitBranch] = useState<string | null>(null);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const outputRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        updateDirectoryInfo();
    }, []);

    useEffect(() => {
        // Scroll to bottom when new output is added
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [outputs]);

    const updateDirectoryInfo = async () => {
        const dirResult = await window.electronAPI.terminalGetCurrentDir();
        if (dirResult.success && dirResult.currentDir) {
            setCurrentDir(dirResult.currentDir);
        }

        const branchResult = await window.electronAPI.terminalGetGitBranch();
        if (branchResult.success) {
            setGitBranch(branchResult.gitBranch || null);
        }
    };

    const executeCommand = async (command: string) => {
        if (!command.trim()) return;

        // Store command in history
        setCommandHistory(prev => [...prev, command]);
        setHistoryIndex(-1);

        // Add command to output
        const inputOutput: TerminalOutput = {
            id: Date.now().toString(),
            timestamp: new Date(),
            type: 'input',
            data: `$ ${command}\n`
        };
        setOutputs(prev => [...prev, inputOutput]);

        try {
            const result = await window.electronAPI.terminalExecuteCommand(command);
            if (result.success && result.output) {
                setOutputs(prev => [...prev, ...result.output]);
            } else if (!result.success && result.error) {
                setOutputs(prev => [...prev, {
                    id: Date.now().toString(),
                    timestamp: new Date(),
                    type: 'stderr',
                    data: `Error: ${result.error}\n`
                }]);
            }
        } catch (error) {
            setOutputs(prev => [...prev, {
                id: Date.now().toString(),
                timestamp: new Date(),
                type: 'stderr',
                data: `Error: ${error.message}\n`
            }]);
        }

        // Update directory info after command execution
        await updateDirectoryInfo();
        setCurrentCommand('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            executeCommand(currentCommand);
        } else if (e.key === 'ArrowUp') {
            if (historyIndex < commandHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setCurrentCommand('');
            }
        }
    };

    const clearTerminal = () => {
        setOutputs([]);
        window.electronAPI.terminalClearHistory();
    };

    const getOutputClassName = (type: TerminalOutput['type']) => {
        switch (type) {
            case 'input': return 'terminal-input';
            case 'stdout': return 'terminal-stdout';
            case 'stderr': return 'terminal-stderr';
            case 'system': return 'terminal-system';
            default: return '';
        }
    };

    return (
        <div className={`terminal-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="terminal-header">
                <div className="terminal-title">
                    <span>Terminal</span>
                    {gitBranch && <span className="branch-indicator">{gitBranch}</span>}
                </div>
                <div className="terminal-actions">
                    <button onClick={clearTerminal} title="Clear Terminal">🗑️</button>
                    <button onClick={onToggle} title="Toggle Terminal">
                        {isExpanded ? '▼' : '▲'}
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="terminal-body">
                    <div className="terminal-output" ref={outputRef}>
                        {outputs.map(output => (
                            <div key={output.id} className={getOutputClassName(output.type)}>
                                <pre>{output.data}</pre>
                            </div>
                        ))}
                    </div>
                    <div className="terminal-input-container">
                        <span className="terminal-prompt">
                            {currentDir}
                            {gitBranch && ` (${gitBranch})`}
                            $
                        </span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={currentCommand}
                            onChange={(e) => setCurrentCommand(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="terminal-input-field"
                            spellCheck={false}
                            autoFocus
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Terminal;