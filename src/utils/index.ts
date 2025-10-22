import {open} from '@tauri-apps/plugin-shell'
import {BaseDirectory, readTextFile, writeFile} from '@tauri-apps/plugin-fs'
import {v4 as uuidv4} from 'uuid'
import JSZip from 'jszip';

export function openUrlByBrowser(url: string){
    open(url)
}

// 生成合法的窗口标签
export function generateWindowLabel(filePath: string): string {
  // Use BigInt for 64-bit integer operations to match Rust's i64
  let hash = BigInt(5381); // Same prime number initial value as Rust
  
  for (let i = 0; i < filePath.length; i++) {
      const char = BigInt(filePath.charCodeAt(i));
      
      // Match Rust's operations: (hash << 5) - hash + char
      try {
          hash = ((hash << BigInt(5)) - hash) + char;
          
          // Ensure we stay within i64 bounds
          if (hash > BigInt(Number.MAX_SAFE_INTEGER)) {
              hash = hash % BigInt(Number.MAX_SAFE_INTEGER);
          }
      } catch (e) {
          // Handle potential BigInt overflow
          const absValue = hash < 0n ? -hash : hash;
          hash = absValue;
      }
  }
  
  return `window_${hash >= 0n ? hash : -hash}`;
}

export function generateDefaultTableData(){
    return (
        {
            options: {
              lockTableHead: false,
              lockFullTable: false,
              lineWrap: true,
              rowIndex: false,
            },
            columns: [
              {
                name: 'Title',
                dataType: 'treeNode',
                width: 150,
                uuid: uuidv4()
              },
            ],
            rows: []
          }
    )
}

const CONFIG_FILE = "config.json"

const defaultConfig = {
  appearance: "light",
  language: "enUS",
  autoUpdate: "auto",
}

export async function getConfig(){
    // 尝试读取配置文件
    const configText = await readTextFile(CONFIG_FILE, { baseDir: BaseDirectory.AppConfig }).catch(() =>
      JSON.stringify(defaultConfig),
    )
    // 解析配置
    const loadedConfig = JSON.parse(configText)

    return loadedConfig
}

export async function createInitialTableFile(filePath: string) {
    try {
        const zip = new JSZip();
        
        // Add initial data.json with default table structure
        const initialContent = generateDefaultTableData();
        zip.file('data.json', JSON.stringify(initialContent, null, 2));
        
        // Create empty attachments folder
        zip.folder('attachments');
        
        // Generate zip file
        const content = await zip.generateAsync({
            type: 'uint8array',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });
        
        // Write to file
        await writeFile(filePath, content);
        
        return true;
    } catch (error) {
        console.error('Failed to create table file:', error);
        throw error;
    }
}