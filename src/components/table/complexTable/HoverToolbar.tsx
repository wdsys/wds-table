// @ts-nocheck
import React, { useContext } from 'react';

import { message, Tooltip } from 'antd';

import {
  CellRendererContext,
} from './contexts';

import * as icons from './SvgIcons';
import * as utils from './utils';

//--------------------------------------------------------------------
// Utility functions
//--------------------------------------------------------------------

/**
 * 找出row在rows数组中的index。
 * 正常情况下，返回值的范围是 [0, rows.length - 1]；
 * 如果row不在rows数组中，则返回-1。
 */
function getRowIndex(row, rows) {
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].uuid === row.uuid) {
      return i;
    }
  }

  return -1;
}

/**
 * 根据uuid找出row在rows数组中的index。
 * 正常情况下，返回值的范围是 [0, rows.length - 1]；
 * 如果rowUUID不在rows数组中，则返回-1。
 */
function getRowIndexByUUID(rowUUID, rows) {
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].uuid === rowUUID) {
      return i;
    }
  }

  return -1;
}

/**
 * 计算每一行的坐标。
 */
function getAllRowsCoords() {
  const rowsCoords = [];

  document.querySelectorAll('.table-area .tr').forEach((item, i) => {
    const rect = item.getBoundingClientRect();
    const left = rect.left + window.scrollX;
    const top = rect.top + window.scrollY;
    const middleY = top + rect.height * 0.5;
    rowsCoords.push([i, left, top, rect.width, rect.height, middleY]);
  });

  return rowsCoords;
}

/**
 * 根据Y坐标计算鼠标当前位于哪一行。
 */
function calcRowIndexByYCoord(y, rowsCoords) {
  let rowIndex = -1;

  if (rowsCoords.length < 1) { // no rows
    return rowIndex;
  }

  for (let i = 0; i < rowsCoords.length; i += 1) {
    const [index, left, top, width, height, middleY] = rowsCoords[i];
    const bottom = top + height;

    if (y >= top && y < middleY) {
      rowIndex = i;
      break;
    } else if (y >= middleY && y < bottom) {
      rowIndex = i + 1;
      break;
    } else {
      rowIndex = i + 1;
    }
  }

  return rowIndex;
}

/**
 * 高亮显示拖拽目标行。
 */
function highlightDraggingTargetRow(newRowIndex) {
  document.querySelectorAll('.table-area .tr').forEach((item, i) => {
    if (i === newRowIndex) {
      item.style.borderTop = '1px solid #ff7b93';
    } else {
      item.style.borderTop = 'none';
    }
  });
}

/**
 * 取消高亮显示拖拽目标行。
 */
function unhighlightDraggingTargetRow() {
  document.querySelectorAll('.table-area .tr').forEach((item, i) => {
    item.style.borderTop = 'none';
  });
}

//--------------------------------------------------------------------
// Components
//--------------------------------------------------------------------

function TooltipTitle1() {
  return (
    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
      点击
      {' '}
      <span style={{ color: '#999' }}>向下新增一行</span>
    </span>
  );
}

function TooltipButton1({ children }) {
  return (
    <Tooltip
      title={<TooltipTitle1 />}
      color="#333"
      open={false}
      mouseEnterDelay={1.0}
      mouseLeaveDelay={0.1}
    >
      {children}
    </Tooltip>
  );
}

function TooltipTitle2() {
  return (
    <div>
      <div>
        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
          点击
          {' '}
          <span style={{ color: '#999' }}>打开菜单</span>
        </span>
      </div>
      <div>
        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
          拖拽
          {' '}
          <span style={{ color: '#999' }}>可移动位置</span>
        </span>
      </div>
    </div>
  );
}

function TooltipButton2({ children }) {
  return (
    <Tooltip
      title={<TooltipTitle2 />}
      color="#333"
      open={false}
      mouseEnterDelay={1.0}
      mouseLeaveDelay={0.1}
    >
      {children}
    </Tooltip>
  );
}

const HoverToolbar = React.memo(({ rowUUID }) => {
  const {
    options,
    tableInfo,
    pagerState,
  } = useContext(CellRendererContext);

  function onClickInsertBelow() {
    if (tableInfo?.type === 1) {
      message.error('表格为协调表，无法从此处新增行');
      return;
    }

    if (options.lockFullTable) {
      message.error('表格处于锁定状态，无法新增行');
      return;
    }

    const detail = {
      action: 'insertRowBelowRowUUID',
      rowUUID,
    };

    const ev = new CustomEvent('modifyTable', { detail });
    window.dispatchEvent(ev);
  }

  function onClickRowMover(e) {
    const rect = e.target.getBoundingClientRect();

    const position = {
      left: rect.left - 40,
      top: rect.top + 30,
      width: rect.width,
      height: rect.height,
    };

    const detail = {
      panelType: 'RowPanel',
      action: 'toggle',
      placement: 'right',
      position,
      row: rowUUID,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  let isDragging = false;

  function onDrag(e) {
    if (!isDragging) {
      return;
    }
    /// //// newRowIndex
    const rowsCoords = getAllRowsCoords();
    const newRowIndex = calcRowIndexByYCoord(e.pageY, rowsCoords);
    if (newRowIndex === -1) {
      return;
    }

    highlightDraggingTargetRow(newRowIndex);
  }

  function onDragStart(e) {
    if (options.lockFullTable) {
      message.error('表格处于锁定状态，无法移动');
      return;
    }
    isDragging = true;
    document.addEventListener('drag', onDrag);
  }

  function onDragEnd(e) {
    if (!isDragging) {
      return;
    }
    isDragging = false;
    document.removeEventListener('drag', onDrag);

    unhighlightDraggingTargetRow();

    /// //// newRowIndex
    const rowsCoords = getAllRowsCoords();
    const newRowIndex = calcRowIndexByYCoord(e.pageY, rowsCoords);
    const { page, pageSize } = pagerState;

    const detail = {
      action: 'moveRowToNewIndex',
      rowUUID,
      newIndex: newRowIndex + (page - 1) * pageSize,
    };

    const ev = new CustomEvent('modifyTable', { detail });
    window.dispatchEvent(ev);
  }

  return (
    <div className="hover-tool-buttons">
      <div className="hover-tool-btn">
        <div>
          <span className="plus" onClick={onClickInsertBelow}>
            <icons.IconCross />
          </span>
        </div>
      </div>

      <div className="hover-tool-btn">
        <div>
          <span
            className="mover"
            onClick={onClickRowMover}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            draggable
          >
            <icons.IconMover />
          </span>
        </div>
      </div>
    </div>
  );
});

export default HoverToolbar;
