// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';

import React, {
  useState,
  useEffect,
  useContext,
} from 'react';

import {
  Button,
  Divider,
  InputNumber,
} from 'antd';

import {
  CellRendererContext,
} from '../contexts';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

function EditSerialNumberPanel(props, ref) {
  const {
    columns,
    setColumns,
  } = useContext(CellRendererContext);

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'right',
    position: null,
    minWidth: 190,
    minHeight: 445,
  });

  useToggleablePanel(ref, setPanelState);

  let currentColumn = null;
  for (const col of columns) {
    if (col.uuid === panelState.column) {
      currentColumn = col;
      break;
    }
  }
  const [start, setStart] = useState(currentColumn?.startSerialNumber || 1);

  useEffect(() => {
    if (panelState.visible) {
      setStart(currentColumn?.startSerialNumber || 1);
    }
  }, [panelState]);

  function onChange(v) {
    setStart(v);
  }

  function onClickSubmit() {
    setColumns((oldColumns) => {
      const newColumns = [];

      for (const col of oldColumns) {
        const newCol = { ...col };

        if (col.uuid === currentColumn.uuid) {
          newCol.startSerialNumber = start;
        }

        newColumns.push(newCol);
      }

      return newColumns;
    });

    setPanelState((oldState) => ({
      ...oldState,
      visible: false,
      column: undefined,
    }));
    panelState?.closeColumnPanel?.();
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-choiceEditPanel">
        <div className="choice-name-editor">
          <InputNumber
            placeholder="Enter"
            value={start}
            onChange={onChange}
            min={1}
            style={{ width: '100%' }}
            precision={0}
          />
        </div>

        <Divider />

        <div style={{ margin: '8px 12px 5px' }}>
          <Button type="primary" block onClick={onClickSubmit}>OK</Button>
        </div>
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(EditSerialNumberPanel);
