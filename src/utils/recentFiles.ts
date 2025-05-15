import { BaseDirectory, mkdir, readTextFile, writeFile, exists } from '@tauri-apps/plugin-fs';

export interface RecentFile {
    path: string;
    filename: string;
    lastAccess: number;
}

const MAX_RECENT_FILES = 100;
const RECENT_FILES_PATH = 'recent-files.json';

export async function getRecentFiles(): Promise<RecentFile[]> {
    try {
        const content = await readTextFile(RECENT_FILES_PATH, { 
            baseDir: BaseDirectory.AppData 
        });
        const files: RecentFile[] = JSON.parse(content);
        
        // Filter out non-existent files
        const existingFiles = [];
        for (const file of files) {
            const fileExists = await exists(file.path);
            if (fileExists) {
                existingFiles.push(file);
            }
        }

        // If any files were filtered out, update the storage
        if (existingFiles.length !== files.length) {
            const encoder = new TextEncoder();
            const data = encoder.encode(JSON.stringify(existingFiles, null, 2));
            await writeFile(RECENT_FILES_PATH, data, { 
                baseDir: BaseDirectory.AppData 
            });
        }

        return existingFiles;
    } catch {
        return [];
    }
}

export async function addRecentFile(filePath: string, filename: string): Promise<void> {
    try {
        // Ensure directory exists
        await mkdir('', { 
            baseDir: BaseDirectory.AppData,
            recursive: true 
        });

        // Read existing records
        const recentFiles = await getRecentFiles();

        // Check if file already exists
        const existingIndex = recentFiles.findIndex(f => f.path === filePath);
        const newEntry: RecentFile = {
            path: filePath,
            filename: filename,
            lastAccess: Date.now()
        };

        if (existingIndex !== -1) {
            recentFiles.splice(existingIndex, 1);
        }

        // Add new record to the beginning
        recentFiles.unshift(newEntry);

        // Limit the number of records
        if (recentFiles.length > MAX_RECENT_FILES) {
            recentFiles.pop();
        }

        // Save to file
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(recentFiles, null, 2));
        await writeFile(RECENT_FILES_PATH, data, { baseDir: BaseDirectory.AppData });
    } catch (error) {
        console.error('Failed to save recent files:', error);
        throw error;
    }
}