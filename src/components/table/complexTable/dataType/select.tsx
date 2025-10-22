// @ts-nocheck
import React from 'react';

import TD from '../TD';
import { IconSelectSingle } from '../SvgIcons';
import { MultiSelectCellContent } from './multiSelect';

function valueToClipboardString(value) {
  if (typeof value === 'undefined' || value === null) {
    return '';
  } if (Array.isArray(value)) {
    return value.join(', ');
  }
  return `${value}`;
}

function valueFromClipboardString(str) {
  const set = new Set();

  const parts = str.split(/,\s*/);
  for (let entry of parts) {
    entry = entry.trim();
    if (entry !== '') {
      set.add(entry);
      break;
    }
  }

  return Array.from(set);
}

function SelectCellContent(props) {
  const {
    colUUID,
    rowUUID,
    dataType,
    choices = [],
    format = 'tag',
    locked,
    value,
  } = props;

  function onClick(e) {
    if (locked) {
      return;
    }

    const elem = e.target.closest('.cell-view-select');
    if (!elem) {
      return;
    }

    const rect = elem.getBoundingClientRect();
    const position = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };

    const detail = {
      panelType: 'SelectionPanel',
      action: 'toggle',
      placement: 'bottom',
      position,
      column: colUUID,
      row: rowUUID,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  if (format === 'tag') { // 渲染为标签
    return (
      <MultiSelectCellContent
        colUUID={colUUID}
        rowUUID={rowUUID}
        dataType={dataType}
        choices={choices}
        locked={locked}
        value={value}
      />
    );
  } if (format === 'fillColor') { // 渲染为填色
    const realValue = Array.isArray(value) ? value[0] : value;

    let color = null;
    for (const choice of choices) {
      if (choice.name === realValue) {
        color = choice.color;
        break;
      }
    }

    let cssColor = 'transparent';
    if (color) {
      cssColor = color.color;
    }

    return (
      <div className="cell-view-select" onClick={onClick}>
        <div
          className="format-fillColor"
          style={{
            backgroundColor: cssColor,
          }}
        />
      </div>
    );
  } if (format === 'signalLight') { // 渲染为信号灯
    const realValue = Array.isArray(value) ? value[0] : value;

    let color = null;
    for (const choice of choices) {
      if (choice.name === realValue) {
        color = choice.color;
        break;
      }
    }

    let cssColor = 'transparent';
    if (color) {
      cssColor = color.color;
    }

    return (
      <div className="cell-view-select" onClick={onClick}>
        <div
          className="format-signalLight"
          style={{
            backgroundColor: cssColor,
          }}
        />
      </div>
    );
  } // 'text' or others, 渲染为文本
  return (
    <div className="cell-view-select" onClick={onClick}>
      {value}
    </div>
  );
}

const SelectCell = React.memo((props) => {
  const {
    colUUID,
    rowUUID,
    onPage,
    dataType,
    isFirstColumn,
    width,
    choices,
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
    dataType,
    choices,
    format,
    locked,
    value,
  };

  return (
    <TD {...tdProps}>
      {
        onPage
        && <SelectCellContent {...textProps} />
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
        choices: col.choices,
        format: col.format,
        locked: readOnly || lockFullTable || col.locked || row.locked,
        value: cellValue,
        style: cellStyle,
      };
  
      const td = <SelectCell key={key} {...props1} />;
      tdList.push(td);
    }
  }

  return tdList;
}

const DataType = {
  name: 'select',
  nameCN: 'Select',
  icon: IconSelectSingle,
  valueToClipboardString,
  valueFromClipboardString,
  renderOneColumn,
};

export default DataType;
