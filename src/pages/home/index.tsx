import { useEffect } from 'react';
import { Outlet, NavLink } from "react-router";
import { PiClock } from "react-icons/pi";
import { VscNewFile } from "react-icons/vsc";
// import { LiaSwatchbookSolid } from "react-icons/lia";
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import {listen} from '@tauri-apps/api/event';
import { message } from '@tauri-apps/plugin-dialog';
import { TbSettings } from "react-icons/tb";
import { selectFileByDialog } from '@/utils/file';
import { generateWindowLabel } from '@/utils/index'
import { addRecentFile } from '@/utils/recentFiles';
import {useTranslation} from 'react-i18next';
import logo from './wds.logo.svg'

import styles from './index.module.less';

interface FakeLinkProps {
    onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    children: React.ReactElement;
    className?: string;
}

function FakeLink ({onClick, children, className}: FakeLinkProps){

    return (
        <div onClick={onClick} className={className}>
            {children}
        </div>
    )
}

export default function Home(){

    const {t} = useTranslation()

    async function onOpenLocalFile(infilepath?:string){
        let filePath:string|undefined = infilepath;
        if(!filePath){
            filePath = await selectFileByDialog(['table'], false) as string;
        }
        
        if(!filePath) return;
        const path = encodeURIComponent(filePath as string)
        const windowLabel = generateWindowLabel(path)
        const existWindow = await WebviewWindow.getByLabel(windowLabel)

        if(existWindow){
            await existWindow.setFocus();
            return;
        }

        const filename = filePath?.split?.('\\')?.pop();
        const webview = new WebviewWindow(windowLabel, {
            url: '/table?file=' + path,  // 对应 router 中的路径
            title: filename,
            width: 970,
            height: 600,
            resizable: true,
            dragDropEnabled: false,
            "decorations": false
        });

        // 添加到最近文件记录
        await addRecentFile(filePath as string, filename as string);

        // 监听窗口事件
        webview.once('tauri://created', () => {
            console.log('webview window created');
        });

        webview.once('tauri://error', (e) => {
            console.error(e);
        });
        
        // const mainWindow = await WebviewWindow.getByLabel('main')
        // mainWindow?.close();
    }

    async function openSettings(){
        const SETTINGS_LABEL = 'settings-window';
        try {
            // Try to get existing window
            const existingWindow = await WebviewWindow.getByLabel(SETTINGS_LABEL);
            
            if (existingWindow) {
                // Window exists, bring it to front and focus
                await existingWindow.unminimize();
                await existingWindow.setFocus();
                return;
            }
    
            // Create new window if it doesn't exist
            const webview = new WebviewWindow(SETTINGS_LABEL, {
                url: '/settings',
                title: '',
                width: 600,
                height: 500,
                resizable: false,
                center: true,
                decorations: true,
                focus: true,
                dragDropEnabled: false,
                "minimizable": false,
                "maximizable": false,
            });
    
            webview.once('tauri://created', () => {
                console.log('settings window created');
            });
    
            webview.once('tauri://error', (e) => {
                console.error('Error creating settings window:', e);
            });
    
        } catch (error) {
            console.error('Failed to open settings window:', error);
        }
    }

    useEffect(() => {
        // Listen for file open events
        const unlisten = listen('open-table-file', async (event: { payload: string }) => {
            const filePath = event.payload;

            await message(event.payload, { title: 'WDS-Table', kind: 'error' });

            await onOpenLocalFile(filePath);
        });
    
        return () => {
            unlisten.then(fn => fn());
        };
    }, []);

    return (
        <div className={styles.ctn}>
            <div className={styles.aside}>
                <div className={styles.topPart}>
                    <div className={styles.header}>
                        <img src={logo} alt='logo' />
                        <div>WDS-Table</div>
                    </div>
                    <NavLink to='/home/recent' className={styles.item}>
                        <span className={styles.icon}><PiClock size='22'/></span>
                        <span>{t('recent')}</span>
                    </NavLink>
                    <FakeLink onClick={()=>onOpenLocalFile()} className={styles.item}>
                        <>
                            <span className={styles.icon}><VscNewFile size='22'/></span>
                            <span>{t('open locale file')}</span>
                        </>
                    </FakeLink>
                    {/* <NavLink to='/home/template' className={styles.item}>
                        <span className={styles.icon}><LiaSwatchbookSolid size='22'/></span>
                        <span>{t('library')}</span>
                    </NavLink> */}
                    <hr />
                </div>

                <div className={styles.bottomPart}>
                    <FakeLink onClick={openSettings} className={styles.item}>
                        <>
                            <span className={styles.icon}><TbSettings size='22'/></span>
                            <span>{t('preferences')}</span>
                        </>
                    </FakeLink>
                </div>
            </div>

            <div className={styles.content}>
                <Outlet/>
            </div>
        </div>
    )
}