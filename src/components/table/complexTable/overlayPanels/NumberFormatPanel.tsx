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

const NumberFormats = [
  {
    code: 'number',
    nameCN: '数字',
  },
  {
    code: 'int',
    nameCN: '整数',
  },
  {
    code: 'thousands',
    nameCN: '千分位',
  },
  {
    code: 'progress',
    nameCN: '进度条',
  },
  {
    code: 'frac2',
    nameCN: '两位小数',
  },
  {
    code: 'percent',
    nameCN: '百分比',
  },
  {
    code: 'RMB',
    nameCN: '人民币',
  },
  {
    code: 'USD',
    nameCN: '美元',
  },
  {
    code: 'EUR',
    nameCN: '欧元',
  },
  {
    code: 'JPY',
    nameCN: '日元',
  },
  {
    code: 'HKD',
    nameCN: '港元',
  },
];

function NumberFormatPanel(props, ref) {
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
  const [formats, setFormats] = useState(NumberFormats);

  let currentColumn = null;
  for (const col of columns) {
    if (col.uuid === panelState.column) {
      currentColumn = col;
      break;
    }
  }

  let selectedFormat;
  if (currentColumn?.dataType === 'number') {
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

  function onChangeFilter(value) {
    const filter = value.trim();
    if (filter === '') {
      setFormats(NumberFormats);
      return;
    }

    setFormats((old) => old.filter((item) => item.nameCN?.includes(filter)));
  }

  function onClickFormat(format) {
    if (currentColumn?.dataType !== 'number') {
      return;
    }

    setColumns((oldColumns) => {
      const newColumns = [];

      for (const col of oldColumns) {
        const newCol = { ...col };
        if (col.uuid === currentColumn.uuid) {
          newCol.format = format.code;
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
        {/* <div className="input-text">
          <HanziInput placeholder="请输入" onChange={onChangeFilter} />
        </div>

        <Divider /> */}

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

export default React.forwardRef(NumberFormatPanel);
