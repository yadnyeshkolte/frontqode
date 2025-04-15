// src/components/App/App.tsx
import React from 'react';
import '../../styles/App.css';

const App: React.FC = () => {
    return (
        <div className="app-container">
            <div className="app-header">
                <h1>Front Qode IDE</h1>
            </div>
            <div className="app-content">z
                <div className="sidebar">
                    <div className="sidebar-header">Explorer</div>
                    <div className="sidebar-content">
                        <ul className="file-tree">
                            <li>src/</li>
                            <li>&nbsp;&nbsp;- index.ts</li>
                            <li>&nbsp;&nbsp;- components/</li>
                            <li>&nbsp;&nbsp;&nbsp;&nbsp;- App/</li>
                            <li>&nbsp;&nbsp;&nbsp;&nbsp;- AppInit/</li>
                        </ul>
                    </div>
                </div>
                <div className="editor">
                    <div className="editor-tabs">
                        <div className="tab active">index.ts</div>
                        <div className="tab">App.tsx</div>
                    </div>
                    <div className="editor-content">
        <pre>// Welcome to Front Qode IDE Yadnyesh
// Start coding here...</pre>
                    </div>
                </div>
            </div>
            <div className="status-bar">
                <div>Ready</div>
                <div>UTF-8</div>
                <div>TypeScript</div>
            </div>
        </div>
    );
};

export default App;