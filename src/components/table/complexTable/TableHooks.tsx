// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';
import { produce } from 'immer';

import React, {
  useEffect,
  useRef,
  useContext,
  useMemo,
  useState,
} from 'react';

import { message } from 'antd';

import {
  InterfaceFunctionContext,
  CellRendererContext,
} from './contexts';
import { DataTypes } from './dataType';
import { showGallery } from './AlbumViewer';
import { showCinema } from './VideoViewer';
import history from './history';
import * as utils from './utils';
import filterRow from './RowFilter';
import { confirm } from './ConfirmDialog';
//--------------------------------------------------------------------
// useDataInput
//--------------------------------------------------------------------

export function useDataInput() {
  const {
    tableDoc,
    setLocalTable,
  } = useContext(CellRendererContext);

  // load the changed props into state
  useEffect(() => {
    // console.log('tableDoc is changed');
    setLocalTable(tableDoc || {}, {
      notifyTableEdited: false,
    });
  }, [tableDoc]);

  // TODO: reset LocalStateContext?
}

//--------------------------------------------------------------------
// useAutoSaver
//--------------------------------------------------------------------

class LimitedSaver {
  static IDLE = 0; // 0: 空闲

  static BUSY = 1; // 1: 忙碌

  static SaveInterval = 1000;

  constructor(saveFunc, canSave) {
    this.saveFunc = saveFunc;
    this.canSave = canSave;
    this.state = LimitedSaver.IDLE;
    this.endTime = -1;
    this.buffer = null;
    this.timer = window.setInterval(() => {
      this.check();
    }, 1024);
  }

  cancel() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }

    if (this.buffer) {
      this.doSave(this.buffer);
    }
  }

  save(data) {
    this.buffer = data;
  }

  async doSave(data) {
    this.buffer = null;
    this.state = LimitedSaver.BUSY;
    this.endTime = new Date().getTime() + LimitedSaver.SaveInterval;

    try {
      if (this.saveFunc && this.canSave) {
        const event1 = new Event('autoSaveTableStart');
        window.dispatchEvent(event1);

        await this.saveFunc(data);

        const event2 = new Event('autoSaveTableDone');
        window.dispatchEvent(event2);
      }
    } catch (err) {
      console.log('doSave error:', err);

      const event3 = new Event('autoSaveTableFailed');
      window.dispatchEvent(event3);
    } finally {
      this.state = LimitedSaver.IDLE;
    }
  }

  isIdle() {
    const now = new Date().getTime();
    if (now < this.endTime) {
      return false;
    }

    if (this.state === LimitedSaver.BUSY) {
      return false;
    }

    return true;
  }

  check() {
    if (this.buffer && this.isIdle()) {
      this.doSave(this.buffer);
    }
  }
}

export function useAutoSaver() {
  const {
    saveTable,
  } = useContext(InterfaceFunctionContext);

  const {
    tableDoc,
    localTable,
    options,
    columns,
    rows,
  } = useContext(CellRendererContext);

  // const {
  //   lockState,
  // } = useContext(LocalStateContext);

  const canSave = true;

  const saver = useRef(null);

  useEffect(() => {
    saver.current = new LimitedSaver(saveTable, canSave);

    return () => {
      saver.current.cancel();
      saver.current = null;
    };
  }, [canSave]);

  useEffect(() => {
    if (options === tableDoc.options
      && columns === tableDoc.columns
      && rows === tableDoc.rows) {
      return;
    }

    if (!options.uuid) {
      options.uuid = uuidv4();
    }

    const doc = {
      options,
      columns,
      rows,
    };

    saver.current.save(doc);

    // const detail = {reason: 'auto-save'};
    // const event = new CustomEvent('saveTable', {detail});
    // window.dispatchEvent(event);

    // 异步延迟保存有一个问题：
    // 当用户切换表格后，前一个表格的脏数据可能丢失
  }, [localTable]);
}

//--------------------------------------------------------------------
// useManualSaver
//--------------------------------------------------------------------

export function useManualSaver() {
  const {
    saveTable,
  } = useContext(InterfaceFunctionContext);
  const {
    setLocalTableNoHistory,
    options,
    columns,
    rows,
  } = useContext(CellRendererContext);
  // const {
  //   lockState,
  // } = useContext(LocalStateContext);

  const refOptions = useRef();
  refOptions.current = options;

  const refColumns = useRef();
  refColumns.current = columns;

  const refRows = useRef();
  refRows.current = rows;

  const refLockState = useRef();
  // refLockState.current = lockState;

  async function doManualSave() {
    // if (!refLockState.current?.lockedByMe) {
    //   console.log('doManualSave skipped: the table is not locked by me');
    //   message.error('此表格当前处于只读状态，无法保存');
    //   return;
    // }

    const loadingMessageKey = uuidv4();

    message.loading({
      content: 'Saving ...',
      duration: 0,
      key: loadingMessageKey,
    });

    const doc = {
      options: refOptions.current,
      columns: refColumns.current,
      rows: refRows.current,
    };
    const promise1 = saveTable(doc);
    const promise2 = utils.delay(1000); // 让消息至少保持1秒
    const results = await Promise.allSettled([promise1, promise2]);

    message.destroy(loadingMessageKey);

    if (results[0].status === 'fulfilled') {
      message.success('Save Successfully!');
    } else { // 'rejected'
      const content = `Save failed: ${results[0].reason}`;
      console.error(content);
      message.error(content);
    }
  }

  async function doAutoSave() {

    const doc = {
      options: refOptions.current,
      columns: refColumns.current,
      rows: refRows.current,
    };

    try {
      await saveTable(doc);
    } catch (err) {
      console.error('error saving table:', err);
    }
  }

  async function onSaveData(e) {
    // console.log(e);
    if (e.detail?.reason === 'manual-save') {
      await doManualSave();
    } else { // 'auto-save'
      await doAutoSave();
    }
  }

  function onUndo() {
    const doc = history.goBack();
    if (doc !== null) {
      setLocalTableNoHistory(doc);
    }
  }

  function onRedo() {
    const doc = history.goForward();
    if (doc !== null) {
      setLocalTableNoHistory(doc);
    }
  }

  function onTableLoaded() {
    history.onLoaded();
  }
  // async function applicationTemplate(e) {
  //   const { detail: { uuid, callback } } = e;
  //   try {
  //     const data = await client.getTableData(uuid, projectId);
  //     const doc = JSON.parse(data);
  //     callback(doc);
  //   } catch (error) {
  //     callback();
  //   }
  // }
  useEffect(() => {
    window.addEventListener('saveTable', onSaveData);
    window.addEventListener('undo', onUndo);
    window.addEventListener('redo', onRedo);
    window.addEventListener('tableLoaded', onTableLoaded);
    // window.addEventListener('applicationTemplate', applicationTemplate);

    return () => {
      window.removeEventListener('saveTable', onSaveData);
      window.removeEventListener('undo', onUndo);
      window.removeEventListener('redo', onRedo);
      window.removeEventListener('tableLoaded', onTableLoaded);
      // window.removeEventListener('applicationTemplate', applicationTemplate);
    };
  }, []);
}

