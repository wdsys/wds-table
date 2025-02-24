import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import {useEffect} from 'react';
import Home from '@/pages/home';
import Recent from  '@/pages/recent';
import Table from '@/pages/table';
import Template from '@/pages/template';

import './App.css'

interface ContextMenuEvent extends MouseEvent {
  preventDefault: () => void;
}

function preventDefaultContextMenu(e: ContextMenuEvent): void {
  e.preventDefault();
}

function App() {

  useEffect(() => {
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
