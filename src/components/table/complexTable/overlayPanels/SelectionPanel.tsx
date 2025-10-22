// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';

import React, {
  useState,
  useEffect,
  useContext,
} from 'react';

import {
  Divider,
} from 'antd';

import {
  CellRendererContext,
} from '../contexts';

import HanziInput from '../HanziInput';
import DefaultTagColors from '../DefaultTagColors';
import * as icons from '../SvgIcons';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';
import SelectChoiceList from './SelectChoiceList';
import { useTranslation } from 'react-i18next';

function SelectionPanel(props, ref) {
  const {
    options,
    columns,
    setColumns,
    rows,
    setRows,
  } = useContext(CellRendererContext);

  const {t} = useTranslation();

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'right',
    position: null,
    minWidth: 200,
    minHeight: 108,
  });

  useToggleablePanel(ref, setPanelState);

  const [tagFilter, setTagFilter] = useState('');
  const [filteredChoices, setFilteredChoices] = useState([]);
  const [showNewChoice, setShowNewChoice] = useState(false);

  function getCurrentColumn() {
    let currentColumn;

    for (const col of columns) {
      if (col.uuid === panelState.column) {
        currentColumn = col;
        break;
      }
    }

    return currentColumn;
  }

  function getCurrentRow() {
    let currentRow;

    for (const row of rows) {
      if (row.uuid === panelState.row) {
        currentRow = row;
        break;
      }
    }

    return currentRow;
  }

  const currentColumn = getCurrentColumn();
  const currentRow = getCurrentRow();

  const colUUID = currentColumn?.uuid;
  const rowUUID = currentRow?.uuid;

  const colLocked = options.lockFullTable
    || options.lockTableHead || currentColumn?.locked;
  const rowLocked = options.lockFullTable || currentRow?.locked;
  const cellLocked = colLocked || rowLocked;

  const cellValue = currentRow?.fields?.[colUUID];

  // console.log('currentColumn:', currentColumn);
  // console.log('currentRow:', currentRow);
  // console.log('cellValue:', cellValue);

  useEffect(() => {
    if (tagFilter === '') {
      setFilteredChoices(currentColumn?.choices);
      setShowNewChoice(false);
    } else {
      const newFilteredChoices = [];
      let matched = false;

      if (currentColumn?.choices) {
        for (const choice of currentColumn.choices) {
          if (choice.name?.includes(tagFilter)) {
            newFilteredChoices.push(choice);
          }

          if (choice.name === tagFilter) {
            matched = true;
          }
        }
      }

      setFilteredChoices(newFilteredChoices);
      setShowNewChoice(!matched);
    }
  }, [currentColumn, tagFilter]);

  function closeSelectionPanel() {
    setPanelState((oldPanelState) => ({
      ...oldPanelState,
      visible: false,
      column: undefined,
      row: undefined,
    }));
  }

  function addChoice(name, color) {
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
            let exist = false;
            for (const choice of col.choices) {
              if (choice.name === name) {
                exist = true;
                break;
              }
            }

            if (!exist) {
              newCol.choices = [...col.choices, newChoice];
            }
          } else {
            newCol.choices = [newChoice];
          }
        }

        newColumns.push(newCol);
      }

      return newColumns;
    });
  }

  function addTag(tag) {
    setRows((oldData) => {
      const newData = [];

      for (const oldRow of oldData) {
        const newRow = { ...oldRow };

        if (oldRow.uuid === rowUUID) {
          if (oldRow.fields) {
            newRow.fields = { ...oldRow.fields };
          } else {
            newRow.fields = {};
          }

          if (currentColumn.dataType === 'select' || currentColumn.dataType === 'taskPriority' || currentColumn.dataType === 'requirementStatus') { // 单选
            newRow.fields[colUUID] = [tag];
          } else { // 多选
            const oldCellValue = oldRow.fields[colUUID];
            if (Array.isArray(oldCellValue)) {
              const index = oldCellValue.indexOf(tag);
              if (index === -1) {
                newRow.fields[colUUID] = [...oldCellValue, tag];
              }
            } else {
              newRow.fields[colUUID] = [tag];
            }
          }
        }

        newData.push(newRow);
      }

      return newData;
    });
  }

  function removeTag(tag) {
    setRows((oldData) => {
      const newData = [];

      for (const oldRow of oldData) {
        const newRow = { ...oldRow };

        if (oldRow.uuid === rowUUID) {
          if (oldRow.fields) {
            newRow.fields = { ...oldRow.fields };
          } else {
            newRow.fields = {};
          }

          const oldCellValue = oldRow.fields[colUUID];
          if (Array.isArray(oldCellValue)) {
            const index = oldCellValue.indexOf(tag);
            if (index !== -1) {
              const front = oldCellValue.slice(0, index);
              const back = oldCellValue.slice(index + 1);
              newRow.fields[colUUID] = front.concat(back);
            }
          }
        }

        newData.push(newRow);
      }

      return newData;
    });
  }

  function onClickChoice(choice, e) {
    if (!choice?.name) {
      return;
    }

    addTag(choice.name);
    if (currentColumn.dataType === 'select' || currentColumn.dataType === 'requirementStatus') { // 单选
      closeSelectionPanel();
    }
  }

  /**
   * tag: String, choice name
   */
  function onClickRemoveTag(tag, e) {
    removeTag(tag);
  }

  function onInputKeyDown(key, target, e) {
    if (key === 'Enter') {
      if (colLocked || rowLocked) {
        return;
      }

      if (tagFilter !== '') {
        addChoice(tagFilter);
        addTag(tagFilter);
        setTagFilter('');
        if (currentColumn.dataType === 'select' || currentColumn.dataType === 'requirementStatus') { // 单选
          closeSelectionPanel();
        }
      }
    }
  }

  function onChangeInputValue(value, target, e) {
    setTagFilter(value.trim());
  }

  function onClickEditChoice(choice, e) {
    const elem = e.target.closest('.one-button');
    if (!elem) {
      return;
    }

    const rect = elem.getBoundingClientRect();
    const position = {
      left: rect.left,
      top: rect.top - 200,
      width: rect.width,
      height: rect.height,
    };

    const detail = {
      panelType: 'ChoiceEditPanel',
      action: 'toggle',
      placement: 'right',
      position,
      column: colUUID,
      choice: choice.uuid,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  function createTags(tagArray) {
    const tags = [];

    if (tagArray) {
      const {
        choices = [],
        dataType,
      } = currentColumn;

      for (let i = 0; i < tagArray.length; i += 1) {
        const item = tagArray[i];

        let choice = null;
        for (const ch of choices) {
          if (ch.name === item) {
            choice = ch;
            break;
          }
        }

        const bg = choice?.color?.color || DefaultTagColors[0].color;

        const tag = (
          <span
            key={item}
            className="tag"
            style={{
              backgroundColor: bg,
            }}
          >
            <span className="name">{item}</span>
            {
              dataType !== 'requirementStatus' && (
                <span className="close" onClick={(e) => onClickRemoveTag(item, e)}>
                  <icons.IconClose />
                </span>
              )
            }
          </span>
        );

        tags.push(tag);
      }
    }

    return tags;
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-selectionPanel">
        {cellValue?.length > 0
          && (
            <div className="chosen-box">
              {createTags(cellValue)}
            </div>
          )}

        <div className="input-box">
          <HanziInput
            placeholder={t('search.or.add')}
            autoFocus
            value={tagFilter}
            onKeyDown={onInputKeyDown}
            onChange={onChangeInputValue}
          />
        </div>

        <Divider />

        <div className="choice-box">
          <SelectChoiceList
            column={currentColumn}
            choices={filteredChoices}
            locked={colLocked}
            onClickChoice={onClickChoice}
            onClickEditChoice={onClickEditChoice}
          />

          {!colLocked
            && showNewChoice
            && (
              <div className="new-choice">
                <div className="new-tag">
                  <span className="name">
                    {tagFilter}
                  </span>
                </div>
                <div className="hint">
                  创建
                  <icons.IconCarriageReturn />
                </div>
              </div>
            )}
        </div>
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(SelectionPanel);
