// @ts-nocheck
import React, {
  useState,
  useContext,
  useCallback,
} from 'react';

import {
  message,
  Tooltip,
  Divider,
} from 'antd';

import { useTranslation } from 'react-i18next';

import {
  CellRendererContext,
  LocalStateContext,
} from '../contexts';

import { ColumnIcon } from '../dataType';
import { SimpleMovableList, MoveHandler } from '../MovableList';
import * as icons from '../SvgIcons';
import * as utils from '../utils';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

//--------------------------------------------------------------------
// Component: ColumnListItem
//--------------------------------------------------------------------

function onClickToggleColumnPanel1(e, colUUID) {
  e.preventDefault();

  const elem = e.target.closest('.one-column');
  if (!elem) {
    return;
  }

  const rect = elem.getBoundingClientRect();

  const position = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };

  const detail = {
    panelType: 'ColumnPanel',
    action: 'toggleOrTransfer',
    placement: 'left',
    position,
    column: colUUID,
  };

  const ev = new CustomEvent('notifyPanel', { detail });
  window.dispatchEvent(ev);
}

function onClickToggleVisibility1(e, setColumns, colUUID) {
  e.stopPropagation();

  setColumns((oldColumns) => {
    const newColumns = [];
    for (const col of oldColumns) {
      const newCol = { ...col };
      if (col.uuid === colUUID) {
        newCol.invisible = !col.invisible;
      }

      newColumns.push(newCol);
    }

    return newColumns;
  });
}

function onClickToggleLocked1(e, setColumns, colUUID) {
  e.stopPropagation();

  setColumns((oldColumns) => {
    const newColumns = [];
    for (const col of oldColumns) {
      const newCol = { ...col };
      if (col.uuid === colUUID) {
        newCol.locked = !col.locked;
      }

      newColumns.push(newCol);
    }

    return newColumns;
  });
}

function ColumnListItem(props) {
  const {
    keyName,
    itemData,

    moving,
    translate,
    onMoveStart,
    onMoveEnd,
    onMoving,

    options,
    columns,
    setColumns,
    readOnly,
  } = props;

  const colUUID = itemData[keyName];

  const onClickToggleColumnPanel = useCallback((e) => {
    onClickToggleColumnPanel1(e, colUUID);
  }, [colUUID]);

  const onClickToggleVisibility = useCallback((e) => {
    if (readOnly) {
      message.error('表格处于只读状态，无法修改字段可见性');
      return;
    }

    if (options.lockTableHead) {
      message.error('表头处于锁定状态，无法修改字段可见性');
      return;
    }

    onClickToggleVisibility1(e, setColumns, colUUID);
  }, [setColumns, colUUID, readOnly, options.lockTableHead]);

  const onClickToggleLocked = useCallback((e) => {
    if (readOnly) {
      message.error('表格处于只读状态，无法修改字段锁定状态');
      return;
    }

    if (options.lockTableHead) {
      message.error('表头处于锁定状态，无法修改字段锁定状态');
      return;
    }

    onClickToggleLocked1(e, setColumns, colUUID);
  }, [setColumns, colUUID, readOnly, options.lockTableHead]);

  return (
    <div
      key={itemData.name}
      className="one-column-box"
      style={{ transform: `translateY(${translate}px)` }}
    >
      <div className="one-column">
        <MoveHandler
          itemKey={itemData[keyName]}
          className="mover"
          boxClassName="one-column-box"
          onMoveStart={onMoveStart}
          onMoving={onMoving}
          onMoveEnd={onMoveEnd}
        >
          <icons.IconMover />
        </MoveHandler>

        <div className="icon-name" onClick={onClickToggleColumnPanel}>
          <div className="icon">
            <ColumnIcon dataType={itemData.dataType} />
          </div>
          <div className="name">
            {itemData.name}
          </div>
        </div>

        <div
          className="visible"
          onClick={onClickToggleVisibility}
        >
          {itemData.invisible
            ? <icons.IconInvisible />
            : <icons.IconVisible />}
        </div>

        {/* <div
          className="visible"
          onClick={onClickToggleLocked}
        >
          {itemData.locked
            ? <icons.IconLocked />
            : <icons.IconUnlocked />}
        </div> */}
      </div>
    </div>
  );
}

//--------------------------------------------------------------------
// Component: ColumnList
//--------------------------------------------------------------------

function onMoveColumn1(setColumns, movedColumns) {
  setColumns((oldColumns) => {
    const map = {};
    let rowIndexColumn = null;
    for (const col of oldColumns) {
      map[col.uuid] = col;
      if (col.dataType === 'rowIndex') {
        rowIndexColumn = col;
      }
    }

    const newColumns = [];
    if (rowIndexColumn) {
      newColumns.push(rowIndexColumn);
    }

    for (const col of movedColumns) {
      const newCol = map[col.uuid];
      if (newCol) {
        newColumns.push(newCol);
      }
    }

    return newColumns;
  });
}

