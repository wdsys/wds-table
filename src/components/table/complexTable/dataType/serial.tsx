// @ts-nocheck
import { IconNumber } from '../SvgIcons';

function valueToClipboardString(value) {
  if (typeof value === 'undefined') {
    return '';
  }
  return `${value}`;
}

function valueFromClipboardString(str) {
  return parseInt(str, 10);
}

const DataType = {
  name: 'serial',
  nameCN: '编号',
  icon: IconNumber,
  valueToClipboardString,
  valueFromClipboardString,
};

export default DataType;
