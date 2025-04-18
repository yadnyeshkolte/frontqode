// src/utils/appPaths.ts
import * as path from 'path';
import { app } from 'electron';

export function getAppDataPath(): string {
    return app.getPath('userData');
}

export function getProjectsPath(): string {
    return path.join(getAppDataPath(), 'projects');
}

export function getExtensionsPath(): string {
    return path.join(getAppDataPath(), 'extensions');
}

export function getLanguageServersPath(): string {
    return path.join(getAppDataPath(), 'language-servers');
}