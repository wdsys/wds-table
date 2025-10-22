// @ts-nocheck
import React, {
  useState,
  useContext,
} from 'react';

import { DataTypes, ColumnIcon } from '../dataType';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';
import { useTranslation } from 'react-i18next';

function LevelChangePanel(props, ref) {
  const {t} = useTranslation()
  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'right',
    position: null,
    minWidth: 216,
    minHeight: 458,
  });
  useToggleablePanel(ref, setPanelState);

  const menuData = [
    {
        title: t('upgrade'),
        key: '1',
    },
    {
        title: t('degrade'),
        key: '2',
    },
  ];

  function onClickMoveLeft() {
    const event = new Event('moveLeft');
    window.dispatchEvent(event);
  }

  function onClickMoveRight() {
    const event = new Event('moveRight');
    window.dispatchEvent(event);
  }

  function onClickType(type) {
    if(type === '1'){
      onClickMoveLeft();
    }else if(type === '2'){
      onClickMoveRight();
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

export default React.forwardRef(LevelChangePanel);
