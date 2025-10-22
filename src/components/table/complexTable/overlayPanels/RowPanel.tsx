// @ts-nocheck
import React, {
  useState,
  useContext,
} from 'react';

import {
  message,
  Divider,
  Drawer,
} from 'antd';

import {
  CellRendererContext,
} from '../contexts';

import { DataTypes } from '../dataType';

import pasteTableRectFromClipboard from '../pasteTableRectFromClipboard';
import { confirm } from '../ConfirmDialog';
import * as icons from '../SvgIcons';
import * as utils from '../utils';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';
import { useTranslation } from 'react-i18next';

function RowDrawer(props) {
  const { row } = props;
  const { columns } = useContext(CellRendererContext);

  let treeNodeColumn = null;
  for (const col of columns) {
    if (col.dataType === 'treeNode') {
      treeNodeColumn = col;
      break;
    }
  }

  let treeNodeCell = null;
  if (treeNodeColumn) {
    treeNodeCell = row?.fields[treeNodeColumn.uuid];
  }

  return (
    <div>
      <h2>
        {treeNodeCell?.text}
      </h2>
      <p>Not implemented yet.</p>
    </div>
  );
}

function RowPanel(props, ref) {
  const {
    projectId,
    requirementSetUUID,
    tableUUID,
    options,
    columns,
    setColumns,
    rows,
    setRows,
    tableInfo,
  } = useContext(CellRendererContext);
  const { t } = useTranslation();

  const userId = localStorage.getItem('userid');

  const rowPanel = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 216,
    minHeight: 200,
  });

  const [panelState, setPanelState] = rowPanel;

  const {
    hide: hideRowPanel,
  } = useToggleablePanel(ref, setPanelState);

  const rowUUID = panelState.row;

  let row;
  let rowIndex = 9999;
  for (let i = 0; i < rows.length; i += 1) {
    const row1 = rows[i];
    if (row1.uuid === rowUUID) {
      row = row1;
      rowIndex = i;
      break;
    }
  }

  const tableLocked = options.lockFullTable;
  const rowLocked = options.lockFullTable || row?.locked;

  const reqStatusUUID = columns.find((i) => i.dataType === 'requirementStatus')?.uuid;
  const reqStatus = row?.fields?.[reqStatusUUID];

  const [drawerVisible, setDrawerVisible] = useState({
    visible: false,
    row: null,
  });

  let treeNodeColumn = null;
  for (const col of columns) {
    if (col.dataType === 'treeNode') {
      treeNodeColumn = col;
      break;
    }
  }

  function onClickInsertAbove() {
    if (!row) {
      return;
    }

    utils.insertNewRowAbove(setRows, row, columns);
    hideRowPanel();
  }

  function onClickInsertBelow() {
    if (!row) {
      return;
    }

    utils.insertNewRowBelow(setRows, row, columns);
    hideRowPanel();
  }

  function onClickMoveLeft() {
    if (!treeNodeColumn) {
      return;
    }

    setRows((oldData) => {
      const newData = [];

      const selectedRows = [];
      const roots = utils.createTreeFromTable(columns, oldData);
      const node = utils.findTreeNodeInRoots(roots, row?.uuid);
      utils.getTreeNodeAllRows(node, selectedRows);
      const selectedRowUUIDs = selectedRows.map((r) => r.uuid);

      for (const row1 of oldData) {
        const newRow = { ...row1 };
        if (selectedRowUUIDs.includes(row1.uuid)) {
          const oldValue = row1.fields?.[treeNodeColumn.uuid];
          let newValue;
          if (typeof oldValue === 'object' && oldValue) {
            const oldLevel = oldValue.level || 0;
            const newLevel = Math.max(0, oldLevel - 1);
            newValue = {
              ...oldValue,
              level: newLevel,
            };
          } else {
            newValue = {
              level: 0,
              text: '',
            };
          }

          newRow.fields = {
            ...row1.fields,
            [treeNodeColumn.uuid]: newValue,
          };
        }

        newData.push(newRow);
      }

      return newData;
    });
  }

  function onClickMoveRight() {
    if (!treeNodeColumn) {
      return;
    }

    setRows((oldData) => {
      const newData = [];

      const selectedRows = [];
      const roots = utils.createTreeFromTable(columns, oldData);
      const node = utils.findTreeNodeInRoots(roots, row?.uuid);
      utils.getTreeNodeAllRows(node, selectedRows);
      const selectedRowUUIDs = selectedRows.map((r) => r.uuid);

      for (const row1 of oldData) {
        const newRow = { ...row1 };
        if (selectedRowUUIDs.includes(row1.uuid)) {
          const oldValue = row1.fields?.[treeNodeColumn.uuid];
          let newValue;
          if (typeof oldValue === 'object' && oldValue) {
            const oldLevel = oldValue.level || 0;
            const newLevel = oldLevel + 1;
            newValue = {
              ...oldValue,
              level: newLevel,
            };
          } else {
            newValue = {
              level: 0,
              text: '',
            };
          }

          newRow.fields = {
            ...row1.fields,
            [treeNodeColumn.uuid]: newValue,
          };
        }

        newData.push(newRow);
      }

      return newData;
    });
  }

  async function onClickCopyRowLink() {
    let rowURL = window.location.pathname;
    rowURL += `?fileId=${tableUUID}&row=${row?.uuid}`;

    try {
      await utils.writeTextToClipboard(rowURL);
      message.success('行链接已复制到剪贴板');
    } catch (err) {
      message.error(`无法复制到剪贴板: ${err}`);
    } finally {
      hideRowPanel();
    }
  }

  function onClickOpenInAsideBar() {
    hideRowPanel();

    setDrawerVisible({
      visible: true,
      row,
    });
  }

  function onCloseDrawer() {
    setDrawerVisible({
      visible: false,
      row: null,
    });
  }

  function onClickToggleLocked() {
    if (!row) {
      return;
    }

    setRows((oldData) => {
      const newData = [];

      for (const row1 of oldData) {
        const newRow = { ...row1 };
        if (row1.uuid === row?.uuid) {
          newRow.locked = !row1.locked;
        }

        newData.push(newRow);
      }

      return newData;
    });

    hideRowPanel();
  }

  function onClickCloneRow() {
    if (!row) {
      return;
    }

    utils.copyRow(setRows, row);
    hideRowPanel();
  }

  async function onClickCopyToClipboard() {
    hideRowPanel();

    const array = [];

    for (const col of columns) {
      let value;
      if (col.dataType === 'rowIndex') {
        value = `${rowIndex + 1}`;
      } else {
        value = row?.fields?.[col.uuid];
      }

      const conv = DataTypes[col.dataType]?.valueToClipboardString;

      let str;
      if (conv) {
        str = conv(value);
      } else {
        str = value ? `${value}` : '';
      }

      array.push(str);
    }

    const text = array.join('\t');

    try {
      await utils.writeTextToClipboard(text);
      message.success('行内容已复制到剪贴板');
    } catch (err) {
      message.error(`无法复制到剪贴板: ${err}`);
    }
  }

  async function onClickPasteFromClipboard() {
    hideRowPanel();

    const colIndex = 0;

    let rowIndex1 = -1;
    for (let i = 0; i < rows.length; i += 1) {
      if (rows[i].uuid === row?.uuid) {
        rowIndex1 = i;
        break;
      }
    }

    if (rowIndex1 < 0) {
      return;
    }

    await pasteTableRectFromClipboard({
      colIndex,
      rowIndex: rowIndex1,
      columns,
      setColumns,
      setRows,
      DataTypes,
    });
  }

  async function onClickDelete() {
    if (!(await confirm(t('delete.row.confirm')))) {
      return;
    }

    if (!row) {
      return;
    }
    console.log(row, columns);
    // TODO:
    utils.deleteRow(setRows, row);
    hideRowPanel();
  }

  function onClickMoveSelectedInsertHere() {
    const treeNode = columns?.find?.((col) => col.dataType === 'treeNode');
    if (!treeNode) {
      message.info('请选中行后再操作！');
      return;
    }
    hideRowPanel();
    setRows((oldData) => {
      const selectedSubTrees = [];
      let inserting = false;
      const reserveRows = [];
      let rootLevel = 0;
      const insertRowLevel = row?.fields?.[treeNode.uuid]?.level || 0;
      oldData?.forEach?.((currentRow) => {
        const treeNodeValue = currentRow?.fields?.[treeNode.uuid];
        const checked = treeNodeValue?.checked;
        const level = treeNodeValue?.level || 0;
        if (checked) {
          if (!inserting) {
            rootLevel = level;
            inserting = true;
            selectedSubTrees.push([currentRow]);
          } else if (level <= rootLevel) {
            rootLevel = level;
            inserting = true;
            selectedSubTrees.push([currentRow]);
          } else {
            const currentInsertingAry = selectedSubTrees[selectedSubTrees.length - 1];
            currentInsertingAry.push(currentRow);
          }
        } else {
          if (inserting) {
            if (level <= rootLevel) {
              inserting = false;
            }
          }
          reserveRows.push(currentRow);
        }
      });
      if (selectedSubTrees.length) {
        let levelGap = 0;
        const finalInsertData = [];
        selectedSubTrees.forEach((subTree) => subTree.forEach((item, index) => {
          const itemTreeNodeValue = item?.fields?.[treeNode.uuid];
          if (itemTreeNodeValue) {
            if (index === 0) {
              levelGap = (itemTreeNodeValue.level || 0) - insertRowLevel;
            }
            finalInsertData.push(
              {
                ...item,
                fields: {
                  ...item.fields,
                  [treeNode.uuid]: {
                    ...(itemTreeNodeValue || {}),
                    checked: true,
                    level: index === 0 ? insertRowLevel
                      : (itemTreeNodeValue?.level || 0) - levelGap,
                  },
                },
              },
            );
          }
        }));
        const insertRowIndex = reserveRows?.findIndex?.((i) => i.uuid === row.uuid);
        if (insertRowIndex > -1) {
          reserveRows?.splice?.(insertRowIndex + 1, 0, ...finalInsertData);
          return reserveRows;
        }
        // message.info('选中行不可插入！');
        return oldData;
      }
      message.info('请选中行后再操作！');
      return oldData;
    });
  }

  function onClickBatchSelect(e) {
    const elem = e.target.closest('.one-button');
    if (!elem) {
      return;
    }

    const rect = elem.getBoundingClientRect();
    const position = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };

    const detail = {
      panelType: 'CheckboxSelectRowsPanel',
      action: 'toggle',
      placement: 'right',
      position,
      rowUUID,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  if (!panelState.visible) {
    return null;
  }

  // 发起协调
  function onClickCoordination() {
    // 此行需求链接
    let rowURL = 'requirement:';
    rowURL += `/projects/${projectId}`;
    rowURL += `/requirements/${requirementSetUUID}`;
    rowURL += `/tables/${tableUUID}`;
    rowURL += `/rows/${row?.uuid}`;

    window.parent.postMessage({
      type: 'open_coordination',
      payload: {
        rowURL,
        rowInfo: row,
        columns,
        rowDetail: {
          projects: projectId,
          requirements: requirementSetUUID,
          tables: tableUUID,
          rows: row?.uuid,
        },
      },
    }, '*');
  }

  // 确定此条目
  function onClickConfirmEntry() {
    // 找到需求状态的列
    const requirementStatus = columns?.find((i) => i.dataType === 'requirementStatus');
    if (requirementStatus) {
      row.fields[requirementStatus?.uuid] = ['确定'];

      window.parent.postMessage({
        type: 'update_tableInfo',
        payload: {
          rowInfo: row,
          tableUUID,
        },
      });
    }
  }

  // 冻结此条目
  async function onClickFreezeEntry() {
    // 找到需求状态的列
    if (!(await confirm('需求项转为冻结后无法再发起协调，确认是否冻结'))) {
      return;
    }

    const requirementStatus = columns?.find((i) => i.dataType === 'requirementStatus');
    if (requirementStatus) {
      row.fields[requirementStatus?.uuid] = ['冻结'];

      window.parent.postMessage({
        type: 'update_tableInfo',
        payload: {
          rowInfo: row,
          tableUUID,
        },
      });
    }
  }

  // 查看历史纪录
  async function onClickHistory() {
    const detail = {
      panelType: 'HistoryCoorPanel',
      action: 'show',
      placement: 'right',
      row,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-rowPanel">
        {
          !tableLocked
          && (
            <div className="two-buttons">
              <div className="button" onClick={onClickInsertAbove}>
                {t('insert.up')}
              </div>
              <div className="button" onClick={onClickInsertBelow}>
                {t('insert.down')}
              </div>
            </div>
          )
        }

        {
          !rowLocked
          && treeNodeColumn !== null
          && (
            <div className="two-buttons">
              <div className="button" onClick={onClickMoveLeft}>
                {/* 向左移动 */}
                {t('upgrade')}
              </div>
              <div className="button" onClick={onClickMoveRight}>
                {/* 向右移动 */}
                {t('degrade')}
              </div>
            </div>
          )
        }

        <div className="button-list">
          {/* <div className="one-button" onClick={onClickCopyRowLink}>
            <div className="icon">
              <icons.IconHyperlink />
            </div>
            <div className="name">
              复制链接
            </div>
          </div> */}

          {/*
          <div className="one-button" onClick={onClickOpenInAsideBar}>
            <div className="icon">
              <icons.IconRightExit />
            </div>
            <div className="name">
              在右侧边栏打开
            </div>
          </div>
          */}

          <Divider />

          <div className="one-button" onClick={onClickCopyToClipboard}>
            <div className="icon">
              <icons.IconCopy />
            </div>
            <div className="name">
              {t('copy')}
            </div>
          </div>

          {
            !rowLocked
            && (
              <div className="one-button" onClick={onClickPasteFromClipboard}>
                <div className="icon">
                  <icons.IconCopy />
                </div>
                <div className="name">
                  {t('paste')}
                </div>
              </div>
            )
          }

          {
            !rowLocked
            && (
              <div className="one-button" onClick={onClickMoveSelectedInsertHere}>
                <div className="icon">
                  <icons.IconMoveToHere />
                </div>
                <div className="name">
                  {t('move.selected.to.here')}
                </div>
              </div>
            )
          }

          {
            !rowLocked
            && (
              <div className="one-button" onClick={onClickBatchSelect}>
                <div className="icon">
                  <icons.IconCheckbox />
                </div>
                <div className="name">
                  {t('patch.action')}
                </div>
                <div className="right-icon">
                  <icons.IconRight />
                </div>
              </div>
            )
          }

          {/* {
            !tableLocked
            && (
              <div className="one-button" onClick={onClickToggleLocked}>
                {
                  row?.locked
                    ? (
                      <>
                        <div className="icon">
                          <icons.IconUnlocked />
                        </div>
                        <div className="name">
                          解锁此行
                        </div>
                      </>
                    )
                    : (
                      <>
                        <div className="icon">
                          <icons.IconLocked />
                        </div>
                        <div className="name">
                          锁定此行
                        </div>
                      </>
                    )
                }
              </div>
            )
          } */}

          {
            !tableLocked
            && (
              <div className="one-button" onClick={onClickCloneRow}>
                <div className="icon">
                  <icons.IconCopy />
                </div>
                <div className="name">
                  {t('duplicate')}
                </div>
              </div>
            )
          }

          {
            !rowLocked
            && (
              <div className="one-button" onClick={onClickDelete}>
                <div className="icon">
                  <icons.IconDelete />
                </div>
                <div className="name">
                  {t('delete.row')}
                </div>
              </div>
            )
          }

        </div>
        <Drawer
          title="详细信息"
          placement="right"
          width={550}
          open={drawerVisible.visible}
          onClose={onCloseDrawer}
        >
          <RowDrawer row={drawerVisible.row} />
        </Drawer>

      </div>

    </OverlayPanelBox>
  );
}

export default React.forwardRef(RowPanel);
