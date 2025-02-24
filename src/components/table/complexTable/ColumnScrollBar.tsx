// @ts-nocheck
import React, { useRef } from 'react';

import * as utils from './utils';

import './ColumnScrollBar.less';

function ColumnScrollBar() {
  const ref1 = useRef();
  const ref2 = useRef();

  let mouseMoving = false;
  let mousePosition = -1;
  let moverPosition = -1;

  function onMouseMove(e) {
    if (!mouseMoving || mousePosition < 0 || !ref2.current) {
      return;
    }

    const slotWidth = parseInt(ref1.current.clientWidth, 10) || 0;
    const moverWidth = parseInt(ref2.current.clientWidth, 10) || 0;
    if (slotWidth <= 0 || moverWidth <= 0) {
      return;
    }

    const dx = parseInt(e.pageX - mousePosition, 10);
    const newLeft = utils.clamp(
      moverPosition + dx,
      0,

      slotWidth - moverWidth,
    );
    ref2.current.style.left = `${newLeft}px`;

    const items = document.querySelectorAll('.scroll-columns');
    if (items.length <= 0) {
      return;
    }

    const scrollRatio = newLeft / slotWidth;
    let scrollLeft = 0;

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const scrollX = Math.floor(item.scrollWidth * scrollRatio);
      const maxScroll = item.scrollWidth - item.clientWidth;
      scrollLeft = Math.min(scrollX, maxScroll);
      if (i >= 1) {
        break;
      }
    }

    for (let i = 0; i < items.length; i += 1) {
      const elem = items[i];
      elem.scrollLeft = scrollLeft;
    }
  }

  function onMouseUp() {
    mouseMoving = false;
    mousePosition = -1;

    window.removeEventListener('pointerup', onMouseUp);
    window.removeEventListener('pointermove', onMouseMove);
  }

  function onMouseDown(e) {
    mouseMoving = true;
    mousePosition = e.pageX;
    moverPosition = parseInt(ref2.current?.style?.left, 10) || 0;

    window.addEventListener('pointerup', onMouseUp);
    window.addEventListener('pointermove', onMouseMove);
  }

  function onDragStart(e) {
    e.preventDefault();
    return false;
  }

  return (
    <div className="column-scroll-bar">
      <div className="scroll-bg" ref={ref1}>
        <div
          ref={ref2}
          className="scroll-fg"
          onPointerDown={onMouseDown}
          onDragStart={onDragStart}
        />
      </div>
    </div>
  );
}

export default ColumnScrollBar;
