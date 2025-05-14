import { ComponentType, useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { VscChromeMinimize, VscChromeMaximize, VscChromeClose, VscChromeRestore } from "react-icons/vsc";

import './index.less';

export default function withTitleBar(Component: ComponentType){

    return function (props: JSX.IntrinsicAttributes){

        const [isMinimizable, setIsMinimizable] = useState(false);
        const [isMaximizable, setIsMaximizable] = useState(false);
        const [isMaximized, setIsMaximized] = useState(false);

        const appWindow = getCurrentWindow();

        useEffect(()=>{
            appWindow.isMaximizable().then(result=>setIsMaximizable(result));
            appWindow.isMinimizable().then(result=>setIsMinimizable(result))
            appWindow.isMaximized().then(result=>setIsMaximized(result))
        }, [isMinimizable, isMaximizable])

        return (
            <div className='viewWrapper2'>
                <div data-tauri-drag-region className="titlebar2">
                    {
                        isMinimizable ? (
                            <div className="titlebar-button2"
                                onClick={()=>{appWindow.minimize()}}
                             id="titlebar-minimize">
                                <VscChromeMinimize/>
                            </div>
                        ) : null
                    }
                    {
                        isMaximizable ? (
                            <div className="titlebar-button2" id="titlebar-maximize"
                                onClick={() => {
                                    appWindow.toggleMaximize();
                                    setIsMaximized(p=>!p)
                                }}>
                                    {isMaximized ? <VscChromeRestore/> : <VscChromeMaximize/>}
                            </div>
                        ) : null
                    }

                    <div className="titlebar-button2" id="titlebar-close"
                            onClick={() => appWindow.close()}>
                        <VscChromeClose />
                    </div>
                </div>
                <div className='contentWrapper2'>
                    <Component {...props} />
                </div>
            </div>
        )
    }
}