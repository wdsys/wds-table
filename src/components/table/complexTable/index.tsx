// @ts-nocheck
import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useMemo,
} from 'react';

import { Pagination, Button, message } from 'antd';
import { VerticalLeftOutlined } from '@ant-design/icons';

import defaultCellRenderers from './Cell';
import Toolbar from './Toolbar';
import HoverToolbar from './HoverToolbar';
import Overlay from './overlayPanels/Overlay';
import ColumnScrollBar from './ColumnScrollBar';
import THead from './THead';
import TD from './TD';
import filterRow from './RowFilter';
import { simplifySortKeys, makeRowComparator } from './RowSorter';
import {
  scrollX,
  WrapUseDataInput,
  WrapUseAutoSaver,
  WrapUseManualSaver,
  WrapUseRowHighlighter,
  WrapUseKeyboardScroller,
  WrapUseTableOperations,
  WrapUseMoveSelectedRows,
  WrapUseCopySelectedRowsToClipboard,
  WrapUseDevicePixelRatioWatcher,
  WrapUseTableScroller,
  WrapUseTableFoldAndUnfold,
  WrapUseSerialNumber,
  WrapUseCheckRow,
  WrapuseDeleteSelected,
} from './TableHooks';
// import { useMultiClientMutex } from './MultiClientMutex';
import * as icons from './SvgIcons';
import * as utils from './utils';

import {
  InterfaceFunctionContextProvider,
  CellRendererContext,
  CellRendererContextProvider,
  OverlayStateContextProvider,
  SelectedableBlockContextProvider,
  SelectedableBlockContext,
} from './contexts';

import { DefaultData } from './DefaultData';
import { DataTypes } from './dataType';

import './ComplexTable.less';
import { useTranslation } from 'react-i18next';

//--------------------------------------------------------------------
// table body
//--------------------------------------------------------------------

function RowStatus(props) {
  const { row } = props;

  return (
    <div className="row-status-buttons">
      {
        row.locked
          && (
            <div className="row-status-button">
              <div className="icon">
                <icons.IconLocked />
              </div>
            </div>
          )
      }
    </div>
  );
}

const TDInToolColumnMemo = React.memo((props) => {
  const { row } = props;

  return (
    <div className="td column-tool" style={{ width: 64 }}>
      <div className="td-content">
        <RowStatus row={row} />
        <HoverToolbar rowUUID={row.uuid} />
      </div>
    </div>
  );
});

const TDInNewColumnMemo = React.memo(() => (
  <div className="td type-newColumn" style={{ width: 32 }}>
    <div className="td-content" />
  </div>
));

function TdContent(props) {
  const { col, row } = props;
  const Renderer = defaultCellRenderers[col.dataType];

  if (Renderer) {
    return <Renderer {...props} />;
  }
  const value = row?.fields?.[col.uuid];
  return <div>{value}</div>;
}

function TR(props) {
  const {
    row,
    tdList,
    lastFixedColumnIndex,
  } = props;

  const fixedTds = [];
  const scrollTds = [];

  for (let j = 0; j < tdList.length; j += 1) {
    const td = tdList[j];

    if (j <= lastFixedColumnIndex) {
      fixedTds.push(td);
    } else {
      scrollTds.push(td);
    }
  }

  const trKey = `row-${row.uuid}`;

  return (
    <div id={trKey} className="tr tr-data">

      <div className="fixed-columns">
        <TDInToolColumnMemo row={row} />

        {fixedTds}
      </div>

      <div className="scroll-columns">
        {scrollTds}

        <TDInNewColumnMemo />
      </div>
    </div>
  );
}

