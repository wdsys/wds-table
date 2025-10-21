// @ts-nocheck
import React, { useContext } from 'react';
import { Checkbox } from 'antd';
import TD from '../TD';
import { IconNumber } from '../SvgIcons';
import {
  CellRendererContext,
} from '../contexts';
import * as utils from '../utils';

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
    readOnly,
    locked,
  } = props;

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

  const tdProps = {
    colUUID,
    rowUUID,
    dataType,
    isFirstColumn,
    width,
    style,
  };

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
            let newValue = checked;
            // if (typeof oldValue === 'object' && oldValue) {
            //   newValue = {
            //     ...oldValue,
            //     checked,
            //   };
            // } else {
            //   newValue = {
            //     checked,
            //   };
            // }
  
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

  return (
    <TD {...tdProps}>
      {
        onPage
        && (
          <div className={`cell-view-rowIndex  ${value?.checked && 'checked'}`} >
            <div className='checkbox'>
              <Checkbox checked={value?.checked} onChange={onChangeCheckbox}/>
            </div>
            <div className='rowIndex'>{value.index}</div>
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
      let checked = !!row?.fields?.[col?.uuid];
      const props1 = {
        colUUID: col.uuid,
        rowUUID: row.uuid,
        onPage: pageRowUUIDs.has(row.uuid),
        dataType: col.dataType,
        isFirstColumn,
        width: col.width,
        value: {
          index: cellValue,
          checked
        },
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
