// @ts-nocheck
import React, {
  useEffect,
  useRef,
} from 'react';

import * as utils from '../utils';

function getRectCoords(rect) {
  const {
    left, top, width, height,
  } = rect;

  let x1 = left;
  let y1 = top;
  if (rect.space === 'page') {
    // do nothing
  } else { // 'viewport'
    x1 += window.scrollX;
    y1 += window.scrollY;
  }

  const x2 = x1 + width;
  const y2 = y1 + height;
  return {
    x1, y1, x2, y2,
  };
}

function OverlayPanelBox(props) {
  const { state, setState, children } = props;
  const ref = useRef(null);

  useEffect(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!(rect && rect.width && rect.height)) {
      return;
    }

    let {
      left: x1,
      top: y1,
      right: x2,
      bottom: y2,
    } = rect;

    const { innerWidth, innerHeight } = window;

    if (x2 + 10 > innerWidth) {
      const dx = innerWidth - (x2 + 10);
      x1 += dx;
      x2 += dx;
    }

    if (x1 < 10) {
      const dx = 10 - x1;
      x1 += dx;
      x2 += dx;
    }

    if (y2 + 10 > innerHeight) {
      const dy = innerHeight - (y2 + 10);
      y1 += dy;
      y2 += dy;
    }

    if (y1 < 10) {
      const dy = 10 - y1;
      y1 += dy;
      y2 += dy;
    }

    const oldLeft = parseInt(ref.current.style.left, 10);
    const oldTop = parseInt(ref.current.style.top, 10);

    const newLeft = oldLeft + (x1 - rect.left);
    const newTop = oldTop + (y1 - rect.top);

    ref.current.style.left = `${newLeft}px`;
    ref.current.style.top = `${newTop}px`;
  }, [state]);

  function hidePanel(e) {
    setState((oldState) => {
      if (oldState.visible && oldState === state) {
        return {
          ...oldState,
          visible: false,
        };
      }
      return oldState;
    });

    document.removeEventListener('click', hidePanel);
  }

  let left = 0;
  let top = 0;

  if (state.visible) {
    const btnCoords = getRectCoords(state.position); // in page
    // const {width, height} = ref.current.getBoundingClientRect();
    // console.log('btnCoords:', btnCoords);
    const width = ref.current?.clientWidth || state.minWidth || 100;
    const height = ref.current?.clientHeight || state.minHeight || 100;

    let right; let
      bottom;
    if (state.placement === 'bottom') {
      left = btnCoords.x1;
      top = btnCoords.y2 + 4;
      right = left + width;
      bottom = top + height;
    } else if (state.placement === 'left') {
      left = btnCoords.x1 - width;
      top = btnCoords.y1;
      right = left + width;
      bottom = top + height;
    } else if (state.placement === 'right') {
      left = btnCoords.x2;
      top = btnCoords.y1;
      right = left + width;
      bottom = top + height;
    } else {
      console.error(`Error: invalid placement ${state.placement}`);
      return null;
    }

    // const rightBoundary = window.scrollX + window.innerWidth - 20;
    // const disp = right - rightBoundary;
    // if (disp > 0) {
    //   left -= disp;
    //   right -= disp;
    // }

    const cont = document.querySelector('.table-global-overlay .container');
    const contRect = utils.getElementRectInPage(cont);
    if (contRect) {
      left -= contRect.left;
      right -= contRect.left;
      top -= contRect.top;
      bottom -= contRect.top;
      if (bottom > (window.innerHeight - contRect.top)) {
        top -= bottom - window.innerHeight + contRect.top;
      }
    }

    // console.log(`left: ${left}, top: ${top}, right: ${right}, bottom: ${bottom}`);

    setTimeout(() => {
      document.addEventListener('click', hidePanel);
    }, 100);
  } else {
    document.removeEventListener('click', hidePanel);
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const style = {
    display: state.visible ? 'block' : 'none',
    left: `${left}px`,
    top: `${top}px`,
  };

  if(state.zIndex){
    style.zIndex = state.zIndex;
  }

  return (
    <div
      ref={ref}
      className="absolute-div"
      style={style}
      onClick={(e) => onClick(e)}
    >
      {children}
    </div>
  );
}

export default OverlayPanelBox;
