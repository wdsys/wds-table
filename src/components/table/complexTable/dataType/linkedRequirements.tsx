// @ts-nocheck
import React, {
  useContext,
} from 'react';

import {
  ArrowLeftOutlined,
} from '@ant-design/icons';

import { Modal, message, Table } from 'antd';

import {
  InterfaceFunctionContext,
  CellRendererContext,
  LocalStateContext,
} from '../contexts';

import TD from '../TD';
import { IconLinkedRequirements } from '../SvgIcons';

function valueToClipboardString(value) {
  return value || '';
}

function valueFromClipboardString(str) {
  return str;
}

function showLinkedReqList({
  content, onClick, color, treeNodeValue,
}) {
  const { children, name } = content;
  const columns = [
    {
      title: '序号',
      width: 60,
      align: 'center',
      render: (_, r, index) => index + 1,
    },
    {
      title: '相关引用',
      dataIndex: 'rowName',
      ellipsis: true,
      render: (i, item) => (
        <div style={{ cursor: 'pointer', color, width: 'fit-content' }} onClick={() => { onClick(item); }}>
          <ArrowLeftOutlined style={{ marginRight: 4 }} />
          {i || '无标题'}
        </div>
      ),
    },
  ];
  Modal.confirm({
    title: `${treeNodeValue || ''}-${name}`,
    icon: '',
    maskClosable: false,
    okText: '关闭',
    closable: true,
    width: 600,
    mask: false,
    cancelButtonProps: { style: { display: 'none' } },
    okButtonProps: { style: { display: 'none' } },
    content: (
      <Table columns={columns} dataSource={children} pagination={false} />
    ),
  });
}

