import { useEffect, useState } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { save, message } from '@tauri-apps/plugin-dialog';
import { exists } from '@tauri-apps/plugin-fs';
// import { writeFile } from '@tauri-apps/plugin-fs';
import { useTranslation } from 'react-i18next';
import { getRecentFiles } from '@/utils/recentFiles';
import type { RecentFile } from '@/utils/recentFiles';
import { addRecentFile } from '@/utils/recentFiles';
import { generateWindowLabel, createInitialTableFile } from '@/utils/index'
import bg from './preview.png'

import styles from './index.module.less';

export default function Recent(){

    const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
    const {t} = useTranslation();
    async function loadRecentFiles() {
        const files = await getRecentFiles();
        setRecentFiles(files);
    }

    async function openRecentFileInWindow(recentItem: RecentFile){

        
        const fileExists = await exists(recentItem.path);
        if (!fileExists) {
            // Close current window
            await message(t('File not found'), { title: 'WDS-Table', kind: 'error' });
            loadRecentFiles();
            return;
        }

        const path = encodeURIComponent(recentItem.path)
        const windowLabel = generateWindowLabel(path)

        const existWindow = await WebviewWindow.getByLabel(windowLabel)

        if(existWindow){
            await existWindow.setFocus();
            return;
        }

        const webview = new WebviewWindow(windowLabel, {
            url: '/table?file=' + path,
            title: recentItem.filename,
            width: 970,
            height: 600,
            resizable: true,
            dragDropEnabled: false,
            "decorations": false
        })

        webview.once('tauri://created', () => {
            console.log('webview window created');
        });

        webview.once('tauri://error', (e) => {
            console.error(e);
        });

        await addRecentFile(recentItem.path, recentItem.filename);
        loadRecentFiles();
    }

    async function openNewFileInWindow() {
        try {
            // 让用户选择保存位置
            const filePath = await save({
                defaultPath: '无标题.table',
                filters: [{
                    name: 'Table',
                    extensions: ['table']
                }]
            });
    
            if (!filePath) return; // 用户取消了保存
    
            // 创建新文件的初始内容
            await createInitialTableFile(filePath)

            // 获取文件名
            const filename = filePath.split('\\').pop() || '';
            
            // 生成窗口标签
            const path = encodeURIComponent(filePath);
            const windowLabel = generateWindowLabel(path);
    
            // 创建新窗口
            const webview = new WebviewWindow(windowLabel, {
                url: '/table?file=' + path,
                title: filename,
                width: 970,
                height: 600,
                resizable: true,
                dragDropEnabled: false,
                decorations: false,
            });
    
            // 添加到最近文件记录
            await addRecentFile(filePath, filename);
            await loadRecentFiles(); // 刷新列表
    
            // 监听窗口事件
            webview.once('tauri://created', () => {
                console.log('webview window created');
            });
    
            webview.once('tauri://error', (e) => {
                console.error(e);
            });
        } catch (error) {
            console.error('Failed to create new file:', error);
        }
    }

    useEffect(() => {
        loadRecentFiles();
    }, []);

    return (
        <div className={styles.ctn}>
            <h2>{t('recent')}</h2>
            <div className={styles.grid}>             
            <div className={styles.item} onClick={openNewFileInWindow}>
                <div className={styles.iconCtn}></div>
                <div className={styles.title}>{t('new table')}</div>
            </div>

            {
                recentFiles.map(i=>(
                    <div className={styles.item} onClick={()=>openRecentFileInWindow(i)}>
                        <div className={styles.bgCtn}>
                            <img src={bg} alt='preview' />
                        </div>
                        <div className={styles.title}>{i.filename}</div>
                    </div>
                ))
            }

            </div>
        </div>
    )
}