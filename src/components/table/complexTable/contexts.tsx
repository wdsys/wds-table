// @ts-nocheck
import React, {
  useState,
  useMemo,
  useContext,
  createContext,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import {message} from 'antd';

import history from './history';
import { DataTypes } from './dataType';

import * as utils from './utils';

//--------------------------------------------------------------------
// Contexts
//--------------------------------------------------------------------

export const InterfaceFunctionContext = createContext(null);

export const CellRendererContext = createContext(null);

export const OverlayStateContext = createContext(null);

export const LocalStateContext = createContext(null);

export const SheetStampsContext = createContext(null);

export const SelectedableBlockContext = createContext(null);

//--------------------------------------------------------------------
// Context Providers
//--------------------------------------------------------------------

export function InterfaceFunctionContextProvider(props) {
  const {
    functions,
    children,
  } = props;
  return (
    <InterfaceFunctionContext.Provider value={functions}>
      {children}
    </InterfaceFunctionContext.Provider>
  );
}

export function OverlayStateContextProvider(props) {
  const {
    children,
  } = props;

  const providerValue = useMemo(() => ({
  }), []);

  return (
    <OverlayStateContext.Provider value={providerValue}>
      {children}
    </OverlayStateContext.Provider>
  );
}

function hiddenNotExistColumnType(data, allTypes) {
  data.columns?.forEach?.((col) => {
    if (!allTypes?.[col?.dataType]) {
      col.invisible = true;
    }
  });
}

export function CellRendererContextProvider(props) {
  const {
    projectId,
    requirementSetUUID,
    tableUUID,
    tableDoc,
    treeNodeID,
    treeNodeSpace,
    children,
    tableInfo,
    tableManager,
  } = props;

  const [localTable, setLocalTableNoHistory] = useState(tableDoc || {});
  
  hiddenNotExistColumnType(localTable, DataTypes);

  const setLocalTable = (arg, options) => {
    const {
      addHistory = true,
      notifyTableEdited = true,
    } = options || {};

    setLocalTableNoHistory((oldData) => {
      let newData;
      if (typeof arg === 'function') {
        newData = arg(oldData);
      } else {
        newData = arg;
      }

      if (addHistory) {
        const newSnapshot = JSON.stringify(newData);
        const currSnapshot = history.current();
        if (newSnapshot !== currSnapshot) {
          history.push(newSnapshot);
        }
      }

      return newData;
    });

    if (notifyTableEdited) {
      const detail = { tableUUID };
      const event = new CustomEvent('tableEdited', { detail });
      window.dispatchEvent(event);
    }
  };

  const { options } = localTable;

  const setOptions = (arg) => {
    setLocalTable((oldData) => {
      let newOptions;
      if (typeof arg === 'function') {
        newOptions = arg(oldData.options);
      } else {
        newOptions = arg;
      }

      return {
        ...oldData,
        options: newOptions,
      };
    });
  };

  const { columns } = localTable;

  const setColumns = (arg) => {
    setLocalTable((oldData) => {
      let newColumns;
      if (typeof arg === 'function') {
        newColumns = arg(oldData.columns);
      } else {
        newColumns = arg;
      }

      return {
        ...oldData,
        columns: newColumns,
      };
    });
  };

  const { rows } = localTable;

  const setRows = (arg) => {
    setLocalTable((oldData) => {
      let newRows;
      if (typeof arg === 'function') {
        newRows = arg(oldData.rows);
      } else {
        newRows = arg;
      }

      return {
        ...oldData,
        rows: newRows,
      };
    });
  };

  const addAttachment = async (uuid, file) => {
    const uniqueFileName = await tableManager.uploadAttachment(uuid, file);
    return uniqueFileName
  }

  const deleteAttachment = (id: string) => {

  }

  const getAttachment = async (id: string)=>{
    const src = await tableManager.getAttachmentSrc(id);
    return src;
  }

  // const [options, setOptions] = useState(tableDoc.options);
  // const [columns, setColumns] = useState(tableDoc.columns);
  // const [rows, setRows] = useState(tableDoc.rows);
  const [tableSelectable, setTableSelectable] = useState(false);

  const [pagerState, setPagerState] = useState({
    page: 1,
    pageSize: 50,
  });

  const providerValue = useMemo(() => ({
    projectId,
    requirementSetUUID,
    tableUUID,
    treeNodeID,
    treeNodeSpace,
    tableDoc,
    localTable,
    setLocalTable,
    setLocalTableNoHistory,
    options,
    setOptions,
    columns,
    setColumns,
    rows,
    setRows,
    tableSelectable,
    setTableSelectable,
    pagerState,
    setPagerState,
    tableInfo,
    addAttachment,
    deleteAttachment,
    getAttachment,
    tableManager,
  }), [
    projectId,
    requirementSetUUID,
    tableUUID,
    treeNodeID,
    treeNodeSpace,
    tableDoc,
    localTable,
    setLocalTable,
    setLocalTableNoHistory,
    options,
    setOptions,
    columns,
    setColumns,
    rows,
    setRows,
    tableSelectable,
    setTableSelectable,
    pagerState,
    setPagerState,
    tableInfo,
    addAttachment,
    deleteAttachment,
  ]);

  return (
    <CellRendererContext.Provider value={providerValue}>
      {children}
    </CellRendererContext.Provider>
  );
}

export function LocalStateContextProvider(props) {
  const {
    lockState,
    acquireLock,
    releaseLock,
    children,
  } = props;

  const [linkedRequirements, setLinkedRequirements] = useState({});

  const [viewLinks, setViewLinks] = useState([]);

  const [currentCoorList, setCurrentCoorList] = useState({});

  const providerValue = useMemo(() => ({
    lockState,
    acquireLock,
    releaseLock,
    linkedRequirements,
    setLinkedRequirements,
    viewLinks,
    setViewLinks,
    currentCoorList,
    setCurrentCoorList,
  }), [
    lockState,
    acquireLock,
    releaseLock,
    linkedRequirements,
    setLinkedRequirements,
    viewLinks,
    setViewLinks,
    currentCoorList,
    setCurrentCoorList,
  ]);
  useEffect(() => {
    window.lockState = lockState;
  }, [lockState]);
  return (
    <LocalStateContext.Provider value={providerValue}>
      {children}
    </LocalStateContext.Provider>
  );
}

export function SheetStampsContextProvider(props) {
  const {
    children,
    projectId, requirementSetUUID,
    tableUUID,
  } = props;

  const [sheetStamps, setSheetStamps] = useState([]);

  async function getData() {
    // const res = await client.getSheetStamps({
    //   projectId,
    //   sheet_uuid: tableUUID,
    //   requirement_uuid: requirementSetUUID,
    // });
    // if (Array.isArray(res)) {
    //   setSheetStamps(res?.filter((i) => i.state === 0));
    // }
  }

  useEffect(() => {
    getData();
  }, [projectId, requirementSetUUID, tableUUID]);

  const context = React.useMemo(() => ({
    sheetStamps,
    refresh: getData,
  }));

  return (
    <SheetStampsContext.Provider value={context}>
      {children}
    </SheetStampsContext.Provider>
  );
}

export function SelectedableBlockContextProvider(props) {
  const {
    children,
  } = props;

  const { rows: allRows, columns: allColumns } = useContext(CellRendererContext);
  const [selectedableBlocks, setSelectedableBlocks] = useState([]);
  const rowsRef = useRef([]);
  const columnsRef = useRef([]);
  const blockRef = useRef(selectedableBlocks);
  const allTypes = DataTypes;
  const isPressingRef = useRef(false);
  const startBlockRef = useRef(null);
  const allRowsRef = useRef([]);
  const allColumnsRef = useRef([]);

  allRowsRef.current = allRows;
  allColumnsRef.current = allColumns;

  blockRef.current = selectedableBlocks;

  const getRows = useCallback((rows) => {
    rowsRef.current = rows;
  }, []);

  const getColumns = useCallback((columns) => {
    columnsRef.current = columns.filter((i) => !i?.invisible);
  }, []);

  const onBlockClick = useCallback((block) => {
    isPressingRef.current = true;
    startBlockRef.current = block;

    const currentCol = columnsRef.current.find((i) => i.uuid === block.col);
    block.dataType = currentCol?.dataType;
    block.value = rowsRef.current.find((r) => r.uuid === block.row)?.fields?.[block.col];

    setSelectedableBlocks([[block]]);
  }, []);

  function getMatrix(start, end) {
    const newBlocks = [];
    const startRowIndex = allRowsRef.current.findIndex(
      (i) => i.uuid === start.row,
    );
    const startColIndex = allColumnsRef.current.findIndex(
      (i) => i.uuid === start.col,
    );
    const endRowIndex = allRowsRef.current.findIndex((i) => i.uuid === end.row);
    const endColIndex = allColumnsRef.current.findIndex((i) => i.uuid === end.col);

    const minRowIndex = Math.min(startRowIndex, endRowIndex);
    const maxRowIndex = Math.max(startRowIndex, endRowIndex);
    const minColIndex = Math.min(startColIndex, endColIndex);
    const maxColIndex = Math.max(startColIndex, endColIndex);

    for (let i = minRowIndex; i <= maxRowIndex; i += 1) {
      const rowBlocks = [];
      for (let j = minColIndex; j <= maxColIndex; j += 1) {
        const newBlock = {
          col: allColumnsRef.current[j].uuid,
          row: allRowsRef.current[i].uuid,
          dataType: allColumnsRef.current[j].dataType,
          value: allRowsRef.current[i].fields?.[allColumnsRef.current[j].uuid],
        };
        rowBlocks.push(newBlock);
      }
      newBlocks.push(rowBlocks);
    }

    return newBlocks;
  }

  const onBlockMouseUp = useCallback((block) => {
    if (isPressingRef.current) {
      isPressingRef.current = false;

      if (block) {
        if (block.col === startBlockRef.current.col && block.row === startBlockRef.current.row) {
          const currentCol = columnsRef.current.find((i) => i.uuid === block.col);
          block.dataType = currentCol?.dataType;
          block.value = rowsRef.current.find((r) => r.uuid === block.row)?.fields?.[block.col];
          setSelectedableBlocks([[block]]);
          return;
        }

        const newBlocks = getMatrix(startBlockRef.current, block);

        setSelectedableBlocks(newBlocks);
      }
    }
  }, []);

  const onMouseEnter = useCallback((block) => {
    if (isPressingRef.current) {
      if (block) {
        if (block.col === startBlockRef.current.col && block.row === startBlockRef.current.row) {
          const currentCol = columnsRef.current.find((i) => i.uuid === block.col);
          block.dataType = currentCol?.dataType;
          block.value = rowsRef.current.find((r) => r.uuid === block.row)?.fields?.[block.col];
          setSelectedableBlocks([[block]]);
          return;
        }

        const newBlocks = getMatrix(startBlockRef.current, block);

        setSelectedableBlocks(newBlocks);
      }
    }
  }, []);

  function getClass(block, matrix) {
    let classStr = '';

    if (!matrix.length) return classStr;

    for (const rowBlocks of matrix) {
      for (const b of rowBlocks) {
        if (block.row === b.row && block.col === b.col) {
          classStr = 'selected';
          break;
        }
      }

      if (classStr) {
        break;
      }
    }

    const topBoundary = matrix[0];
    const bottomBoundary = matrix[matrix.length - 1];
    const leftBoundary = matrix.map((i) => i[0]);
    const rightBoundary = matrix.map((i) => i[i.length - 1]);

    if (topBoundary.some((i) => i.row === block.row && i.col === block.col)) {
      classStr += ' topBoundary';
    }

    if (bottomBoundary.some((i) => i.row === block.row && i.col === block.col)) {
      classStr += ' bottomBoundary';
    }

    if (leftBoundary.some((i) => i.row === block.row && i.col === block.col)) {
      classStr += ' leftBoundary';
    }

    if (rightBoundary.some((i) => i.row === block.row && i.col === block.col)) {
      classStr += ' rightBoundary';
    }

    return classStr;
  }

  const providerValue = useMemo(() => ({
    selectedableBlocks,
    getRows,
    getColumns,
    onBlockClick,
    onBlockMouseUp,
    onMouseEnter,
    getClass,
  }), [selectedableBlocks]);

  function getNewIndex([x, y], direction, [boundryX, boundryY]) {
    let newX = x;
    let newY = y;

    if (direction === 'up') {
      newY = Math.max(y - 1, 0);
    } else if (direction === 'down') {
      newY = Math.min(y + 1, boundryY);
    } else if (direction === 'left') {
      newX = Math.max(x - 1, 0);
    } else if (direction === 'right') {
      newX = Math.min(x + 1, boundryX);
    }

    return [newX, newY];
  }

  function getNewSelectedBlock(block, rows, columns, direction) {
    const blockColIndex = columns.findIndex((i) => i.uuid === block.col);
    const blockRowIndex = rows.findIndex((i) => i.uuid === block.row);

    const [newColIndex, newRowIndex] = getNewIndex(
      [blockColIndex, blockRowIndex],
      direction,
      [columns.length - 1, rows.length - 1],
    );

    return {
      col: columns[newColIndex].uuid,
      row: rows[newRowIndex].uuid,
      dataType: columns[newColIndex].dataType,
      value: rows[newRowIndex].fields?.[columns[newColIndex].uuid],
    };
  }

  // 监听上下左右
  useEffect(() => {
    const handleKeyDown = (e) => {
      const { activeElement } = document;
      const isInputFocused = activeElement.tagName === 'INPUT'
      || activeElement.tagName === 'TEXTAREA'
      || activeElement.contentEditable === 'true';
      if (isInputFocused) return;
      if (blockRef.current?.[0]?.[0]) {
        const block = blockRef.current[0][0];
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          const direction = e.key.replace('Arrow', '').toLowerCase();
          const newBlock = getNewSelectedBlock(
            block,
            rowsRef.current,
            columnsRef.current,
            direction,
          );
          setSelectedableBlocks([[newBlock]]);
          // e.preventDefault();
          // e.stopPropagation();
        }
      }
    };

    const onDocumentMouseUp = () => {
      isPressingRef.current = false;
    };

    document.addEventListener('mouseup', onDocumentMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mouseup', onDocumentMouseUp);
    };
  }, []);

  // 复制selected block
  useEffect(() => {
    // 监听ctrl+c
    const handleCopy = (e) => {
      const block = selectedableBlocks[0];
      if (block && e.ctrlKey && (e.key === 'c' || e.key === 'v')) {
        const hasTextSelection = window.getSelection().toString().length > 0;
        if (hasTextSelection) return;

        const rowIndex = allRowsRef.current.findIndex((r) => r.uuid === block[0].row);
        const colIndex = allColumnsRef.current.findIndex((c) => c.uuid === block[0].col);

        if (e.key === 'c') {
          let str = '';

          for (const rows of selectedableBlocks) {
            for (const b of rows) {
              const conv = allTypes?.[b?.dataType]?.valueToClipboardString;
              const { value } = b;
              let vStr = '';
              if (conv) {
                vStr = conv(value);
                if (b?.dataType === 'rowIndex') {
                  const index = allRows.findIndex((r) => r.uuid === b.row);
                  vStr = `${index + 1}`;
                }
              } else {
                vStr = value ? `${value}` : '';
              }
              str += vStr;
              str += '\t';
            }
            str = str.slice(0, -1);
            str += '\r\n';
          }

          try {
            utils.writeTextToClipboard(str).then(() => {
              message.success('单元格内容已复制到剪贴板');
            });
          } catch (err) {
            message.error(`复制失败, ${err.message}`);
          }
        }

        if (e.key === 'v') {
          const { activeElement } = document;
          // enumeration枚举值有input框，但是可直接粘贴
          const isInputFocused = (activeElement.tagName === 'INPUT'
                                || activeElement.tagName === 'TEXTAREA'
                                || activeElement.contentEditable === 'true');
          if (isInputFocused) return;

          utils.readTextTableFromClipboard().then((data) => {
            if(!data) return;
            const strMatrix = data;
            const changeData = [];
            const changeEnumColValues = {};
            // eslint-disable-next-line no-plusplus
            for (let x = 0; x < strMatrix.length; x++) {
              // eslint-disable-next-line no-plusplus
              for (let y = 0; y < strMatrix[x].length; y++) {
                const row = allRowsRef.current[rowIndex + x];
                const col = allColumnsRef.current[colIndex + y];

                const values = allTypes?.[col?.dataType]
                  ?.valueFromClipboardString?.(strMatrix[x][y]) || [];

                if (row && col) {
                  changeData.push({
                    colUUID: col.uuid,
                    rowUUID: row.uuid,
                    value: values,
                  });
                }

                // 列改变
                // if (col.dataType === 'enumeration') {
                //   for (const item of values) {
                //     const ind = changeEnumColValues?.[col.uuid]?.findIndex(
                //       (i) => (i.value === item.value && i.equal === item.equal),
                //     );
                //     if (!(ind >= 0)) {
                //       changeEnumColValues[col.uuid] = [
                //         ...(changeEnumColValues?.[col.uuid] || []),
                //         item,
                //       ];
                //     }
                //   }
                // }
              }
            }
            // const v = data?.[0]?.[0];
            // const newValue = allTypes.current?.[column?.dataType]?.valueFromClipboardString?.(v);

            // 需修改列--选项新增
            if (Object.keys(changeEnumColValues)?.length) {
              const detail = {
                action: 'setColumnValues',
                data: changeEnumColValues,
              };

              const ev = new CustomEvent('modifyTable', { detail });
              window.dispatchEvent(ev);
            }

            const detail = {
              action: 'setCellValues',
              data: changeData,
            };

            const ev = new CustomEvent('modifyTable', { detail });
            window.dispatchEvent(ev);
          });
        }
        console.log(e.key, 'eeee')
      }

      
      if(e.key === 'Delete'){
        const { activeElement } = document;
        // enumeration枚举值有input框，但是可直接粘贴
        const isInputFocused = (activeElement.tagName === 'INPUT'
                              || activeElement.tagName === 'TEXTAREA'
                              || activeElement.contentEditable === 'true');
        
        const block = selectedableBlocks[0];
        if (block && !isInputFocused) {
          const changeData = [];
          
          // Process all selected blocks
          for (const rows of selectedableBlocks) {
            for (const b of rows) {
              changeData.push({
                colUUID: b.col,
                rowUUID: b.row,
                value: undefined // Clear the cell value
              });
            }
          }
      
          const detail = {
            action: 'setCellValues',
            data: changeData,
          };
      
          const ev = new CustomEvent('modifyTable', { detail });
          window.dispatchEvent(ev);
        }
      }
    };
    window.addEventListener('keydown', handleCopy);

    return () => {
      window.removeEventListener('keydown', handleCopy);
    };
  }, [selectedableBlocks]);

  return (
    <SelectedableBlockContext.Provider value={providerValue}>
      {children}
    </SelectedableBlockContext.Provider>
  );
}
