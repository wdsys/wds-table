// @ts-nocheck
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

import { confirm } from '../ConfirmDialog';
import * as icons from '../SvgIcons';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';
import filterRow from '../RowFilter';
import { useTranslation } from 'react-i18next';

function CheckboxSelectPanel(props, ref) {
  const {
    columns, setColumns, setRows, options, rows,
  } = useContext(CellRendererContext);

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'right',
    position: null,
    minWidth: 190,
    minHeight: 170,
  });

  useToggleablePanel(ref, setPanelState);

  const { t } = useTranslation();

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

  function closeColumnPanel() {
    const detail = {
      panelType: 'ColumnPanel',
      action: 'hide',
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  function onClickSelectAll(e) {
    setRows((oldData) => {
      const newData = [];

      for (const row of oldData) {
        const newRow = { ...row };
        if (row.fields) {
          if (currentColumn.dataType === 'checkbox') {
            newRow.fields = {
              ...row.fields,
              [currentColumn.uuid]: true,
            };
          } else if (currentColumn.dataType === 'treeNode') {
            newRow.fields = {
              ...row.fields,
              [currentColumn.uuid]: {
                ...row.fields?.[currentColumn.uuid],
                checked: true,
              },
            };
          }
        } else if (currentColumn.dataType === 'checkbox') {
          newRow.fields = {
            [currentColumn.uuid]: true,
          };
        } else if (currentColumn.dataType === 'treeNode') {
          newRow.fields = {
            [currentColumn.uuid]: {
              checked: true,
            },
          };
        }

        newData.push(newRow);
      }

      return newData;
    });

    closeCheckboxSelectPanel();
    closeColumnPanel();
  }

  function onClickSelectOthers(e) {
    setRows((oldData) => {
      const newData = [];

      for (const row of oldData) {
        const newRow = { ...row };
        if (row.fields) {
          if (currentColumn.dataType === 'checkbox') {
            const oldValue = !!row.fields[currentColumn.uuid];
            newRow.fields = {
              ...row.fields,
              [currentColumn.uuid]: !oldValue,
            };
          } else if (currentColumn.dataType === 'treeNode') {
            const oldValue = row.fields[currentColumn.uuid];
            newRow.fields = {
              ...row.fields,
              [currentColumn.uuid]: {
                ...oldValue,
                checked: !oldValue?.checked,
              },
            };
          }
        } else if (currentColumn.dataType === 'checkbox') {
          newRow.fields = {
            [currentColumn.uuid]: true,
          };
        } else if (currentColumn.dataType === 'treeNode') {
          newRow.fields = {
            [currentColumn.uuid]: {
              checked: true,
            },
          };
        }

        newData.push(newRow);
      }

      return newData;
    });

    closeCheckboxSelectPanel();
    closeColumnPanel();
  }

  function onClickSelectNone(e) {
    setRows((oldData) => {
      const newData = [];

      for (const row of oldData) {
        const newRow = { ...row };
        if (row.fields) {
          if (currentColumn.dataType === 'checkbox') {
            newRow.fields = {
              ...row.fields,
              [currentColumn.uuid]: false,
            };
          } else if (currentColumn.dataType === 'treeNode') {
            newRow.fields = {
              ...row.fields,
              [currentColumn.uuid]: {
                ...row.fields?.[currentColumn.uuid],
                checked: false,
              },
            };
          }
        } else if (currentColumn.dataType === 'checkbox') {
          newRow.fields = {
            [currentColumn.uuid]: false,
          };
        } else if (currentColumn.dataType === 'treeNode') {
          newRow.fields = {
            [currentColumn.uuid]: {
              checked: false,
            },
          };
        }

        newData.push(newRow);
      }

      return newData;
    });

    closeCheckboxSelectPanel();
    closeColumnPanel();
  }

  async function onClickDeleteSelected(e) {
    let length = 0;
    for (const col of columns) {
      if (col.dataType === 'treeNode') {
        for (const row of rows) {
          const selected = !!row.fields?.[col.uuid]?.checked;
          if (selected) { length += 1; }
        }
      } else {
        // newData.push(row);
      }
    }
    if (!!length && !(await confirm(`确定要删除选中的${length}行吗？`))) {
      return;
    }

    setRows((oldData) => {
      const newData = [];

      if (currentColumn.dataType === 'checkbox') {
        for (const row of oldData) {
          const selected = !!row.fields?.[currentColumn.uuid];
          const filterTrue = filterRow(options.filter, row, columns);
          if (!(selected && filterTrue)) {
            newData.push(row);
          }
        }
      } else if (currentColumn.dataType === 'treeNode') {
        for (const row of oldData) {
          const selected = !!row.fields?.[currentColumn.uuid]?.checked;
          const filterTrue = filterRow(options.filter, row, columns);
          // 删除选中且可见的行
          if (!(selected && filterTrue)) {
            newData.push(row);
          }
        }
      } else {
        // newData.push(row);
      }

      return newData;
    });

    closeCheckboxSelectPanel();
    closeColumnPanel();
  }

  async function onClickDeleteUnselected(e) {
    if (!(await confirm('确定要删除未选中的行吗？'))) {
      return;
    }

    setRows((oldData) => {
      const newData = [];

      if (currentColumn.dataType === 'checkbox') {
        for (const row of oldData) {
          const selected = !!row.fields?.[currentColumn.uuid];
          if (selected) {
            newData.push(row);
          }
        }
      } else if (currentColumn.dataType === 'treeNode') {
        for (const row of oldData) {
          const selected = !!row.fields?.[currentColumn.uuid]?.checked;
          if (selected) {
            newData.push(row);
          }
        }
      } else {
        // newData.push(row);
      }

      return newData;
    });

    closeCheckboxSelectPanel();
    closeColumnPanel();
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-numberFormatPanel">
        <div className="button-list">
          <div className="one-button" onClick={onClickSelectAll}>
            <span className="icon"><icons.IconCheckbox /></span>
            <span className="name">{t('patch.select.all')}</span>
          </div>
          <div className="one-button" onClick={onClickSelectOthers}>
            <span className="icon"><icons.IconCheckbox /></span>
            <span className="name">{t('select.invert')}</span>
          </div>
          <div className="one-button" onClick={onClickSelectNone}>
            <span className="icon"><icons.IconCheckboxEmpty /></span>
            <span className="name">{t('unselect')}</span>
          </div>
          <Divider />
          <div className="one-button" onClick={onClickDeleteSelected}>
            <span className="icon"><icons.IconDelete /></span>
            <span className="name">{t('patch.delete.selected')}</span>
          </div>
          {/* <div className="one-button" onClick={onClickDeleteUnselected}>
            <span className="icon"><icons.IconDelete /></span>
            <span className="name">删除未选中的行</span>
          </div> */}
        </div>
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(CheckboxSelectPanel);
