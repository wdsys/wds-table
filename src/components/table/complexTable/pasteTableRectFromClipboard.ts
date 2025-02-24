// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';

import { DataTypes, ColumnIcon } from './dataType';
import * as utils from './utils';

function updateTableRect({
  colIndex,
  rowIndex,
  columns,
  setColumns,
  setRows,
  matrix,
}) {
  setColumns((oldData) => {
    const newData = [];

    for (let j = 0; j < oldData.length; j += 1) {
      let newCol;
      const oldCol = oldData[j];

      if (j < colIndex) {
        newCol = oldCol;
      } else if (oldCol.dataType === 'select'
        || oldCol.dataType === 'multiSelect') {
        newCol = { ...oldCol };
        const oldTags = new Set();
        if (newCol.choices) {
          for (const item of newCol.choices) {
            oldTags.add(item.name);
          }
        }

        for (let i = 0; i < matrix.length; i += 1) {
          const values = matrix[i];
          const value = values[j - colIndex];
          if (!Array.isArray(value) || value.length < 1) {
            continue;
          }

          if (!newCol.choices) {
            newCol.choices = [];
          }

          for (const tag of value) {
            if (!oldTags.has(tag)) {
              const newTag = {
                uuid: uuidv4(),
                name: tag,
              };

              newCol.choices.push(newTag);
              oldTags.add(tag);
            }
          }
        }
      } else {
        newCol = oldCol;
      }

      newData.push(newCol);
    }

    return newData;
  });

  setRows((oldData) => {
    const newData = [];
    const newRowCount = Math.max(oldData.length, rowIndex + matrix.length);

    for (let i = 0; i < newRowCount; i += 1) {
      let newRow;

      if (i < oldData.length) { // 原有的row
        const oldRow = oldData[i];
        newRow = { ...oldRow };
      } else { // 新增的row
        newRow = {
          uuid: uuidv4(),
        };
      }

      if (i >= rowIndex && i < rowIndex + matrix.length) { // 被粘贴的row
        const values = matrix[i - rowIndex];

        if (values.length > 0) {
          // 需要更新的列数
          let colCount = Math.min(values.length, columns.length - colIndex);
          colCount = utils.clamp(colCount, 0, columns.length);

          if (colCount > 0 && !newRow.fields) {
            newRow.fields = {};
          }

          for (let j = 0; j < colCount; j += 1) {
            const value = values[j];

            if (value !== undefined) {
              const k = colIndex + j;
              const col = columns[k];

              if (col !== undefined) {
                newRow.fields[col.uuid] = value;
              }
            }
          }
        }
      }

      newData.push(newRow);
    }

    return newData;
  });
}

async function pasteTableRectFromClipboard({
  colIndex,
  rowIndex,
  columns,
  setColumns,
  setRows,
  AllDataTypes,
}) {
  const converters = [];
  const defaultConv = (str) => ((str === '') ? undefined : str);
  for (let i = colIndex; i < columns.length; i += 1) {
    let conv = defaultConv;
    const col = columns[i];
    if (col) {
      const dataType = AllDataTypes?.[col?.dataType] || DataTypes[col?.dataType];
      if (dataType?.valueFromClipboardString) {
        conv = dataType.valueFromClipboardString;
      }
    }

    converters.push(conv);
  }

  const matrix = await utils.readTextTableFromClipboard({ converters });
  if (!Array.isArray(matrix) || matrix.length < 1) {
    return;
  }

  updateTableRect({
    colIndex,
    rowIndex,
    columns,
    setColumns,
    setRows,
    matrix,
  });
}

export default pasteTableRectFromClipboard;
