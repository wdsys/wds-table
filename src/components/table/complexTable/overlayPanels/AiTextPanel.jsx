import React, {
  useState,
  useRef,
} from 'react';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

const ExpandFormats = [
  {
    code: '5',
    nameCN: '填充',
  },
  {
    code: '1',
    nameCN: '扩写',
  },
  {
    code: '2',
    nameCN: '润色',
  },
  {
    code: '3',
    nameCN: '改写',
  },
  {
    code: '4',
    nameCN: '缩写',
  },
];

function AiTextPanel(props, ref) {
  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 216,
    minHeight: 135,
  });

  useToggleablePanel(ref, setPanelState);

  const refInput = useRef(null);
  const formats = ExpandFormats;

  function closePanel() {
    const detail1 = {
      panelType: 'CellPanel',
      action: 'toggle',
      visible: false,
    };

    const ev = new CustomEvent('notifyPanel', { detail: detail1 });
    window.dispatchEvent(ev);

    const detail2 = {
      panelType: 'AiTextPanel',
      action: 'toggle',
      visible: false,
    };

    const ev2 = new CustomEvent('notifyPanel', { detail: detail2 });
    window.dispatchEvent(ev2);
  }

  async function openAiTextResponsePanel(item) {
    closePanel();

    const detail3 = {
      panelType: 'AiTextResponsePanel',
      action: 'toggle',
      placement: 'bottom',
      cellValue: panelState.currentValue,
      searchType: item.nameCN,
      colUUID: panelState.colUUID,
      rowUUID: panelState.rowUUID,
      isTreeNodeCell: panelState.isTreeNodeCell,
      cellElem: panelState.cellElem,
    };

    const ev3 = new CustomEvent('notifyPanel', { detail: detail3 });
    window.dispatchEvent(ev3);
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div ref={refInput} className="overlay-numberFormatPanel">
        <div className="button-list">
          {
            formats.map((item) => (
              <div
                key={item.code}
                className="one-button"
                onClick={(e) => openAiTextResponsePanel(item)}
              >
                <span className="name">
                  {item.nameCN}
                </span>
              </div>
            ))
          }
        </div>
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(AiTextPanel);