//--------------------------------------------------------------------
// useRelatedRequirementsUpdater
//--------------------------------------------------------------------

class IntervalCaller {
  constructor(callback) {
    this.callback = callback;
    this.check();
  }

  cancel() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  async check() {
    try {
      this.callback();
    } catch (err) {
      console.log(err);
    }

    await utils.delay(3000);
    await this.check();
  }
}

class RequirementURLsResolver {
  constructor(onResolveRequirementURLs) {
    this.onResolveRequirementURLs = onResolveRequirementURLs;
    if (!this.onResolveRequirementURLs) {
      this.onResolveRequirementURLs = (urls, options) => urls;
    }
  }

  async resolve(urls, options) {
    const result = await this.onResolveRequirementURLs(urls, options);
    return result;
  }
}

export function useRelatedRequirementsUpdater() {
  const {
    onResolveRequirementURLs,
  } = useContext(InterfaceFunctionContext);

  const {
    projectId,
    requirementSetUUID,
    tableUUID,
  } = useContext(CellRendererContext);

  const requirementURLsResolver = useRef(null);
  const requirementURLsUpdater = useRef(null);

  useEffect(() => {
    requirementURLsResolver.current = new RequirementURLsResolver(onResolveRequirementURLs);
  }, [onResolveRequirementURLs]);

  async function onCheckRequirementURLs() {
    // console.log('onCheckRequirementURLs');
    const resolver = requirementURLsResolver.current;
    if (!resolver) {
      return;
    }

    const items = [];
    const urls = [];
    document.querySelectorAll('.related-requirement-item').forEach((item, index) => {
      // console.log(index, item);
      const elemURL = item.querySelector('.text .url');
      const url = elemURL.innerText.trim();
      // 修改后的数据需要更新
      if (!(elemURL.classList.contains('url-hidden') && elemURL.getAttribute('url') === url)) {
        if (url.startsWith('requirement:')) {
          urls.push(url);
          items.push(item);
        }
      }
    });

    // console.log(urls);
    if (urls.length < 1) {
      return;
    }

    const resolveOptions = {
      srcProjectId: projectId,
      srcRequirementSetUUID: requirementSetUUID,
      srcSheetUUID: tableUUID,
    };

    const info = await resolver.resolve(urls, resolveOptions);
    // console.log('resolved info:', info);

    const infoMap = {};
    for (const item of info) {
      infoMap[item.url] = item;
    }

    // console.log('infoMap:', infoMap);

    for (const item of items) {
      const elemURL = item.querySelector('.text .url');
      const elemName = item.querySelector('.text .name');

      const url = elemURL.innerText.trim();
      const urlInfo = infoMap[url];
      if (!urlInfo) {
        continue;
      }

      const name = urlInfo.name || '';
      if (name !== '') {
        elemName.innerText = name;
        elemName.setAttribute('title', name);
        elemURL.setAttribute('url', url);
        elemURL.classList.add('url-hidden');
      }
    }
  }

  useEffect(() => {
    requirementURLsUpdater.current = new IntervalCaller(onCheckRequirementURLs);

    return () => {
      requirementURLsUpdater.current.cancel();
    };
  }, []);
}

//--------------------------------------------------------------------
// useLinkedRequirementsUpdater
//--------------------------------------------------------------------

//--------------------------------------------------------------------
// useViewLinksUpdater
//--------------------------------------------------------------------

//--------------------------------------------------------------------
// useRowHighlighter
//--------------------------------------------------------------------

