// @ts-nocheck
import React, {
  useState,
  useContext,
} from 'react';

import {
  CellRendererContext,
} from '../contexts';

import * as icons from '../SvgIcons';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

const SelectFormats = [
  {
    code: 'tag',
    nameCN: '标签',
  },
  {
    code: 'fillColor',
    nameCN: '填色',
  },
  {
    code: 'signalLight',
    nameCN: '信号灯',
  },
  {
    code: 'text',
    nameCN: '文字',
  },
];

function SelectFormatPanel(props, ref) {
  const { columns, setColumns } = useContext(CellRendererContext);

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 190,
    minHeight: 395,
  });

  useToggleablePanel(ref, setPanelState);

  let currentColumn = null;
  for (const col of columns) {
    if (col.uuid === panelState.column) {
      currentColumn = col;
      break;
    }
  }

  let selectedFormat;
  if (currentColumn?.dataType === 'select') {
    selectedFormat = currentColumn?.format;
  }

  function setFormat(format) {
    setColumns((oldColumns) => {
      const newColumns = [];

      for (const col of oldColumns) {
        const newCol = { ...col };
        if (col.uuid === currentColumn.uuid) {
          newCol.format = format;
        }

        newColumns.push(newCol);
      }

      return newColumns;
    });
  }

  function onClickFormat(format) {
    if (currentColumn?.dataType !== 'select') {
      return;
    }

    setFormat(format.code);
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-serialFormatPanel">
        <div className="button-list">
          {
            SelectFormats.map((item, i) => (
              <div
                key={item.code}
                className="one-button"
                onClick={(e) => onClickFormat(item)}
              >
                <span className="name">
                  {item.nameCN}
                </span>

                <span
                  className="selected"
                  style={{
                    visibility: item.code === selectedFormat ? 'visible' : 'hidden',
                  }}
                >
                  <icons.IconCorrect />
                </span>
              </div>
            ))
          }
        </div>
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(SelectFormatPanel);
