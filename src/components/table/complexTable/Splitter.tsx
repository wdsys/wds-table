// @ts-nocheck
import React, {
  useState,
  useRef,
  useCallback,
} from 'react';

import './Splitter.less';

const Splitter = React.memo(({ columnKey, saveVirtualConfig }) => {
  const [moving, setMoving] = useState(false);

  const ref = useRef(null);

  const onMouseMove = useCallback((e) => {
    e.preventDefault();

    if (ref.current) {
      const th = ref.current.closest('.th');
      if (th) {
        const oldWidth = parseInt(th.style.width, 10) || th.clientWidth;
        const newWidth = oldWidth + e.movementX;
        th.style.width = `${newWidth}px`;
      }
    }
  }, [columnKey]);

  const stopMoving = useCallback((e) => {
    e.preventDefault();

    window.removeEventListener('pointermove', onMouseMove);
    window.removeEventListener('pointerup', stopMoving);

    setMoving(false);

    if (ref.current) {
      const th = ref.current.closest('.th');
      if (th) {
        const oldWidth = parseInt(th.style.width, 10) || th.clientWidth;
        const newWidth = oldWidth + e.movementX;
        th.style.width = `${newWidth}px`;

        const detail = {
          colUUID: columnKey,
          width: newWidth,
        };

        const ev = new CustomEvent('splitterMouseMove', { detail });
        window.dispatchEvent(ev);

        // 虚拟表 -- 调整列宽度存储
        saveVirtualConfig(newWidth);
      }
    }
  }, [columnKey]);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();

    window.addEventListener('pointermove', onMouseMove);
    window.addEventListener('pointerup', stopMoving);

    setMoving(true);
  }, [columnKey]);

  const onDragStart = useCallback((e) => {
    e.preventDefault();
  }, [columnKey]);

  let className = 'splitter';
  if (moving) {
    className += ' moving';
  }

  return (
    <div ref={ref} className="splitter-box">
      <div
        className={className}
        onMouseDown={onMouseDown}
        onDragStart={onDragStart}
      />
    </div>
  );
});

export default Splitter;
