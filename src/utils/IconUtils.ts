// src/utils/IconUtils.ts
interface FileIconInfo {
    icon: string;
    cssClass: string;
}

export function getFileIconInfo(filePath: string): FileIconInfo {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';

    // Map of file extensions to Material Icons and CSS classes
    const iconMap: Record<string, FileIconInfo> = {
        // Programming languages
        'java': { icon: 'code', cssClass: 'file-icon-java' },
        'js': { icon: 'javascript', cssClass: 'file-icon-js' },
        'jsx': { icon: 'integration_instructions', cssClass: 'file-icon-jsx' },
        'ts': { icon: 'code', cssClass: 'file-icon-ts' },
        'tsx': { icon: 'integration_instructions', cssClass: 'file-icon-tsx' },
        'html': { icon: 'html', cssClass: 'file-icon-html' },
        'css': { icon: 'css', cssClass: 'file-icon-css' },
        'scss': { icon: 'style', cssClass: 'file-icon-css' },
        'less': { icon: 'style', cssClass: 'file-icon-less' },
        'json': { icon: 'file_json', cssClass: 'file-icon-json' },
        'py': { icon: 'code', cssClass: 'file-icon-py' },
        'rb': { icon: 'code', cssClass: 'file-icon-rb' },
        'php': { icon: 'php', cssClass: 'file-icon-php' },
        'go': { icon: 'code', cssClass: 'file-icon-go' },
        'rs': { icon: 'code', cssClass: 'file-icon-rs' },

        // Documents
        'md': { icon: 'markdown', cssClass: 'file-icon-md' },
        'txt': { icon: 'text_snippet', cssClass: 'file-icon-txt' },
        'pdf': { icon: 'picture_as_pdf', cssClass: 'file-icon-pdf' },
        'doc': { icon: 'description', cssClass: 'file-icon-doc' },
        'docx': { icon: 'description', cssClass: 'file-icon-doc' },

        // Images
        'png': { icon: 'image', cssClass: 'file-icon-img' },
        'jpg': { icon: 'image', cssClass: 'file-icon-img' },
        'jpeg': { icon: 'image', cssClass: 'file-icon-img' },
        'gif': { icon: 'gif', cssClass: 'file-icon-img' },
        'svg': { icon: 'image', cssClass: 'file-icon-svg' },

        // Archives
        'zip': { icon: 'folder_zip', cssClass: 'file-icon-zip' },
        'rar': { icon: 'folder_zip', cssClass: 'file-icon-zip' },
        'tar': { icon: 'folder_zip', cssClass: 'file-icon-zip' },
        'gz': { icon: 'folder_zip', cssClass: 'file-icon-zip' },

        // Config files
        'gitignore': { icon: 'hide_source', cssClass: 'file-icon-git' },
        'env': { icon: 'key', cssClass: 'file-icon-env' },
        'yml': { icon: 'settings', cssClass: 'file-icon-yml' },
        'yaml': { icon: 'settings', cssClass: 'file-icon-yml' },
    };

    return iconMap[extension] || { icon: 'description', cssClass: '' }; // Default icon
}

// For directories
export function getDirectoryIcon(isExpanded: boolean): string {
    return isExpanded ? 'folder_open' : 'folder';
}