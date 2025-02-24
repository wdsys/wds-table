// @ts-nocheck
import moment from 'moment';
import React from 'react';

import { vsprintf } from '../sprintf';
import TD from '../TD';
import { IconDate } from '../SvgIcons';

function valueToClipboardString(value) {
  if (typeof value === 'undefined' || value === null) {
    return '';
  }
  return `${value}`;
}

function valueFromClipboardString(str) {
  const re = /((\d{1,4})(\.|\/|-)(\d{1,2})(\.|\/|-)(\d{1,2}))/;
  const m = re.exec(str);
  if (m) {
    const year = parseInt(m[2], 10);
    const month = parseInt(m[4], 10);
    const day = parseInt(m[6], 10);
    console.log([year, month, day]);
    const str1 = vsprintf('%2d-%02d-%02d', [year, month, day]);
    const date = moment(str1);
    return date.format('YYYY-MM-DD');
  }
  return undefined;
}

function DateCellContent(props) {
  const {
    colUUID,
    rowUUID,
    locked,
    value,
  } = props;

  function onClick(e) {
    if (locked) {
      return;
    }

    const elem = e.target.closest('.cell-view-date');
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
      panelType: 'DateEditPanel',
      action: 'toggle',
      placement: 'bottom',
      position,
      column: colUUID,
      row: rowUUID,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  let dateString;
  if (value) {
    const date = moment(value);
    dateString = date.format('YYYY-MM-DD');
  }

  return (
    <div className="cell-view-date" onClick={onClick}>
      <div className="text">
        {dateString}
      </div>
    </div>
  );
}

const DateCell = React.memo((props) => {
  const {
    colUUID,
    rowUUID,
    onPage,
    dataType,
    isFirstColumn,
    width,
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

  const contentProps = {
    colUUID,
    rowUUID,
    locked,
    value,
  };

  return (
    <TD {...tdProps}>
      {
        onPage
        && <DateCellContent {...contentProps} />
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
  } = props;

  const tdList = [];

  for (let i = 0; i < rows.length; i += 1) {
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
      locked: readOnly || lockFullTable || col.locked || row.locked,
      value: cellValue,
      style: cellStyle,
    };

    const td = <DateCell key={key} {...props1} />;
    tdList.push(td);
  }

  return tdList;
}

const DataType = {
  name: 'date',
  nameCN: '日期',
  icon: IconDate,
  valueToClipboardString,
  valueFromClipboardString,
  renderOneColumn,
};

export default DataType;
