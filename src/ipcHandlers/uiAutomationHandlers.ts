// src/ipcHandlers/uiAutomationHandlers.ts
import { ipcMain } from 'electron';
import { DesktopUseClient } from 'desktop-use';
import os from 'os';

let client: any = null;

export const setupUIAutomationHandlers = () => {

    // Get platform information
    ipcMain.handle('get-platform-info', async () => {
        try {
            return {
                platform: process.platform,  // 'win32', 'darwin', 'linux', etc.
                osName: os.type(),           // 'Windows_NT', 'Darwin', 'Linux', etc.
                version: os.release()        // OS version string
            };
        } catch (error) {
            console.error('Failed to get platform info:', error);
            return { platform: 'unknown', osName: 'Unknown', version: 'unknown' };
        }
    });

    // Initialize the client
    ipcMain.handle('ui-automation-connect', async (_, hostPort = '127.0.0.1:3000') => {
        try {
            client = new DesktopUseClient(hostPort);
            return { success: true };
        } catch (error) {
            console.error('Failed to connect to Terminator server:', error);
            return { success: false, error: error.message };
        }
    });

    // Launch browser with URL
    ipcMain.handle('ui-automation-launch-browser', async (_, url: string) => {
        try {
            if (!client) return { success: false, error: 'Client not initialized' };
            await client.openUrl(url);
            return { success: true };
        } catch (error) {
            console.error('Failed to launch browser:', error);
            return { success: false, error: error.message };
        }
    });

    // Click element
    ipcMain.handle('ui-automation-click', async (_, selector: string) => {
        try {
            if (!client) return { success: false, error: 'Client not initialized' };
            const element = client.locator(selector);
            await element.click();
            return { success: true };
        } catch (error) {
            console.error('Failed to click element:', error);
            return { success: false, error: error.message };
        }
    });

    // Type text
    ipcMain.handle('ui-automation-type', async (_, selector: string, text: string) => {
        try {
            if (!client) return { success: false, error: 'Client not initialized' };
            const element = client.locator(selector);
            await element.typeText(text);
            return { success: true };
        } catch (error) {
            console.error('Failed to type text:', error);
            return { success: false, error: error.message };
        }
    });

    // Wait for element to appear
    ipcMain.handle('ui-automation-wait-for-element', async (_, selector: string, timeout = 5000) => {
        try {
            if (!client) return { success: false, error: 'Client not initialized' };
            const element = client.locator(selector);
            await element.expectVisible({ timeout });
            return { success: true };
        } catch (error) {
            console.error('Failed to wait for element:', error);
            return { success: false, error: error.message };
        }
    });
};

//App.tsx, App.css
//UI Automation handers, component, services
//electrond.ts, index.ts, preload.ts
