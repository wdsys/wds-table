import { readTextFile, writeFile, mkdir, readDir, readFile, remove } from '@tauri-apps/plugin-fs';
import { tempDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';

export interface TableSession {
  sessionId: string;
  tempPath: string;
  dataPath: string;
  attachmentsPath: string;
  originalFile: string;
}

export class TableManager {
  private currentSession: TableSession | null = null;

  async createSession(originalFile: string): Promise<TableSession> {
    // Create unique session ID
    const sessionId = uuidv4();
    const tempBasePath = await tempDir();
    const sessionPath = await join(tempBasePath, sessionId);
    
    // Create temp directory structure
    const dataPath = await join(sessionPath, 'data.json');
    const attachmentsPath = await join(sessionPath, 'attachments');
    
    await mkdir(sessionPath, { recursive: true });
    await mkdir(attachmentsPath, { recursive: true });

    this.currentSession = {
      sessionId,
      tempPath: sessionPath,
      dataPath,
      attachmentsPath,
      originalFile
    };

    return this.currentSession;
  }

  async extractZipToSession(zipPath: string): Promise<void> {
    if (!this.currentSession) throw new Error('No active session');

    const zipContent = await readFile(zipPath);
    const zip = await JSZip.loadAsync(zipContent);
    
    // Extract data.json
    const dataFile = zip.file('data.json');
    if (dataFile) {
      const content = await dataFile.async('string');
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      await writeFile(this.currentSession.dataPath, data);
    }

    // Extract attachments
    const attachmentsFolder = zip.folder('attachments');
    if (attachmentsFolder) {
      for (const [path, file] of Object.entries(attachmentsFolder.files)) {
        if (!file.dir) {
          const content = await file.async('uint8array');
          const fileName = path.replace(/^attachments\//, '');
          const filePath = await join(this.currentSession.attachmentsPath, fileName);
          console.log(filePath, 'filePath')
          await writeFile(filePath, content);
        }
      }
    }
  }

  async saveSessionToZip(): Promise<void> {
    if (!this.currentSession) throw new Error('No active session');

    const zip = new JSZip();
    
    // Add data.json
    const dataContent = await readTextFile(this.currentSession.dataPath);
    zip.file('data.json', dataContent);

    // Add attachments
    const attachmentsFolder = zip.folder('attachments');
    if (attachmentsFolder) {
      const files = await readDir(this.currentSession.attachmentsPath);
      for (const file of files) {
        const content = await readFile(
          await join(this.currentSession.attachmentsPath, file.name)
        );
        attachmentsFolder.file(file.name, content);
      }
    }

    // Generate and save zip
    const content = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    await writeFile(this.currentSession.originalFile, content);
  }

  async getTableData(): Promise<any> {
    if (!this.currentSession) throw new Error('No active session');
    const content = await readTextFile(this.currentSession.dataPath);
    return JSON.parse(content);
  }

  async updateTableData(data: any): Promise<void> {
    if (!this.currentSession) throw new Error('No active session');
    const encoder = new TextEncoder();
    const content = encoder.encode(JSON.stringify(data, null, 2));
    await writeFile(this.currentSession.dataPath, content);
  }

    /**
   * 上传附件到单元格
   * @param file 文件对象
   * @returns 返回附件在临时目录中的路径
   */
    async uploadAttachment(uuid: string, file: File): Promise<string> {
        if (!this.currentSession) {
          throw new Error('No active session');
        }
    
        try {
          // 生成唯一文件名避免冲突
          const uniqueFileName = `${uuid}-${file.name}`;
          const attachmentPath = await join(this.currentSession.attachmentsPath, uniqueFileName);
    
          // 读取文件内容
          const arrayBuffer = await file.arrayBuffer();
          const content = new Uint8Array(arrayBuffer);
    
          // 写入临时目录
          await writeFile(attachmentPath, content);
    
          // 返回相对路径用于存储在单元格中
          return uniqueFileName;
        } catch (error) {
          console.error('Failed to upload attachment:', error);
          throw error;
        }
      }
    
      /**
       * 删除单元格附件
       * @param fileName 文件名
       */
      async removeAttachment(fileName: string): Promise<void> {
        if (!this.currentSession) {
          throw new Error('No active session');
        }
    
        try {
          const filePath = await join(this.currentSession.attachmentsPath, fileName);
          await remove(filePath);
        } catch (error) {
          console.error('Failed to remove attachment:', error);
          throw error;
        }
      }

  getAttachmentPath(filename: string): Promise<string> {
    if (!this.currentSession) throw new Error('No active session');
    return join(this.currentSession.attachmentsPath, filename);
  }

  async getAttachmentSrc(filename: string): Promise<string>{
    const path = await this.getAttachmentPath(filename);
    const src =  convertFileSrc(path)
    return src;
  }

    /**
   * Get attachment file content
   * @param fileName The name of the attachment
   * @returns Blob of the file content
   */
    async getAttachmentBlob(fileName: string): Promise<Blob> {
      if (!this.currentSession) {
        throw new Error('No active session');
      }
  
      try {
        const filePath = await join(this.currentSession.attachmentsPath, fileName);
        const fileContent = await readFile(filePath);
        
        // Convert Uint8Array to Blob
        return new Blob([fileContent], {
          type: this.getMimeType(fileName)
        });
      } catch (error) {
        console.error('Failed to get attachment blob:', error);
        throw error;
      }
    }
  
    private getMimeType(fileName: string): string {
      const ext = fileName.split('.').pop()?.toLowerCase();
      const mimeTypes = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        // Add more mime types as needed
      };
      // @ts-ignore
      return mimeTypes[ext] || 'application/octet-stream';
    }
}