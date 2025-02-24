// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Input } from 'antd';
import * as utils from './utils';

export default function HanziInput(props) {
  const {
    value,
    onKeyDown,
    onChange,
    autoFocus = false,
    ...config
  } = props;

  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const input = ref.current;
    if (!input) {
      return;
    }

    input.value = value || '';

    setVisible((oldVisible) => {
      const newVisible = utils.isElementVisible(input);

      if (newVisible && !oldVisible && autoFocus) {
        input.focus();
        input.select();
      }

      return newVisible;
    });
  }, [props]);

  let compositing = false;

  function onInputKeyDown(e) {
    if (onKeyDown) {
      onKeyDown(e.key, e.target, e);
    }
  }

  function onInputCompositionStart(e) {
    compositing = true;
  }

  function onInputCompositionUpdate(e) {
    compositing = true;
  }

  function onInputCompositionEnd(e) {
    compositing = false;
    if (onChange) {
      onChange(e.target.value, e.target, e);
    }
  }

  function onInputChange(e) {
    if (!compositing) {
      if (onChange) {
        onChange(e.target.value, e.target, e);
      }
    }
  }

  function onInputBlur() {
    compositing = false;
  }

  return (
    <input
      ref={ref}
      className="hanzi-input"
      {...config}
      onKeyDown={onInputKeyDown}
      onCompositionStart={onInputCompositionStart}
      onCompositionUpdate={onInputCompositionUpdate}
      onCompositionEnd={onInputCompositionEnd}
      onChange={onInputChange}
      onBlur={onInputBlur}
    />
  );
}
