// @ts-nocheck
import React from 'react';
import { CheckOutlined } from '@ant-design/icons';
import './index.less';

export default function CheckItem({
  // value,
  option: { label }, onChange,
}) {
  function toggle(ele) {
    const checked = ele.classList.toggle('checked');
    onChange?.(checked);
  }

  function onClick(e) {
    toggle(e.currentTarget);
  }

  return (
    <div className="check-item-wrapper" onClick={onClick}>
      <CheckOutlined className="checked-icon" />
      <div className="check-item">{label}</div>
    </div>
  );
}
