// src/utils/FileExplorerUtils.ts

export interface FileTreeItem {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileTreeItem[];
    expanded?: boolean;
}

// Default expanded state for directories
export const defaultExpandedState = (item: FileTreeItem): boolean => {
    // Root folder is expanded by default
    if (item.path === item.name) {
        return true;
    }

    const itemName = item.name.toLowerCase();

    // Directories that should be collapsed by default
    const collapsedFolders: Record<string, string[]> = {
        // Java
        "java": ["target", "bin", "build", ".gradle", ".mvn", "out", "classes", ".settings", ".classpath", ".project", ".idea", "logs"],
        // Rust
        "rust": ["target", "debug", ".cargo", ".idea", ".vscode", "bin", "pkg", "web", "pkg-web"],
        // Ruby
        "ruby": ["vendor", ".bundle", "coverage", "tmp", "log", ".gems", ".rbenv", ".ruby-version", ".sass-cache", "db", "public/system", "public/assets", "public/uploads"],
        // C/C++
        "c": ["bin", "build", "lib", "obj", "Debug", "Release", "ipch", "cmake-build-*", ".vs", ".vscode", "CMakeFiles"],
        "cpp": ["bin", "build", "lib", "obj", "Debug", "Release", "ipch", "cmake-build-*", ".vs", ".vscode", "CMakeFiles"],
        // Kotlin
        "kotlin": ["build", ".gradle", "out", "classes", ".kotlin", ".idea", "captures", ".navigation", ".externalNativeBuild", ".cxx", "freeline"],
        // Python
        "python": ["__pycache__", "venv", ".venv", "env", "ENV", "env.bak", ".pytest_cache", ".tox", "htmlcov", ".hypothesis", ".eggs", "dist", "build", "develop-eggs", "downloads", "eggs", ".eggs", "lib", "lib64", "parts", "sdist", "var", "wheels", ".mypy_cache", ".pyre", "instance", ".webassets-cache"],
        // JavaScript/TypeScript
        "javascript": ["node_modules", "bower_components", ".npm", ".next", ".nuxt", "dist", "coverage", ".cache", ".parcel-cache", ".serverless", ".fusebox", ".dynamodb", ".yarn"],
        "typescript": ["node_modules", "bower_components", ".npm", ".next", ".nuxt", "dist", "coverage", ".cache", ".parcel-cache", ".serverless", ".fusebox", ".dynamodb", ".yarn"],
        // Go
        "go": ["bin", "pkg", "vendor", ".glide", ".idea", ".vscode", "obj", "test"],
        // Swift
        "swift": [".build", "build", "DerivedData", "xcuserdata", ".swiftpm", "fastlane"],
        // PHP
        "php": ["vendor", ".idea", ".vscode", "cache", "nbproject", "logs", "wp-content/uploads", "wp-content/upgrade", "wp-content/cache", "storage", "bootstrap/cache"],
        // Dart/Flutter
        "dart": [".dart_tool", ".pub", "build", ".android", ".ios", ".idea", ".vscode", "coverage", ".symbols"],
        "flutter": [".dart_tool", ".pub", "build", ".android", ".ios", ".idea", ".vscode", "coverage", ".symbols"],
        // Elixir
        "elixir": ["build", "deps", ".elixirls", "cover", "priv/static/assets", "tmp", ".mix"],
        // Scala
        "scala": ["target", "project/project", "project/target", ".idea", ".bsp", ".history", ".cache", ".lib", ".bloop", ".metals", "project/.bloop", ".vscode", ".ensime_cache"],
        // Clojure
        "clojure": ["target", "classes", "checkouts", ".cpcache", ".shadow-cljs", ".clj-kondo", ".clerk"],
        // R
        "r": [".Rproj.user", "packrat/lib*", "packrat/src", "renv", "rsconnect"],
        // Haskell
        "haskell": ["dist", "dist-newstyle", ".stack-work", ".HTF", ".hpc", ".cabal-sandbox", ".hsenv", ".stack-work", ".hie"],
        // Common/General - applies to all projects
        "common": [".webpack","out", ".git", "logs", ".idea", ".vscode", ".vs", ".vagrant", ".pytest_cache", "coverage", ".nyc_output", "tmp", "temp"]
    };

    // Check if directory should be collapsed by default
    const commonFolders = collapsedFolders["common"];

    // Check if directory name is in the common collapsed folders
    if (commonFolders.includes(itemName)) {
        return false;
    }

    // Check all language-specific folders
    for (const language in collapsedFolders) {
        if (language !== "common") {
            if (collapsedFolders[language].includes(itemName)) {
                return false;
            }
        }
    }

    // By default, most folders should be expanded
    return true;
};

export const updateExpandedState = (tree: FileTreeItem[], itemPath: string): FileTreeItem[] => {
    return tree.map(item => {
        if (item.path === itemPath) {
            // Toggle the expanded state of this item
            return {
                ...item,
                expanded: item.expanded === undefined ? false : !item.expanded
            };
        } else if (item.children && item.children.length > 0) {
            // Recursively update children
            return {
                ...item,
                children: updateExpandedState(item.children, itemPath)
            };
        }
        return item;
    });
};

export const processFileTree = (tree: FileTreeItem[]): FileTreeItem[] => {
    return tree.map(item => {
        if (item.isDirectory) {
            // Set the expanded state based on our rules
            const expanded = defaultExpandedState(item);

            // Process children recursively if they exist
            const children = item.children ? processFileTree(item.children) : [];

            return {
                ...item,
                expanded,
                children
            };
        }
        return item;
    });
};

// Function to determine if a path should be ignored
