// @ts-nocheck
import React from 'react';

import { utcTimeStampToLocal } from '../../utils';

import { TxtRender, IconRender, FileType } from './TypeRender';
import './index.less';

function ListView(props) {
  const {
    fileList = [],
    handleOpenFile = () => {},
    handleSelectItem,
    selectFile,
  } = props;

  const columns = [
    {
      title: '资源名称',
      dataIndex: 'name',
      width: 300,
      render: (txt, item) => (
        <>
          {
            item?.nodeType === 'file' ? FileType(item.name)?.icon : <IconRender nodeType={item?.nodeType} type={item?.type} />
          }
          <span style={{ width: 'calc(100% - 50px)' }}>{txt}</span>
        </>
      ),
    },
    {
      title: '修改日期',
      dataIndex: 'updated_at',
      width: 200,
      render: (date) => (date ? new Date(utcTimeStampToLocal(date))?.toLocaleString() : ''),
    },
    {
      title: '类型',
      dataIndex: 'nodeType',
      width: 200,
      render: (type, item) => (
        // eslint-disable-next-line react/jsx-no-useless-fragment
        <>
          {
            type === 'file' ? FileType(item.name)?.txt : <TxtRender nodeType={type} type={item?.type} />
          }
        </>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      width: 150,
      render: (txt) => txt && `${txt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} KB`,
    },
  ];

  function onContextMenu(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  const tableEles = [];
  // for (const item of fileList) {
  fileList.forEach((item) => {
    const {
      id, type, nodeType, name, uuid, folder_id: folderId, parent_id: parentId,
    } = item || {};

    const ele = (
      <div
        className={`
          file-wrap-item
          table-body-tr
          ${(selectFile?.id === id && nodeType === 'file') ? 'file-wrap-item_selected' : ''}
        `}
        role="presentation"
        key={`${type}-${nodeType}-${id}`}
        data-item={JSON.stringify({
          id, type, nodeType, name, uuid, folder_id: folderId, parent_id: parentId,
        })}
        onClick={(e) => { handleSelectItem(e, item); }}
        onDoubleClick={(e) => { handleOpenFile(e, item); }}
      >
        {columns?.map((i) => {
          const { dataIndex, width, render } = i;

          return (
            <div
              className="table-file-td"
              style={{ width }}
              key={`${id}-${i.title}-${item.uuid}`}
            >
              {render(item[dataIndex] || '', item)}
            </div>
          );
        })}
      </div>
    );

    tableEles.push(ele);
  });

  return (
    <div className="file-list-view-wrap">
      <div className="file-table-head" onContextMenu={onContextMenu}>
        {
          columns?.map((item) => {
            const { title, width } = item;
            return (
              <div className="table-head-item" style={{ width }} key={title}>{title}</div>
            );
          })
        }
      </div>
      <div className="file-table-body">
        {tableEles}
      </div>
    </div>
  );
}

export default ListView;
