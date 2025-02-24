// @ts-nocheck
import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from 'react';

import {
  message,
  Tooltip,
} from 'antd';

import {
  CellRendererContext,
  LocalStateContext,
} from './contexts';

import { ColumnIcon, DataTypes } from './dataType';
import Splitter from './Splitter';
import * as icons from './SvgIcons';
import * as utils from './utils';

//--------------------------------------------------------------------
// Utility functions
//--------------------------------------------------------------------

function updateColumnScrollBar() {
  const table = document.querySelector('.complex-table');
  if (!table) {
    return;
  }

  const scrollBar = table.querySelector('.column-scroll-bar');
  const div = table.querySelector('.scroll-columns');

  if (scrollBar && div) {
    if (div.clientWidth >= div.scrollWidth) {
      scrollBar.style.display = 'none';
    } else {
      scrollBar.style.display = 'block';

      const fg = table.querySelector('.scroll-fg');
      const visibleRatio = div.clientWidth / div.scrollWidth;
      const fgWidth = Math.floor(visibleRatio * scrollBar.clientWidth);
      fg.style.width = `${fgWidth}px`;

      if (div.scrollLeft <= 0) {
        fg.style.left = '0px';
      }
    }
  }
}

//--------------------------------------------------------------------
// Hooks
//--------------------------------------------------------------------

function changeColumnWidth(setColumns, colUUID, newWidth) {
  setColumns((oldColumns) => {
    const newColumns = [];

    for (const col of oldColumns) {
      if (col.uuid === colUUID) {
        const newCol = { ...col };
        newCol.width = newWidth;
        newColumns.push(newCol);
      } else {
        newColumns.push(col);
      }
    }

    return newColumns;
  });
}

function useColumnResizer(setColumns) {
  function onSplitterMouseMove(e) {
    const { colUUID, width } = e.detail;
    changeColumnWidth(setColumns, colUUID, width);
  }

  useEffect(() => {
    window.addEventListener('splitterMouseMove', onSplitterMouseMove);

    return () => {
      window.removeEventListener('splitterMouseMove', onSplitterMouseMove);
    };
  }, []);
}

//--------------------------------------------------------------------
// Table head components
//--------------------------------------------------------------------

/**
 * 暂时没有使用
 */
function THeadTooltip(props) {
  const { isRowIndexColumn, children } = props;

  return (
    <Tooltip
      title={(
        <div>
          {!isRowIndexColumn
            && (
              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  点击
                  {' '}
                  <span style={{ color: '#999' }}>打开设置</span>
                </span>
              </div>
            )}

          <div>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
              拖拽
              {' '}
              <span style={{ color: '#999' }}>调整位置</span>
            </span>
          </div>
        </div>
      )}
      color="#333"
      mouseEnterDelay={1.0}
    >
      {children}
    </Tooltip>
  );
}

const TH = React.memo((props) => {
  const {
    isFirstColumn,
    locked,
    uuid: colUUID,
    name: colName,
    dataType,
    width: colWidth,
    explainInfo,
    tableType,
    sheetUUID,
    projectId,
    client,
  } = props;

  const isRowIndexColumn = (dataType === 'rowIndex');
  const [width, setWidth] = useState(colWidth || 100);

  useEffect(() => {
    if (colWidth !== width) {
      setWidth(colWidth || width);
    }
  }, [colWidth]);

  const onClick = useCallback((e) => {
    if (isRowIndexColumn) {
      return;
    }

    const elem = e.target.closest('.th-content');
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
      placement: 'bottom',
      position,
      column: colUUID,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }, [isRowIndexColumn, colUUID]);

  let className = 'th';
  if (isFirstColumn) {
    className += ' first-th';
  }

  function onClickColExplain(e) {
    e.stopPropagation();

    const detail = {
      panelType: 'ColExplainPanel',
      action: 'show',
      column: props,
      disabled: true,
    };

    const event = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(event);
  }

  function saveVirtualConfig(newWidth) {
    if (tableType === 2) {
      const params = {
        project_id: projectId,
        sheet_uuid: sheetUUID,
        col_uuid: colUUID,
        col_width: newWidth,
      };

      client.putVirtualColConfig(params);
    }
  }

  function getIcon() {
    const iconFn = DataTypes?.[dataType]?.icon;
    if (iconFn) {
      return iconFn?.();
    }
    return (
      <ColumnIcon dataType={dataType} />
    );
  }

  return (
    <div id={`column-${colUUID}`} className={className} style={{ width }}>
      <div className="th-content" onClick={(e) => onClick(e)}>
        {!isRowIndexColumn
          && (
            <span className="column-icon">
              {getIcon()}
            </span>
          )}

        <span className="column-name">
          {colName}
        </span>

        {/* Array.isArray(explainInfo) 兼容旧数据 */}
        {
          !!(Array.isArray(explainInfo) ? explainInfo?.length : explainInfo) && (
            <span className="column-explain" title="列说明" onClick={onClickColExplain}>
              <icons.IconExplain />
            </span>
          )
        }

        {
          (locked && dataType !== 'rowIndex')
          && (
            <span className="column-lock" title="此列被锁定">
              <icons.IconLocked />
            </span>
          )
        }
      </div>
      {/* 标未锁定 或 非需求表（协调表/虚拟表） */}
      {
        (!locked || !!tableType)
        && <Splitter columnKey={colUUID} saveVirtualConfig={saveVirtualConfig} />
      }
    </div>
  );
});

