// @ts-nocheck
import { IconPhone } from '../SvgIcons';

function valueToClipboardString(value) {
  if (value) {
    return `${value}`;
  }
  return '';
}

function valueFromClipboardString(str) {
  return str;
}

const DataType = {
  name: 'phone',
  nameCN: '电话',
  icon: IconPhone,
  valueToClipboardString,
  valueFromClipboardString,
};

export default DataType;
