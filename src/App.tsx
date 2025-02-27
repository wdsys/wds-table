import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import {useEffect} from 'react';
import {listen} from '@tauri-apps/api/event';
import Home from '@/pages/home';
import Recent from  '@/pages/recent';
import Table from '@/pages/table';
import Template from '@/pages/template';
import Setting from '@/pages/settings';
import { useTranslation } from "react-i18next";
import { getConfig } from "./utils";

import '@/locale/i18n';

import './App.css'

interface ContextMenuEvent extends MouseEvent {
  preventDefault: () => void;
}

function preventDefaultContextMenu(e: ContextMenuEvent): void {
  e.preventDefault();
}

function App() {

  const {i18n} = useTranslation();

  useEffect(() => {
    // 监听配置变更事件
    const unlisten = listen('lang-changed', (event:any) => {
      i18n.changeLanguage(event?.payload?.language)
    });

    return () => {
      unlisten.then(fn => fn()); // 清理事件监听
    };
  }, []);

  function initLanguage(){
    getConfig().then(config=>{
        i18n.changeLanguage(config.language)
    })
  }

  useEffect(() => {

    initLanguage();

    const preventDefault = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Prevent all drag and drop events
    document.addEventListener('dragenter', preventDefault);
    document.addEventListener('dragover', preventDefault);
    document.addEventListener('dragleave', preventDefault);
    document.addEventListener('drop', preventDefault);
    window.addEventListener('contextmenu', preventDefaultContextMenu, false)

    return () => {
        // Clean up listeners
        document.removeEventListener('dragenter', preventDefault);
        document.removeEventListener('dragover', preventDefault);
        document.removeEventListener('dragleave', preventDefault);
        document.removeEventListener('drop', preventDefault);
        window.removeEventListener('contextmenu', preventDefaultContextMenu, false)
    };
}, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Navigate to='/home/recent'/>}></Route>
        <Route path='home' element={<Home />}>
          <Route path='recent' element={<Recent/>} />
          <Route path='template' element={<Template />} />
        </Route>

        <Route path='table' element={<Table />} />
        <Route path='/settings' element={<Setting />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
