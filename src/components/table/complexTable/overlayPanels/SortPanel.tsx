// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';
import { produce } from 'immer';

import React, {
  useState,
  useContext,
} from 'react';

import {
  message,
  Divider,
  Select,
} from 'antd';

import {
  CellRendererContext,
} from '../contexts';

import { ColumnIcon } from '../dataType';
import { SimpleMovableList, MoveHandler } from '../MovableList';
import * as icons from '../SvgIcons';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

import { getSortableColumns, getFirstSortableColumn } from '../RowSorter';

function SortKey(props) {
  const {
    columns,
    keyName,
    itemData,
    onChangeSortKey,
    onRemoveSortKey,

    moving,
    translate,
    onMoveStart,
    onMoveEnd,
    onMoving,
  } = props;

  let column;
  for (const col of columns) {
    if (col.uuid === itemData.colUUID) {
      column = col;
      break;
    }
  }

  if (!column) {
    return null;
  }

  function onChangeColumn(value) {
    if (!onChangeSortKey) {
      return;
    }

    const newColumn = columns.filter((c) => c.uuid === value)[0];
    if (!newColumn) {
      return;
    }

    onChangeSortKey(itemData[keyName], {
      colUUID: value,
    });
  }

  function onChangeOrder(value) {
    if (!onChangeSortKey) {
      return;
    }

    onChangeSortKey(itemData[keyName], {
      order: value,
    });
  }

  function onClickDelete() {
    if (!onRemoveSortKey) {
      return;
    }

    onRemoveSortKey(itemData[keyName]);
  }

  const boxClassList = ['one-condition-box'];
  if (moving) {
    boxClassList.push('moving');
  }

  const sortableColumns = getSortableColumns(columns);

  return (
    <div
      className={boxClassList.join(' ')}
      style={{ transform: `translateY(${translate}px)` }}
    >
      <div className="one-condition">
        <MoveHandler
          itemKey={itemData[keyName]}
          className="mover"
          boxClassName="one-condition-box"
          onMoveStart={onMoveStart}
          onMoving={onMoving}
          onMoveEnd={onMoveEnd}
        >
          <icons.IconMover />
        </MoveHandler>

        <div className="column">
          <Select value={column.uuid} onChange={onChangeColumn}>
            {
              sortableColumns.map((col) => (
                <Select.Option key={col.uuid} value={col.uuid}>
                  <span className="column-name">
                    <span className="icon">
                      <ColumnIcon dataType={col.dataType} />
                    </span>
                    <span className="text">{col.name}</span>
                  </span>
                </Select.Option>
              ))
            }
          </Select>
        </div>

        <div className="operator">
          <Select value={itemData.order || 0} onChange={onChangeOrder}>
            <Select.Option key={0} value={0}>
              <span className="text">升序</span>
            </Select.Option>
            <Select.Option key={1} value={1}>
              <span className="text">降序</span>
            </Select.Option>
          </Select>
        </div>

        <div style={{ flexGrow: 1 }} />

        <div className="other">
          <div className="button" onClick={onClickDelete}>
            <icons.IconMultiply />
          </div>
        </div>
      </div>
    </div>
  );
}

function SortPanel(props, ref) {
  const {
    options,
    setOptions,
    columns,
  } = useContext(CellRendererContext);

  const {
    sortKeys = [],
  } = options.sorting || {};

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 300,
    minHeight: 120,
  });

  useToggleablePanel(ref, setPanelState);

  function onAddSortKey() {
    const column = getFirstSortableColumn(columns);
    if (!column) {
      message.error('当前表格中的字段类型不支持排序');
      return;
    }

    const newSortKey = {
      uuid: uuidv4(),
      colUUID: column.uuid,
      order: 0, // 0: ASC, 1: DESC
    };

    setOptions((oldOptions) => {
      const {
        sortKeys: oldSortKeys = [],
      } = oldOptions.sorting || {};

      return {
        ...oldOptions,
        sorting: {
          sortKeys: [...oldSortKeys, newSortKey],
        },
      };
    });
  }

  function onClearSortKeys() {
    setOptions(produce((draft) => {
      draft.sorting = {
        sortKeys: [],
      };
    }));
  }

  function onMoveSortKey(newSortKeys) {
    setOptions((oldOptions) => ({
      ...oldOptions,
      sorting: {
        sortKeys: newSortKeys,
      },
    }));
  }

  function onChangeSortKey(uuid, props1) {
    setOptions((oldOptions) => {
      const {
        sortKeys: oldSortKeys = [],
      } = oldOptions.sorting || {};

      const newSortKeys = [];
      for (const item of oldSortKeys) {
        if (item.uuid === uuid) {
          newSortKeys.push({
            ...item,
            ...props1,
          });
        } else {
          newSortKeys.push(item);
        }
      }

      return {
        ...oldOptions,
        sorting: {
          sortKeys: newSortKeys,
        },
      };
    });
  }

  function onRemoveSortKey(uuid) {
    setOptions((oldOptions) => {
      const {
        sortKeys: oldSortKeys = [],
      } = oldOptions.sorting || {};

      return {
        ...oldOptions,
        sorting: {
          sortKeys: oldSortKeys.filter((c) => c.uuid !== uuid),
        },
      };
    });
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="table-filter-overlay" style={{ width: 300 }}>
        <div className="card-title">
          <span style={{ marginRight: '5px' }}>
            <span>当前视图排序设置</span>
          </span>
          <icons.IconHelp />
        </div>

        <Divider />

        {
          sortKeys.length > 0
            ? (
              <div className="all-conditions">
                <SimpleMovableList
                  listData={sortKeys}
                  keyName="uuid"
                  ItemRenderer={SortKey}
                  itemProps={{
                    columns,
                    onChangeSortKey,
                    onRemoveSortKey,
                  }}
                  vertical
                  onListChange={onMoveSortKey}
                />
              </div>
            )
            : (
              <div className="all-conditions">
                <div className="one-condition-box">
                  <div className="one-condition">
                    <div className="name">
                      <span style={{ color: '#8E8E8E' }}>未设置排序规则</span>
                    </div>
                  </div>
                </div>
              </div>
            )
        }

        <Divider />

        <div className="one-condition-box">
          <div className="one-condition button-group">
            <div className="button" onClick={onAddSortKey}>
              <div className="icon">
                <icons.IconPlus />
              </div>
              <div className="name">
                新增排序规则
              </div>
            </div>
            <div className="button" onClick={onClearSortKeys}>
              <div className="icon">
                <icons.IconDelete />
              </div>
              <div className="name">
                清除排序规则
              </div>
            </div>
          </div>
        </div>
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(SortPanel);
