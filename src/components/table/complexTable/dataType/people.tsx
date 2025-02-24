// @ts-nocheck
import { IconPeople } from '../SvgIcons';

function valueToClipboardString(value) {
  return '';
}

function valueFromClipboardString(str) {
  return undefined;
}

const DataType = {
  name: 'people',
  nameCN: '多人',
  icon: IconPeople,
  valueToClipboardString,
  valueFromClipboardString,
};

export default DataType;
