// @ts-nocheck
import React, {
  useState,
  useContext,
  useRef,
} from 'react';

import {
  CellRendererContext,
} from '../contexts';

import * as icons from '../SvgIcons';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

const ExpandFormats = [
  {
    code: 'expand',
    nameCN: '展开',
  },
  {
    code: 'collapse',
    nameCN: '折叠',
  },
];

const HasExpandDataType = ['text', 'file', 'signature', 'linkedRequirements', 'notification'];

function ExpandFormatsPanel(props, ref) {
  const {
    columns,
    setColumns,
  } = useContext(CellRendererContext);

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 191,
    minHeight: 395,
  });

  useToggleablePanel(ref, setPanelState);

  const refInput = useRef(null);
  const formats = ExpandFormats;

  let currentColumn = null;
  for (const col of columns) {
    if (col.uuid === panelState.column) {
      currentColumn = col;
      break;
    }
  }

  let selectedFormat = 'expand';
  if (HasExpandDataType.includes(currentColumn?.dataType)) {
    selectedFormat = currentColumn?.expandFormat || 'expand';
  }

  function onClickFormat(format) {
    if (!HasExpandDataType.includes(currentColumn?.dataType)) {
      return;
    }

    setColumns((oldColumns) => {
      const newColumns = [];

      for (const col of oldColumns) {
        const newCol = { ...col };
        if (col.uuid === currentColumn.uuid) {
          newCol.expandFormat = format.code;
        }

        newColumns.push(newCol);
      }
      return newColumns;
    });
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div ref={refInput} className="overlay-numberFormatPanel">

        <div className="button-list">
          {
            formats.map((item, i) => (
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

export default React.forwardRef(ExpandFormatsPanel);
