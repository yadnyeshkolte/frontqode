// src/components/Settings/LSPManager.tsx
import React, { useState, useEffect } from 'react';
import './styles/LSPManager.css';

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
    const [servers, setServers] = useState<LanguageServer[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // Get available servers and their installation status
        const fetchServers = async () => {
            try {
                setIsLoading(true);
                const availableServers = await window.electronAPI.getAvailableLanguageServers();

                if (availableServers.success) {
                    setServers(availableServers.servers.map((server: any) => ({
                        ...server,
                        installing: false
                    })));
                } else {
                    console.error('Failed to fetch language servers:', availableServers.error);
                }
            } catch (error) {
                console.error('Error fetching language servers:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchServers().then(() => {
            //will add later
        });
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

            // Show notification
            if (result.success) {
                // In a real app, you might want to use a toast notification system
                console.log(`Successfully installed ${serverId} language server`);
            } else {
                console.error(`Failed to install ${serverId} language server`);
            }
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

                {isLoading ? (
                    <div className="loading">Loading servers...</div>
                ) : (
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
                )}
            </div>
        </div>
    );
};

export default LSPManager;