function renderOneColumn(props, DataTypes) {
  const {
    colIndex,
    col,
    isFirstColumn,
    rows,
    currentPageRowUUIDs,
  } = props;

  if (col.dataType === 'rowIndex') {
    const { renderOneColumn: render } = DataTypes.rowIndex;
    return render(props);
  } if (col.dataType === 'text') {
    const { renderOneColumn: render } = DataTypes.text;
    return render(props);
  } if (col.dataType === 'number') {
    const { renderOneColumn: render } = DataTypes.number;
    return render(props);
  } if (col.dataType === 'select') {
    const { renderOneColumn: render } = DataTypes.select;
    return render(props);
  } if (col.dataType === 'multiSelect') {
    const { renderOneColumn: render } = DataTypes.multiSelect;
    return render(props);
  } if (col.dataType === 'checkbox') {
    const { renderOneColumn: render } = DataTypes.checkbox;
    return render(props);
  } if (col.dataType === 'date') {
    const { renderOneColumn: render } = DataTypes.date;
    return render(props);
  } if (col.dataType === 'file') {
    const { renderOneColumn: render } = DataTypes.file;
    return render(props);
  } if (col.dataType === 'hyperlink') {
    const { renderOneColumn: render } = DataTypes.hyperlink;
    return render(props);
  } if (col.dataType === 'relatedRequirements') {
    const { renderOneColumn: render } = DataTypes.relatedRequirements;
    return render(props);
  } if (col.dataType === 'linkedRequirements') {
    const { renderOneColumn: render } = DataTypes.linkedRequirements;
    return render(props);
  } if (col.dataType === 'treeNode') {
    const { renderOneColumn: render } = DataTypes.treeNode;
    return render(props);
  } if (col.dataType === 'views') {
    const { renderOneColumn: render } = DataTypes.views;
    return render(props);
  } if (col.dataType === 'viewLinks') {
    const { renderOneColumn: render } = DataTypes.viewLinks;
    return render(props);
  } if (col.dataType === 'requirementStatus') {
    const { renderOneColumn: render } = DataTypes.requirementStatus;
    return render(props);
  } if (col.dataType === 'currentCoorOrder') {
    const { renderOneColumn: render } = DataTypes.currentCoorOrder;
    return render(props);
  } if (col.dataType === 'signature') {
    const { renderOneColumn: render } = DataTypes.signature;
    return render(props);
  } if (col.dataType === 'serialNumber') {
    const { renderOneColumn: render } = DataTypes.serialNumber;
    return render(props);
  } if (col.dataType === 'notification') {
    const { renderOneColumn: render } = DataTypes.notification;
    return render(props);
  } if (col.dataType) {
    const dataType = DataTypes[col.dataType];
    if (dataType) {
      return dataType.renderOneColumn(props);
    }
  }

  const Renderer = defaultCellRenderers[col.dataType];

  const tdList = [];

  for (let i = 0; i < rows.length; i += 1) {

    if(currentPageRowUUIDs.has(rows[i].uuid)){
      const row = {
        ...rows[i],
        rowIndex: i,
      };
  
      const content = <TdContent col={col} row={row} />;
  
      const key = `${i}-${colIndex}`;
  
      const props1 = {
        colUUID: col.uuid,
        rowUUID: row.uuid,
        dataType: col.dataType,
        isFirstColumn,
        width: col.width,
      };
  
      const td = (
        <TD key={key} {...props1}>
          {content}
        </TD>
      );
  
      tdList.push(td);
    }
  }
  return tdList;
}

function renderVisibleColumns(columns, rows, options, currentPageRowUUIDs) {
  const renderedColumns = [];

  let isFirstColumn = true;

  for (let j = 0; j < columns.length; j += 1) {
    const col = columns[j];

    if (col.invisible) {
      continue;
    }
    const tdList = renderOneColumn({
      readOnly: options.readOnly,
      lockFullTable: options.lockFullTable,
      pageRowUUIDs: options.pageRowUUIDs,
      colIndex: j,
      col,
      isFirstColumn,
      rows,
      columns,
      currentPageRowUUIDs,
    }, options.DataTypes);

    renderedColumns.push(tdList);
    isFirstColumn = false;
  }
  return renderedColumns;
}