export function useRowHighlighter() {
  const {
    rows,
    columns,
    pagerState,
    setPagerState,
    options: tableOptions,
    setOptions,
  } = useContext(CellRendererContext);

  const refPagerState = useRef();
  refPagerState.current = pagerState;

  const refRows = useRef();
  refRows.current = [...rows];

  const refFilterRows = useRef();
  refFilterRows.current = [];

  const [foldedRowUUIDs, setFoldedRowUUIDs] = useState(new Set());
  // const foldedRowUUIDs = useMemo(() => collectFoldedRowUUIDs(columns, rows), [columns, rows]);

  useEffect(() => {
    utils.collectFoldedRowUUIDs(columns, rows).then(result => {
      setFoldedRowUUIDs(result);
    });
  }, [columns, rows]);

  // 是否有图片需要加载，如需加载，需要等待加载后滚动
  const refIsLoadingImg = useRef(false);

  for (const item of columns) {
    if (item.dataType === 'file' && item.expandFormat === 'expand') {
      refIsLoadingImg.current = true;
    }
  }

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    // If the row is folded, skip it.
    if (foldedRowUUIDs.has(row.uuid)) {
      continue;
    }

    const filterTrue = filterRow(tableOptions.filter, row, columns);
    if (filterTrue) {
      refFilterRows?.current?.push(row);
    }
  }

  function getElementCoords(elem) {
    const rect = elem.getBoundingClientRect();
    const { left, top } = rect;
    const docX = document.documentElement.scrollLeft;
    const docY = document.documentElement.scrollTop;
    return [left + docX, top + docY];
  }

  function getRowUUIDByIndex(index) {
    let rowUUID;

    document.querySelectorAll('.tbody .tr').forEach((elem, i) => {
      if (i === index) {
        rowUUID = elem.id?.substr(4);
      }
    });

    return rowUUID;
  }

  function getPagerByRowUUID(rowUUID) {
    let findIndex = refFilterRows.current.findIndex((i) => i.uuid === rowUUID);
    if (findIndex === -1) {
      // 未找到目标行
      // 1.将所有需求行展开
      const event = new CustomEvent('foldReqRows');
      window.dispatchEvent(event);
      // 2. 删除过滤条件
      setOptions(produce((draft) => {
        draft.filter = {
          relation: 'any',
          conditions: [],
        };
      }));

      // 所有行展开，找到所在行的下标
      findIndex = refRows.current.findIndex((i) => i.uuid === rowUUID);
      if (findIndex === -1) {
        message.info('未找到该需求行，可能已被过滤、隐藏或删除');
        return;
      }
    }

    // 当前行所在的页码
    const pagerOfRow = Math.ceil((findIndex + 1) / (refPagerState.current?.pageSize || 50));

    setPagerState({
      ...refPagerState.current,
      page: pagerOfRow,
    });
  }

  function scrollToRowByUUID(rowUUID) {
    const tbody = document.querySelector('.tbody');
    if (!tbody) {
      return;
    }

    const tr = tbody.querySelector(`#row-${rowUUID}`);
    if (!tr) {
      return;
    }

    const [tbodyLeft, tbodyTop] = getElementCoords(tbody);
    const [trLeft, trTop] = getElementCoords(tr);
    tbody.scrollLeft += trLeft - tbodyLeft;
    tbody.scrollTop += trTop - tbodyTop;
  }

  function highlightBlinkRowByUUID(rowUUID) {
    const tbody = document.querySelector('.tbody');
    if (!tbody) {
      return;
    }

    const tr = tbody.querySelector(`#row-${rowUUID}`);
    if (!tr) {
      return;
    }

    const animKeyframes = [
      { background: '#59e' },
      { background: 'none' },
    ];

    const animOptions = {
      duration: 3000,
      easing: 'linear',
    };

    const effect = new KeyframeEffect(tr, animKeyframes, animOptions);
    const animation = new Animation(effect, document.timeline);
    animation.play();
  }

  function locateBlinkRowByUUID(rowUUID) {
    getPagerByRowUUID(rowUUID);
    // 如果有图片加载，需等图片加载后，进行滚动并高亮
    setTimeout(() => {
      scrollToRowByUUID(rowUUID);
      highlightBlinkRowByUUID(rowUUID);
    }, refIsLoadingImg.current ? 500 : 0);
  }

  function onScrollToRow(e) {
    const options = e.detail;
    if (!options) {
      return;
    }

    let rowUUID;

    if (Object.keys(options).includes('index')) {
      const rowIndex = parseInt(options.index, 10);
      rowUUID = getRowUUIDByIndex(rowIndex);
    } else if (Object.keys(options).includes('uuid')) {
      rowUUID = options.uuid;
    } else {
      return;
    }

    if (!rowUUID) {
      return;
    }

    scrollToRowByUUID(rowUUID);
  }

  function onHighlightBlinkRow(e) {
    const options = e.detail;
    if (!options) {
      return;
    }

    let rowUUID;

    if (Object.keys(options).includes('index')) {
      const rowIndex = parseInt(options.index, 10);
      rowUUID = getRowUUIDByIndex(rowIndex);
    } else if (Object.keys(options).includes('uuid')) {
      rowUUID = options.uuid;
    } else {
      return;
    }

    if (!rowUUID) {
      return;
    }

    highlightBlinkRowByUUID(rowUUID);
  }

  function onLocateBlinkRow(e) {
    const options = e.detail;
    if (!options) {
      return;
    }

    let rowUUID;

    if (Object.keys(options).includes('index')) {
      const rowIndex = parseInt(options.index, 10);
      rowUUID = getRowUUIDByIndex(rowIndex);
    } else if (Object.keys(options).includes('uuid')) {
      rowUUID = options.uuid;
    } else {
      return;
    }

    if (!rowUUID) {
      return;
    }

    locateBlinkRowByUUID(rowUUID);
  }

  useEffect(() => {
    window.addEventListener('scrollToRow', onScrollToRow);
    window.addEventListener('highlightBlinkRow', onHighlightBlinkRow);
    window.addEventListener('locateBlinkRow', onLocateBlinkRow);

    return () => {
      window.removeEventListener('scrollToRow', onScrollToRow);
      window.removeEventListener('highlightBlinkRow', onHighlightBlinkRow);
      window.removeEventListener('locateBlinkRow', onLocateBlinkRow);
    };
  }, []);
}

//--------------------------------------------------------------------
// useKeyboardScroller
//--------------------------------------------------------------------

