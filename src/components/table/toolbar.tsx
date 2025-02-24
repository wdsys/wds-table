// @ts-nocheck
import React, { useRef, useState, useEffect } from 'react';
import { LeftOutlined, RightOutlined, FullscreenOutlined } from '@ant-design/icons';
import {
  IconAddFolder,
  IconShouQi,
  IconZhankai,
  IconAddReq,
  IconExportReq,
  IconMoBanMessage,
  IconLeft,
  IconRight,
  IconChooseAllCol,
  IconCopyCol,
  IconDelCol,
  IconQuxiaoCol,
  IconCopyRowlink,
  IconRowsExport,
  IconReqEdit,
  IconReqExcel,
  // IconPatchDel,
} from './SvgIcon';
import './toolbar.less';

export default function Toolbar() {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    const element = scrollRef.current;
    if (element) {
      const buffer = 1; // Add 1px buffer for rounding errors
      setShowLeftArrow(element.scrollLeft > 0);
      setShowRightArrow(
        Math.ceil(element.scrollLeft + element.clientWidth + buffer) < element.scrollWidth,
      );
    }
  };

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    checkScroll();
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        element.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  const scroll = (direction) => {
    const element = scrollRef.current;
    if (element) {
      const scrollAmount = 200;
      element.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  function onClickMoveLeft() {
    const event = new Event('moveLeft');
    window.dispatchEvent(event);
  }

  function onClickMoveRight() {
    const event = new Event('moveRight');
    window.dispatchEvent(event);
  }

  function onClickSelectAll() {
    const ev = new CustomEvent('selectAllRow');
    window.dispatchEvent(ev);
  }

  function onClickCancelSelectRows() {
    const ev = new CustomEvent('unSelectAllRow');
    window.dispatchEvent(ev);
  }

  function onClickCopyToClipboard() {
    const event = new Event('copyToClipboard');
    window.dispatchEvent(event);
  }

  function onClickDeleteSelected() {
    const event = new Event('deleteSelected');
    window.dispatchEvent(event);
  }

  return (
    <div className="toolbar-wrapper">
      {showLeftArrow && (
        <div
          className="scroll-arrow left"
          role="presentation"
          onClick={() => scroll('left')}
        >
          <LeftOutlined />
        </div>
      )}
      <div
        className="toolbar"
        ref={scrollRef}
        onScroll={checkScroll}
      >
        <div className="toolbar-content">

          <button type="button" className="toolbar-item" onClick={onClickMoveLeft}>
            <IconLeft />
            <span>升级</span>
          </button>

          <button type="button" className="toolbar-item" onClick={onClickMoveRight}>
            <IconRight />
            <span>降级</span>
          </button>

          <button type="button" className="toolbar-item" onClick={onClickSelectAll}>
            <IconChooseAllCol style={{ fontSize: '18px' }} />
            <span>全选所有行</span>
          </button>

          <button type="button" className="toolbar-item" onClick={onClickCancelSelectRows}>
            <IconQuxiaoCol />
            <span>取消选中行</span>
          </button>

          <button type="button" className="toolbar-item" onClick={onClickCopyToClipboard}>
            <IconCopyCol />
            <span>选中行复制</span>
          </button>

          <button type="button" className="toolbar-item" onClick={onClickDeleteSelected}>
            <IconDelCol />
            <span>选中行删除</span>
          </button>
        </div>
      </div>
      {showRightArrow && (
        <div
          className="scroll-arrow right"
          role="presentation"
          onClick={() => scroll('right')}
        >
          <RightOutlined />
        </div>
      )}
    </div>
  );
}
