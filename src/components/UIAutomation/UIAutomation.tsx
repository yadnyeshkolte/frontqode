// src/components/UIAutomation/UIAutomation.tsx
import React, { useState, useEffect, useRef } from 'react';
import './UIAutomation.css';

interface UIAutomationProps {
    isOpen: boolean;
    onClose: () => void;
    projectPath: string;
}

interface RecordedAction {
    type: 'click' | 'type' | 'wait' | 'navigate';
    timestamp: number;
    selector?: string;
    value?: string;
    url?: string;
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
    const [recordedActions, setRecordedActions] = useState<RecordedAction[]>([]);
    const [recordingData, setRecordingData] = useState<string>('');

    const logsEndRef = useRef<HTMLDivElement>(null);

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

    // Auto-scroll logs to bottom when new logs are added
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

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

                if (isRecording) {
                    addRecordedAction({
                        type: 'navigate',
                        timestamp: Date.now(),
                        url
                    });
                }
            } else {
                addLog(`Failed to launch browser: ${result.error}`);
            }
        } catch (error) {
            addLog(`Error launching browser: ${error}`);
        }
    };

    // Normalize selector
    const normalizeSelector = (selectorInput: string): string => {
        // Handle CSS selectors or specific format needed for desktop-use
        if (selectorInput.startsWith('#')) {
            // For ID selectors, make sure they're correctly formatted
            return selectorInput;
        } else if (selectorInput.startsWith('.')) {
            // For class selectors
            return selectorInput;
        } else if (selectorInput.includes('=')) {
            // For attribute selectors, already in correct format
            return selectorInput;
        } else {
            // Default to CSS selector
            return selectorInput;
        }
    };

    // Click element
    const handleClick = async () => {
        try {
            if (!selector) {
                addLog('Please enter a selector');
                return;
            }

            const normalizedSelector = normalizeSelector(selector);
            addLog(`Using normalized selector: ${normalizedSelector}`);

            const result = await window.electronAPI.uiAutomationClick(normalizedSelector);
            if (result.success) {
                addLog(`Clicked element with selector: ${normalizedSelector}`);

                if (isRecording) {
                    addRecordedAction({
                        type: 'click',
                        timestamp: Date.now(),
                        selector: normalizedSelector
                    });
                }
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

            const normalizedSelector = normalizeSelector(selector);
            addLog(`Using normalized selector: ${normalizedSelector}`);

            const result = await window.electronAPI.uiAutomationType(normalizedSelector, text);
            if (result.success) {
                addLog(`Typed "${text}" into element with selector: ${normalizedSelector}`);

                if (isRecording) {
                    addRecordedAction({
                        type: 'type',
                        timestamp: Date.now(),
                        selector: normalizedSelector,
                        value: text
                    });
                }
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

            const normalizedSelector = normalizeSelector(selector);
            addLog(`Waiting for element with selector: ${normalizedSelector}`);

            const result = await window.electronAPI.uiAutomationWaitForElement(normalizedSelector, 5000);
            if (result.success) {
                addLog(`Element found: ${normalizedSelector}`);

                if (isRecording) {
                    addRecordedAction({
                        type: 'wait',
                        timestamp: Date.now(),
                        selector: normalizedSelector
                    });
                }
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

    // Add a recorded action
    const addRecordedAction = (action: RecordedAction) => {
        setRecordedActions(prev => [...prev, action]);
    };

    // Toggle recording
    const handleToggleRecording = () => {
        if (!isRecording) {
            // Start recording
            setRecordedActions([]);
            addLog('Recording started');
        } else {
            // Stop recording and process the recorded actions
            addLog('Recording stopped');
            processRecordedActions();
        }
        setIsRecording(!isRecording);
    };

    // Process recorded actions to create a viewable log
    const processRecordedActions = () => {
        let formattedData = "Recorded Actions:\n\n";

        recordedActions.forEach((action, index) => {
            const time = new Date(action.timestamp).toLocaleTimeString();

            switch (action.type) {
                case 'navigate':
                    formattedData += `${index + 1}. [${time}] Navigate to: ${action.url}\n`;
                    break;
                case 'click':
                    formattedData += `${index + 1}. [${time}] Click on: ${action.selector}\n`;
                    break;
                case 'type':
                    formattedData += `${index + 1}. [${time}] Type "${action.value}" into: ${action.selector}\n`;
                    break;
                case 'wait':
                    formattedData += `${index + 1}. [${time}] Wait for element: ${action.selector}\n`;
                    break;
            }
        });

        setRecordingData(formattedData);
    };

    // Generate automation script
    const handleGenerateScript = () => {
        // Base script with imports and setup
        const scriptLines = [
            'import { DesktopUseClient } from \'desktop-use\';',
            '',
            'async function runAutomation() {',
            '    try {',
            `        // Connect to Terminator server`,
            `        const client = new DesktopUseClient('${hostPort}');`,
            `        console.log('Connected to Terminator server');`,
            ''
        ];

        // If we have recorded actions, use them to generate the script
        if (recordedActions.length > 0) {
            recordedActions.forEach(action => {
                switch (action.type) {
                    case 'navigate':
                        scriptLines.push(`        // Navigate to URL`);
                        scriptLines.push(`        console.log('Opening URL: ${action.url}');`);
                        scriptLines.push(`        await client.openUrl('${action.url}');`);
                        scriptLines.push(`        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for page to load`);
                        scriptLines.push('');
                        break;
                    case 'click':
                        scriptLines.push(`        // Click element`);
                        scriptLines.push(`        console.log('Clicking element: ${action.selector}');`);
                        scriptLines.push(`        const element${scriptLines.length} = client.locator('${action.selector}');`);
                        scriptLines.push(`        await element${scriptLines.length - 1}.click();`);
                        scriptLines.push('');
                        break;
                    case 'type':
                        scriptLines.push(`        // Type text`);
                        scriptLines.push(`        console.log('Typing text into element: ${action.selector}');`);
                        scriptLines.push(`        const inputElement${scriptLines.length} = client.locator('${action.selector}');`);
                        scriptLines.push(`        await inputElement${scriptLines.length - 1}.typeText('${action.value}');`);
                        scriptLines.push('');
                        break;
                    case 'wait':
                        scriptLines.push(`        // Wait for element`);
                        scriptLines.push(`        console.log('Waiting for element: ${action.selector}');`);
                        scriptLines.push(`        const waitElement${scriptLines.length} = client.locator('${action.selector}');`);
                        scriptLines.push(`        await waitElement${scriptLines.length - 1}.expectVisible({ timeout: 5000 });`);
                        scriptLines.push('');
                        break;
                }
            });
        } else {
            // Default script if no recording
            scriptLines.push(`        // Launch browser`);
            scriptLines.push(`        console.log('Opening URL: ${url}');`);
            scriptLines.push(`        await client.openUrl('${url}');`);
            scriptLines.push(`        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for page to load`);
            scriptLines.push('');

            if (selector) {
                scriptLines.push(`        // Click on target button`);
                scriptLines.push(`        console.log('Looking for button: ${selector}');`);
                scriptLines.push(`        const button = client.locator('${selector}');`);
                scriptLines.push(`        await button.expectVisible({ timeout: 5000 });`);
                scriptLines.push(`        console.log('Button found!');`);
                scriptLines.push(`        await button.click();`);
                scriptLines.push(`        console.log('Button clicked successfully');`);
                scriptLines.push('');
            } else {
                scriptLines.push(`        // Example: find and click a button with id="countnumber"`);
                scriptLines.push(`        console.log('Looking for button with id "countnumber"');`);
                scriptLines.push(`        const button = client.locator('#countnumber');`);
                scriptLines.push(`        await button.expectVisible({ timeout: 5000 });`);
                scriptLines.push(`        console.log('Button found!');`);
                scriptLines.push(`        await button.click();`);
                scriptLines.push(`        console.log('Button clicked successfully');`);
                scriptLines.push('');
            }

            scriptLines.push(`        // Try to get analytics data if available`);
            scriptLines.push(`        try {`);
            scriptLines.push(`            const analyticsElement = client.locator('.analytics-data');`);
            scriptLines.push(`            const analyticsText = await analyticsElement.getText();`);
            scriptLines.push(`            console.log('Analytics data:', analyticsText);`);
            scriptLines.push(`        } catch (e) {`);
            scriptLines.push(`            console.log('Analytics element not found or accessible');`);
            scriptLines.push(`        }`);
        }

        // Close the script
        scriptLines.push('    } catch (error) {');
        scriptLines.push('        console.error(\'Automation error:\', error);');
        scriptLines.push('    }');
        scriptLines.push('}');
        scriptLines.push('');
        scriptLines.push('runAutomation();');

        const script = scriptLines.join('\n');
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

    // Save recording data
    const handleSaveRecording = async () => {
        try {
            if (!recordingData) {
                addLog('No recording data to save');
                return;
            }

            const recordingPath = `${projectPath}/ui-automation-recording.txt`;
            const result = await window.electronAPI.writeFile(recordingPath, recordingData);

            if (result.success) {
                addLog(`Recording data saved to: ${recordingPath}`);
            } else {
                addLog(`Failed to save recording data: ${result.error}`);
            }
        } catch (error) {
            addLog(`Error saving recording data: ${error}`);
        }
    };

    // Load a preset test script for the countnumber button
    const handleLoadCounterScript = () => {
        const counterScript = `
import { DesktopUseClient } from 'desktop-use';

async function runAutomation() {
    try {
        // Connect to Terminator server
        const client = new DesktopUseClient('${hostPort}');
        console.log('Connected to Terminator server');
        
        // Launch browser with test site
        console.log('Opening URL: ${url}');
        await client.openUrl('${url}');
        
        // Wait for page to load
        console.log('Waiting for page to load...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Find and click the counter button
        console.log('Looking for button with id "countnumber"...');
        const counterButton = client.locator('#countnumber');
        
        try {
            await counterButton.expectVisible({ timeout: 5000 });
            console.log('Counter button found!');
            
            // Click the button
            console.log('Clicking counter button...');
            await counterButton.click();
            console.log('Counter button clicked successfully');
            
            // Wait to see results
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Click it a few more times
            for (let i = 0; i < 3; i++) {
                console.log(\`Clicking counter button (3)...\`);
                await counterButton.click();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Try to get counter value or analytics if available
            try {
                // First try to find a counter value element
                const counterValueElement = client.locator('.counter-value, #counter-value, .value, #value');
                const counterValue = await counterValueElement.getText();
                console.log('Counter value:', counterValue);
            } catch (e) {
                console.log('Counter value element not found');
            }
            
            // Try to find analytics data
            try {
                const analyticsElement = client.locator('.analytics-data, #analytics, .analytics');
                const analyticsText = await analyticsElement.getText();
                console.log('Analytics data:', analyticsText);
            } catch (e) {
                console.log('Analytics element not found');
            }
            
        } catch (error) {
            console.error('Counter button not found:', error);
        }
        
    } catch (error) {
        console.error('Automation error:', error);
    }
}

runAutomation();`.trim();

        setAutomationScript(counterScript);
        setSelector('#countnumber');
        addLog('Loaded counter button test script');
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
                            <div className="warning-icon-container">
                                <span className="material-icons warning-icon">warning</span>
                            </div>
                            <h3>Platform Not Supported</h3>
                            <p className="platform-message">UI Automation is currently only supported on Windows.</p>
                            <p className="platform-info">Detected platform: <span className="platform-highlight">{platform}</span></p>
                            <div className="platform-footer">
                                <button className="close-unsupported" onClick={onClose}>Close</button>
                            </div>
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
                                    placeholder="Element Selector (e.g., #countnumber)"
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
                                    onClick={handleLoadCounterScript}
                                    disabled={!connected}
                                >
                                    Load Counter Script
                                </button>
                            </div>
                            <div className="ui-automation-row">
                                <button
                                    onClick={handleSaveScript}
                                    disabled={!automationScript}
                                >
                                    Save Script
                                </button>
                                {recordedActions.length > 0 && (
                                    <button
                                        onClick={handleSaveRecording}
                                        disabled={!recordingData}
                                    >
                                        Save Recording
                                    </button>
                                )}
                            </div>
                        </div>

                        {recordingData && (
                            <div className="ui-automation-section">
                                <h3>Recording Data</h3>
                                <pre className="script-preview">{recordingData}</pre>
                            </div>
                        )}

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
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UIAutomation;