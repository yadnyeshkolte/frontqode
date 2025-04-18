// src/components/Settings/LSPManager.tsx
import React, { useState, useEffect } from 'react';
import '../../styles/LSPManager.css';

interface LSPManagerProps {
    onClose: () => void;
}

interface LanguageServer {
    id: string;
    name: string;
    description: string;
    installed: boolean;
    installing: boolean;
}

const LSPManager: React.FC<LSPManagerProps> = ({ onClose }) => {
    const [servers, setServers] = useState<LanguageServer[]>([
        {
            id: 'typescript',
            name: 'TypeScript/JavaScript',
            description: 'Language server for TypeScript and JavaScript (typescript-language-server)',
            installed: false,
            installing: false
        },
        {
            id: 'html',
            name: 'HTML',
            description: 'Language server for HTML (vscode-html-languageserver)',
            installed: false,
            installing: false
        },
        {
            id: 'css',
            name: 'CSS',
            description: 'Language server for CSS (vscode-css-languageserver)',
            installed: false,
            installing: false
        },
        {
            id: 'json',
            name: 'JSON',
            description: 'Language server for JSON (vscode-json-languageserver)',
            installed: false,
            installing: false
        },
        {
            id: 'python',
            name: 'Python',
            description: 'Language server for Python (python-language-server)',
            installed: false,
            installing: false
        }
    ]);

    useEffect(() => {
        // Check which servers are installed
        const checkInstalledServers = async () => {
            const updatedServers = [...servers];

            for (let i = 0; i < updatedServers.length; i++) {
                const server = updatedServers[i];
                try {
                    // This is a placeholder. In a real app, you'd check if the server is actually installed
                    const serverInfo = await window.electronAPI.getLSPServerInfo(server.id);
                    updatedServers[i].installed = serverInfo.success;
                } catch (error) {
                    console.error(`Error checking server ${server.id}:`, error);
                }
            }

            setServers(updatedServers);
        };

        checkInstalledServers();
    }, []);

    const installServer = async (serverId: string) => {
        // Update server state to installing
        setServers(servers.map(server =>
            server.id === serverId ? { ...server, installing: true } : server
        ));

        try {
            const result = await window.electronAPI.installLSPServer(serverId);

            // Update server state after installation attempt
            setServers(servers.map(server =>
                server.id === serverId
                    ? { ...server, installing: false, installed: result.success }
                    : server
            ));
        } catch (error) {
            console.error(`Error installing server ${serverId}:`, error);

            // Update server state on error
            setServers(servers.map(server =>
                server.id === serverId ? { ...server, installing: false } : server
            ));
        }
    };

    return (
        <div className="lsp-manager">
            <div className="lsp-manager-header">
                <h2>Language Server Manager</h2>
                <button className="close-button" onClick={onClose}>×</button>
            </div>
            <div className="lsp-manager-content">
                <p>Install language servers to enable code intelligence features like auto-completion, diagnostics, and hover information.</p>

                <div className="server-list">
                    {servers.map(server => (
                        <div key={server.id} className="server-item">
                            <div className="server-info">
                                <h3>{server.name}</h3>
                                <p>{server.description}</p>
                            </div>
                            <div className="server-actions">
                                {server.installed ? (
                                    <div className="server-status installed">Installed</div>
                                ) : server.installing ? (
                                    <div className="server-status installing">Installing...</div>
                                ) : (
                                    <button
                                        className="install-button"
                                        onClick={() => installServer(server.id)}
                                    >
                                        Install
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LSPManager;