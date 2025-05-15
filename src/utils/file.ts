import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeFile } from '@tauri-apps/plugin-fs';
import {open as shellOpen} from '@tauri-apps/plugin-shell';

export async function selectFileByDialog(extensions: string[], multiple = false){
    const file = await open({
        multiple: multiple,
        directory: false,
        filters: [
            {
                name: 'Text',
                extensions: extensions,
            }
        ]
    })

    return file;
}

export async function getFileContent(path: string){
    const result = await readTextFile(path)
    return result;
}

export const base64ToBlob = (base64Data: string, defaultMimeType: string = 'application/octet-stream') => {
    // 检查是否包含 data URI scheme
    const isDataUrl = base64Data.startsWith('data:');
    let mimeType = defaultMimeType;
    let base64WithoutPrefix = base64Data;
  
    if (isDataUrl) {
      // 从 data URI 中提取 MIME type 和实际的 base64 数据
      const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64WithoutPrefix = matches[2];
      }
    }
  
    // 将 Base64 字符串解码为二进制数据
    const byteCharacters = atob(base64WithoutPrefix);
  
    // 将二进制数据转换为 Uint8Array
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
  
    // 创建 Blob 对象
    return new Blob([byteArray], { type: mimeType });
};

// export async function saveBlobToFile(filename: string, blob: Blob, defaultPath?: string) {
//     try {
//         // 获取文件扩展名
//         const extension = filename.split('.').pop() || '*';
        
//         // 从 blob 的 type 获取 MIME 类型名称
//         const mimeTypeName = blob.type.split('/').pop()?.toUpperCase() || 'All Files';
        
//         // 构建完整的默认保存路径
//         const fullDefaultPath = defaultPath 
//             ? `${defaultPath}/${filename}`
//             : filename;

//         // 打开保存对话框让用户选择保存位置
//         const filePath = await save({
//             defaultPath: fullDefaultPath,
//             filters: [{
//                 name: `${mimeTypeName} Files`,
//                 extensions: [extension]
//             },
//             {
//                 name: 'All Files',
//                 extensions: ['*']
//             }]
//         });

//         if (!filePath) return; // 用户取消了保存

//         // 将 Blob 转换为 Uint8Array
//         const arrayBuffer = await blob.arrayBuffer();
//         const uint8Array = new Uint8Array(arrayBuffer);

//         // 写入文件
//         await writeFile(filePath, uint8Array);

//         return filePath;
//     } catch (error) {
//         console.error('Failed to save file:', error);
//         throw error;
//     }
// }

export async function openFilePathWithDefaultApp(filePath: string) {
    try {
        // 转换base64为Blob
        // const blob = base64ToBlob(base64);
        
        // // 获取系统临时目录
        // const tempdir = await tempDir();
        
        // // 创建临时文件路径
        // const tempPath = await join(tempdir, filename);
        
        // // 将blob转换为Uint8Array并写入临时文件
        // const arrayBuffer = await blob.arrayBuffer();
        // const uint8Array = new Uint8Array(arrayBuffer);
        // await writeFile(tempPath, uint8Array);
        
        // 使用系统默认程序打开文件
        await shellOpen(filePath);
        
        return filePath;
    } catch (error) {
        console.error('Failed to open file:', error);
        throw error;
    }
}

export async function writeContentToFile(path: string, jsonString: string) {
    try {
        // Convert string to Uint8Array using TextEncoder
        const encoder = new TextEncoder();
        const data = encoder.encode(jsonString);
        
        // Write to file using Tauri's fs API
        await writeFile(path, data);
        
        return path;
    } catch (error) {
        console.error('Failed to write file:', error);
        throw error;
    }
}

export async function saveBlobToFile(filename: string, blob: Blob): Promise<string | null> {
    try {
      // Open save dialog
      const filePath = await save({
        defaultPath: filename,
        filters: [{
          name: 'All Files',
          extensions: ['*']
        }]
      });
  
      if (!filePath) return null; // User cancelled
  
      // Convert blob to Uint8Array
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
  
      // Write file
      await writeFile(filePath, uint8Array);
      
      return filePath;
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  }