const LastTRMemo = React.memo((props) => {
  const { columns, setRows, options } = props;
  const {t} = useTranslation();
  function onClick() {
    utils.appendNewRow(setRows, columns);

    // 有过滤条件，可能会引发新增行被隐藏情况
    if (options?.filter?.conditions?.length) {
      message.info('当前表格存在过滤条件，新增行可能被隐藏。');
    }
  }

  let totalWidth = 32;
  for (const col of columns) {
    if (!col.invisible) {
      totalWidth += col.width;
    }
  }

  return (
    <div className="tr tr-plus">
      <div className="td column-tool" />

      <div className="row-plus" style={{ width: totalWidth }} onClick={onClick}>
        <icons.IconPlus />
        {' '}
        {t('new row')}
      </div>
    </div>
  );
});

function collectFoldedRowUUIDs(columns, rows) {
  const result = new Set();

  const roots = utils.createTreeFromTable(columns, rows);

  for (const row of rows) {
    const node = utils.findTreeNodeInRoots(roots, row.uuid);
    if (node && !utils.isTreeNodeVisible(node)) {
      result.add(row.uuid);
    }
  }

  return result;
}

function syncColumnWidthsToDOM(columns) {
  if (!columns?.length) {
    return;
  }

  // const t1 = new Date().getTime();

  const tableArea = document.querySelector('.table-area');
  if (!tableArea) {
    return;
  }

  const tbody = tableArea.querySelector('.tbody');
  if (!tbody) {
    return;
  }

  const trList = tbody.querySelectorAll('.tr-data');
  if (trList.length < 1) {
    return;
  }

  // console.log('trList:', trList);

  const visibleColumns = [];
  for (const col of columns) {
    if (col.invisible) {
      continue;
    }

    if (col.dataType === 'rowIndex') {
      continue;
    }

    visibleColumns.push(col.width || 60);
  }

  // console.log('visibleColumns:', visibleColumns);

  if (visibleColumns.length < 1) {
    return;
  }

  // console.log('Sync changed column widths to DOM');

  const colIndices = new Set();
  const colWidths = [];

  trList.forEach((tr, rowIndex) => {
    // const tdList = tr.querySelectorAll(
    // '.td:not(.column-tool):not(.type-rowIndex):not(.type-newColumn)');
    const tdList = tr.querySelectorAll('.td-data');

    if (rowIndex === 0) {
      for (let i = 0; i < tdList.length; i += 1) {
        const td = tdList[i];
        const width = visibleColumns[i];
        const cssWidth = `${width}px`;
        if (td.style.width !== cssWidth) {
          colIndices.add(i);
          colWidths[i] = cssWidth;
        }
      }
    }

    for (const i of colIndices) {
      const td = tdList[i];
      td.style.width = colWidths[i];
    }
  });

  // const t2 = new Date().getTime();
  // const dt = t2 - t1;
  // console.log(`time to sync column widths: ${dt}ms`);
}

function syncColumnWidthsToAllRows(columns) {
  if (!columns?.length) {
    return;
  }

  // const t1 = new Date().getTime();

  const tableArea = document.querySelector('.table-area');
  if (!tableArea) {
    return;
  }

  const tbody = tableArea.querySelector('.tbody');
  if (!tbody) {
    return;
  }

  const trList = tbody.querySelectorAll('.tr-data');
  if (trList.length < 1) {
    return;
  }

  // console.log('trList:', trList);

  const visibleColumns = [];
  for (const col of columns) {
    if (col.invisible) {
      continue;
    }

    visibleColumns.push(col.width || 60);
  }

  // console.log('visibleColumns:', visibleColumns);

  if (visibleColumns.length < 1) {
    return;
  }

  // console.log('Sync changed column widths to DOM');

  trList.forEach((tr, rowIndex) => {
    const tdList = tr.querySelectorAll('.type-rowIndex, .td-data');

    for (let i = 0; i < tdList.length; i += 1) {
      const td = tdList[i];
      const width = visibleColumns[i];
      td.style.width = `${width}px`;
    }
  });

  // const t2 = new Date().getTime();
  // const dt = t2 - t1;
  // console.log(`time to sync column widths: ${dt}ms`);
}