function LinkedRequirementItem(props) {
  const {
    index,
    item,
    otherProject,
    type,
    treeNodeValue,
    onClickLink,
  } = props;

  let className = 'related-requirement-item';
  if (otherProject) {
    className += ' other-project';
  }

  if (type === 'parent') {
    const color = otherProject ? '#085c10' : '#0505f2';
    const text = `${item.name || item.id}(${item.children?.length})`;

    return (
      <div
        className="lined-requirement-project"
        style={{
          cursor: 'pointer', color, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}
        onClick={() => {
          showLinkedReqList({
            content: item, onClick: onClickLink, color, treeNodeValue,
          });
        }}
      >
        <span title={text}>
          {text}
        </span>
      </div>
    );
  }
  const name = item.rowName || '无标题';
  return (
    <div className={className} style={{ paddingLeft: 16 }}>
      <span className="icon"><ArrowLeftOutlined /></span>
      <span className="text" onClick={(e) => onClickLink(item, index)}>
        <span className="url" title={name}>{name}</span>
        <span className="name" />
      </span>
    </div>
  );
}

function LinkedRequirementsCellContent(props) {
  const {
    rowUUID,
    locked,
    expandFormat = 'expand',
    treeNodeValue,
  } = props;

  const {
    onOpenRelatedRequirement,
    checkTargetLinkExist,
    deleteBrokenLink,
  } = useContext(InterfaceFunctionContext);

  const {
    projectId,
    requirementSetUUID,
    tableUUID,
  } = useContext(CellRendererContext);

  const {
    linkedRequirements: {
      result: linkedRequirements = {},
      projects: projectMap,
    },
  } = useContext(LocalStateContext);

  function onClickLinkedRequirementItem(item, compareData, callback) {
    const isSameProject = (item.projectId.toString() === compareData.projectId);
    const isSameReqSet = (item.requirementSetUUID === compareData.requirementSetUUID);
    const isSameTable = (item.tableUUID === compareData.tableUUID);

    if (isSameProject && isSameReqSet && isSameTable) {
      const detail = { uuid: item.rowUUID };
      const e = new CustomEvent('locateBlinkRow', { detail });
      window.dispatchEvent(e);
      return;
    }

    if (onOpenRelatedRequirement) {
      let rowURL = 'requirement:';
      rowURL += `/projects/${item.projectId}`;
      rowURL += `/requirements/${item.requirementSetUUID}`;
      rowURL += `/tables/${item.tableUUID}`;
      rowURL += `/rows/${item.rowUUID}`;

      onOpenRelatedRequirement(rowURL, callback);
    }
  }

  function getClickFunctionWithCloseData() {
    const compareData = {
      projectId,
      requirementSetUUID,
      tableUUID,
    };

    function changeCompareData(data) {
      compareData.requirementSetUUID = data.reqUUID;
      compareData.tableUUID = data.tableUUID;
    }

    return async function (item) {
      const isExist = await checkTargetLinkExist(item);
      if (isExist?.valid === true) {
        onClickLinkedRequirementItem(item, compareData, changeCompareData);
      } else {
        Modal.error({
          title: '相关引用已损坏！',
          okText: '删除引用',
          onOk: async () => {
            const res = await deleteBrokenLink({
              src_requirement_set_uuid: item.requirementSetUUID,
              src_sheet_uuid: item.tableUUID,
              src_row_uuid: item.rowUUID,
              src_project_id: item.projectId,
              dst_requirement_set_uuid: requirementSetUUID,
              dst_sheet_uuid: tableUUID,
              dst_row_uuid: rowUUID,
              dst_project_id: projectId,
            });
            if (res !== 0) {
              message.error('删除失败！');
            }
          },
        });
      }
    };
  }

  const checkBeforeJump = getClickFunctionWithCloseData();

  const itemElems = [];
  const value = linkedRequirements[rowUUID];

  let renderAry = [];
  const isCollapse = expandFormat === 'collapse';
  const type = isCollapse ? 'parent' : 'child';

  if (Array.isArray(value) && value.length > 0) {
    if (isCollapse) {
      renderAry = value.reduce((pre, current) => {
        const relatedProject = pre.find((p) => p.id === current.projectId);
        if (relatedProject) {
          relatedProject.children?.push?.(current);
        } else {
          const selfProject = projectMap?.find?.((i) => i.id === current.projectId);
          pre.push({
            id: current.projectId,
            name: selfProject?.name || '',
            children: [current],
            projectId: current.projectId,
          });
        }
        return pre;
      }, []);
    } else {
      renderAry = value;
    }

    for (let i = 0; i < renderAry.length; i += 1) {
      const item = renderAry[i];
      if (!item) {
        continue;
      }

      const otherProject = (`${item.projectId}` !== `${projectId}`);

      const elem = (
        <LinkedRequirementItem
          key={i}
          index={i}
          item={item}
          type={type}
          treeNodeValue={treeNodeValue}
          otherProject={otherProject}
          onClickLink={checkBeforeJump}
        />
      );

      itemElems.push(elem);

      // if (expandFormat === 'expand') {
      //   item.children?.forEach?.((subItem, index) => {
      //     const subElem = (
      //       <LinkedRequirementItem
      //         // eslint-disable-next-line react/no-array-index-key
      //         key={`${i}${index}`}
      //         index={`${i}${index}`}
      //         item={subItem}
      //         type="child"
      //         otherProject={otherProject}
      //         onClickLink={checkBeforeJump}
      //       />
      //     );
      //     itemElems.push(subElem);
      //   });
      // }
    }
  }

  return (
    <div className="cell-view-related-requirements">
      <div className="related-requirement-list">
        {itemElems}
      </div>
    </div>
  );
}

const LinkedRequirementsCell = React.memo((props) => {
  const {
    colUUID,
    rowUUID,
    onPage,
    dataType,
    isFirstColumn,
    width,
    locked,
    style,
    treeNodeValue,
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
    expandFormat,
    treeNodeValue,
  };

  return (
    <TD {...tdProps}>
      {
        onPage
        && <LinkedRequirementsCellContent {...textProps} />
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
    columns = [],
    currentPageRowUUIDs,
  } = props;
  const tdList = [];

  const treeNodeUUID = columns?.find?.((c) => c.dataType === 'treeNode')?.uuid;

  for (let i = 0; i < rows.length; i += 1) {

    if(currentPageRowUUIDs.has(rows[i].uuid)){
      const key = `${i}-${colIndex}`;
      const row = rows[i];
      const cellStyle = row?.styles?.[col?.uuid] || {};
      const treeNodeValue = row.fields?.[treeNodeUUID]?.text;
  
      const props1 = {
        colUUID: col.uuid,
        rowUUID: row.uuid,
        onPage: pageRowUUIDs.has(row.uuid),
        dataType: col.dataType,
        expandFormat: col.expandFormat,
        isFirstColumn,
        width: col.width,
        locked: readOnly || lockFullTable || col.locked || row.locked,
        style: cellStyle,
        treeNodeValue,
      };
      const td = <LinkedRequirementsCell key={key} {...props1} />;
      tdList.push(td);
    }
  }

  return tdList;
}

const DataType = {
  name: 'linkedRequirements',
  nameCN: '相关引用',
  icon: IconLinkedRequirements,
  valueToClipboardString,
  valueFromClipboardString,
  renderOneColumn,
};

export default DataType;
