// @ts-nocheck
import React, {
  useState,
  useEffect,
  useContext,
  useRef,
} from 'react';

import {
  Divider,
} from 'antd';

import {
  CellRendererContext,
} from '../contexts';

import HanziInput from '../HanziInput';
import * as icons from '../SvgIcons';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

const SerialFormats = [
  {
    code: 'base10',
    nameCN: '十进制',
    format: '%d',
  },
  {
    code: 'base16',
    nameCN: '十六进制',
    format: '%x',
  },
];

function SerialFormatPanel(props, ref) {
  const { columns, setColumns } = useContext(CellRendererContext);

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 190,
    minHeight: 395,
  });

  useToggleablePanel(ref, setPanelState);

  const refInput = useRef(null);
  const [formats, setFormats] = useState(SerialFormats);

  let currentColumn = null;
  for (const col of columns) {
    if (col.uuid === panelState.column) {
      currentColumn = col;
      break;
    }
  }

  let selectedFormat;
  if (currentColumn?.dataType === 'serial') {
    selectedFormat = currentColumn?.format;
  }

  useEffect(() => {
    if (panelState.visible) {
      const elem = refInput.current?.querySelector('input');
      if (elem) {
        setTimeout(() => {
          elem.focus();
          elem.select();
        }, 50);
      }
    }
  }, [panelState]);

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

  function onChangeFilter(value) {
    if (currentColumn?.dataType !== 'serial') {
      return;
    }

    setFormat(value);
  }

  function onClickFormat(format) {
    if (currentColumn?.dataType !== 'serial') {
      return;
    }

    setFormat(format.format);
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-serialFormatPanel">
        <div ref={refInput} className="input-text">
          <HanziInput
            placeholder="请输入"
            onChange={onChangeFilter}
            value={currentColumn?.format}
          />
        </div>

        <Divider />

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
                    visibility: item.format === selectedFormat ? 'visible' : 'hidden',
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

export default React.forwardRef(SerialFormatPanel);
