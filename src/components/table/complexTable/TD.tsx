// @ts-nocheck
import React from 'react';

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

  function onContextMenu(e) {
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

  return (
    <div
      className={className}
      onContextMenu={onContextMenu}
      style={{ width, ...style }}
    >
      <div className="td-content">
        {children}
      </div>
    </div>
  );
}

export default TD;