function ColumnList(props) {
  const {
    options, columns, setColumns, readOnly,
  } = props;

  const onMoveColumn = useCallback((movedColumns) => {
    onMoveColumn1(setColumns, movedColumns);
  }, [setColumns]);

  const realColumns = columns.filter((c) => c.dataType !== 'rowIndex');

  return (
    <SimpleMovableList
      listData={realColumns}
      keyName="uuid"
      ItemRenderer={ColumnListItem}
      vertical
      onListChange={onMoveColumn}
      itemProps={{
        options,
        columns,
        setColumns,
        readOnly,
      }}
      locked={readOnly || options.lockTableHead}
    />
  );
}

//--------------------------------------------------------------------
// Component: ConfigPanel
//--------------------------------------------------------------------

function ConfigPanel(props, ref) {
  const {
    options,
    columns,
    setColumns,
  } = useContext(CellRendererContext);

  const {t} = useTranslation();

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 240,
    minHeight: 145,
    zIndex: 1,
  });

  useToggleablePanel(ref, setPanelState);

  const headLocked = options.lockTableHead;

  let allInvisible = true;
  for (const col of columns) {
    if (!col.invisible) {
      allInvisible = false;
      break;
    }
  }

  let allLocked = true;
  for (const col of columns) {
    if (!col.locked) {
      allLocked = false;
      break;
    }
  }

  function onClickAddColumn(e) {
    if (options.lockTableHead) {
      message.error('表头处于锁定状态，无法新增字段');
      return;
    }

    setColumns(utils.addNewColumnToTable);

    setTimeout(() => {
      const overlay = e.target.closest('.table-config-overlay');
      const div = overlay.querySelector('.all-columns');
      div.scrollTo(div.scrollWidth, div.scrollHeight);
    }, 100);
  }

  function onClickToggleAllVisibility() {
    if (options.lockTableHead) {
      message.error('表头处于锁定状态，无法修改字段可见性');
      return;
    }

    setColumns((oldColumns) => {
      const newColumns = [];

      let currentAllVisible = true;
      for (const col of oldColumns) {
        if (col.invisible) {
          currentAllVisible = false;
          break;
        }
      }

      const invisible = !!currentAllVisible;

      for (const col of oldColumns) {
        const newCol = { ...col };
        newCol.invisible = invisible;
        newColumns.push(newCol);
      }

      return newColumns;
    });
  }

  function onClickToggleAllLocked() {
    if (options.lockTableHead) {
      message.error('表头处于锁定状态，无法修改字段锁定状态');
      return;
    }

    setColumns((oldColumns) => {
      const newColumns = [];

      let currentAllLocked = true;
      for (const col of oldColumns) {
        if (!col.locked) {
          currentAllLocked = false;
          break;
        }
      }

      const locked = !currentAllLocked;

      for (const col of oldColumns) {
        const newCol = { ...col };
        newCol.locked = locked;
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
      <div className="table-config-overlay">
        <div className="card-title">
          <span style={{ marginRight: '5px' }}>{t('current config')}</span>
          {/* <icons.IconHelp /> */}
        </div>
        <Divider />

        <div className="all-columns">
          <div className="one-column-box">
            <div className="one-column">
              <div className="name">
                {t('all fields')}
              </div>

              <div className="visible" onClick={onClickToggleAllVisibility}>
                <Tooltip
                  title={<span style={{ fontSize: '12px', fontWeight: 'bold' }}>Hidden</span>}
                  color="#333"
                  overlayInnerStyle={{
                    margin: 0, padding: '3px 8px', color: '#fff', minHeight: 0,
                  }}
                >
                  <span>
                    {allInvisible
                      ? <icons.IconInvisible /> : <icons.IconVisible />}
                  </span>
                </Tooltip>
              </div>

              {/* <div className="visible" onClick={onClickToggleAllLocked}>
                <Tooltip
                  title={<span style={{ fontSize: '12px', fontWeight: 'bold' }}>锁定所有列</span>}
                  color="#333"
                  overlayInnerStyle={{
                    margin: 0, padding: '3px 8px', color: '#fff', minHeight: 0,
                  }}
                >
                  <span>
                    {allLocked
                      ? <icons.IconLocked /> : <icons.IconUnlocked />}
                  </span>
                </Tooltip>
              </div> */}
            </div>
          </div>

          <ColumnList
            options={options}
            columns={columns}
            setColumns={setColumns}
          />
        </div>

        {
          !headLocked
          && (
            <>
              <Divider />

              <div className="one-column-box">
                <div className="one-column" style={{ cursor: 'pointer' }}>
                  <div className="icon">
                    <icons.IconPlus />
                  </div>
                  <div className="name" onClick={onClickAddColumn}>
                    {t('new field')}
                  </div>
                </div>
              </div>
            </>
          )
        }
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(ConfigPanel);