function TableToolBar() {
  const { rows } = useContext(CellRendererContext);

  const [clientHeight, setClientHeight] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);

  const table = document.querySelector('.complex-table');

  const tbody = table?.querySelector?.('.tbody');

  useEffect(() => {
    if (rows?.length && tbody) {
      setClientHeight(tbody?.clientHeight || 0);
      setScrollHeight(tbody?.scrollHeight || 0);
    }
  }, [rows, tbody]);

  if (!table) {
    return null;
  }

  function handleTableBackTop() {
    const event = new CustomEvent('backToTableTop');
    window.dispatchEvent(event);
  }

  function handleTableBackBottom() {
    const event = new CustomEvent('backToTableBottom');
    window.dispatchEvent(event);
  }

  // 可滚动时显示
  if (scrollHeight > clientHeight) {
    return (
      <div className="table-float-btn">
        <Button className="table-top-btn" onClick={handleTableBackTop} title="回到顶部">
          <div className="float-btn-body"><VerticalLeftOutlined style={{ transform: 'rotate(-90deg)' }} /></div>
        </Button>

        <Button className="table-bottom-btn" onClick={handleTableBackBottom} title="回到底部">
          <div className="float-btn-body"><VerticalLeftOutlined style={{ transform: 'rotate(90deg)' }} /></div>
        </Button>
      </div>
    );
  }

  return null;
}

function CheckedRowCount() {
  const { rows, columns } = useContext(CellRendererContext);
  const {t} = useTranslation();

  let count = 0;

  const treeNode = columns?.find?.((c) => c.dataType === 'rowIndex');

  if (treeNode && rows?.length) {
    for (const row of rows) {
      if (row?.fields?.[treeNode.uuid]) {
        count += 1;
      }
    }
  }

  if (!count) {
    return null;
  }

  return (
    <div style={{ marginLeft: '8px', color: '#1890ff', fontWeight: 'bold' }}>
      {t('selectedRows', {count})}
    </div>
  );
}

