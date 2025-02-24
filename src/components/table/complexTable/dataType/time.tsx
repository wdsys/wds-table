// @ts-nocheck
import { IconTime } from '../SvgIcons';

function valueToClipboardString(value) {
  if (typeof value === 'undefined' || value === null) {
    return '';
  }

  return `${value}`;
}

function valueFromClipboardString(str) {
  return undefined;
}

const DataType = {
  name: 'time',
  nameCN: '时间',
  icon: IconTime,
  valueToClipboardString,
  valueFromClipboardString,
};

export default DataType;
