// src/components/AppInit/AppInit.tsx
import React, { useState } from 'react';
import '../../styles/AppInit.css';

interface AppInitProps {
    onComplete: () => void;
}

const AppInit: React.FC<AppInitProps> = ({ onComplete }) => {
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    // Simulate loading process
    React.useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setLoading(false);
                    setTimeout(() => {
                        onComplete();
                    }, 500);
                    return 100;
                }
                return prev + 10;
            });
        }, 300);

        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <div className="app-init-container">
            <div className="app-init-content">
                <h1>Front Qode</h1>
                <p>Starting up your cross-platform code editor</p>

                <div className="progress-container">
                    <div
                        className="progress-bar"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <p className="status-text">
                    {loading ? `Loading... ${progress}%` : "Ready to launch!"}
                </p>
            </div>
        </div>
    );
};

export default AppInit;