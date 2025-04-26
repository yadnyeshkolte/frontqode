// src/components/UIAutomation/UIAutomation.tsx
import React, { useState, useEffect } from 'react';
import './UIAutomation.css';

interface UIAutomationProps {
    isOpen: boolean;
    onClose: () => void;
    projectPath: string;
}

const UIAutomation: React.FC<UIAutomationProps> = ({ isOpen, onClose, projectPath }) => {
    const [connected, setConnected] = useState<boolean>(false);
    const [hostPort, setHostPort] = useState<string>('127.0.0.1:3000');
    const [url, setUrl] = useState<string>('http://localhost:3000');
    const [selector, setSelector] = useState<string>('');
    const [text, setText] = useState<string>('');
    const [logs, setLogs] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [automationScript, setAutomationScript] = useState<string>('');
    const [platform, setPlatform] = useState<string>('');
    const [isWindowsOS, setIsWindowsOS] = useState<boolean>(true);

    // Detect operating system on component mount
    useEffect(() => {
        const detectOS = async () => {
            try {
                // Assume we have an electronAPI method to get the platform
                const osInfo = await window.electronAPI.getPlatform();
                setPlatform(osInfo.platform);

                // Check if the platform is Windows
                setIsWindowsOS(osInfo.platform === 'win32');

                if (osInfo.platform !== 'win32') {
                    addLog(`UI Automation is currently only supported on Windows.`);
                }
            } catch (error) {
                console.error('Error detecting OS:', error);
                // Fallback detection using navigator.platform (less reliable)
                const navPlatform = navigator.platform.toLowerCase();
                const isWindows = navPlatform.includes('win');
                setPlatform(navPlatform);
                setIsWindowsOS(isWindows);

                if (!isWindows) {
                    addLog(`UI Automation is currently only supported on Windows.`);
                }
            }
        };

        detectOS();
    }, []);

    // Connect to Terminator server
    const handleConnect = async () => {
        try {
            const result = await window.electronAPI.uiAutomationConnect(hostPort);
            if (result.success) {
                setConnected(true);
                addLog('Connected to Terminator server');
            } else {
                addLog(`Connection failed: ${result.error}`);
            }
        } catch (error) {
            addLog(`Error connecting: ${error}`);
        }
    };

    // Launch browser with URL
    const handleLaunchBrowser = async () => {
        try {
            const result = await window.electronAPI.uiAutomationLaunchBrowser(url);
            if (result.success) {
                addLog(`Launched browser with URL: ${url}`);
            } else {
                addLog(`Failed to launch browser: ${result.error}`);
            }
        } catch (error) {
            addLog(`Error launching browser: ${error}`);
        }
    };

    // Click element
    const handleClick = async () => {
        try {
            if (!selector) {
                addLog('Please enter a selector');
                return;
            }
            const result = await window.electronAPI.uiAutomationClick(selector);
            if (result.success) {
                addLog(`Clicked element with selector: ${selector}`);
            } else {
                addLog(`Failed to click element: ${result.error}`);
            }
        } catch (error) {
            addLog(`Error clicking element: ${error}`);
        }
    };

    // Type text
    const handleType = async () => {
        try {
            if (!selector) {
                addLog('Please enter a selector');
                return;
            }
            if (!text) {
                addLog('Please enter text to type');
                return;
            }
            const result = await window.electronAPI.uiAutomationType(selector, text);
            if (result.success) {
                addLog(`Typed "${text}" into element with selector: ${selector}`);
            } else {
                addLog(`Failed to type text: ${result.error}`);
            }
        } catch (error) {
            addLog(`Error typing text: ${error}`);
        }
    };

    // Wait for element
    const handleWaitForElement = async () => {
        try {
            if (!selector) {
                addLog('Please enter a selector');
                return;
            }
            addLog(`Waiting for element with selector: ${selector}`);
            const result = await window.electronAPI.uiAutomationWaitForElement(selector, 5000);
            if (result.success) {
                addLog(`Element found: ${selector}`);
            } else {
                addLog(`Element not found: ${result.error}`);
            }
        } catch (error) {
            addLog(`Error waiting for element: ${error}`);
        }
    };

    // Add a log message
    const addLog = (message: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    // Toggle recording
    const handleToggleRecording = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            addLog('Recording started');
        } else {
            addLog('Recording stopped');
        }
    };

    // Generate automation script
    const handleGenerateScript = () => {
        const script = `
import { DesktopUseClient } from 'desktop-use';

async function runAutomation() {
    try {
        const client = new DesktopUseClient('${hostPort}');
        
        // Launch browser
        console.log('Opening URL: ${url}');
        await client.openUrl('${url}');
        
        // Wait for page to load (adjust time as needed)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Add your automation steps here
        // Example:
        // const loginButton = client.locator('button:Login');
        // await loginButton.click();
        
    } catch (error) {
        console.error('Automation error:', error);
    }
}

runAutomation();
        `.trim();

        setAutomationScript(script);
        addLog('Generated automation script');
    };

    // Save automation script
    const handleSaveScript = async () => {
        try {
            if (!automationScript) {
                addLog('No script to save');
                return;
            }

            const scriptPath = `${projectPath}/ui-automation-script.ts`;
            const result = await window.electronAPI.writeFile(scriptPath, automationScript);

            if (result.success) {
                addLog(`Script saved to: ${scriptPath}`);
            } else {
                addLog(`Failed to save script: ${result.error}`);
            }
        } catch (error) {
            addLog(`Error saving script: ${error}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="ui-automation-container">
            <div className="ui-automation-header">
                <h2>UI Automation</h2>
                <button onClick={onClose} className="close-button">×</button>
            </div>

            <div className="ui-automation-content">
                {!isWindowsOS ? (
                    <div className="ui-automation-unsupported">
                        <div className="unsupported-message">
                            <span className="material-icons warning-icon">warning</span>
                            <h3>Platform Not Supported</h3>
                            <p>UI Automation is currently only supported on Windows.</p>
                            <p>Detected platform: {platform}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="ui-automation-section">
                            <h3>Connection</h3>
                            <div className="ui-automation-row">
                                <input
                                    type="text"
                                    value={hostPort}
                                    onChange={(e) => setHostPort(e.target.value)}
                                    placeholder="Host:Port"
                                />
                                <button
                                    onClick={handleConnect}
                                    disabled={connected}
                                >
                                    {connected ? 'Connected' : 'Connect'}
                                </button>
                            </div>
                        </div>

                        <div className="ui-automation-section">
                            <h3>Browser</h3>
                            <div className="ui-automation-row">
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="URL"
                                />
                                <button
                                    onClick={handleLaunchBrowser}
                                    disabled={!connected}
                                >
                                    Launch
                                </button>
                            </div>
                        </div>

                        <div className="ui-automation-section">
                            <h3>Element Interaction</h3>
                            <div className="ui-automation-row">
                                <input
                                    type="text"
                                    value={selector}
                                    onChange={(e) => setSelector(e.target.value)}
                                    placeholder="Element Selector"
                                />
                            </div>
                            <div className="ui-automation-row">
                                <button
                                    onClick={handleClick}
                                    disabled={!connected || !selector}
                                >
                                    Click
                                </button>
                                <button
                                    onClick={handleWaitForElement}
                                    disabled={!connected || !selector}
                                >
                                    Wait For
                                </button>
                            </div>
                            <div className="ui-automation-row">
                                <input
                                    type="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Text to Type"
                                />
                                <button
                                    onClick={handleType}
                                    disabled={!connected || !selector || !text}
                                >
                                    Type
                                </button>
                            </div>
                        </div>

                        <div className="ui-automation-section">
                            <h3>Recording & Scripting</h3>
                            <div className="ui-automation-row">
                                <button
                                    onClick={handleToggleRecording}
                                    disabled={!connected}
                                    className={isRecording ? 'recording' : ''}
                                >
                                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                                </button>
                                <button
                                    onClick={handleGenerateScript}
                                    disabled={!connected}
                                >
                                    Generate Script
                                </button>
                                <button
                                    onClick={handleSaveScript}
                                    disabled={!automationScript}
                                >
                                    Save Script
                                </button>
                            </div>
                        </div>

                        {automationScript && (
                            <div className="ui-automation-section">
                                <h3>Generated Script</h3>
                                <pre className="script-preview">{automationScript}</pre>
                            </div>
                        )}
                    </>
                )}

                <div className="ui-automation-section">
                    <h3>Logs</h3>
                    <div className="logs-container">
                        {logs.map((log, index) => (
                            <div key={index} className="log-entry">{log}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
//screenpipe
export default UIAutomation;