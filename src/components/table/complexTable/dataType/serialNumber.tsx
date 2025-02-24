// @ts-nocheck
import React, {
  useState,
  useLayoutEffect,
  useRef,
} from 'react';

import TD from '../TD';
import { IconSerialNum } from '../SvgIcons';
import * as utils from '../utils';

const CUSTOMENTERINCELL = '|||';
const CUSTOMNEWLINEINCELL = '///';

function valueToClipboardString(value) {
  if (value) {
    let str = value.toString();
    str = str.replace(/\r/g, CUSTOMENTERINCELL).trim();
    str = str.replace(/\n/g, CUSTOMNEWLINEINCELL).trim();
    return str;
  }

  return '';
}

function valueFromClipboardString(str) {
  return str.replaceAll(CUSTOMNEWLINEINCELL, '\n').replaceAll(CUSTOMENTERINCELL, '\r');
}

function TextViewer(props) {
  const {
    value,
    onEdit,
  } = props;

  const timeoutRef = React.useRef(null);

  function onDoubleClick(e) {
    clearTimeout(timeoutRef.current);
    onEdit(e);
  }

  const content = value;
  return (
    <div
      className="cell-view-text"
      onDoubleClick={onDoubleClick}
    >
      {content}
    </div>
  );
}

function TextEditor(props) {
  const {
    value,
    onChange,
  } = props;

  const ref = useRef(null);

  useLayoutEffect(() => {
    const elem = ref.current;
    if (elem) {
      elem.innerText = value;
      elem.focus();
    }
  }, [value]);

  function onKeyDown(e) {
    if (e.keyCode === 13) { // Enter
      if (e.altKey) { // Alt+Enter
        e.preventDefault();
        e.target.blur();
      }
    } else if (e.keyCode === 27) { // Escape
      e.preventDefault();
      e.target.blur();
    }
  }

  function onBlur(e) {
    const text = utils.getContentEditableText(e.target);
    // console.log('text:', JSON.stringify(text));
    // if you found text wrong, then check e.target.innerHTML
    onChange(text);
  }

  return (
    <div
      ref={ref}
      className="cell-view-text"
      contentEditable
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    />
  );
}

function TextCellContent(props) {
  const {
    colUUID,
    rowUUID,
    locked,
    value,
  } = props;

  const [editing, setEditing] = useState(false);

  function onEdit(e) {
    if (locked) {
      return;
    }

    setEditing(true);
  }

  function onChange(newValue, e) {
    setEditing(false);

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

  if (!locked && editing) {
    return (
      <TextEditor
        value={value}
        onChange={onChange}
        editing={editing}
        setEditing={setEditing}
      />
    );
  }
  return (
    <TextViewer
      value={value}
      onEdit={onEdit}
    />
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
  } = props;

  const tdList = [];

  for (let i = 0; i < rows.length; i += 1) {
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
    };
    const td = <TextCell key={key} {...props1} />;
    tdList.push(td);
  }

  return tdList;
}

const DataType = {
  name: 'serialNumber',
  nameCN: '编码',
  icon: IconSerialNum,
  valueToClipboardString,
  valueFromClipboardString,
  renderOneColumn,
};

export default DataType;
