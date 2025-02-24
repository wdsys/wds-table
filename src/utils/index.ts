import {open} from '@tauri-apps/plugin-shell'
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