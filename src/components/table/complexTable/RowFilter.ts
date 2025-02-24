// @ts-nocheck
import moment from 'moment';
import { useContext } from 'react';

import { LocalStateContext } from './contexts';

function filterCellByTreeNodeLevel(cell, operatorId, operand) {
  const cellValue = parseInt(cell, 10) || 0;
  const compareValue = parseInt(operand, 10) || 0;

  if (operatorId === 'levelLT') {
    return cellValue < compareValue;
  } if (operatorId === 'levelEqual') {
    return cellValue === compareValue;
  } // levelGT
  return cellValue > compareValue;
}

function filterCellOfTypeText(cell, operatorId, operand) {
  const cellValue = cell || '';
  const compareValue = operand || '';

  if (operatorId === 'include') {
    return cellValue.includes(compareValue);
  } if (operatorId === 'notInclude') {
    return !cellValue.includes(compareValue);
  } if (operatorId === 'equal') {
    return cellValue === compareValue;
  } if (operatorId === 'notEqual') {
    return cellValue !== compareValue;
  } if (operatorId === 'startsWith') {
    return cellValue.startsWith(compareValue);
  } if (operatorId === 'endsWith') {
    return cellValue.endsWith(compareValue);
  } if (operatorId === 'empty') {
    return cellValue === '';
  } if (operatorId === 'notEmpty') {
    return cellValue !== '';
  }
  return true; // default true for unknown operator
}

function filterCellOfTypeTreeNode(cell, operatorId, operand) {
  if (operatorId === 'levelLT'
    || operatorId === 'levelEqual'
    || operatorId === 'levelGT') {
    return filterCellByTreeNodeLevel(cell?.level, operatorId, operand);
  }
  return filterCellOfTypeText(cell?.text, operatorId, operand);
}

function filterCellOfTypeNumber(cell, operatorId, operand) {
  const cellValue = parseFloat(cell) || 0;
  const compareValue = parseFloat(operand) || 0;

  if (operatorId === 'equal') {
    return Math.abs(cellValue - compareValue) < 1e-6;
  } if (operatorId === 'notEqual') {
    return Math.abs(cellValue - compareValue) >= 1e-6;
  } if (operatorId === 'gt') {
    return cellValue > compareValue;
  } if (operatorId === 'lt') {
    return cellValue < compareValue;
  } if (operatorId === 'ge') {
    return cellValue >= compareValue;
  } if (operatorId === 'le') {
    return cellValue <= compareValue;
  }
  return true; // default true for unknown operator
}

function filterCellOfTypeCheckbox(cell, operatorId, operand) {
  const cellValue = !!cell;
  const compareValue = !!operand;

  if (operatorId === 'equal') {
    return cellValue === compareValue;
  }
  return true; // default true for unknown operator
}

function filterCellOfTypeReqStatus(cell, operatorId, operand) {
  let cellValue;
  if (Array.isArray(cell)) {
    [cellValue] = cell;
  } else {
    cellValue = cell || '未协调';
  }

  if (operatorId === 'equal') {
    return cellValue === operand;
  } if (operatorId === 'notEqual') {
    return cellValue !== operand;
  } if (operatorId === 'empty') {
    return !cellValue;
  } if (operatorId === 'notEmpty') {
    return !!cellValue;
  }
  return true; // default true for unknown operator
}

function filterCellOfTypeViewLinks(cell, operatorId, operand) {
  if (operatorId === 'empty') {
    return !(Array.isArray(cell) && cell.length > 0);
  } if (operatorId === 'notEmpty') {
    return Array.isArray(cell) && cell.length > 0;
  }
  return true; // default true for unknown operator
}

function filterCellOfTypeSelect(cell, operatorId, operand) {
  let cellValue;
  if (Array.isArray(cell)) {
    [cellValue] = cell;
  } else {
    cellValue = cell;
  }

  if (operatorId === 'equal') {
    return cellValue === operand;
  } if (operatorId === 'notEqual') {
    return cellValue !== operand;
  } if (operatorId === 'empty') {
    return !cellValue;
  } if (operatorId === 'notEmpty') {
    return !!cellValue;
  }
  return true; // default true for unknown operator
}

function filterCellOfTypePerson(cell, operatorId, operand) {
  let cellValue;
  if (Array.isArray(cell)) {
    [cellValue] = cell;
  } else {
    cellValue = cell;
  }

  if (operatorId === 'equal') {
    return cellValue?.id === operand;
  } if (operatorId === 'notEqual') {
    return cellValue?.id !== operand;
  } if (operatorId === 'empty') {
    return !cellValue;
  } if (operatorId === 'notEmpty') {
    return !!cellValue;
  }
  return true; // default true for unknown operator
}

function filterCellOfTypePersons(cell, operatorId, operand) {
  if (operatorId === 'include') {
    if (Array.isArray(cell)) {
      return cell.some((i) => i?.id === operand);
    }
    return false;
  } if (operatorId === 'notInclude') {
    if (Array.isArray(cell)) {
      return cell.every((i) => i?.id !== operand);
    }
    return true;
  } if (operatorId === 'empty') {
    if (Array.isArray(cell)) {
      return cell.length === 0;
    }
    return true;
  } if (operatorId === 'notEmpty') {
    if (Array.isArray(cell)) {
      return cell.length > 0;
    }
    return false;
  }
  return true; // default true for unknown operator
}