function TBody(props) {
  const { lastFixedColumnIndex } = props;
  const [selectSheet, setSelectSheet] = useState({});

  const {
    options,
    columns,
    rows,
    setRows,
    pagerState,
    setPagerState,
    tableUUID,
  } = useContext(CellRendererContext);

  const {
    getRows,
    getColumns,
  } = useContext(SelectedableBlockContext);

  //   const {
  //     lockState,
  //   } = useContext(LocalStateContext);

  const refColumns = useRef();
  refColumns.current = columns;

  const colWidths = {};
  for (const col of columns) {
    colWidths[col.uuid] = col.width;
  }

  const colWidthsJSON = JSON.stringify(colWidths);

  // useEffect(() => {
  //   syncColumnWidthsToAllRows(refColumns.current);
  // }, [colWidthsJSON, rows]);

  const foldedRowUUIDs = useMemo(() => collectFoldedRowUUIDs(columns, rows), [columns, rows]);

  const filteredRowUUIDs = new Set();
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    // If the row is folded, skip it.
    if (foldedRowUUIDs.has(row.uuid)) {
      continue;
    }

    const filterTrue = filterRow(options.filter, row, columns);
    if (filterTrue) {
      // If the row matches the filters, collect it.
      filteredRowUUIDs.add(row.uuid);
    }
  }

  const visibleRows = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (filteredRowUUIDs.has(row.uuid)) {
      visibleRows.push(row);
    }
  }

  // 统计此表之中总共有多少行可见（未被折叠，且符合过滤条件）
  const visibleRowCount = visibleRows.length;

  // 排序
  const sortKeys = simplifySortKeys(columns, options);
  if (sortKeys.length > 0) {
    const compareRows = makeRowComparator(columns, sortKeys);
    visibleRows.sort(compareRows);
  }

  const currentRows = [];

  // 计算分页位置
  const { pageSize } = pagerState;
  const pages = Math.ceil(visibleRowCount / pageSize);
  const page = Math.min(pagerState.page, pages) || 1; // between [1, pages]  page最小为1
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, visibleRowCount);

  // 找出当前页的row UUIDs
  const currentPageRowUUIDs = new Set();
  for (let i = 0; i < visibleRowCount; i += 1) {
    if (i < startIndex) {
      continue;
    } else if (i >= endIndex) {
      break;
    }

    const row = visibleRows[i];
    currentPageRowUUIDs.add(row.uuid);
    currentRows.push(row);
  }

  getRows(currentRows);
  getColumns(columns);

  // const t1 = new Date().getTime();
  const renderOptions = {
    ...options,
    pageRowUUIDs: currentPageRowUUIDs,
    // readOnly: lockState.readOnly,
    DataTypes,
  };

  const renderedColumns = renderVisibleColumns(columns, rows, renderOptions, currentPageRowUUIDs);

  // const t2 = new Date().getTime();
  // console.log('t2-t1:', t2-t1);
  const rowMap = {}; // rowUUID -> rowIndex
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    rowMap[row.uuid] = i;
  }

  // 生成行数据
  const trList = [];

  const indexMap =  new Map();
  const currentPageRowUUIDsArray = Array.from(currentPageRowUUIDs);
  // for (let i = 0; i < rows.length; i += 1) {
  for (let i = 0; i < currentPageRowUUIDs.size; i += 1) {

    // const rowIndex = rowMap[row.uuid];
    const currentRowUUID = currentPageRowUUIDsArray[i]
    const row = visibleRows.find(r=>r.uuid === currentRowUUID);
    // 排序 按照currentPageRowUUIDs的顺序
    let index = indexMap.get(currentRowUUID);
    if(typeof index !== 'number'){
      index = renderedColumns[0].findIndex(n=>n.props.rowUUID === currentRowUUID);
      indexMap.set(currentRowUUID, index)
    }
    const tdList = [];

    for (let j = 0; j < renderedColumns.length; j += 1) {
      const col = renderedColumns[j];
      if (col) {
        const td = col[index];
        if (td) {
          tdList.push(td);
        }
      }
    }

    const tr = (
      <TR
        key={`row-${row.uuid}`}
        row={row}
        tdList={tdList}
        lastFixedColumnIndex={lastFixedColumnIndex}
      />
    );

    trList.push(tr);
    if (trList.length >= pageSize) {
      break;
    }
  }
  // const t3 = new Date().getTime();
  // console.log('t3-t2:', t3-t2);

  function onWheel(e) {
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      scrollX(e.deltaY);
    }
  }

  const ref = useRef(null);

  async function getTableNumOfPage() {
    // const res = await client.getTableNumOfPage(tableUUID, localStorage.getItem('userid'));
    // if (res?.code === 0 && res?.data?.value) {
    //   setPagerState({
    //     ...pagerState,
    //     pageSize: Number(res?.data?.value),
    //   });
    // } else {
    //   setPagerState({
    //     ...pagerState,
    //     pageSize: 10,
    //   });
    // }
  }

  useEffect(() => {
    ref.current?.addEventListener('wheel', onWheel);

    return () => {
      ref.current?.removeEventListener('wheel', onWheel);
    };
  }, []);

  // useEffect(() => {
  //   // sheet改变，pageSize设置
  //   if (tableUUID) {
  //     const sheetInfo = userPage.find((item) => item.code === tableUUID) || {};
  //     const pageNum = sheetInfo?.value || 50;
  //     setSelectSheet(sheetInfo);
  //     setPagerState({
  //       ...pagerState,
  //       pageSize: Number(pageNum),
  //     });
  //   }
  // }, [tableUUID]);

  async function onPagerChange(page1, pageSize1) {
    setPagerState({
      page: page1,
      pageSize: pageSize1,
    });
    // 页码改变，存储后台
    // if (pageSize1 === pagerState.pageSize) {
    //   return;
    // }
    // const data = [
    //   {
    //     user_id: selectSheet?.user_id || localStorage.getItem('userid'),
    //     name: selectSheet?.name || 'requirement.pagination.per_page',
    //     code: selectSheet?.code || tableUUID,
    //     type: selectSheet?.type || 'int',
    //     value: pageSize1,
    //   },
    // ];
    // await client.setUserSetting(data);
    // await client.setTableNumOfPage(tableUUID, pageSize, localStorage.getItem('userid'));
  }

  return (
    <>
      <div ref={ref} className="tbody">
        {trList}

        {
          !options.lockFullTable
            && page >= pages
            && <LastTRMemo columns={columns} setRows={setRows} options={options} />
        }
      </div>
      <div className="table-pager">
        <Pagination
          defaultPageSize={10}
          pageSizeOptions={[5, 10, 20, 50, 100, 200, 500, 1000, 2000]}
          total={visibleRowCount}
          current={page}
          pageSize={pagerState.pageSize}
          showSizeChanger
          showQuickJumper
          showTotal={false}
          size="small"
          onChange={onPagerChange}
        />
        <CheckedRowCount />
      </div>

      <div className="table-toolbar">
        <TableToolBar />
      </div>
    </>
  );
}

