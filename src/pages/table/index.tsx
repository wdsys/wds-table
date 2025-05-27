import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router";
import Table from '@/components/table'
import { ConfigProvider } from 'antd';
import { TfiMenu } from "react-icons/tfi";
import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';
import { message, save } from '@tauri-apps/plugin-dialog';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import {Menu} from '@tauri-apps/api/menu';
import styles from './index.module.less';
import { useTranslation } from "react-i18next";

import { TableManager } from '@/utils/tableManager';
import { addRecentFile } from '@/utils/recentFiles'
import getDefaultData from './defaultData';

export default function TablePage(){

    const {i18n} = useTranslation();
    const currentLanguage = i18n.language; // 获取当前语言

    const locale = currentLanguage === 'enUS' ? enUS : zhCN;

    const [params] = useSearchParams();
    const path = params.get('file')
    const [data, setData] = useState(getDefaultData());
    const tableManager = useRef(new TableManager());
    const filename = path?.split?.('\\')?.pop()

    async function getTableJson(p: string) {
        const endEvent = new CustomEvent('loadEnd');
        try {
            const startEvent = new CustomEvent('loadStart');
            window.dispatchEvent(startEvent);
            // Create new session and extract zip
            await tableManager.current.createSession(p);
            await tableManager.current.extractZipToSession(p);
            
            // Load table data
            const tableData = await tableManager.current.getTableData();
            setData(tableData);        
            window.dispatchEvent(endEvent);
            
            // 获取到文件后 开始记录history
            setTimeout(()=>{
                const event = new Event('tableLoaded');
                window.dispatchEvent(event)
            }, 0)

        } catch (error) {
            console.error('Failed to load table:', error);
            window.dispatchEvent(endEvent);
            await message('文件格式不正确！', { title: 'WDS-Table', kind: 'error' });
            await getCurrentWindow().destroy();
        }
    }

    
    async function handleSave(data:any) {
        await tableManager.current.updateTableData(data)
        try {
            await tableManager.current.saveSessionToZip();

            const event = new CustomEvent('autoSaveTableDone');
            window.dispatchEvent(event);
        } catch (error) {
            console.error('Failed to save table:', error);
        }
    }

    async function showMenu(){
        const menu = await Menu.new({
            items: [
                {
                    id: 'save',
                    text: '保存',
                    action: ()=>{
                        const detail = { reason: 'manual-save' };
                        const event = new CustomEvent('saveTable', { detail });
                        window.dispatchEvent(event);
                    }
                },
                {
                    id: 'saveAs',
                    text: '另存为',
                    action: async ()=>{
                        try {
                            const filePath = await save({
                                filters: [{
                                    name: 'WDS Table',
                                    extensions: ['table']
                                }]
                            });
                            
                            if (filePath) {
                                await tableManager.current.saveAs(filePath);
                            }
                        } catch (error) {
                            console.error('Failed to save as:', error);
                            await message('保存失败！', { 
                                title: 'WDS-Table', 
                                kind: 'error' 
                            });
                        }
                    }
                }
            ]
        })

        menu.popup();
    }
    
    useEffect(()=>{
        if(path){
            getTableJson(path)
            addRecentFile(path, filename||'').then(()=>{
                WebviewWindow.getByLabel('main').then(mainWebview=>{
                    mainWebview?.emit?.('file-updated');
                })
            })
        }
    }, [path])

    return (
        <ConfigProvider locale={locale}>
            <div className={styles.ctn}>
                {/* <div className={styles.toolbar}>
                    <Toolbar />
                </div> */}
                <div className={styles.menu} onClick={showMenu}><TfiMenu/></div>
                <div className={styles.title}>{filename}</div>
                <div className={styles.tableCtn}>
                    <Table fileData={data} filename={filename} 
                    filePath={path} handleSave={handleSave}
                    tableManager={tableManager.current}
                    />
                </div>
            </div>
        </ConfigProvider>
    )
}