export function scrollX(delta) {
  const table = document.querySelector('.complex-table');
  const div1 = table?.querySelector('.scroll-bg');
  const div2 = table?.querySelector('.scroll-fg');

  const slotWidth = parseInt(div1.clientWidth, 10) || 0;
  const moverWidth = parseInt(div2.clientWidth, 10) || 0;
  if (slotWidth <= 0 || moverWidth <= 0) {
    return;
  }

  const item = document.querySelector('.scroll-columns');
  const itemWidth = item.scrollWidth;
  const dx = Math.floor((delta / itemWidth) * slotWidth);

  const moverPosition = parseInt(div2.style.left, 10);
  const newLeft = utils.clamp(
    moverPosition + dx,
    0,

    slotWidth - moverWidth,
  );
  div2.style.left = `${newLeft}px`;

  const items = document.querySelectorAll('.scroll-columns');
  if (items.length <= 0) {
    return;
  }

  const scrollRatio = newLeft / slotWidth;
  let scrollLeft = 0;

  for (let i = 0; i < items.length; i += 1) {
    const item1 = items[i];
    const scrollX1 = Math.floor(item1.scrollWidth * scrollRatio);
    const maxScroll = item1.scrollWidth - item1.clientWidth;
    scrollLeft = Math.min(scrollX1, maxScroll);
    if (i >= 1) {
      break;
    }
  }

  for (let i = 0; i < items.length; i += 1) {
    const elem = items[i];
    elem.scrollLeft = scrollLeft;
  }
}

export function scrollY(delta) {
  const table = document.querySelector('.complex-table');
  const tbody = table.querySelector('.tbody');
  const ch = tbody.clientHeight;
  const sh = tbody.scrollHeight;
  let scroll = tbody.scrollTop;
  scroll += delta;
  scroll = utils.clamp(scroll, 0, sh - ch);
  tbody.scrollTop = scroll;
}

export function useKeyboardScroller() {
  function onKeyDown(e) {
    const body = document.querySelector('body');
    const virtualTbody = document.querySelector('.virtualTbody')
    if (document.activeElement !== body && document.activeElement !== virtualTbody) {
      return;
    }

    const delta = 50;

    const modified = e.ctrlKey || e.altKey || e.metaKey || e.shiftKey;
    if (!modified) {
      if (e.keyCode === 37 || e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollX(-delta);
      } else if (e.keyCode === 39 || e.key === 'ArrowRight') {
        e.preventDefault();
        scrollX(delta);
      } else if (e.keyCode === 38 || e.key === 'ArrowUp') {
        e.preventDefault();
        scrollY(-delta);
      } else if (e.keyCode === 40 || e.key === 'ArrowDown') {
        e.preventDefault();
        scrollY(delta);
      }
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.keyCode === 83 || e.key === 's') {
        e.preventDefault();
        const detail = { reason: 'manual-save' };
        const event = new CustomEvent('saveTable', { detail });
        window.dispatchEvent(event);
      } else if (e.keyCode === 89 || e.key === 'y') {
        e.preventDefault();
        const event = new Event('redo');
        window.dispatchEvent(event);
      } else if (e.keyCode === 90 || e.key === 'z') {
        e.preventDefault();
        const event = new Event('undo');
        window.dispatchEvent(event);
      }
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);
}

//--------------------------------------------------------------------
// useTableOperations
//--------------------------------------------------------------------

export function useTableOperations() {
  const {
    projectId,
    columns,
    rows,
    setRows,
    getAttachment,
  } = useContext(CellRendererContext);

  const {
    getAPIBaseURL,
    getResourceAttachment,
    getAttachmentVideo,
    createAttachmentVideo,
    deleteAttachmentVideo,
  } = useContext(InterfaceFunctionContext);

  const refColumns = useRef();
  refColumns.current = columns;

  const refRows = useRef();
  refRows.current = rows;

  function showColumnGallery({ colUUID, file }) {
    if (!refRows.current?.length) {
      return;
    }

    const data = [];
    for (const row of refRows.current) {
      const value = row.fields?.[colUUID];
      if (value?.length) {
        for (const item of value) {
          if (utils.isImage(item.name)) {
            data.push(item);
          }
        }
      }
    }

    showGallery({
      data,
      getAttachment,
      getResourceAttachment,
      defaultFileDigest: file.uuid,
    });
  }

  function showVideoCinema({ projectId: projectId1, file }) {
    const data = {
      file,
    };

    showCinema({
      data,
      projectId: projectId1,
      getAPIBaseURL,
      getAttachmentVideo,
      createAttachmentVideo,
      deleteAttachmentVideo,
      getResourceAttachment,
      getAttachment,
    });
  }

  function onDisplayTable(e) {
    const { detail } = e;
    if (!detail) {
      return;
    }

    if (detail.action === 'showColumnGallery') {
      showColumnGallery(detail);
    } else if (detail.action === 'showVideoCinema') {
      showVideoCinema(detail);
    } else {
      console.log('invalid action:', detail);
    }
  }

  function insertRowBelowRowUUID({ rowUUID }) {
    utils.insertNewRowBelowRowUUID(setRows, rowUUID, refColumns.current);
  }

  function moveRowToNewIndex({ rowUUID, newIndex }) {
    let currentRow = null;
    let currentRowIndex = -1;
    const rows1 = refRows.current;

    for (let i = 0; i < rows1.length; i += 1) {
      const row1 = rows1[i];
      if (row1.uuid === rowUUID) {
        currentRow = row1;
        currentRowIndex = i;
        break;
      }
    }

    if (currentRow === null || currentRowIndex < 0) {
      return;
    }

    const newRowIndex = Math.round(newIndex);
    if (newRowIndex < 0
      || newRowIndex === currentRowIndex
      || newRowIndex === currentRowIndex + 1) {
      return;
    }

    setRows((oldData) => {
      const front = oldData.slice(0, currentRowIndex);
      const back = oldData.slice(currentRowIndex + 1);
      const newData = front.concat(back);

      if (newRowIndex < currentRowIndex) {
        newData.splice(newRowIndex, 0, currentRow);
      } else {
        newData.splice(newRowIndex - 1, 0, currentRow);
      }

      return newData;
    });
  }

  function setCellValue({ colUUID, rowUUID, value }) {
    setRows((oldData) => {
      const newData = [];

      for (const row of oldData) {
        if (row.uuid === rowUUID) {
          const newRow = {
            ...row,
            fields: {
              ...row.fields,
              [colUUID]: value,
            },
          };

          newData.push(newRow);
        } else {
          newData.push(row);
        }
      }

      return newData;
    });
  }

  function setCellValues({
    data,
  }) {
    const rowuuids = data.map((i) => i.rowUUID);
    setRows((oldData) => {
      const newData = [];

      for (const row of oldData) {
        if (rowuuids.includes(row.uuid)) {
          const newRow = {
            ...row,
            fields: {
              ...row.fields,
            },
          };

          for (const item of data) {
            if (item.rowUUID === row.uuid) {
              newRow.fields[item.colUUID] = item.value;
            }
          }

          newData.push(newRow);
        } else {
          newData.push(row);
        }
      }

      return newData;
    });
  }

  function onModifyTable(e) {
    const { detail } = e;
    if (!detail) {
      return;
    }

    if (detail.action === 'insertRowBelowRowUUID') {
      insertRowBelowRowUUID(detail);
    } else if (detail.action === 'moveRowToNewIndex') {
      moveRowToNewIndex(detail);
    } else if (detail.action === 'setCellValue') {
      setCellValue(detail);
    } else if (detail.action === 'setCellValues') {
      setCellValues(detail);
    } else {
      console.log('invalid action:', detail);
    }
  }

  useEffect(() => {
    window.addEventListener('displayTable', onDisplayTable);
    window.addEventListener('modifyTable', onModifyTable);

    return () => {
      window.removeEventListener('displayTable', onDisplayTable);
      window.removeEventListener('modifyTable', onModifyTable);
    };
  }, []);
}

//--------------------------------------------------------------------
// useMoveSelectedRows
//--------------------------------------------------------------------

export function useMoveSelectedRows() {
  const {
    options,
    columns,
    setRows,
  } = useContext(CellRendererContext);

  // const {
  //   lockState,
  // } = useContext(LocalStateContext);

  const optionsRef = useRef();
  optionsRef.current = options;

  const columnsRef = useRef();
  columnsRef.current = columns;

  // const lockStateRef = useRef();
  // lockStateRef.current = lockState;

  function onMoveLeft() {
    // if (optionsRef.current.lockFullTable) {
    //   message.error('当前表格已被锁定，无法移动');
    //   return;
    // }

    setRows((oldData) => {
      const treeNodeColumn = utils.getTreeNodeColumn(columnsRef.current);
      const rowIndexColumn = columnsRef.current?.find?.(c=>c?.dataType === 'rowIndex');
      if (!treeNodeColumn) {
        return oldData;
      }

      const selectedRows = utils.getSelectedRows(oldData, rowIndexColumn).filter((r) => !r.locked);
      if (selectedRows.length === 0) {
        return oldData;
      }

      const selectedRowUUIDs = selectedRows.map((r) => r.uuid);
      const newData = [];

      for (const row1 of oldData) {
        const newRow = { ...row1 };
        if (selectedRowUUIDs.includes(row1.uuid)) {
          const oldValue = row1.fields?.[treeNodeColumn.uuid];
          let newValue;
          if (typeof oldValue === 'object' && oldValue) {
            const oldLevel = oldValue.level || 0;
            const newLevel = Math.max(0, oldLevel - 1);
            newValue = {
              ...oldValue,
              level: newLevel,
            };
          } else {
            newValue = {
              level: 0,
              text: '',
            };
          }

          newRow.fields = {
            ...row1.fields,
            [treeNodeColumn.uuid]: newValue,
          };
        }

        newData.push(newRow);
      }

      return newData;
    });
  }

  function onMoveRight() {
    // if (optionsRef.current.lockFullTable) {
    //   message.error('当前表格已被锁定，无法移动');
    //   return;
    // }

    setRows((oldData) => {
      const treeNodeColumn = utils.getTreeNodeColumn(columnsRef.current);
      const rowIndexColumn = columnsRef.current?.find?.(c=>c?.dataType === 'rowIndex');
      if (!treeNodeColumn) {
        return oldData;
      }

      const selectedRows = utils.getSelectedRows(oldData, rowIndexColumn).filter((r) => !r.locked);
      if (selectedRows.length === 0) {
        return oldData;
      }

      const selectedRowUUIDs = selectedRows.map((r) => r.uuid);
      const newData = [];

      for (const row1 of oldData) {
        const newRow = { ...row1 };
        if (selectedRowUUIDs.includes(row1.uuid)) {
          const oldValue = row1.fields?.[treeNodeColumn.uuid];
          let newValue;
          if (typeof oldValue === 'object' && oldValue) {
            const oldLevel = oldValue.level || 0;
            const newLevel = oldLevel + 1;
            newValue = {
              ...oldValue,
              level: newLevel,
            };
          } else {
            newValue = {
              level: 0,
              text: '',
            };
          }

          newRow.fields = {
            ...row1.fields,
            [treeNodeColumn.uuid]: newValue,
          };
        }

        newData.push(newRow);
      }

      return newData;
    });
  }
  useEffect(() => {
    window.addEventListener('moveLeft', onMoveLeft);
    window.addEventListener('moveRight', onMoveRight);
    return () => {
      window.removeEventListener('moveRight', onMoveRight);
      window.removeEventListener('moveLeft', onMoveLeft);
    };
  }, []);
}

export function useDeleteSelected() {
  const {
    options,
    columns,
    setRows,
    rows,
  } = useContext(CellRendererContext);

  async function deleteSelected() {
    let length = 0;
    for (const col of columns) {
      if (col.dataType === 'rowIndex') {
        for (const row of rows) {
          const selected = !!row.fields?.[col.uuid];
          if (selected) { length += 1; }
        }
      } else {
        // newData.push(row);
      }
    }
    if (!!length && !(await confirm(`确定要删除选中的${length}行吗？`))) {
      return;
    }
    setRows((oldData) => {
      const newData = [];
      for (const col of columns) {
        if (col.dataType === 'rowIndex') {
          for (const row of oldData) {
            const selected = !!row.fields?.[col.uuid];
            const filterTrue = filterRow(options.filter, row, columns);
            // 删除选中且可见的行
            if (!(selected && filterTrue)) {
              newData.push(row);
            }
          }
        } else {
          // newData.push(row);
        }
      }
      return newData;
    });
  }

  useEffect(() => {
    window.addEventListener('deleteSelected', deleteSelected);
    return () => {
      window.removeEventListener('deleteSelected', deleteSelected);
    };
  }, [deleteSelected]);
}

//--------------------------------------------------------------------
// useCopySelectedRowsToClipboard
//--------------------------------------------------------------------

export function useCopySelectedRowsToClipboard() {
  const {
    projectId,
    requirementSetUUID,
    tableUUID,
    columns,
    rows,
  } = useContext(CellRendererContext);

  const columnsRef = useRef();
  columnsRef.current = columns;

  const rowsRef = useRef();
  rowsRef.current = rows;

  const tableUUIDRef = useRef();
  tableUUIDRef.current = tableUUID;

  const reqSetUUIDRef = useRef();
  reqSetUUIDRef.current = requirementSetUUID;

  const projectIdRef = useRef();
  projectIdRef.current = projectId;

  async function onCopyToClipboard() {
    const treeNodeColumn = columnsRef.current?.find?.(col=>col?.dataType === 'rowIndex'); // utils.getTreeNodeColumn(columnsRef.current);
    if (!treeNodeColumn) {
      return;
    }

    const selectedRows = utils.getSelectedRows(rowsRef.current, treeNodeColumn);
    if (selectedRows.length === 0) {
      return;
    }

    const rowIndices = {};
    for (let i = 0; i < rowsRef.current.length; i += 1) {
      const row = rowsRef.current[i];
      rowIndices[row.uuid] = i;
    }

    const matrix = [];

    for (const row of selectedRows) {
      const array = [];
      const rowIndex = rowIndices[row.uuid] || 0;

      for (const col of columnsRef.current) {
        const value = row.fields?.[col.uuid];
        // if (col.dataType === 'rowIndex') {
        //   value = rowIndex + 1;
        // } else {
        //   value = row.fields?.[col.uuid];
        // }

        let str;
        const conv = DataTypes[col.dataType]?.valueToClipboardString;
        if (conv) {
          str = conv(value);
        } else {
          str = value ? `${value}` : '';
        }

        array.push(str);
      }

      const text = array.join('\t');
      matrix.push(text);
    }

    const text = matrix.join('\r\n');

    try {
      await utils.writeTextToClipboard(text);
      message.success(`已复制${selectedRows.length}行内容到剪贴板`);
    } catch (err) {
      message.error(`无法复制到剪贴板: ${err}`);
    }
  }

  async function onCopyLinkToClipboard() {
    const treeNodeColumn = utils.getTreeNodeColumn(columnsRef.current);
    if (!treeNodeColumn) {
      return;
    }

    const selectedRows = utils.getSelectedRows(rowsRef.current, treeNodeColumn);
    if (selectedRows.length === 0) {
      return;
    }

    const rowIndices = {};
    for (let i = 0; i < rowsRef.current.length; i += 1) {
      const row = rowsRef.current[i];
      rowIndices[row.uuid] = i;
    }

    const matrix = [];

    for (const row of selectedRows) {
      let rowURL = 'requirement:';
      rowURL += `/projects/${projectIdRef.current}`;
      rowURL += `/requirements/${reqSetUUIDRef.current}`;
      rowURL += `/tables/${tableUUIDRef.current}`;
      rowURL += `/rows/${row?.uuid}`;

      matrix.push(rowURL);
    }

    const text = matrix.join('\r\n');

    try {
      await utils.writeTextToClipboard(text);
      message.success(`已复制${selectedRows.length}个需求行链接到剪贴板`);
    } catch (err) {
      message.error(`无法复制到剪贴板: ${err}`);
    }
  }

  useEffect(() => {
    window.addEventListener('copyToClipboard', onCopyToClipboard);
    window.addEventListener('copyLinkToClipboard', onCopyLinkToClipboard);

    return () => {
      window.removeEventListener('copyToClipboard', onCopyToClipboard);
      window.removeEventListener('copyLinkToClipboard', onCopyLinkToClipboard);
    };
  }, []);
}

//--------------------------------------------------------------------
// useDevicePixelRatioWatcher
//--------------------------------------------------------------------

function warnDevicePixelRatioChanged() {
  const msg = (
    <>
      检测到您的屏幕发生变化，这可能会对您的使用体验造成一定影响。
      <br />
      建议您将
      <strong>窗口缩放比例</strong>
      还原为
      <em>默认值</em>
      ，或者关闭窗口后重新打开。
    </>
  );

  message.warn(msg, 5);
}

window.lastDRPChangeWarningTime = 0;
window.initDevicePixelRatio = window.devicePixelRatio;
window.lastDevicePixelRatio = window.devicePixelRatio;

function tryWarnDevicePixelRatioChanged(newDevicePixelRatio) {
  // 检查是否发生变化
  if (newDevicePixelRatio === window.lastDevicePixelRatio) {
    return;
  }

  console.log('devicePixelRatio changed to', newDevicePixelRatio);

  // 检查是否等于初始值
  if (newDevicePixelRatio === window.initDevicePixelRatio) {
    return;
  }

  // 检查最近一段时间内是否已经提示过
  const now = new Date().getTime();
  const interval = 30000; // 30秒
  if (now - window.lastDRPChangeWarningTime < interval) {
    return;
  }

  window.lastDRPChangeWarningTime = now;

  // 发出提示
  warnDevicePixelRatioChanged();
}

