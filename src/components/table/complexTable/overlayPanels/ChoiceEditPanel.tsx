// @ts-nocheck
import React, {
  useState,
  useContext,
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
import TagColorList from './TagColorList';

function ChoiceEditPanel(props, ref) {
  const {
    setLocalTable,
    columns,
    setColumns,
  } = useContext(CellRendererContext);

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'right',
    position: null,
    minWidth: 190,
    minHeight: 434,
  });

  useToggleablePanel(ref, setPanelState);

  let currentColumn = null;
  for (const col of columns) {
    if (col.uuid === panelState.column) {
      currentColumn = col;
      break;
    }
  }

  let currentChoice = null;
  if (currentColumn && currentColumn.choices) {
    for (const choice of currentColumn.choices) {
      if (choice.uuid === panelState.choice) {
        currentChoice = choice;
        break;
      }
    }
  }

  // console.log('panelState:', panelState);
  // console.log('currentChoice:', currentChoice);

  function onChangeChoiceName(newName) {
    if (!currentColumn?.choices) {
      return;
    }

    const name = newName.trim();

    let isNameUsedByOther = false;
    for (const choice of currentColumn.choices) {
      if (choice.uuid === currentChoice.uuid) {
        continue;
      }

      if (choice.name === name) {
        isNameUsedByOther = true;
        break;
      }
    }

    if (isNameUsedByOther) {
      console.error(`duplicate choice name: ${name}`);
      return;
    }

    setLocalTable((oldData) => {
      const oldColumns = oldData.columns;
      const oldRows = oldData.rows;

      const newColumns = [];
      const newRows = [];

      for (const col of oldColumns) {
        const newCol = { ...col };
        if (col.uuid === currentColumn.uuid) {
          if (col.choices) {
            newCol.choices = [];

            for (const choice of col.choices) {
              const newChoice = { ...choice };

              if (choice.uuid === currentChoice.uuid) {
                newChoice.name = name;
              }

              newCol.choices.push(newChoice);
            }
          }
        }

        newColumns.push(newCol);
      }

      for (const row of oldRows) {
        const newRow = { ...row };

        if (row.fields) {
          const newFields = { ...row.fields };

          const oldValue = row.fields?.[currentColumn.uuid];
          if (oldValue) {
            const newValue = [];

            for (const entry of oldValue) {
              if (entry === currentChoice.name) {
                newValue.push(name);
              } else {
                newValue.push(entry);
              }
            }

            newFields[currentColumn.uuid] = newValue;
          }

          newRow.fields = newFields;
        }

        newRows.push(newRow);
      }

      return {
        ...oldData,
        columns: newColumns,
        rows: newRows,
      };
    });
  }

  /**
   * @param color: e.g. {code: '...', color: '...'}
   */
  function onChooseColor(color) {
    setColumns((oldColumns) => {
      const newColumns = [];

      for (const col of oldColumns) {
        const newCol = { ...col };
        if (col.uuid === currentColumn.uuid) {
          if (col.choices) {
            newCol.choices = [];

            for (const choice of col.choices) {
              const newChoice = { ...choice };

              if (choice.uuid === currentChoice.uuid) {
                newChoice.color = color;
              }

              newCol.choices.push(newChoice);
            }
          }
        }

        newColumns.push(newCol);
      }

      return newColumns;
    });
  }

  function onDeleteChoice() {
    setColumns((oldColumns) => {
      const newColumns = [];

      for (const col of oldColumns) {
        const newCol = { ...col };
        if (col.uuid === currentColumn.uuid) {
          if (col.choices) {
            newCol.choices = [];

            for (const choice of col.choices) {
              if (choice.uuid === currentChoice.uuid) {
                continue;
              }

              const newChoice = { ...choice };
              newCol.choices.push(newChoice);
            }
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
      choice: undefined,
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
            placeholder="请输入"
            value={currentChoice?.name}
            onChange={onChangeChoiceName}
          />
        </div>

        <Divider />

        <TagColorList chosenColor={currentChoice?.color} onChooseColor={onChooseColor} />

        <Divider />

        <div className="button-list">
          <div className="one-button" onClick={onDeleteChoice}>
            <div className="icon">
              <icons.IconDelete />
            </div>
            <div className="name">
              删除
            </div>
          </div>
        </div>
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(ChoiceEditPanel);
