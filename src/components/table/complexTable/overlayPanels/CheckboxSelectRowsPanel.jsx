import React, {
  useState,
  useContext,
} from 'react';

import {
  Divider,
} from 'antd';

import {
  CellRendererContext,
} from '../contexts';

import * as icons from '../SvgIcons';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';
import filterRow from '../RowFilter';
import { useTranslation } from 'react-i18next';

function CheckboxSelectRowsPanel(props, ref) {
  const {
    columns, setRows, options, rows,
  } = useContext(CellRendererContext);

  const {t} = useTranslation();

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'right',
    position: null,
    minWidth: 190,
    minHeight: 170,
  });

  useToggleablePanel(ref, setPanelState);

  let currentColumn = null;
  for (const col of columns) {
    if (col.uuid === panelState.column) {
      currentColumn = col;
      break;
    }
  }

  function closeCheckboxSelectPanel() {
    setPanelState((oldState) => ({
      ...oldState,
      visible: false,
      column: undefined,
    }));
  }

  function closeRowsPanel() {
    const detail = {
      panelType: 'RowPanel',
      action: 'hide',
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  function onClickSelectTopAll(e) {
    let treeNodeUUID = null;
    for (const col of columns) {
      if (col.dataType === 'rowIndex') {
        treeNodeUUID = col.uuid;
        break;
      }
    }
    if (!treeNodeUUID) {
      return;
    }

    setRows((oldData) => {
      const newData = [];

      let findTarget = false;

      for (const row of oldData) {
        const newRow = { ...row };

        // 目标之前 && 行未锁定
        if (!findTarget && !row?.locked) {
          const filterTrue = filterRow(options.filter, row, columns);
          if (filterTrue) {
            newRow.fields = {
              ...(row?.fields || {}),
              [treeNodeUUID]:  true,
            };
          }
        }

        newData.push(newRow);

        if (!findTarget && panelState?.rowUUID === row.uuid) {
          findTarget = true;
        }
      }

      return newData;
    });

    closeCheckboxSelectPanel();
    closeRowsPanel();
  }

  function onClickSelectBottomAll(e) {
    let treeNodeUUID = null;
    for (const col of columns) {
      if (col.dataType === 'rowIndex') {
        treeNodeUUID = col.uuid;
        break;
      }
    }
    if (!treeNodeUUID) {
      return;
    }

    setRows((oldData) => {
      const newData = [];

      let findTarget = false;

      for (const row of oldData) {
        const newRow = { ...row };

        if (!findTarget && panelState?.rowUUID === row.uuid) {
          findTarget = true;
        }
        // 判断是否在筛选范围内 && 行未锁定
        if (findTarget && !row.locked) {
          const filterTrue = filterRow(options.filter, row, columns);
          if (filterTrue) {
            newRow.fields = {
              ...(row?.fields || {}),
              [treeNodeUUID]: true,
            };
          }
        }

        newData.push(newRow);
      }

      return newData;
    });

    closeCheckboxSelectPanel();
    closeRowsPanel();
  }

  function onClickSelectTopNone(e) {
    let treeNodeUUID = null;
    for (const col of columns) {
      if (col.dataType === 'rowIndex') {
        treeNodeUUID = col.uuid;
        break;
      }
    }
    if (!treeNodeUUID) {
      return;
    }

    setRows((oldData) => {
      const newData = [];

      let findTarget = false;

      for (const row of oldData) {
        const newRow = { ...row };

        // 判断是否在筛选范围内 && 行未锁定
        if (!findTarget && !row.locked) {
          const filterTrue = filterRow(options.filter, row, columns);
          if (filterTrue) {
            newRow.fields = {
              ...(row?.fields || {}),
              [treeNodeUUID]: false,
            };
          }
        }

        newData.push(newRow);

        if (!findTarget && panelState?.rowUUID === row.uuid) {
          findTarget = true;
        }
      }

      return newData;
    });

    closeCheckboxSelectPanel();
    closeRowsPanel();
  }

  function onClickSelectBottomNone(e) {
    let treeNodeUUID = null;
    for (const col of columns) {
      if (col.dataType === 'rowIndex') {
        treeNodeUUID = col.uuid;
        break;
      }
    }
    if (!treeNodeUUID) {
      return;
    }

    setRows((oldData) => {
      const newData = [];

      let findTarget = false;

      for (const row of oldData) {
        const newRow = { ...row };

        if (!findTarget && panelState?.rowUUID === row.uuid) {
          findTarget = true;
        }
        // 判断是否在筛选范围内 && 行未锁定
        if (findTarget && !row.locked) {
          const filterTrue = filterRow(options.filter, row, columns);
          if (filterTrue) {
            newRow.fields = {
              ...(row?.fields || {}),
              [treeNodeUUID]: false,
            };
          }
        }

        newData.push(newRow);
      }

      return newData;
    });

    closeCheckboxSelectPanel();
    closeRowsPanel();
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-numberFormatPanel">
        <div className="button-list">
          <div className="one-button" onClick={onClickSelectTopAll}>
            <span className="icon"><icons.IconCheckbox /></span>
            <span className="name">{t('select.above')}</span>
          </div>
          <div className="one-button" onClick={onClickSelectTopNone}>
            <span className="icon"><icons.IconCheckboxEmpty /></span>
            <span className="name">{t('unselect.above')}</span>
          </div>
          <Divider />
          <div className="one-button" onClick={onClickSelectBottomAll}>
            <span className="icon"><icons.IconCheckbox /></span>
            <span className="name">{t('select.below')}</span>
          </div>
          <div className="one-button" onClick={onClickSelectBottomNone}>
            <span className="icon"><icons.IconCheckboxEmpty /></span>
            <span className="name">{t('unselect.below')}</span>
          </div>
        </div>
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(CheckboxSelectRowsPanel);
