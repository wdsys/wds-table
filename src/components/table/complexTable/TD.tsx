// @ts-nocheck
import React, { useContext } from 'react';
import { SelectedableBlockContext } from './contexts';

function TD(props) {
  const {
    colUUID,
    rowUUID,
    dataType,
    isFirstColumn,
    width,
    style = {},
    children,
  } = props;

  const {
    selectedableBlocks,
    onBlockClick,
    onBlockMouseUp,
    getClass,
    onMouseEnter,
  } = useContext(SelectedableBlockContext);

  function onContextMenu(e) {
    // 树节点，查找td-content
    const elem = dataType === 'treeNode' ? e.target.closest('.td-content') : e.target.closest('.cell-view-text');
    e.preventDefault();

    if (dataType === 'rowIndex'
      || dataType === 'viewLinks'
      || dataType === 'linkedRequirements') {
      return;
    }

    const position = {
      left: e.pageX,
      top: e.pageY,
      width: 1,
      height: 1,
      space: 'page',
    };

    const detail = {
      panelType: 'CellPanel',
      action: 'show',
      placement: 'right',
      position,
      colUUID,
      rowUUID,
      cellElem: elem,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  let className = 'td';
  if (isFirstColumn) {
    className += ' first-td';
  }

  if (dataType) {
    className += ` type-${dataType}`;
  }

  if (dataType !== 'rowIndex') {
    className += ' td-data';
  }

  const selectedClass = getClass({ col: colUUID, row: rowUUID }, selectedableBlocks);
  if (selectedClass) {
    className += ` ${selectedClass}`;
  }

  return (
    <div
      className={className}
      onContextMenu={onContextMenu}
      style={{ width, ...style }}
      onMouseDown={(e) => { onBlockClick({ col: colUUID, row: rowUUID }, e); }}
      onMouseUp={(e) => { onBlockMouseUp({ col: colUUID, row: rowUUID }, e); }}
      onMouseEnter={(e) => { onMouseEnter({ col: colUUID, row: rowUUID }, e); }}
    >
      <div className="td-content">
        {children}
      </div>
    </div>
  );
}

export default TD;
