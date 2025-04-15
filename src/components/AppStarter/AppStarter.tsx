// src/components/AppStarter/AppStarter.tsx
import React from 'react';
import '../../styles/AppStarter.css';

interface AppStarterProps {
    onNewProject: () => void;
}

const AppStarter: React.FC<AppStarterProps> = ({ onNewProject }) => {
    return (
        <div className="app-starter-container">
            <div className="app-starter-content">
                <h1>Front Qode IDE</h1>
                <p>Choose an option to get started</p>

                <div className="starter-options">
                    <button className="starter-button" onClick={onNewProject}>
                        <span className="starter-button-icon">+</span>
                        New Project
                    </button>

                    <button className="starter-button starter-button-disabled">
                        <span className="starter-button-icon">⚙️</span>
                        Customize
                    </button>

                    <button className="starter-button starter-button-disabled">
                        <span className="starter-button-icon">📂</span>
                        Open Project
                    </button>

                    <button className="starter-button starter-button-disabled">
                        <span className="starter-button-icon">📥</span>
                        Clone Repository
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppStarter;