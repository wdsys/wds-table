// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';

export function clamp(value, min, max) {
  if (value < min) {
    return min;
  } if (value > max) {
    return max;
  }
  return value;
}

export function formatIntegerAsCommaSeparated(intValue, n) {
  const intString = intValue.toString();
  const chars = intString.split('');
  const revChars = chars.reverse();

  const revCommaSepChars = [];
  for (let i = 0; i < revChars.length; i += 1) {
    const ch = revChars[i];
    revCommaSepChars.push(ch);
    if ((i < revChars.length - 1) && (i + 1) % n === 0) {
      revCommaSepChars.push(',');
    }
  }

  const commaSepChars = revCommaSepChars.reverse();
  const commaSepString = commaSepChars.join('');
  return commaSepString;
}

export function formatNumberAsCommaSeparated(num, n) {
  const intValue = Math.floor(num);
  const intString = formatIntegerAsCommaSeparated(intValue, n);

  const fracValue = num - intValue;
  const fracString = `${fracValue}`;

  const dotIndex = fracString.indexOf('.');
  if (dotIndex === -1) {
    return intString;
  }
  return `${intString}.${fracString.substr(dotIndex + 1)}`;
}

/**
 * n: 3=千分位, 4=万分位
 * m: toFixed(m)
 */
export function formatNumberAsCommaSeparatedAndFixed(num, n, m) {
  const intValue = Math.floor(num);
  const intString = formatIntegerAsCommaSeparated(intValue, n);

  const fracValue = num - intValue;
  const fracString = fracValue.toFixed(n);

  const dotIndex = fracString.indexOf('.');
  return `${intString}.${fracString.substr(dotIndex + 1)}`;
}

export function generateNewColumnName(oldColumns) {
  const nameSet = new Set();
  for (const col of oldColumns) {
    nameSet.add(col.name);
  }

  let newName = '字段名';
  let i = 0;
  while (nameSet.has(newName)) {
    i += 1;
    newName = `字段名 ${i}`;
  }

  return newName;
}

const NumericChars = '0123456789';
const UpperCaseAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LowerCaseAlphabet = UpperCaseAlphabet.toLowerCase();
const AlphanumericChars = `${NumericChars}${UpperCaseAlphabet}${LowerCaseAlphabet}`;

export function generateRandomString(len, chars = AlphanumericChars) {
  let str = '';

  for (let i = 0; i < len; i += 1) {
    const randInt = Math.floor(Math.random() * chars.length);
    str += chars[randInt];
  }

  return str;
}

export function getOS() {
  const platform = navigator?.platform
    || navigator?.userAgentData?.platform
    || 'unknown';

  if (platform.match(/(win32|windows)/i)) {
    return 'windows';
  } if (platform.match(/(linux|unix|bsd)/i)) {
    return 'linux';
  } if (platform.match(/mac/i)) {
    return 'mac';
  }
  return 'unknown';
}

export function isElectron() {
  return window.process?.versions?.electron !== undefined;
}

//--------------------------------------------------------------------
// Clipboard
//--------------------------------------------------------------------

export async function readTextFromClipboard() {
  if (isElectron()) {
    const { clipboard } = window.require('electron');
    if (!clipboard) {
      return null; // clipboard unavailable
    }

    return clipboard.readText();
  } if (navigator.clipboard) {
    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
      for (const type of clipboardItem.types) {
        if (type === 'text/plain') {
          const blob = await clipboardItem.getType(type);
          const text = await blob.text();
          return text;
        }
      }
    }

    return null; // no text in clipboard
  }
  throw new Error('clipboard is not supported');
}

export async function readLinesFromClipboard(options = {}) {
  const {
    rowsep = /\r?\n/,
  } = options;

  let text;

  try {
    text = await readTextFromClipboard();
  } catch (err) {
    console.error(err);
    return null;
  }

  if (text === undefined || text === null) {
    return null;
  }

  const lines = text.split(rowsep);
  if (lines.at(-1) === '') { // text以换行符结尾的情况
    lines.pop(); // 去掉末尾的无用元素
  }

  return lines;
}

export async function readTextTableFromClipboard(options = {}) {
  const {
    rowsep = /\r?\n/,
    colsep = /\t/,
    converters = [],
  } = options;

  const lines = await readLinesFromClipboard({ rowsep });
  if (!Array.isArray(lines) || lines.length < 1) {
    return null;
  }

  const table = [];

  for (const line of lines) {
    const fields = line.split(colsep);
    if (fields.length === 0) {
      table.push([]);
      continue;
    }

    const values = [];

    for (let i = 0; i < fields.length; i += 1) {
      const field = fields[i];
      const conv = converters[i];
      let value;

      if (conv) {
        try {
          value = conv(field);
        } catch (err) {
          console.error('cannot convert pasted string:', field, err);
          value = undefined;
        }
      } else {
        value = field;
      }

      values.push(value);
    }

    table.push(values);
  }

  return table;
}

export async function writeTextToClipboard(text) {
  if (isElectron()) {
    const { clipboard } = window.require('electron');
    if (!clipboard) {
      return; // clipboard unavailable
    }

    clipboard.writeText(text);
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    throw new Error('clipboard is not supported');
  }
}

//--------------------------------------------------------------------
// Table Operations
//--------------------------------------------------------------------

export function getColumnByUUID(columns, colUUID) {
  if (columns?.length) {
    for (const col of columns) {
      if (col.uuid === colUUID) {
        return col;
      }
    }
  }

  return null;
}

export function getRowByUUID(rows, rowUUID) {
  if (rows?.length) {
    for (const row of rows) {
      if (row.uuid === rowUUID) {
        return row;
      }
    }
  }

  return null;
}

/**
 * 查找第一个treeNode列
 */
export function getTreeNodeColumn(columns) {
  for (const col of columns) {
    if (col.dataType === 'treeNode') {
      return col;
    }
  }

  return null;
}

/**
 * 查找所有选中的行
 */
export function getSelectedRows(rows, treeNodeColumn) {
  if (!treeNodeColumn) {
    return [];
  }

  const selectedRows = [];

  for (const row of rows) {
    const value = row.fields?.[treeNodeColumn.uuid];
    if (value?.checked) {
      selectedRows.push(row);
    }
  }

  return selectedRows;
}

export function addNewColumnToTable(oldColumns) {
  const name = generateNewColumnName(oldColumns);
  const uuid = uuidv4();

  const newCol = {
    name,
    uuid,
    dataType: 'text',
    width: 120,
  };

  return [...oldColumns, newCol];
}

export function createNewRow(columns) {
  const uuid = uuidv4();
  const newRow = { uuid, fields: {} };

  for (const col of columns) {
    if (col.dataType === 'rowIndex') {
      continue;
    }

    if ((col.defaultValue !== undefined)
      && (typeof col.defaultValue !== 'undefined')) {
      newRow.fields[col.uuid] = col.defaultValue;
    }
  }

  return newRow;
}

export function insertNewRowAboveRowUUID(setRows, rowUUID, columns) {
  const newRow = createNewRow(columns);

  const treeNodeColumnUUIDs = [];
  for (const col of columns) {
    if (col.dataType === 'treeNode') {
      treeNodeColumnUUIDs.push(col.uuid);
    }
  }

  setRows((oldData) => {
    const newData = [];
    let prevRow = null;

    for (const r of oldData) {
      if (r.uuid === rowUUID) {
        if (prevRow) {
          for (const colUUID of treeNodeColumnUUIDs) {
            newRow.fields[colUUID] = {
              ...newRow.fields[colUUID],
              level: prevRow.fields?.[colUUID]?.level || 0,
            };
          }
        }

        newData.push(newRow);
      }

      newData.push(r);
      prevRow = r;
    }

    return newData;
  });
}

export function insertNewRowAbove(setRows, row, columns) {
  insertNewRowAboveRowUUID(setRows, row.uuid, columns);
}

export function insertNewRowBelowRowUUID(setRows, rowUUID, columns) {
  const newRow = createNewRow(columns);

  const treeNodeColumnUUIDs = [];
  for (const col of columns) {
    if (col.dataType === 'treeNode') {
      treeNodeColumnUUIDs.push(col.uuid);
    }
  }

  setRows((oldData) => {
    const newData = [];

    for (const r of oldData) {
      newData.push(r);
      if (r.uuid === rowUUID) {
        for (const colUUID of treeNodeColumnUUIDs) {
          newRow.fields[colUUID] = {
            ...newRow.fields[colUUID],
            level: r.fields?.[colUUID]?.level || 0,
          };
        }

        newData.push(newRow);
      }
    }

    if (!rowUUID) {
      newData.push(newRow);
    }

    return newData;
  });
}

export function insertNewRowBelow(setRows, row, columns) {
  insertNewRowBelowRowUUID(setRows, row.uuid, columns);
}

/**
 * 寻找由 { colUUID, rowInfo } 所确定的treeNode单元格的父节点所在的行
 * @param {string} colUUID
 * @param {object} rowInfo
 * @param {array} row
 * @returns object | null
 */
function getParentRowInfo(colUUID, rowInfo, rows) {
  const {
    index: rowIndex,
    uuid: rowUUID,
    level: rowLevel,
  } = rowInfo || {};

  if (!(rowIndex > 0)) { // it's the first row, so it has no parent
    return null;
  }

  if (!rowUUID) { // invalid rowUUID
    return null;
  }

  const childRow = rows[rowIndex];
  if (childRow?.uuid !== rowUUID) { // invalid rowUUID or rowIndex
    return null;
  }

  if (childRow.level < 1) { // it's a root node, so it has no parent
    return null;
  }

  for (let i = rowIndex - 1; i >= 0; i -= 1) {
    const row = rows[i];
    const cellValue = row.fields?.[colUUID];
    const cellLevel = cellValue?.level || 0;

    if (cellLevel >= 0 && cellLevel < rowLevel) {
      return {
        index: i,
        uuid: row.uuid,
        level: cellLevel,
      };
    }
  }

  return null;
}

/**
 * 寻找某个treeNode单元格的所有直系父节点所在的行
 * @param {string} colUUID
 * @param {object} rowInfo
 * @param {array} rows
 * @returns {array} array of row UUIDs
 */
function getAllParentRowUUIDs(colUUID, rowInfo, rows) {
  const result = [];

  let currentRowInfo = rowInfo;
  let loop = true;

  while (loop) {
    const parent = getParentRowInfo(colUUID, currentRowInfo, rows);
    if (!parent) {
      loop = false;
      break;
    }

    const { uuid } = parent;
    result.push(uuid);
    currentRowInfo = parent;
  }

  return result;
}

export function appendNewRow(setRows, columns) {
  const newRow = createNewRow(columns);

  const treeNodeColumns = new Map();

  for (const col of columns) {
    if (col.dataType === 'treeNode') {
      treeNodeColumns.set(col.uuid, {
        lastCellLevel: 0,
        lastCellParents: [], // row UUIDs of parent cells
      });
    }
  }

  setRows((oldData) => {
    const oldRowCount = oldData.length;
    if (oldRowCount < 1) {
      return [newRow];
    }

    const lastRowIndex = oldRowCount - 1;
    const lastRow = oldData[lastRowIndex];

    for (const colUUID of treeNodeColumns.keys()) {
      const info = treeNodeColumns.get(colUUID);
      const lastCell = lastRow?.fields?.[colUUID];
      info.lastCellLevel = lastCell?.level || 0;

      const rowInfo = {
        index: lastRowIndex,
        uuid: lastRow?.uuid,
        level: info.lastCellLevel,
      };

      info.lastCellParents = getAllParentRowUUIDs(colUUID, rowInfo, oldData);
    }

    const newData = [];

    for (const row of oldData) {
      const newRow1 = {
        ...row,
        fields: {
          ...row.fields,
        },
      };

      for (const colUUID of treeNodeColumns.keys()) {
        const info = treeNodeColumns.get(colUUID);
        if (info.lastCellParents.includes(row.uuid)) {
          newRow1.fields[colUUID] = {
            ...newRow1.fields[colUUID],
            closed: false,
          };
        }
      }

      newData.push(newRow1);
    }

    for (const colUUID of treeNodeColumns.keys()) {
      const info = treeNodeColumns.get(colUUID);
      newRow.fields[colUUID] = {
        ...newRow.fields[colUUID],
        level: info.lastCellLevel,
      };
    }

    newData.push(newRow);

    return newData;
  });
}

export function copyRow(setRows, row) {
  const newRow = JSON.parse(JSON.stringify(row));
  newRow.uuid = uuidv4();

  setRows((oldData) => {
    const newData = [];

    for (const r of oldData) {
      newData.push(r);
      if (r.uuid === row.uuid) {
        newData.push(newRow);
      }
    }

    return newData;
  });
}

export function deleteRow(setRows, row) {
  setRows((oldData) => {
    const newData = [];
    for (let i = 0; i < oldData.length; i += 1) {
      const oldRow = oldData[i];
      if (oldRow.uuid !== row.uuid) {
        newData.push(oldRow);
      }
    }

    return newData;
  });
}

export function regenerateAllUUIDsInDoc(options) {
  const { doc } = options;

  // regenerate all UUIDs in options
  if (doc.options) {
    if (doc.options.uuid) {
      doc.options.uuid = uuidv4();
    }
  }

  const columnUUIDMap = new Map(); // old uuid => new uuid
  let treeNodeColumnUUID;

  // regenerate all UUIDs in columns
  if (doc.columns?.length) {
    for (const item of doc.columns) {
      const oldUUID = item.uuid;
      const newUUID = uuidv4();
      item.uuid = newUUID;
      columnUUIDMap.set(oldUUID, newUUID);

      // treeNode列需要特殊处理
      if (item.dataType === 'treeNode') {
        treeNodeColumnUUID = newUUID;
      }
    }
  }

  // regenerate all UUIDs in rows
  if (doc.rows?.length) {
    for (const row of doc.rows) {
      row.uuid = uuidv4();

      if (row.fields) {
        for (const oldUUID of columnUUIDMap.keys()) {
          if (Object.keys(row.fields).includes(oldUUID)) {
            const newUUID = columnUUIDMap.get(oldUUID);
            row.fields[newUUID] = row.fields[oldUUID];
            delete row.fields[oldUUID];
          }
        }

        // treeNode列需要特殊处理
        // 清除子需求集
        const treeNodeField = row.fields[treeNodeColumnUUID];
        if (treeNodeField?.uuid) {
          delete treeNodeField.uuid;
        }
      }
    }
  }
}

//--------------------------------------------------------------------
// DOM Operations
//--------------------------------------------------------------------

export async function delay(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

// https://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
export function isElementVisible(elem) {
  if (elem) {
    return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
  }
  return false;
}

export function getElementRectInViewport(elem) {
  const rect = elem.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    space: 'viewport',
  };
}

export function getElementRectInPage(elem) {
  const rect = elem.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
    space: 'page',
  };
}

// select all text in contenteditable
// see http://stackoverflow.com/a/6150060/145346
export function doElementSelectAll(elem) {
  if (document.body.createTextRange) {
    const range = document.body.createTextRange();
    range.moveToElementText(elem);
    range.select();
  } else if (window.getSelection) {
    const range = document.createRange();
    range.selectNodeContents(elem);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export async function blob2img(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.src = url;

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
  });
}

export async function readLocalFile(file, format) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (format === 'text') {
      reader.readAsText(file);
    } else if (format === 'arrayBuffer') {
      reader.readAsArrayBuffer(file);
    } else if (format === 'binaryString') {
      reader.readAsBinaryString(file);
    } else if (format === 'dataURL') {
      reader.readAsDataURL(file);
    } else {
      throw new Error(`invalid format: ${format}`);
    }

    reader.addEventListener('load', (e) => {
      resolve(e.target.result);
    });

    reader.addEventListener('error', (e) => {
      reject(e);
    });
  });
}

export function setEndOfContenteditable(contentEditableElement) {
  if (document.createRange) { // Firefox, Chrome, Opera, Safari, IE 9+
    // Create a range (a range is a like the selection but invisible)
    const range = document.createRange();

    // Select the entire contents of the element with the range
    range.selectNodeContents(contentEditableElement);

    // collapse the range to the end point.
    // false means collapse to end rather than the start
    range.collapse(false);

    // get the selection object (allows you to change selection)
    const selection = window.getSelection();

    // remove any selections already made
    selection.removeAllRanges();

    // make the range you have just created the visible selection
    selection.addRange(range);
  } else if (document.selection) { // IE 8 and lower
    // Create a range (a range is a like the selection but invisible)
    const range = document.body.createTextRange();

    // Select the entire contents of the element with the range
    range.moveToElementText(contentEditableElement);

    // collapse the range to the end point.
    // false means collapse to end rather than the start
    range.collapse(false);

    // Select the range (make it the visible selection
    range.select();
  }
}

// Walk-around for Chrome content-editable element bug, refer to:
// https://stephenhaney.com/2020/get-contenteditable-plaintext-with-correct-linebreaks/
export function getContentEditableText(elem) {
  let newValue = '';
  let isOnFreshLine = true;

  // Recursive function to navigate childNodes and build linebreaks with text
  function parseChildNodesForValueAndLines(childNodes) {
    for (let i = 0; i < childNodes.length; i += 1) {
      const childNode = childNodes[i];

      if (childNode.nodeName === 'BR') {
        // BRs are always line breaks which means the next loop is on a fresh line
        newValue += '\n';
        isOnFreshLine = true;
        continue;
      }

      // We may or may not need to create a new line
      if (childNode.nodeName === 'DIV' && isOnFreshLine === false) {
        // Divs create new lines for themselves if they aren't already on one
        newValue += '\n';
      }

      // Whether we created a new line or not, we'll use it for
      // this content so the next loop will not be on a fresh line:
      isOnFreshLine = false;

      // Add the text content if this is a text node:
      if (childNode.nodeType === 3 && childNode.textContent) {
        newValue += childNode.textContent;
      }

      // If this node has children, get into them as well:
      parseChildNodesForValueAndLines(childNode.childNodes);
    }
  }

  // Parse the child nodes for HTML and newlines:
  parseChildNodesForValueAndLines(elem.childNodes);
  return newValue;
}

//--------------------------------------------------------------------
// Tree Operations
//--------------------------------------------------------------------

export function createTreeFromTable(columns, rows) {
  if (!columns || !rows?.length) {
    return null;
  }

  let treeNodeColumn = null;
  for (const col of columns) {
    if (col.dataType === 'treeNode') {
      treeNodeColumn = col;
      break;
    }
  }

  if (!treeNodeColumn) {
    return null;
  }

  const roots = [];
  let lastNode = null;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const value = row?.fields?.[treeNodeColumn.uuid] || {};
    const {
      level = 0,
      closed = false,
    } = value;

    const node = {
      row,
      level,
      closed: !!closed,
      parent: null,
      childs: [],
    };

    if (i === 0) {
      roots.push(node);
      lastNode = node;
      continue;
    }

    let myParent = null;
    let tmpNode = lastNode;
    let loop = true;

    while (loop) {
      if (level > tmpNode.level) { // 比lastNode更深
        myParent = tmpNode;
        loop = false;
        break;
      } else if (level === tmpNode.level) { // 和lastNode平级
        myParent = tmpNode.parent;
        loop = false;
        break;
      }

      // 比lastNode要浅
      if (tmpNode.parent) {
        tmpNode = tmpNode.parent;
      } else {
        loop = false;
        break;
      }
    }

    if (myParent) {
      node.parent = myParent;
      myParent.childs.push(node);
    } else {
      roots.push(node);
    }

    lastNode = node;
  }

  return roots;
}

export function findTreeNodeInRoots(roots, rowUUID) {
  if (!roots?.length) {
    return null;
  }

  for (const root of roots) {
    if (root.row.uuid === rowUUID) {
      return root;
    }

    const node = findTreeNodeInRoots(root.childs, rowUUID);
    if (node) {
      return node;
    }
  }

  return null;
}

export function isTreeNodeVisible(node) {
  if (!node.parent) {
    return true;
  }

  if (node.parent.closed) {
    return false;
  }

  return isTreeNodeVisible(node.parent);
}

export function getTreeNodeAllRows(node, rows) {
  if (!node) {
    return rows;
  }

  rows.push(node.row);
  for (const child of node.childs) {
    getTreeNodeAllRows(child, rows);
  }

  return rows;
}

const ImageExts = [
  '.bmp',
  '.gif',
  '.ico',
  '.jpg',
  '.jpeg',
  '.png',
  '.svg',
  '.webp',
];

export function isImage(filename) {
  const name = filename.toLowerCase();
  for (const ext of ImageExts) {
    if (name.endsWith(ext)) {
      return true;
    }
  }

  return false;
}

const VideoExts = [
  '.avi',
  '.flv',
  '.mp4',
  '.mkv',
  '.ogv',
  '.wmv',
];

export function isVideo(filename) {
  const name = filename.toLowerCase();
  for (const ext of VideoExts) {
    if (name.endsWith(ext)) {
      return true;
    }
  }

  return false;
}
// 不支持的文件
const noSupportExts = [
  '.avi',
  '.flv',
  '.mp4',
  '.mkv',
  '.ogv',
  '.wmv',
  '.bmp',
  '.gif',
  '.ico',
  '.jpg',
  '.jpeg',
  '.png',
  '.svg',
  '.webp',
];
export function isSupportFileExt(filename) {
  const name = filename.toLowerCase();
  for (const ext of noSupportExts) {
    if (name.endsWith(ext)) {
      return false;
    }
  }
  return true;
}

async function shellExec(command, options) {
  return new Promise((resolve, reject) => {
    const child = window.require('child_process');
    child.exec(command, options, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

export async function openFileByOS(path) {
  let runner;
  const options = {};

  const process = window.require('process');

  if (process.platform === 'win32' || process.platform === 'win64') {
    runner = 'start';
    options.windowsHide = true;
  } else if (process.platform === 'darwin') {
    runner = 'open';
  } else { // linux
    runner = 'xdg-open';
  }

  const command = `${runner} ${path}`;
  return shellExec(command, options);
}

export async function openBlobByOS(blob, name) {
  const os = window.require('os');
  const fs = window.require('fs');
  const path = window.require('path');

  const tmpdir = os.tmpdir();
  const filePath = path.join(tmpdir, name);

  const buffer = await blob.arrayBuffer();
  const typedArray = new Uint8Array(buffer);
  await fs.promises.writeFile(filePath, typedArray);

  return openFileByOS(filePath);
}

// 对比字段值
export function compareFields({ columns, oldFieldsInfo, newFieldsInfo }) {
  if (!newFieldsInfo) {
    return [];
  }
  const diffFields = [];

  for (const i of columns) {
    if (i.dataType === 'treeNode') { // 树节点
      if (oldFieldsInfo?.[i.uuid]?.text !== newFieldsInfo?.[i.uuid]?.text) {
        diffFields.push(i.uuid);
      }
    } else if (['file']?.includes(i.dataType)) {
      if (oldFieldsInfo?.[i.uuid]?.length !== newFieldsInfo?.[i.uuid]?.length) {
        diffFields.push(i.uuid);
      } else {
        // 长度相同，判断具体值是否相同
        for (const value of (oldFieldsInfo?.[i.uuid] || [])) {
          if (!newFieldsInfo?.[i.uuid]?.find((j) => j.uuid === value.uuid)) { // 有不同值
            diffFields.push(i.uuid);
          }
        }
      }
    } else if (['linkedRequirements', 'viewLinks', 'requirementStatus', 'currentCoorOrder']?.includes(i.dataType)) {
      // eslint-disable-next-line no-continue
      continue;
    } else if (['text', 'number', 'date', 'hyperlink', 'checkbox'].includes(i.dataType)) { // 文本
      if (oldFieldsInfo?.[i.uuid] !== newFieldsInfo?.[i.uuid]) {
        diffFields.push(i.uuid);
      }
    } else if (i.dataType === 'select') { // 单选
      if (oldFieldsInfo[i.uuid]?.[0] !== newFieldsInfo?.[i.uuid]?.[0]) {
        diffFields.push(i.uuid);
      }
    } else if (['multiSelect', 'views', 'relatedRequirements'].includes(i.dataType)) { // 多选
      // 兼容该多选值为undefined的情况
      if ((oldFieldsInfo?.[i.uuid]?.length || 0) !== (newFieldsInfo?.[i.uuid]?.length || 0)) {
        // 长度不等，值不同
        diffFields.push(i.uuid);
      } else {
        // 长度相同，判断具体值是否相同
        for (const value of (oldFieldsInfo?.[i.uuid] || [])) {
          if (!newFieldsInfo?.[i.uuid]?.includes(value)) { // 有不同值
            diffFields.push(i.uuid);
          }
        }
      }
    }
  }

  return diffFields;
}

export function generateInitOptions() {
  return [
    { name: '紧急', color: 'rgba(233, 30, 44, 0.2)', code: '将红' },
    { name: '重要', color: 'rgba(240, 107, 5, 0.2)', code: '鲜橘' },
    { name: '中等', color: 'rgba(240, 200, 0, 0.2)', code: '淡黄' },
    { name: '一般', color: 'rgba(140, 140, 140, 0.12)', code: '白灰' },
  ].map((i) => ({
    uuid: uuidv4(),
    name: i.name,
    color: {
      code: i.code,
      nameCN: i.name,
      color: i.color,
    },
  }));
}
