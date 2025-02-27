import {open} from '@tauri-apps/plugin-shell'
import {BaseDirectory, readTextFile} from '@tauri-apps/plugin-fs'
import {v4 as uuidv4} from 'uuid'

export function openUrlByBrowser(url: string){
    open(url)
}

// 生成合法的窗口标签
export function generateWindowLabel(filePath: string): string {
    // 使用简单的哈希算法，也可以使用更复杂的哈希函数
    let hash = 0;
    for (let i = 0; i < filePath.length; i++) {
        const char = filePath.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return `window_${Math.abs(hash)}`;
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
                name: '树节点',
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
  language: "zhCN",
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