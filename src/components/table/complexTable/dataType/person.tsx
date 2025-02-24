// @ts-nocheck
import { IconPerson } from '../SvgIcons';

function valueToClipboardString(value) {
  return '';
}

function valueFromClipboardString(str) {
  return undefined;
}

const DataType = {
  name: 'person',
  nameCN: '单人',
  icon: IconPerson,
  valueToClipboardString,
  valueFromClipboardString,
};

export default DataType;
