// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';

import React, {
  useState,
  useEffect,
  useContext,
} from 'react';

import {
  message,
  Button,
  Divider,
} from 'antd';

import {
  CellRendererContext,
} from '../contexts';

import HanziInput from '../HanziInput';
import DefaultTagColors from '../DefaultTagColors';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';
import TagColorList from './TagColorList';

function ChoiceNewPanel(props, ref) {
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

  const [name, setName] = useState('');
  const [color, setColor] = useState(null);

  useEffect(() => {
    if (panelState.visible) {
      setName('');
      setColor(null);
    }
  }, [panelState]);

  let currentColumn = null;
  for (const col of columns) {
    if (col.uuid === panelState.column) {
      currentColumn = col;
      break;
    }
  }

  function onChangeChoiceName(newName) {
    setName(newName.trim());
  }

  function onChooseColor(newColor) {
    setColor(newColor);
  }

  function onClickSubmit() {
    if (name === '') {
      message.error('标签值不能为空');
      return;
    }

    if (currentColumn.choices?.length) {
      let duplicate = false;
      for (const item of currentColumn.choices) {
        if (item.name === name) {
          duplicate = true;
          break;
        }
      }

      if (duplicate) {
        message.error('标签值不能重复');
        return;
      }
    }

    setColumns((oldColumns) => {
      const newColumns = [];

      for (const col of oldColumns) {
        const newCol = { ...col };

        if (col.uuid === currentColumn.uuid) {
          const newChoice = {
            uuid: uuidv4(),
            name,
          };

          if (color) {
            newChoice.color = color;
          } else {
            [newChoice.color] = DefaultTagColors;
          }

          if (col.choices) {
            newCol.choices = [...col.choices, newChoice];
          } else {
            newCol.choices = [newChoice];
          }
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
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-choiceEditPanel">
        <div className="choice-name-editor">
          <HanziInput
            placeholder="Enter"
            value={name}
            onChange={onChangeChoiceName}
          />
        </div>

        <Divider />

        <TagColorList chosenColor={color} onChooseColor={onChooseColor} />

        <Divider />

        <div style={{ margin: '8px 12px 5px' }}>
          <Button type="primary" block onClick={onClickSubmit}>确定</Button>
        </div>
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(ChoiceNewPanel);
