// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';

import React, {
  useState,
  useEffect,
  useRef,
  useContext,
} from 'react';

import {
  message,
  Checkbox,
} from 'antd';

import {
  InterfaceFunctionContext,
  CellRendererContext,
} from '../contexts';

import TD from '../TD';
import { IconTreeNode } from '../SvgIcons';
import * as icons from '../SvgIcons';
import * as utils from '../utils';

function valueToClipboardString(value) {
  if (value) {
    let str = '';
    for (let i = 0; i < (value.level || 0); i += 1) {
      str += '    ';
    }

    str += value.text || '';
    str = str.replace(/\r?\n/g, ' ').trimRight();
    return str;
  }
  return '';
}

function valueFromClipboardString(str) {
  const re = /^(\s*)(.*)$/;
  let level;
  let content;

  const m = re.exec(str);
  if (m) {
    level = Math.floor(m[1].length / 4);
    [, , content] = m;
  } else {
    level = 0;
    content = str;
  }

  return {
    level,
    text: content,
  };
}

function TreeNodeCellContent(props) {
  const {
    colUUID,
    rowUUID,
    readOnly,
    locked,
  } = props;

  const {
    onOpenSubtable,
  } = useContext(InterfaceFunctionContext);

  const {
    treeNodeSpace,
    columns,
    rows,
    setRows,
    tableInfo,
    options,
  } = useContext(CellRendererContext);

  const hasFilterCondition = !!options?.filter?.conditions?.length;
  const col = utils.getColumnByUUID(columns, colUUID);
  const row = utils.getRowByUUID(rows, rowUUID);

  const ref = useRef(null);
  const [value, setValue] = useState(row?.fields?.[col?.uuid]);

  let linkUUID = null;
  let linkExist = false;
  if (value?.uuid) {
    linkUUID = value.uuid;
    linkExist = !!treeNodeSpace[linkUUID];
  }

  useEffect(() => {
    const newValue = row?.fields?.[col?.uuid];
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [props]);

  useEffect(() => {
    ref.current.innerText = value?.text || '';
  }, [value]);

  function onChangeCheckbox(e) {
    if (readOnly || locked) {
      return;
    }

    const { checked } = e.target;

    setRows((oldData) => {
      const selectedRows = [];
      if (hasFilterCondition) {
        selectedRows.push(row);
      } else {
        const roots = utils.createTreeFromTable(columns, oldData);
        const node = utils.findTreeNodeInRoots(roots, row.uuid);
        utils.getTreeNodeAllRows(node, selectedRows);
      }

      const selectedRowUUIDs = selectedRows.map((r) => r.uuid);

      const newData = [];
      for (const row1 of oldData) {
        const index = selectedRowUUIDs.indexOf(row1.uuid);
        if (index !== -1) {
          const oldValue = row1.fields?.[col.uuid];
          let newValue;
          if (typeof oldValue === 'object' && oldValue) {
            newValue = {
              ...oldValue,
              checked,
            };
          } else {
            newValue = {
              checked,
            };
          }

          const newRow = {
            ...row1,
            fields: {
              ...row1.fields,
              [col.uuid]: newValue,
            },
          };

          newData.push(newRow);
        } else {
          newData.push(row1);
        }
      }

      return newData;
    });
  }

  function onClickOpenClose(e) {
    // 虚拟表和协调表在被锁定后，可折叠展开
    if (!tableInfo.type && locked) {
      message.error('当前单元格被锁定，无法进行修改');
      return;
    }

    setRows((oldData) => oldData.map((_row) => {
      if (_row.uuid === row.uuid) {
        const oldValue = _row.fields?.[col.uuid];
        let newValue;
        if (typeof oldValue === 'object' && oldValue) {
          newValue = {
            ...oldValue,
            closed: !oldValue.closed,
          };
        } else {
          newValue = {
            closed: true,
          };
        }

        return {
          ..._row,
          fields: {
            ..._row.fields,
            [col.uuid]: newValue,
          },
        };
      }
      return _row;
    }));
  }

  function onMoveLeft() {
    if (readOnly || locked) {
      return;
    }

    setRows((oldData) => {
      const selectedRowUUIDs = [row.uuid];
      const newData = [];

      for (const row1 of oldData) {
        const newRow = { ...row1 };
        if (selectedRowUUIDs.includes(row1.uuid)) {
          const oldValue = row1.fields?.[col.uuid];
          let newValue;
          if (typeof oldValue === 'object' && oldValue) {
            const oldLevel = oldValue.level || 0;
            const newLevel = Math.max(0, oldLevel - 1);
            newValue = {
              ...oldValue,
              level: newLevel,
            };
          } else {
            newValue = {
              level: 0,
              text: '',
            };
          }

          newRow.fields = {
            ...row1.fields,
            [col.uuid]: newValue,
          };
        }

        newData.push(newRow);
      }

      return newData;
    });
  }

  function onMoveRight() {
    if (readOnly || locked) {
      return;
    }

    setRows((oldData) => {
      const selectedRowUUIDs = [row.uuid];
      const newData = [];

      for (const row1 of oldData) {
        const newRow = { ...row1 };
        if (selectedRowUUIDs.includes(row1.uuid)) {
          const oldValue = row1.fields?.[col.uuid];
          let newValue;
          if (typeof oldValue === 'object' && oldValue) {
            const oldLevel = oldValue.level || 0;
            const newLevel = oldLevel + 1;
            newValue = {
              ...oldValue,
              level: newLevel,
            };
          } else {
            newValue = {
              level: 0,
              text: '',
            };
          }

          newRow.fields = {
            ...row1.fields,
            [col.uuid]: newValue,
          };
        }

        newData.push(newRow);
      }

      return newData;
    });
  }

  function onDoubleClick(e) {
    if (readOnly || locked) {
      return;
    }

    if (ref.current) {
      ref.current.contentEditable = true;
      ref.current.focus();
    }
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      ref.current?.blur();
      event.preventDefault();
    } else if (event.key === 'Enter') {
      if (event.altKey) {
        ref.current?.blur();
        event.preventDefault();
      }
    } else if (event.key === ',') {
      if ((event.metaKey && event.shiftKey)
        || (event.ctrlKey && event.shiftKey)) {
        onMoveLeft();
        event.preventDefault();
      }
    } else if (event.key === '.') {
      if ((event.metaKey && event.shiftKey)
        || (event.ctrlKey && event.shiftKey)) {
        onMoveRight();
        event.preventDefault();
      }
    }
  }

  function onBlur(e) {
    if (readOnly || locked) {
      return;
    }

    if (ref.current) {
      ref.current.contentEditable = false;
    }

    const text = utils.getContentEditableText(e.target);
    // console.log('text:', JSON.stringify(text));
    // if you found text wrong, then check e.target.innerHTML

    setRows((oldData) => oldData.map((_row) => {
      if (_row.uuid === row.uuid) {
        const oldValue = _row.fields?.[col.uuid];
        let newValue;
        if (typeof oldValue === 'object' && oldValue) {
          newValue = {
            ...oldValue,
            text,
          };
        } else {
          newValue = {
            level: 0,
            text,
          };
        }

        return {
          ..._row,
          fields: {
            ..._row.fields,
            [col.uuid]: newValue,
          },
        };
      }
      return _row;
    }));
  }

  function onClickOpen(e) {
    let cellUUID;

    setRows((oldData) => {
      const newData = [];
      for (const row1 of oldData) {
        if (row1.uuid === row.uuid) {
          const oldValue = row1.fields?.[col?.uuid] || {};
          const newValue = {
            ...oldValue,
            uuid: oldValue.uuid || uuidv4(),
          };

          const newRow = {
            ...row1,
            fields: {
              ...row1.fields,
              [col.uuid]: newValue,
            },
          };

          cellUUID = newValue.uuid;
          newData.push(newRow);
        } else {
          newData.push(row1);
        }
      }

      return newData;
    });

    setTimeout(() => {
      if (onOpenSubtable) {
        onOpenSubtable(col, row, cellUUID);
      }
    }, 30);
  }
  const indent = hasFilterCondition ? 0 : ((value?.level || 0) * 50);
  return (
    <div
      className="cell-view-treeNode"
      style={{ marginLeft: `${indent}px` }}
    >
      <div className="checkbox">
        <Checkbox checked={value?.checked} onChange={onChangeCheckbox} />
      </div>
      <div className="open-close" onClick={onClickOpenClose}>
        {value?.closed
          ? <icons.IconTreeNodeClosed />
          : <icons.IconTreeNodeOpen />}
      </div>
      <div
        ref={ref}
        className="cell-view-text"
        contentEditable={false}
        onDoubleClick={(e) => onDoubleClick(e)}
        onKeyDown={(e) => onKeyDown(e)}
        onBlur={(e) => onBlur(e)}
      />
      <div className={`float-bar${linkExist ? ' has-link' : ''}`}>
        <div className="float-bar-content">
          {linkExist
            && (
              <div className="button" onClick={onClickOpen}>
                {linkExist ? '打开' : '新建'}
              </div>
            )}
          <span className="link-notation" />
        </div>
      </div>
    </div>
  );
}

const TreeNodeCell = React.memo((props) => {
  const {
    colUUID,
    rowUUID,
    onPage,
    dataType,
    isFirstColumn,
    width,
    readOnly,
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
    readOnly,
    locked,
    value,
  };

  return (
    <TD {...tdProps}>
      {
        onPage
        && <TreeNodeCellContent {...textProps} />
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
        readOnly,
        locked: lockFullTable || col.locked || row.locked,
        value: cellValue,
        style: cellStyle,
      };
  
      const td = <TreeNodeCell key={key} {...props1} />;
      tdList.push(td);
    }
  }

  return tdList;
}

const DataType = {
  name: 'treeNode',
  nameCN: '标题',
  icon: IconTreeNode,
  valueToClipboardString,
  valueFromClipboardString,
  renderOneColumn,
};

export default DataType;
