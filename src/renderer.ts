// src/renderer.ts
import './index.css';
import './styles/App.css';
import './styles/AppInit.css';
import './styles/AppStarter.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import AppInit from './components/AppInit/AppInit';
import AppStarter from './components/AppStarter/AppStarter';
import App from './components/App/App';

// First check if our renderer is loading at all
console.log('👋 Front Qode IDE renderer is loading');

// Get the root element
const container = document.getElementById('root');

if (container) {
    const root = createRoot(container);

    // Flow: AppInit -> AppStarter -> App
    const handleInitComplete = () => {
        // Render the starter screen when initialization is complete
        root.render(React.createElement(AppStarter, { onNewProject: handleNewProject }));
    };

    const handleNewProject = () => {
        // Render the main app when "New Project" is clicked
        root.render(React.createElement(App));
    };

    // Render the initialization component first
    root.render(React.createElement(AppInit, { onComplete: handleInitComplete }));
}