export function useDevicePixelRatioWatcher() {
  const refRemove = useRef(null);

  function watchDevicePixelRatio() {
    refRemove.current?.();

    const newDevicePixelRatio = window.devicePixelRatio;
    tryWarnDevicePixelRatioChanged(newDevicePixelRatio);

    const mqString = `(resolution: ${newDevicePixelRatio}dppx)`;
    const media = window.matchMedia(mqString);
    media.addEventListener('change', watchDevicePixelRatio);

    refRemove.current = () => {
      media.removeEventListener('change', watchDevicePixelRatio);
    };
  }

  useEffect(() => {
    watchDevicePixelRatio();

    return () => {
      refRemove.current?.();
    };
  }, []);
}

function UseTableScroller() {
  function scrollTo(element, to, duration) {
    const start = element.scrollTop;
    const change = to - start;
    const increment = 20;
    let currentTime = 0;

    function animateScroll() {
      currentTime += increment;
      const val = Math.easeInOutQuad(currentTime, start, change, duration);
      element.scrollTop = val;

      if (currentTime < duration) {
        requestAnimationFrame(animateScroll);
      }
    }

    // 缓动函数
    Math.easeInOutQuad = function (t, b, c, d) {
      t /= d / 2;
      // eslint-disable-next-line no-mixed-operators
      if (t < 1) return c / 2 * t * t + b;
      // eslint-disable-next-line no-plusplus
      t--;
      // eslint-disable-next-line no-mixed-operators
      return -c / 2 * (t * (t - 2) - 1) + b;
    };

    animateScroll();
  }

  function onBackToTop() {
    const table = document.querySelector('.complex-table');
    if (!table) {
      return;
    }
    const tbody = table.querySelector('.virtualTbody');

    scrollTo(tbody, 0, 500);
  }

  async function onBackToBottom() {
    const table = document.querySelector('.complex-table');
    if (!table) {
      return;
    }
    const tbody = table.querySelector('.virtualTbody');
    const sh = tbody.scrollHeight;

    scrollTo(tbody, sh, 500);
  }

  useEffect(() => {
    window.addEventListener('backToTableTop', onBackToTop);
    window.addEventListener('backToTableBottom', onBackToBottom);

    return () => {
      window.removeEventListener('backToTableTop', onBackToTop);
      window.removeEventListener('backToTableBottom', onBackToBottom);
    };
  }, []);
}

function UseTableFoldAndUnfold() {
  const {
    rows,
    columns,
    setRows,
  } = useContext(CellRendererContext);
  const treeNodeUUID = columns?.find((i) => i.dataType === 'treeNode')?.uuid;

  function onFoldReqRows() {
    setRows((oldRows) => {
      const newRows = [];

      for (const item of oldRows) {
        const treeNodeInfo = item?.fields?.[treeNodeUUID];
        if (treeNodeInfo) {
          treeNodeInfo.closed = false;
        }

        newRows.push(item);
      }

      return newRows;
    });
  }

  function onUnfoldReqRows() {
    setRows((oldRows) => {
      const newRows = [];

      for (const item of oldRows) {
        const treeNodeInfo = item?.fields?.[treeNodeUUID];
        if (treeNodeInfo) {
          treeNodeInfo.closed = true;
        }

        newRows.push(item);
      }

      return newRows;
    });
  }

  useEffect(() => {
    window.addEventListener('foldReqRows', onFoldReqRows);
    window.addEventListener('unfoldReqRows', onUnfoldReqRows);

    return () => {
      window.removeEventListener('foldReqRows', onFoldReqRows);
      window.removeEventListener('unfoldReqRows', onUnfoldReqRows);
    };
  }, [rows]);
}

