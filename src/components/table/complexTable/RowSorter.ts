// @ts-nocheck
import moment from 'moment';

import { TagValues } from './ViewsChoices';

function compareTreeNode(aValue, bValue) {
  const aText = aValue?.text || '';
  const bText = bValue?.text || '';
  return aText.localeCompare(bText);
}

function compareText(aValue, bValue) {
  const aText = aValue || '';
  const bText = bValue || '';
  return aText.localeCompare(bText);
}

function compareNumber(aValue, bValue) {
  const aNum = parseFloat(aValue) || 0;
  const bNum = parseFloat(bValue) || 0;
  return aNum - bNum;
}

function compareCheckbox(aValue, bValue) {
  const aChecked = aValue ? 1 : 0;
  const bChecked = bValue ? 1 : 0;
  return aChecked - bChecked;
}

function convertSelectValueToText(value) {
  let cellValue;
  if (Array.isArray(value)) {
    [cellValue] = value;
  } else {
    cellValue = value;
  }

  return cellValue?.toString() || '';
}

function compareSelect(aValue, bValue) {
  const aText = convertSelectValueToText(aValue);
  const bText = convertSelectValueToText(bValue);
  return aText.localeCompare(bText);
}

function convertMultiSelectValueToText(value) {
  if (Array.isArray(value)) {
    return value.sort().join(',');
  }
  return value?.toString() || '';
}

function compareMultiSelect(aValue, bValue) {
  const aText = convertMultiSelectValueToText(aValue);
  const bText = convertMultiSelectValueToText(bValue);
  return aText.localeCompare(bText);
}

function normalizeViewsValue(value) {
  const result = [];

  if (Array.isArray(value)) {
    for (const key of Object.keys(TagValues)) {
      if (value.includes(key)) {
        result.push(TagValues[key]);
      }
    }
  }

  return result;
}

function convertViewsValueToInt(value) {
  const v = normalizeViewsValue(value);
  if (v.length >= 3) {
    return v[0] * 100 + v[1] * 10 + v[2];
  } if (v.length >= 2) {
    return v[0] * 10 + v[1];
  } if (v.length >= 1) {
    return v[0];
  }
  return 0;
}

function compareViews(aValue, bValue) {
  const aText = convertViewsValueToInt(aValue);
  const bText = convertViewsValueToInt(bValue);
  if (aText < bText) {
    return -1;
  } if (aText > bText) {
    return 1;
  }
  return 0;
}

function compareDate(aValue, bValue) {
  try {
    const aMoment = moment(aValue);
    const bMoment = moment(bValue);
    return aMoment.diff(bMoment);
  } catch (error) {
    console.log('date排序错误:', 'aValue:', aValue, 'bValue:', bValue);
    console.log(error);
    return 0;
  }
}

function convertRelatedRequirementsValueToInt(value) {
  if (Array.isArray(value)) {
    return value.length;
  }
  return 0;
}

function compareRelatedRequirements(aValue, bValue) {
  const aNum = convertRelatedRequirementsValueToInt(aValue);
  const bNum = convertRelatedRequirementsValueToInt(bValue);
  return aNum - bNum;
}

export const SortableDataTypes = {
  treeNode: compareTreeNode,
  text: compareText,
  number: compareNumber,
  checkbox: compareCheckbox,
  select: compareSelect,
  multiSelect: compareMultiSelect,
  views: compareViews,
  date: compareDate,
  hyperlink: compareText,
  relatedRequirements: compareRelatedRequirements,
};

export function getSortableColumns(columns) {
  return columns.filter((col) => !!SortableDataTypes[col.dataType]);
}

export function getFirstSortableColumn(columns) {
  for (const col of columns) {
    if (SortableDataTypes[col.dataType]) {
      return col;
    }
  }

  return null;
}

export function simplifySortKeys(columns, options) {
  const sortKeys = [];

  if (options?.sorting?.sortKeys.length) {
    for (const sortKey of options.sorting.sortKeys) {
      const col = columns.find((c) => c.uuid === sortKey.colUUID);
      if (!col) {
        continue;
      }

      if (sortKeys.length > 0) {
        const lastSortKey = sortKeys[sortKeys.length - 1];
        if (sortKey.colUUID === lastSortKey.colUUID) {
          // 如果当前排序列与上一列相同，则替换上一个
          sortKeys[sortKeys.length - 1] = sortKey;
        } else {
          sortKeys.push(sortKey);
        }
      } else {
        sortKeys.push(sortKey);
      }
    }
  }

  return sortKeys;
}

export function makeRowComparator(columns, sortKeys) {
  const columnMap = {}; // colUUID -> col
  for (const col of columns) {
    columnMap[col.uuid] = col;
  }

  const compareRows = (a, b) => {
    for (const sortKey of sortKeys) {
      // 找出当前sortKey所对应的列
      // 如果找不到，则忽略这个sortKey
      const col = columnMap[sortKey.colUUID];
      if (!col) {
        continue;
      }

      // 如果当前列不支持排序，则忽略这个sortKey
      const compare = SortableDataTypes[col.dataType];
      if (!compare) {
        continue;
      }

      const aValue = a.fields?.[col.uuid];
      const bValue = b.fields?.[col.uuid];
      const result = compare(aValue, bValue);
      if (result !== 0) { // 如果两个值不相等，则返回比较结果
        if (sortKey.order === 1) { // 降序
          return -result;
        } // 升序
        return result;
      }

      // 如果两个值相等，则继续比较下一个sortKey
    }

    return 0;
  };

  return compareRows;
}
