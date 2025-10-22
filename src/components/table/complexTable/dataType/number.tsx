// @ts-nocheck
import React, {
  useState,
  useEffect,
  useRef,
} from 'react';

import {
  Input,
} from 'antd';

import TD from '../TD';
import ProgressBar from '../ProgressBar';
import { IconPercent } from '../SvgIcons';
import * as utils from '../utils';

const MoneyPrefixes = {
  RMB: '¥',
  USD: '$',
  EUR: '€',
  JPY: 'JP¥',
  HKD: 'HK$',
};

function valueToClipboardString(value) {
  if (typeof value === 'undefined') {
    return '';
  } if (Number.isNaN(value)) {
    return 'NaN';
  }
  return `${value}`;
}

function valueFromClipboardString(str) {
  return parseFloat(str);
}

function NumberEditor(props) {
  const {
    value,
    onBlur,
  } = props;

  const ref = useRef(null);

  useEffect(() => {
    const input = ref.current;
    if (input) {
      input.focus();
    }
  }, []);

  function onInputKeyDown(e) {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  }

  function onInputBlur(e) {
    if (onBlur) {
      onBlur(e.target.value);
    }
  }

  return (
    <div className="editor-box">
      <Input
        ref={ref}
        type="text"
        defaultValue={value}
        onKeyDown={onInputKeyDown}
        onBlur={onInputBlur}
      />
    </div>
  );
}

function NumberCellContent(props) {
  const {
    colUUID,
    rowUUID,
    format = 'number',
    locked,
    value,
  } = props;

  const [editing, setEditing] = useState(false);

  function onClick() {
    if (locked) {
      return;
    }

    if (!editing) {
      setEditing(true);
    }
  }

  function onChange(newValue, e) {
    if (newValue === value) {
      return;
    }

    const detail = {
      action: 'setCellValue',
      colUUID,
      rowUUID,
      value: newValue,
    };

    const ev = new CustomEvent('modifyTable', { detail });
    window.dispatchEvent(ev);
  }

  function onEditorBlur(newValue) {
    setEditing(false);
    onChange(newValue);
  }

  if (editing) {
    return (
      <div className="cell-view-number">
        <NumberEditor
          value={value}
          onBlur={onEditorBlur}
        />
      </div>
    );
  }

  const numValue = parseFloat(value) || 0;

  if (format === 'progress') { // 渲染为进度条
    return (
      <div className="cell-view-number">
        <div className="progress-box" onClick={onClick}>
          <ProgressBar value={numValue} readOnly={locked} onChange={onChange} />
        </div>
      </div>
    );
  } // 渲染为文本
  let text;
  const moneyPrefix = MoneyPrefixes[format];

  if (moneyPrefix) { // 渲染为货币格式
    const s = utils.formatNumberAsCommaSeparatedAndFixed(numValue, 3, 2);
    text = `${moneyPrefix}${s}`;
  } else if (format === 'int') {
    text = parseInt(numValue, 10).toString();
  } else if (format === 'thousands') {
    text = utils.formatNumberAsCommaSeparated(numValue, 3);
  } else if (format === 'frac2') {
    text = numValue.toFixed(2);
  } else if (format === 'percent') {
    text = `${numValue * 100}%`;
  } else { // default: number
    text = `${numValue}`;
  }

  return (
    <div className="cell-view-number">
      <div className="text-box" onClick={onClick}>
        <div>{text}</div>
      </div>
    </div>
  );
}

const NumberCell = React.memo((props) => {
  const {
    colUUID,
    rowUUID,
    onPage,
    dataType,
    isFirstColumn,
    width,
    format,
    locked,
    value,
    style,
  } = props;

  const tdProps = {
    colUUID,
    rowUUID,
    dataType,
    isFirstColumn,
    width,
    style,
  };

  const textProps = {
    colUUID,
    rowUUID,
    format,
    locked,
    value,
  };

  return (
    <TD {...tdProps}>
      {
        onPage
        && <NumberCellContent {...textProps} />
      }
    </TD>
  );
});

function renderOneColumn(props) {
  const {
    readOnly,
    lockFullTable,
    pageRowUUIDs,
    colIndex,
    col,
    isFirstColumn,
    rows,
    currentPageRowUUIDs,
  } = props;

  const tdList = [];

  for (let i = 0; i < rows.length; i += 1) {
    if(currentPageRowUUIDs.has(rows[i].uuid)){
      const key = `${i}-${colIndex}`;
      const row = rows[i];
      const cellValue = row?.fields?.[col?.uuid] || '';
      const cellStyle = row?.styles?.[col?.uuid] || {};
  
      const props1 = {
        colUUID: col.uuid,
        rowUUID: row.uuid,
        onPage: pageRowUUIDs.has(row.uuid),
        dataType: col.dataType,
        isFirstColumn,
        width: col.width,
        format: col.format,
        locked: readOnly || lockFullTable || col.locked || row.locked,
        value: cellValue,
        style: cellStyle,
      };
  
      const td = <NumberCell key={key} {...props1} />;
      tdList.push(td);
    }
  }

  return tdList;
}

const DataType = {
  name: 'number',
  nameCN: 'Number',
  icon: IconPercent,
  valueToClipboardString,
  valueFromClipboardString,
  renderOneColumn,
};

export default DataType;
