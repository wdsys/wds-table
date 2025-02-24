// @ts-nocheck
import React, {
  useState,
  useContext,
} from 'react';

import {
  CellRendererContext,
} from '../contexts';

import * as icons from '../SvgIcons';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

const CheckboxViews = [
  {
    code: 'checkbox',
    nameCN: '勾选框',
  },
  {
    code: 'switch',
    nameCN: '开关',
  },
];

function CheckboxViewPanel(props, ref) {
  const { columns, setColumns } = useContext(CellRendererContext);

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'right',
    position: null,
    minWidth: 190,
    minHeight: 72,
  });

  useToggleablePanel(ref, setPanelState);

  let currentColumn = null;
  for (const col of columns) {
    if (col.uuid === panelState.column) {
      currentColumn = col;
      break;
    }
  }

  let selectedView;
  if (currentColumn?.dataType === 'checkbox') {
    selectedView = currentColumn?.view;
  }

  function onClickView(view) {
    if (currentColumn?.dataType !== 'checkbox') {
      return;
    }

    setColumns((oldColumns) => {
      const newColumns = [];

      for (const col of oldColumns) {
        const newCol = { ...col };
        if (col.uuid === currentColumn.uuid) {
          newCol.view = view.code;
        }

        newColumns.push(newCol);
      }

      return newColumns;
    });
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-numberFormatPanel">
        <div className="button-list">
          {
            CheckboxViews.map((item, i) => (
              <div
                key={item.code}
                className="one-button"
                onClick={(e) => onClickView(item)}
              >
                <span className="name">
                  {item.nameCN}
                </span>

                <span
                  className="selected"
                  style={{
                    visibility: item.code === selectedView ? 'visible' : 'hidden',
                  }}
                >
                  <icons.IconCorrect />
                </span>
              </div>
            ))
          }
        </div>
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(CheckboxViewPanel);
