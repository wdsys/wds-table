// @ts-nocheck
import React, {
  useState,
  useRef,
} from 'react';

import {
  Progress,
} from 'antd';

import * as utils from './utils';

function ProgressBar(props) {
  const {
    value,
    readOnly = false,
    onChange,
  } = props;

  const ref = useRef(null);
  const clampValue = utils.clamp(value, 0.0, 1.0);
  const [percent, setPercent] = useState(clampValue * 100);

  let isMoving = false;
  let barWidth = 100;

  function onMouseMove(e) {
    if (readOnly || !isMoving) {
      return;
    }

    const dx = e.movementX;
    if (!(dx > 0.999 || dx < -0.999)) {
      return;
    }

    const dp = (dx / barWidth) * 100;

    setPercent((oldPercent) => {
      let newPercent = utils.clamp(oldPercent + dp, 0, 100);
      if (newPercent >= 98.8) {
        newPercent = 100;
      }

      return newPercent;
    });
  }

  function onMouseUp(e) {
    e.preventDefault();
    e.stopPropagation();

    isMoving = false;

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    if (readOnly) {
      return;
    }

    const elem = ref.current.querySelector('.ant-progress-inner');
    if (!elem) {
      console.error('cannot find .ant-progress-inner');
      return;
    }

    const bg = ref.current.querySelector('.ant-progress-bg');
    if (!bg) {
      console.error('cannot find .ant-progress-bg');
      return;
    }

    const newValue = bg.clientWidth / elem.clientWidth;
    if (Math.abs(newValue - value) > 1e-5) {
      if (onChange) {
        onChange(newValue);
      }
    }
  }

  function onMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();

    if (readOnly) {
      return;
    }

    const elem = ref.current.querySelector('.ant-progress-inner');
    if (!elem) {
      console.error('cannot find .ant-progress-inner');
      return;
    }

    barWidth = elem.clientWidth;
    isMoving = true;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onClick(e) {
    const elem = e.target;
    if (!elem.classList.contains('ant-progress-text')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  return (
    <div
      ref={ref}
      className="number-progress-box"
      style={{ width: '100%', padding: '0 5px 0 0' }}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      <Progress
        size="small"
        percent={percent}
        format={(p) => `${p.toFixed(0)}%`}
      />
    </div>
  );
}

export default ProgressBar;
