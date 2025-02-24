// @ts-nocheck
import React, {
  useState,
  useContext,
} from 'react';

import {
  Divider,
} from 'antd';

import * as icons from '../SvgIcons';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

function TestPanel(props, ref) {
  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
  });

  const {
    hide: closeDropdown,
  } = useToggleablePanel(ref, setPanelState);

  function onClickDeleteAllRows() {
    closeDropdown();
  }

  function onClickDeleteLocalStorage() {
    closeDropdown();
  }

  function onClickTest() {
    console.log('onClickTest');
    closeDropdown();
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="table-config-overlay">
        <div className="card-title">
          <span style={{ marginRight: '5px' }}>测试工具</span>
          <icons.IconHelp />
        </div>
        <Divider />
        <div className="all-columns">
          <div className="one-column-box">
            <div className="one-column" style={{ cursor: 'pointer' }} onClick={onClickDeleteAllRows}>
              <div className="icon">
                <icons.IconDelete />
              </div>
              <div className="name">
                删除所有行
              </div>
            </div>
          </div>

          <div className="one-column-box">
            <div className="one-column" style={{ cursor: 'pointer' }} onClick={onClickDeleteLocalStorage}>
              <div className="icon">
                <icons.IconDelete />
              </div>
              <div className="name">
                删除本地存储
              </div>
            </div>
          </div>

          <div className="one-column-box">
            <div className="one-column" style={{ cursor: 'pointer' }} onClick={onClickTest}>
              <div className="icon">
                <icons.IconConfig />
              </div>
              <div className="name">
                测试
              </div>
            </div>
          </div>

        </div>
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(TestPanel);
