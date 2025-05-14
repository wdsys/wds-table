// @ts-nocheck
import React from 'react';

import TD from '../TD';
import DefaultTagColors from '../DefaultTagColors';
import { IconSelectMultiple } from '../SvgIcons';

function valueToClipboardString(value) {
  if (typeof value === 'undefined' || value === null) {
    return '';
  }

  if (Array.isArray(value)) {
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
    }
  }

  return Array.from(set);
}

function TagList(props) {
  const {
    choices,
    value,
    limit = -1,
  } = props;

  const tags = [];

  if (!(choices?.length && value)) {
    return tags;
  }

  let array;
  if (Array.isArray(value)) {
    array = value;
  } else {
    array = [value];
  }

  for (let i = 0; i < array.length; i += 1) {
    if (limit >= 0 && tags.length >= limit) {
      break;
    }

    const item = array[i];

    let choice = null;
    for (const ch of choices) {
      if (ch.name === item) {
        choice = ch;
        break;
      }
    }

    if (!choice) {
      continue;
    }

    const bg = choice?.color?.color || DefaultTagColors[0].color;

    const tag = (
      <span
        key={i}
        className="tag"
        style={{
          backgroundColor: bg,
        }}
      >
        <span className="name">{item}</span>
      </span>
    );

    tags.push(tag);
  }

  return tags;
}

export function MultiSelectCellContent(props) {
  const {
    colUUID,
    rowUUID,
    dataType,
    choices,
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

  let limit;
  if (dataType === 'select' || dataType === 'requirementStatus') {
    limit = 1; // 单选
  } else {
    limit = -1; // 多选
  }

  return (
    <div className="cell-view-select" onClick={onClick}>
      <TagList choices={choices} value={value} limit={limit} />
    </div>
  );
}

const MultiSelectCell = React.memo((props) => {
  const {
    colUUID,
    rowUUID,
    onPage,
    dataType,
    isFirstColumn,
    width,
    choices,
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
    locked,
    value,
  };

  return (
    <TD {...tdProps}>
      {
        onPage
        && <MultiSelectCellContent {...textProps} />
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
      const cellValue = row?.fields?.[col?.uuid];
      const cellStyle = row?.styles?.[col?.uuid] || {};
  
      const props1 = {
        colUUID: col.uuid,
        rowUUID: row.uuid,
        onPage: pageRowUUIDs.has(row.uuid),
        dataType: col.dataType,
        isFirstColumn,
        width: col.width,
        choices: col.choices,
        locked: readOnly || lockFullTable || col.locked || row.locked,
        value: cellValue,
        style: cellStyle,
      };
  
      const td = <MultiSelectCell key={key} {...props1} />;
      tdList.push(td);
    }
  }

  return tdList;
}

const DataType = {
  name: 'multiSelect',
  nameCN: '多选',
  icon: IconSelectMultiple,
  valueToClipboardString,
  valueFromClipboardString,
  renderOneColumn,
};

export default DataType;
