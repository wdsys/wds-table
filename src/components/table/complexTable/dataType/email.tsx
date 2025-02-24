// @ts-nocheck
import { IconMention } from '../SvgIcons';

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
  name: 'email',
  nameCN: '邮箱',
  icon: IconMention,
  valueToClipboardString,
  valueFromClipboardString,
};

export default DataType;
