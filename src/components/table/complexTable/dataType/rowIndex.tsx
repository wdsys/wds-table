// @ts-nocheck
import React from 'react';

import TD from '../TD';
import { IconNumber } from '../SvgIcons';

function valueToClipboardString(value) {
  return `${value || 0}`;
}

const RowIndexCell = React.memo((props) => {
  const {
    colUUID,
    rowUUID,
    onPage,
    dataType,
    isFirstColumn,
    width,
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

  return (
    <TD {...tdProps}>
      {
        onPage
        && (
          <div className="cell-view-rowIndex">
            {value}
          </div>
        )
      }
    </TD>
  );
});

function renderOneColumn(props) {
  const {
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
      const cellValue = i + 1;
      const cellStyle = row?.styles?.[col?.uuid] || {};
  
      const props1 = {
        colUUID: col.uuid,
        rowUUID: row.uuid,
        onPage: pageRowUUIDs.has(row.uuid),
        dataType: col.dataType,
        isFirstColumn,
        width: col.width,
        value: cellValue,
        style: cellStyle,
      };
  
      const td = <RowIndexCell key={key} {...props1} />;
      tdList.push(td);
    }
  }

  return tdList;
}

const DataType = {
  name: 'rowIndex',
  nameCN: '序号',
  icon: IconNumber,
  valueToClipboardString,
  renderOneColumn,
};

export default DataType;