function THead(props) {
  const { lastFixedColumnIndex } = props;

  const {
    options,
    columns,
    setColumns,
    tableInfo,
  } = useContext(CellRendererContext);

  useColumnResizer(setColumns);

  useEffect(()=>{
    setTimeout(updateColumnScrollBar, 100)
  })

  useEffect(() => {
    // setTimeout(updateColumnScrollBar, 100);
    updateColumnScrollBar();
    window.addEventListener('resize', updateColumnScrollBar);
    return () => {
      window.removeEventListener('resize', updateColumnScrollBar);
    };
  }, []);

  const onClickAddColumn = useCallback(() => {
    if (options.lockTableHead || options.lockFullTable) {
      message.error('表头处于锁定状态，无法新增列');
      return;
    }

    setColumns(utils.addNewColumnToTable);

    setTimeout(() => {
      const div = document.querySelector('.table-area');
      if (div) {
        div.scrollTo(div.scrollWidth, div.scrollTop);

        // 表格
        const items = document.querySelectorAll('.scroll-columns');
        if (items.length <= 0) {
          return;
        }

        for (let i = 0; i < items.length; i += 1) {
          const item = items[i];
          item.scrollTo(item.scrollWidth, item.scrollTop);
        }

        // 底部滚动条
        const table = document.querySelector('.complex-table');
        const div1 = table?.querySelector('.scroll-bg');
        const div2 = table?.querySelector('.scroll-fg');

        const slotWidth = parseInt(div1.clientWidth, 10) || 0;
        const moverWidth = parseInt(div2.clientWidth, 10) || 0;
        if (slotWidth <= 0 || moverWidth <= 0) {
          return;
        }
        const newLeft = slotWidth - moverWidth;
        div2.style.left = `${newLeft}px`;
      }
    }, 100);
  }, [options, setColumns]);

  const fixedColumns = [];
  const scrollColumns = [];

  {
    let isFirstColumn = true;
    for (let i = 0; i < columns.length; i += 1) {
      const col = columns[i];
      if (col.invisible) {
        continue;
      }

      const locked = options.lockFullTable || options.lockTableHead || col.locked;

      const elem = (
        <TH
          key={i}
          {...col}
          isFirstColumn={isFirstColumn}
          locked={locked}
          tableType={tableInfo.type}
          sheetUUID={tableInfo.uuid}
          AllDataTypes={DataTypes}
        />
      );

      if (i <= lastFixedColumnIndex) {
        fixedColumns.push(elem);
      } else {
        scrollColumns.push(elem);
      }

      isFirstColumn = false;
    }
  }

  const thPlus = useMemo(() => (
    <div className="column-plus" onClick={onClickAddColumn}>
      <icons.IconPlus />
    </div>
  ), [onClickAddColumn]);

  return (
    <div className="thead">

      <div className="fixed-columns">
        <div className="column-tool" />

        {fixedColumns}
      </div>

      <div className="scroll-columns">
        {scrollColumns}

        {thPlus}
      </div>
    </div>
  );
}

export default THead;
