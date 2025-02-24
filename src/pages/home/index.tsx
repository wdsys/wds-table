import { Outlet, NavLink } from "react-router";
import { PiClock } from "react-icons/pi";
import { VscNewFile } from "react-icons/vsc";
import { LiaSwatchbookSolid } from "react-icons/lia";
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { selectFileByDialog } from '@/utils/file';
import { generateWindowLabel } from '@/utils/index'
import { addRecentFile } from '@/utils/recentFiles';
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

    async function onOpenLocalFile(){
        const filePath = await selectFileByDialog(['table'], false);
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

    return (
        <div className={styles.ctn}>
            <div className={styles.aside}>

                <div className={styles.header}>
                    <img src={logo} alt='logo' />
                    <div>WDS-Table</div>
                </div>

                <NavLink to='/home/recent' className={styles.item}>
                    <span className={styles.icon}><PiClock size='22'/></span>
                    <span>最近</span>
                </NavLink>
                <FakeLink onClick={onOpenLocalFile} className={styles.item}>
                    <>
                        <span className={styles.icon}><VscNewFile size='22'/></span>
                        <span>打开本地文件</span>
                    </>
                </FakeLink>
                <NavLink to='/home/template' className={styles.item}>
                    <span className={styles.icon}><LiaSwatchbookSolid size='22'/></span>
                    <span>表库</span>
                </NavLink>
                <hr />
            </div>

            <div className={styles.content}>
                <Outlet/>
            </div>
        </div>
    )
}