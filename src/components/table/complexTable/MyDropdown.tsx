// @ts-nocheck
import React, { useContext, useRef } from 'react';
import { OverlayStateContext } from './contexts';
import { getElementRectInViewport } from './utils';

export function DropdownButton(props) {
  const { target, placement, children } = props;

  const ref = useRef(null);

  function onClick() {
    if (!ref.current) {
      return;
    }

    const position = getElementRectInViewport(ref.current);

    const detail = {
      panelType: target,
      action: 'toggle',
      position,
    };

    if (placement) {
      detail.placement = placement;
    }

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  return (
    <div ref={ref} onClick={onClick}>
      {children}
    </div>
  );
}

/**
 * @deprecated
 */
export default function MyDropdown({ target, placement, children }) {
  const ctx = useContext(OverlayStateContext)[target];
  if (!ctx) {
    return children;
  }

  const [state, setState] = ctx;
  const ref = useRef(null);

  function onClick(e) {
    setState((oldState) => {
      if (oldState.visible) {
        return { ...oldState, visible: false };
      }

      const position = getElementRectInViewport(ref.current);
      return {
        ...oldState, visible: true, placement, position,
      };
    });
  }

  return (
    <div ref={ref} onClick={onClick}>
      {children}
    </div>
  );
}
