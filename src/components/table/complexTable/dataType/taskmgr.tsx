// @ts-nocheck
import React from 'react';

import ContextMenu from '../../components/ContextMenu';
import TD from '../TD';
import { IconText, IconRight } from '../SvgIcons';

function TaskMgr({ onChangeType }) {
  const menu = [
    {
      text: '成员',
      autoClose: true,
      icon: <IconText />,
      onClick: () => { onChangeType('taskHolder'); },
    },
    {
      text: '任务开始日期',
      autoClose: true,
      icon: <IconText />,
      onClick: () => { onChangeType('taskStartDate'); },
    },
    {
      text: '任务结束日期',
      autoClose: true,
      icon: <IconText />,
      onClick: () => { onChangeType('taskEndDate'); },
    },
  ];

  return (
    <ContextMenu type="click" menu={menu}>
      <div
        key="taskmgr"
        className="one-button"
      >
        <div className="icon">
          <IconText />
        </div>
        <div className="name">
          任务管理
        </div>
        <div style={{ marginTop: 8 }}>
          <IconRight />
        </div>
      </div>
    </ContextMenu>
  );
}

const DataType = {
  name: 'taskmgr',
  nameCN: '任务管理',
  icon: IconText,
  justRender: true,
  component: TaskMgr,
};

export default DataType;