function getVisibleColumnCount(columns) {
  let visibleColumnCount = 0;

  for (const col of columns) {
    if (!col.invisible) {
      visibleColumnCount += 1;
    }
  }

  return visibleColumnCount;
}

function getLastFixedColumnIndex(columns) {
  let lastFixedColumnIndex = -1;

  for (let i = columns.length - 1; i >= 0; i -= 1) {
    const col = columns[i];
    if (col.fixed) {
      lastFixedColumnIndex = i;
      break;
    }
  }

  return lastFixedColumnIndex;
}

function TableContent() {
  const {
    columns,
  } = useContext(CellRendererContext);

  const visibleColumnCount = getVisibleColumnCount(columns);
  if (!visibleColumnCount) {
    return null;
  }

  const lastFixedColumnIndex = getLastFixedColumnIndex(columns);

  return (
    <>
      <THead lastFixedColumnIndex={lastFixedColumnIndex} />
      <TBody lastFixedColumnIndex={lastFixedColumnIndex} />
    </>
  );
}

function TableContainer(props) {
  const { children } = props;

  const {
    options,
    tableSelectable,
  } = useContext(CellRendererContext);

  const {
    thLineWrap = false,
  } = options || {};

  let className = 'table ';
  className += tableSelectable ? 'selectable' : 'non-selectable';
  className += thLineWrap ? ' th-line-wrap' : 'th-line-nowrap';

  return (
    <div className="table-container">
      <div className={className}>
        {children}
      </div>
    </div>
  );
}

function Table() {
  return (
    <TableContainer>
      <TableContent />
    </TableContainer>
  );
}

// //--------------------------------------------------------------------
// // Top Component
// //--------------------------------------------------------------------

function chainComponents(list, children = null) {
  let result = children;

  for (let i = list.length - 1; i >= 0; i -= 1) {
    const [component, props] = list[i];
    result = React.createElement(component, props, result);
  }

  return result;
}

