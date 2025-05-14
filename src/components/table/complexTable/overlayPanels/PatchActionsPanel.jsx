// @ts-nocheck
import React, {
  useState,
  useContext,
} from 'react';

import { DataTypes, ColumnIcon } from '../dataType';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

function PatchActionsPanel(props, ref) {
  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'right',
    position: null,
    minWidth: 100,
    minHeight: 458,
  });
  useToggleablePanel(ref, setPanelState);

  const menuData = [
    {
        title: '全选所有行',
        key: '1',
    },
    {
        title: '取消选中行',
        key: '2',
    },
    {
        title: '复制选中行',
        key: '3',
    },
    {
        title: '删除选中行',
        key: '4',
    },
  ];

  function onClickSelectAll() {
    const ev = new CustomEvent('selectAllRow');
    window.dispatchEvent(ev);
  }

  function onClickCancelSelectRows() {
    const ev = new CustomEvent('unSelectAllRow');
    window.dispatchEvent(ev);
  }

  function onClickCopyToClipboard() {
    const event = new Event('copyToClipboard');
    window.dispatchEvent(event);
  }

  function onClickDeleteSelected() {
    const event = new Event('deleteSelected');
    window.dispatchEvent(event);
  }

  function onClickType(type) {
    if(type === '1'){
        onClickSelectAll();
    }else if(type === '2'){
        onClickCancelSelectRows();
    }else if(type === '3'){
        onClickCopyToClipboard();
    }else if(type === '4'){
        onClickDeleteSelected();
    }
  }

  function createMenuItem(item) {

    return (
      <div
        key={item.key}
        className="one-menu"
        onClick={(e) => onClickType(item.key)}
      >
          {item.title}
      </div>
    );
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-menu">
          {
            menuData.map((item) => createMenuItem(item))
          }
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(PatchActionsPanel);