function useSerialNumber() {
  const {
    columns,
    setRows,
    setColumns,
    setOptions,
  } = useContext(CellRendererContext);

  // const {
  //   lockState,
  // } = useContext(LocalStateContext);

  function addSerialNumberColumn(event) {
    // if (lockState.readOnly) {
    //   message.error('表格处于只读模式，无法编辑');
    //   return;
    // }

    const { detail } = event;
    const serialNumberColumn = columns?.find?.((i) => i.dataType === 'serialNumber');
    setOptions((oldOptions) => ({
      ...oldOptions,
      serialNumber: true,
    }));
    const hasRowIndexColumn = columns?.some?.((i) => i.dataType === 'rowIndex');
    const hasSerialNumberColumn = !!serialNumberColumn;
    const columnUUID = hasSerialNumberColumn ? serialNumberColumn.uuid : uuidv4();
    if (!detail?.reNumber || !hasSerialNumberColumn || serialNumberColumn?.invisible) {
      setColumns((oldColumns) => {
        const newColumns = [];
        try {
          for (let i = 0; i < oldColumns.length; i += 1) {
            const newCol = { ...oldColumns[i] };
            if (!hasSerialNumberColumn && i === 0) {
              const serialNumberCol = {
                name: '编码',
                dataType: 'serialNumber',
                uuid: columnUUID,
                width: 80,
              };
              if (hasRowIndexColumn) {
                newColumns.push(newCol, serialNumberCol);
              } else {
                newColumns.push(serialNumberCol, newCol);
              }
            } else if (hasSerialNumberColumn && oldColumns[i]?.dataType === 'serialNumber') {
              // 切换显隐
              newCol.invisible = false;
              newColumns.push(newCol);
            } else {
              newColumns.push(newCol);
            }
          }
        } catch (e) {
          return oldColumns;
        }
        return newColumns;
      });
    }

    if (!hasSerialNumberColumn || detail?.reNumber) {
      setRows((oldData) => {
        const newData = [];
        const preNum = [];
        if (typeof serialNumberColumn?.startSerialNumber === 'number' && serialNumberColumn?.startSerialNumber > 1) {
          preNum.push(serialNumberColumn.startSerialNumber);
        }
        const treeNodeColumn = columns?.find?.((i) => i.dataType === 'treeNode');
        try {
          for (let i = 0; i < oldData.length; i += 1) {
            const oldRow = oldData[i];
            if (treeNodeColumn) {
              const treeNodeValue = oldRow?.fields?.[treeNodeColumn.uuid];
              const treeNodeLevel = treeNodeValue?.level || 0;
              if (treeNodeLevel === 0) {
                if (typeof preNum[0] === 'number') {
                  if (i !== 0) {
                    preNum[0] += 1;
                  }
                  preNum.length = 1;
                } else {
                  preNum[0] = 1;
                }
              } else if (typeof preNum[treeNodeLevel] === 'undefined') {
                const supplyPart = new Array(treeNodeLevel + 1 - preNum.length).fill(1);
                preNum.push(...supplyPart);
              } else {
                preNum[treeNodeLevel] += 1;
                preNum.length = treeNodeLevel + 1;
              }
              oldRow.fields[columnUUID] = preNum.join('.');
            } else {
              oldRow.fields[columnUUID] = (preNum[0] || 1) + i;
            }
            const newRow = {
              ...oldRow,
            };

            newData.push(newRow);
          }
        } catch (e) {
          return newData;
        }

        return newData;
      });
    }
  }

  function removeSerialNumberColumn() {
    // if (lockState.readOnly) {
    //   message.error('表格处于只读模式，无法编辑');
    //   return;
    // }
    setOptions((oldOptions) => ({
      ...oldOptions,
      serialNumber: false,
    }));
    setColumns((oldColumns) => {
      const newColumns = [];
      try {
        for (const col of oldColumns) {
          const newCol = { ...col };
          if (col.dataType === 'serialNumber') {
            newCol.invisible = true;
          }

          newColumns.push(newCol);
        }
      } catch (e) {
        return oldColumns;
      }

      return newColumns;
    });
  }

  useEffect(() => {
    window.addEventListener('addSerialNumber', addSerialNumberColumn);
    window.addEventListener('removeSerialNumber', removeSerialNumberColumn);
    return () => {
      window.removeEventListener('addSerialNumber', addSerialNumberColumn);
      window.removeEventListener('removeSerialNumber', removeSerialNumberColumn);
    };
  }, [columns]);
}

function useCheckRow() {
  const {
    columns,
    setRows,
    options,
  } = useContext(CellRendererContext);

  // const {
  //   lockState,
  // } = useContext(LocalStateContext);

  function selectAll() {
    // if (lockState.readOnly) {
    //   message.error('表格处于只读模式，无法操作');
    //   return;
    // }
    setRows((oldData) => {
      const newData = [];
      for (const row of oldData) {
        const newRow = { ...row };
        for (const col of columns) {
          if (row.fields) {
            if (col.dataType === 'rowIndex') {
              const filterTrue = filterRow(options.filter, row, columns);
              if (filterTrue) {
                newRow.fields = {
                  ...row.fields,
                  [col.uuid]: true
                  // {
                  //   ...row.fields?.[col.uuid],
                  //   // checked: !!changeBtn,
                  //   checked: true,
                  // },
                };
              }
            }
          }
        }
        newData.push(newRow);
      }
      return newData;
    });
  }

  function unSelectAllRow() {
    // if (lockState.readOnly) {
    //   message.error('表格处于只读模式，无法操作');
    //   return;
    // }
    setRows((oldData) => {
      const newData = [];
      for (const row of oldData) {
        const newRow = { ...row };
        for (const col of columns) {
          if (row.fields) {
            if (col.dataType === 'rowIndex') {
              const filterTrue = filterRow(options.filter, row, columns);
              if (filterTrue) {
                newRow.fields = {
                  ...row.fields,
                  [col.uuid]: false
                  // {
                  //   ...row.fields?.[col.uuid],
                  //   checked: false,
                  // },
                };
              }
            }
          }
        }
        newData.push(newRow);
      }
      return newData;
    });
  }

  useEffect(() => {
    window.addEventListener('selectAllRow', selectAll);
    window.addEventListener('unSelectAllRow', unSelectAllRow);
    return () => {
      window.removeEventListener('selectAllRow', selectAll);
      window.removeEventListener('unSelectAllRow', unSelectAllRow);
    };
  }, [columns, options]);
}

//= ===================================================================
// Hook wrappers
//= ===================================================================

export function WrapUseDataInput({ children }) {
  useDataInput();
  return children;
}

export function WrapUseAutoSaver({ children }) {
  useAutoSaver();
  return children;
}

export function WrapUseManualSaver({ children }) {
  useManualSaver();
  return children;
}

export function WrapUseRowHighlighter({ children }) {
  useRowHighlighter();
  return children;
}

export function WrapUseKeyboardScroller({ children }) {
  useKeyboardScroller();
  return children;
}

export function WrapUseTableOperations({ children }) {
  useTableOperations();
  return children;
}

export function WrapUseMoveSelectedRows({ children }) {
  useMoveSelectedRows();
  return children;
}

export function WrapUseCopySelectedRowsToClipboard({ children }) {
  useCopySelectedRowsToClipboard();
  return children;
}

export function WrapUseDevicePixelRatioWatcher({ children }) {
  useDevicePixelRatioWatcher();
  return children;
}

export function WrapUseTableScroller({ children }) {
  UseTableScroller();
  return children;
}

export function WrapUseTableFoldAndUnfold({ children }) {
  UseTableFoldAndUnfold();
  return children;
}

export function WrapUseSerialNumber({ children }) {
  useSerialNumber();
  return children;
}

export function WrapUseCheckRow({ children }) {
  useCheckRow();
  return children;
}

export function WrapuseDeleteSelected({ children }) {
  useDeleteSelected();
  return children;
}
