// @ts-nocheck
import React, {
  useState,
  useLayoutEffect,
  useRef,
} from 'react';

import TD from '../TD';
import { IconNotification } from '../SvgIcons';
import { generateColor } from './signature';

function valueToClipboardString(value) {
  return undefined;
}

function valueFromClipboardString(str) {
  return str;
}

function TextCellContent(props) {
  const {
    colUUID,
    rowUUID,
    locked,
    value,
    expandFormat = 'expand',
  } = props;
  let content = null;

  if (Array.isArray(value) && value?.length) {
    if (expandFormat === 'expand') {
      content = value.map((i) => (
        <div
          key={i.id}
          className="nameBlock"
          style={{ backgroundColor: generateColor(i.id) }}
        >
          {i.name}
        </div>
      ));
    } else {
      content = (
        <div>
          提醒列表已有
          {value.length}
          人
        </div>
      );
    }
  }
  function onClick(e) {
    if (locked) {
      return;
    }

    const detail = {
      panelType: 'SelectMemberModal',
      action: 'toggle',
      column: colUUID,
      row: rowUUID,
      values: value || [],
    };
    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  //   if (!locked && editing) {
  //     return (
  //       <TextEditor
  //         value={value}
  //         onChange={onChange}
  //         editing={editing}
  //         setEditing={setEditing}
  //       />
  //     );
  //   }
  return (
    <div className="cell-view-notification" onClick={onClick}>
      <div className="notification-blocks">{content}</div>
    </div>
  );
}

const TextCell = React.memo((props) => {
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
    expandFormat,
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
    locked,
    value,
    expandFormat,
  };

  return (
    <TD {...tdProps}>
      {
        onPage
          && <TextCellContent {...textProps} />
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
        locked: readOnly || lockFullTable || col.locked || row.locked,
        value: cellValue,
        style: cellStyle,
        expandFormat: col.expandFormat,
      };
      const td = <TextCell key={key} {...props1} />;
      tdList.push(td);
    }
  }

  return tdList;
}

const DataType = {
  name: 'notification',
  nameCN: '用户提醒',
  icon: IconNotification,
  valueToClipboardString,
  valueFromClipboardString,
  renderOneColumn,
};

export default DataType;
