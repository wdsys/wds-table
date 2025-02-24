// @ts-nocheck
import {
  useCallback,
  useImperativeHandle,
} from 'react';

function showPanel1(setPanelState, options) {
  setPanelState((oldState) => ({
    ...oldState,
    visible: true,
    ...options,
  }));
}

function hidePanel1(setPanelState) {
  setPanelState((oldState) => ({
    ...oldState,
    visible: false,
  }));
}

function togglePanel1(setPanelState, options) {
  setPanelState((oldState) => {
    if (!oldState.visible) {
      return {
        ...oldState,
        visible: true,
        ...options,
      };
    }
    return {
      ...oldState,
      visible: false,
    };
  });
}

function useToggleablePanel(ref, setPanelState, extensions) {
  const showPanel = useCallback((options) => {
    showPanel1(setPanelState, options);
  }, [setPanelState]);

  const hidePanel = useCallback(() => {
    hidePanel1(setPanelState);
  }, [setPanelState]);

  const togglePanel = useCallback((options) => {
    togglePanel1(setPanelState, options);
  }, [setPanelState]);

  const routes = {
    show: showPanel,
    hide: hidePanel,
    toggle: togglePanel,
    ...extensions,
  };

  const notify = (options) => {
    const fn = routes[options?.action];
    fn?.(options);
  };

  useImperativeHandle(ref, () => ({
    notify,
  }));

  return routes;
}

export default useToggleablePanel;