function HooksContainer(props) {
  return chainComponents([
    [WrapUseDataInput],
    [WrapUseAutoSaver],
    [WrapUseManualSaver],
    [WrapUseRowHighlighter],
    [WrapUseKeyboardScroller],
    [WrapUseTableOperations],
    [WrapUseMoveSelectedRows],
    [WrapUseCopySelectedRowsToClipboard],
    [WrapUseDevicePixelRatioWatcher],
    [WrapUseTableScroller],
    [WrapUseTableFoldAndUnfold],
    [WrapUseSerialNumber],
    [WrapUseCheckRow],
    [WrapuseDeleteSelected],
  ], props.children);
}

// // function useMultiClientMutexWrap(props) {
// //   const {
// //     clientConfig,
// //     userInfo,
// //   } = useContext(PageContext);

// //   const {
// //     projectId,
// //     requirementSetUUID,
// //     tableUUID,
// //   } = props;

// //   const url = new URL(clientConfig.baseURL);
// //   const server = url.origin;

// //   const resource = [
// //     'requirement:',
// //     'projects',
// //     projectId,
// //     'requirements',
// //     requirementSetUUID,
// //     'tables',
// //     tableUUID,
// //   ].join('/');

// //   const clientInfo = {
// //     user: {
// //       id: userInfo.id, // used to identify socket.io client user
// //       code: userInfo.code,
// //       name: userInfo.name, // will show in socket.io client list
// //       email: userInfo.email,
// //       phoneno: userInfo.phoneno,
// //       userIcon: userInfo?.iconpath,
// //     },
// //   };

// //   const condition = [
// //     projectId,
// //     requirementSetUUID,
// //     tableUUID,
// //   ];

// //   return useMultiClientMutex({
// //     server,
// //     resource,
// //     clientInfo,
// //     condition, // condition change will trigger socket.io reconnection
// //     debug: false, // set to true to see debug logs
// //     autoReload: true, // set to true to auto reload data when switch to Writable
// //   });
// // }

function ComplexContainer(props) {
  const { tableInfo } = props;

  let className = 'complex-layer';
  if (tableInfo.type === 1) {
    className += ' complex-layer_coordinationTable';
  }

  return (
    <>
      <div className={className}>
        <Toolbar />

        <div className="table-area">
          <Table />
        </div>

        <ColumnScrollBar />
      </div>

      <Overlay />
    </>
  );
}

export default function ComplexTable(props) {
  const {
    projectId,
    requirementSetUUID,
    tableUUID,
    tableInfo = {},
    tableDoc = DefaultData,
    treeNodeID,
    treeNodeSpace,
    saveTable,
    onParseExcelFile,
    onResolveRequirementURLs,
    onFindLinkedRequirements,
    onRefreshTable,
    onRemoveTable,
    onOpenSubtable,
    onOpenRelatedRequirement,
    getProjectRequirements,
    getTableTemplates,
    getTableTemplateData,
    serverAPIFunctions,
    tableManager,
  } = props;

  const interfaceFunctions = {
    saveTable,
    onParseExcelFile,
    onResolveRequirementURLs,
    onFindLinkedRequirements,
    onRefreshTable,
    onRemoveTable,
    onOpenSubtable,
    onOpenRelatedRequirement,
    getProjectRequirements,
    getTableTemplates,
    getTableTemplateData,
    ...serverAPIFunctions,
  };

  const cellRenderersContextData = {
    projectId,
    requirementSetUUID,
    tableUUID,
    tableDoc,
    treeNodeID,
    treeNodeSpace,
    tableInfo,
    tableManager,
  };

  return (
    <div className="complex-table">
      <InterfaceFunctionContextProvider functions={interfaceFunctions}>
        <CellRendererContextProvider {...cellRenderersContextData}>
          <OverlayStateContextProvider>
            <SelectedableBlockContextProvider>
              <HooksContainer>
                <ComplexContainer tableInfo={tableInfo} />
              </HooksContainer>
            </SelectedableBlockContextProvider>
          </OverlayStateContextProvider>
        </CellRendererContextProvider>
      </InterfaceFunctionContextProvider>
    </div>
  );
}