function filterCellOfMultiSelect(cell, operatorId, operand) {
  if (operatorId === 'include') {
    if (Array.isArray(cell)) {
      return cell.includes(operand);
    }
    return false;
  } if (operatorId === 'notInclude') {
    if (Array.isArray(cell)) {
      return !cell.includes(operand);
    }
    return true;
  } if (operatorId === 'empty') {
    if (Array.isArray(cell)) {
      return cell.length === 0;
    }
    return true;
  } if (operatorId === 'notEmpty') {
    if (Array.isArray(cell)) {
      return cell.length > 0;
    }
    return false;
  }
  return true; // default true for unknown operator
}

function filterCellOfDate(cell, operatorId, operand) {
  let cellValue = null;
  if (cell) {
    try {
      cellValue = moment(cell);
    } catch (err) {
      // ignore
    }
  }

  let compareValue = null;
  if (operand) {
    try {
      compareValue = moment(operand);
    } catch (err) {
      // ignore
    }
  }

  if (operatorId === 'equal') {
    return cellValue?.isSame(compareValue);
  } if (operatorId === 'notEqual') {
    return !cellValue?.isSame(compareValue);
  } if (operatorId === 'lt') {
    return cellValue?.isBefore(compareValue);
  } if (operatorId === 'gt') {
    return cellValue?.isAfter(compareValue);
  } if (operatorId === 'le') {
    return cellValue?.isSameOrBefore(compareValue);
  } if (operatorId === 'ge') {
    return cellValue?.isSameOrAfter(compareValue);
  } if (operatorId === 'empty') {
    return cellValue === null;
  } if (operatorId === 'notEmpty') {
    return cellValue !== null;
  }
  return true; // default true for unknown operator
}

function filterCellOfTypeFile(cell, operatorId, operand) {
  const fileNames = [];
  if (cell?.length) {
    for (const attachment of cell) {
      const fileName = attachment?.name;
      if (fileName) {
        fileNames.push(fileName);
      }
    }
  }

  const cellValue = fileNames.join('\n').toLowerCase();
  const compareValue = operand || '';

  if (operatorId === 'include') {
    if (compareValue) {
      return cellValue.includes(compareValue);
    }
    return true;
  } if (operatorId === 'notInclude') {
    if (compareValue) {
      return !cellValue.includes(compareValue);
    }
    return true;
  } if (operatorId === 'empty') {
    return cellValue.length === 0;
  } if (operatorId === 'notEmpty') {
    return cellValue.length > 0;
  }
  return true; // default true for unknown operator
}

function filterCellOfTypeRelatedRequirements(cell, operatorId, _operand) {
  if (operatorId === 'empty') {
    return !(Array.isArray(cell) && cell.length > 0);
  } if (operatorId === 'notEmpty') {
    return Array.isArray(cell) && cell.length > 0;
  }
  return true; // default true for unknown operator
}

function filterRowWithOneCondition(cond, row, columns) {
  // Find the column by cond.colUUID.
  let column = null;
  for (const col of columns) {
    if (col.uuid === cond.colUUID) {
      column = col;
      break;
    }
  }

  // If the column is not found, the condition is ignored.
  if (!column) {
    return true;
  }

  let cell = row.fields?.[column.uuid];

  if (column.dataType === 'viewLinks') {
    const {
      viewLinks,
    } = useContext(LocalStateContext);

    for (const rowLink of viewLinks) {
      if (row.uuid === rowLink.row_uuid) {
        cell = rowLink?.links;
      }
    }
  }

  if (column.dataType === 'treeNode') {
    return filterCellOfTypeTreeNode(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'text') {
    return filterCellOfTypeText(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'number') {
    return filterCellOfTypeNumber(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'checkbox') {
    return filterCellOfTypeCheckbox(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'select') {
    return filterCellOfTypeSelect(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'multiSelect') {
    return filterCellOfMultiSelect(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'views') {
    return filterCellOfMultiSelect(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'date') {
    return filterCellOfDate(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'hyperlink') {
    return filterCellOfTypeText(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'file') {
    return filterCellOfTypeFile(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'relatedRequirements') {
    return filterCellOfTypeRelatedRequirements(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'requirementStatus') {
    return filterCellOfTypeReqStatus(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'viewLinks') {
    return filterCellOfTypeViewLinks(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'taskPriority') {
    return filterCellOfTypeSelect(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'taskInCharger') {
    return filterCellOfTypePerson(cell, cond.operatorId, cond.operand);
  } if (column.dataType === 'taskHolder') {
    return filterCellOfTypePersons(cell, cond.operatorId, cond.operand);
  }

  // default true for unsupported dataType filter
  return true;
}

function filterRowWithAnyCondition(conditions, row, columns) {
  for (const cond of conditions) {
    if (filterRowWithOneCondition(cond, row, columns)) {
      return true;
    }
  }

  return false;
}

function filterRowWithAllCondition(conditions, row, columns) {
  for (const cond of conditions) {
    if (!filterRowWithOneCondition(cond, row, columns)) {
      return false;
    }
  }

  return true;
}

function filterRow(filter, row, columns) {
  if (!filter?.conditions?.length) {
    return true;
  }

  if (filter.relation === 'any') {
    return filterRowWithAnyCondition(filter.conditions, row, columns);
  } // 'all'
  return filterRowWithAllCondition(filter.conditions, row, columns);
}

export default filterRow;
