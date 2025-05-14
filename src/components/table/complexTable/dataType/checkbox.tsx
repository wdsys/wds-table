// @ts-nocheck
import React from 'react';

import {
  Input,
  Switch,
} from 'antd';

import TD from '../TD';
import { IconCheckbox } from '../SvgIcons';

function valueToClipboardString(value) {
  if (value) {
    return 'true';
  }
  return 'false';
}

function valueFromClipboardString(str) {
  const re = /\s*(true|yes|on)\s*/i;
  if (re.exec(str)) {
    return true;
  }

  const num = parseInt(str, 10);
  if (!Number.isNaN(num) && num !== 0) {
    return true;
  }

  return false;
}

function CheckboxCellContent(props) {
  const {
    colUUID,
    rowUUID,
    view = 'checkbox',
    locked,
    value,
  } = props;
  function onChange(newValue) {
    if (locked) {
      return;
    }

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

  function onClick(e) {
    if (e.target.tagName === 'INPUT' || e.target.type === 'checkbox') {
      return;
    }

    const box = e.target.closest('.checkbox-box');
    if (!box) {
      return;
    }

    const input = box.querySelector('input');
    if (!input) {
      return;
    }

    onChange(!input.checked);
  }

  if (view === 'switch') {
    return (
      <div className="cell-view-checkbox">
        <Switch size="small" checked={!!value} onChange={onChange} />
      </div>
    );
  } // default: checkbox
  return (
    <div className="cell-view-checkbox">
      <div className="checkbox-box" onClick={onClick}>
        <div className="input-box">
          <Input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
        </div>
      </div>
    </div>
  );
}

const CheckboxCell = React.memo((props) => {
  const {
    colUUID,
    rowUUID,
    onPage,
    dataType,
    isFirstColumn,
    width,
    view,
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

  const checkboxProps = {
    colUUID,
    rowUUID,
    view,
    locked,
    value,
  };

  return (
    <TD {...tdProps}>
      {
        onPage
        && <CheckboxCellContent {...checkboxProps} />
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
      const cellValue = row?.fields?.[col?.uuid] || false;
      const cellStyle = row?.styles?.[col?.uuid] || {};
  
      const props1 = {
        colUUID: col.uuid,
        rowUUID: row.uuid,
        onPage: pageRowUUIDs.has(row.uuid),
        dataType: col.dataType,
        isFirstColumn,
        width: col.width,
        view: col.view,
        locked: readOnly || lockFullTable || col.locked || row.locked,
        value: cellValue,
        style: cellStyle,
      };
  
      const td = <CheckboxCell key={key} {...props1} />;
      tdList.push(td);
    }
  }

  return tdList;
}

const DataType = {
  name: 'checkbox',
  nameCN: '勾选框',
  icon: IconCheckbox,
  valueToClipboardString,
  valueFromClipboardString,
  renderOneColumn,
};

export default DataType;
