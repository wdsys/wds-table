// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';

import React, {
  useState,
  useEffect,
  useContext,
  useRef,
} from 'react';

import {
  message,
  Divider,
} from 'antd';

import {
  CellRendererContext,
  LocalStateContext,
} from '../contexts';

import { DataTypes, ColumnIcon } from '../dataType';
import pasteTableRectFromClipboard from '../pasteTableRectFromClipboard';
import { confirm } from '../ConfirmDialog';
import * as icons from '../SvgIcons';
import * as utils from '../utils';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';
import SelectChoiceList from './SelectChoiceList';
import { PageContext } from '../../contexts';
import { useTranslation } from 'react-i18next';

function ColumnPanel(props, ref) {
  const {
    options,
    setOptions,
    columns,
    setColumns,
    rows,
    setRows,
  } = useContext(CellRendererContext);

  const {t} = useTranslation();

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 216,
    minHeight: 300,
  });

  useToggleablePanel(ref, setPanelState, {
    toggleOrTransfer: (options1) => {
      setPanelState((oldState) => {
        if (options1.column === panelState.column) {
          if (!oldState.visible) {
            return {
              ...oldState,
              visible: true,
              ...options1,
            };
          }
          return {
            ...oldState,
            visible: false,
          };
        }
        return {
          ...oldState,
          visible: true,
          ...options1,
        };
      });
    },
  });

  const currentColumn = columns.filter((c) => c.uuid === panelState.column)[0];

  const headLocked = options.lockTableHead || currentColumn?.locked;
  const bodyLocked = options.lockFullTable || currentColumn?.locked;

  const refColumnName = useRef(null);

  // 检查此列是否已有数据（如果已有数据就不能改变列类型）
  let hasValue = false;
  if (currentColumn?.uuid) {
    for (const row of rows) {
      if (Object.keys(row.fields || {}).includes(currentColumn.uuid)) {
        // 判断是否存在之前有内容但是已经为空的数值，此类数据不影响类型切换
        const currentColumnValue = row.fields[currentColumn.uuid];
        // 文本不为空 ； 日期不为undefined ; 勾选不为false
        if (currentColumnValue !== '' && currentColumnValue !== false && typeof (currentColumnValue) !== 'undefined') {
          hasValue = true;
          break;
        }
      }
    }
  }

  useEffect(() => {
    const column = columns.filter((c) => c.uuid === panelState.column)[0];
    if (!column) {
      return;
    }

    if (headLocked) {
      return;
    }

    const elem = refColumnName.current;
    if (elem && panelState.visible) {
      elem.value = column.name;
      elem.focus();
      elem.select();
    }
  }, [panelState, headLocked]);

  if (!currentColumn) {
    return null;
  }

  function closeColumnPanel() {
    setPanelState((oldState) => ({
      ...oldState,
      visible: false,
      column: undefined,
    }));
  }

  function onBlurColumnName() {
    // 判断name是否真正发生变化
    const oldName = currentColumn.name;
    const newName = refColumnName.current?.value;
    if (newName === oldName) { // name is unchanged
      return;
    }

    // 找到当前列的序号
    let colIndex = -1;
    for (let i = 0; i < columns.length; i += 1) {
      if (columns[i].uuid === currentColumn.uuid) {
        colIndex = i;
        break;
      }
    }

    if (colIndex < 0) { // cannot find the column
      return;
    }

    // 判断newName是否存在重复
    let duplicated = false;
    for (let i = 0; i < columns.length; i += 1) {
      if (i === colIndex) {
        continue;
      }

      if (columns[i].name === newName) {
        duplicated = true;
        break;
      }
    }

    if (duplicated) {
      const errmsg = `无法将第${colIndex + 1}列的名字从`
        + `【${oldName}】修改为【${newName}】，因为这个名字已经存在。`;
      message.error(errmsg, 6);
      return;
    }

    setColumns((oldColumns) => {
      const newColumns = [];

      for (const col of oldColumns) {
        let newCol;

        if (col.uuid === currentColumn.uuid) {
          newCol = {
            ...col,
            name: newName,
          };
        } else {
          newCol = col;
        }

        newColumns.push(newCol);
      }

      return newColumns;
    });
  }

  function onClickChooseType(e) {
    if (headLocked) {
      return;
    }

    if (hasValue) {
      return;
    }

    function onReallyChooseType(type) {
      if (type === currentColumn.dataType) { // type unchanged
        return;
      }

      let colIndex = -1;
      for (let i = 0; i < columns.length; i += 1) {
        if (columns[i].uuid === currentColumn.uuid) {
          colIndex = i;
          break;
        }
      }

      if (colIndex < 0) {
        return;
      }

      let duplicated = false;
      const taskColumnTypes = ['taskMember', 'taskStartDate', 'taskEndDate', 'taskHolder', 'taskInCharger', 'taskSubscribe', 'taskPriority', 'taskProgress'];
      const cantDuplicatedColumns = ['treeNode', 'serialNumber', 'notification', ...taskColumnTypes];
      if (cantDuplicatedColumns.includes(type)) {
        for (let i = 0; i < columns.length; i += 1) {
          if (columns[i].dataType === type) {
            duplicated = true;
            break;
          }
        }
      }

      if (duplicated) {
        const oldName = DataTypes[currentColumn.dataType]?.nameCN;
        const newName = DataTypes[type]?.nameCN;
        const errmsg = `无法将第${colIndex + 1}列的类型从`
          + `【${oldName}】修改为【${newName}】，因为该类型只能有一个。`;
        message.error(errmsg, 6);
        return;
      }

      setColumns((oldColumns) => {
        const newColumns = [];

        for (const col of oldColumns) {
          let newCol;

          if (col.uuid === currentColumn.uuid) {
            newCol = {
              ...col,
              dataType: type,
            };
            if (taskColumnTypes.includes(type)
              && DataTypes[type]?.nameCN) {
              newCol.name = DataTypes[type]?.nameCN;

              if (type === 'taskPriority') {
                newCol.choices = utils.generateInitOptions();
              }
            }
          } else {
            newCol = col;
          }

          newColumns.push(newCol);
        }

        return newColumns;
      });

      if (type === 'serialNumber') {
        setOptions((oldOptions) => ({
          ...oldOptions,
          serialNumber: true,
        }));
      }
    }

    const btn = e.target.closest('.one-button');
    if (!btn) {
      return;
    }

    const rect = btn.getBoundingClientRect();

    const position = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };

    const detail = {
      panelType: 'ColumnTypePanel',
      action: 'toggle',
      placement: 'right',
      position,
      callback: onReallyChooseType,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  function onClickChooseFormat(e) {
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

    let panelType;
    if (currentColumn.dataType === 'number') {
      panelType = 'NumberFormatPanel';
    } else if (currentColumn.dataType === 'serial') {
      panelType = 'SerialFormatPanel';
    } else if (currentColumn.dataType === 'checkbox') {
      panelType = 'CheckboxViewPanel';
    } else if (currentColumn.dataType === 'select') {
      panelType = 'SelectFormatPanel';
    } else if (currentColumn.dataType === 'signature') {
      panelType = 'SignFormatPanel';
    } else if (currentColumn.dataType === 'linkedRequirements') {
      panelType = 'LinkedRequirementsFormatPanel';
    } else {
      // ignore
    }

    if (panelType) {
      const detail = {
        panelType,
        action: 'toggle',
        placement: 'right',
        position,
        column: currentColumn.uuid,
      };

      const ev = new CustomEvent('notifyPanel', { detail });
      window.dispatchEvent(ev);
    }
  }

  function onClickShowExpandPanel(e) {
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

    const panelType = 'ExpandFormatPanel';

    const detail = {
      panelType,
      action: 'toggle',
      placement: 'right',
      position,
      column: currentColumn.uuid,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  function onClickGenerateSerial() {
    closeColumnPanel();

    setRows((oldData) => {
      const newData = [];
      const colUUID = currentColumn.uuid;

      let i = 1;
      for (const row of oldData) {
        const newRow = {
          ...row,
          fields: {
            ...row.fields,
            [colUUID]: i,
          },
        };

        i += 1;
        newData.push(newRow);
      }

      return newData;
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
      panelType: 'CheckboxSelectPanel',
      action: 'toggle',
      placement: 'right',
      position,
      column: currentColumn.uuid,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  function onClickEditStartSerialNum(e) {
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
      panelType: 'EditSerialNumberPanel',
      action: 'toggle',
      placement: 'right',
      position,
      column: currentColumn.uuid,
      closeColumnPanel,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  function onClickAddChoice(e) {
    const elem = e.target.closest('.one-button');
    if (!elem) {
      return;
    }

    const rect = elem.getBoundingClientRect();
    const position = {
      left: rect.left,
      top: rect.top - 200,
      width: rect.width,
      height: rect.height,
    };

    const detail = {
      panelType: 'ChoiceNewPanel',
      action: 'toggle',
      placement: 'right',
      position,
      column: currentColumn.uuid,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  function onClickColExplain() {
    const detail = {
      panelType: 'ColExplainPanel',
      action: 'show',
      column: currentColumn,
      disabled: false,
    };

    const event = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(event);
  }

  function onClickEditChoice(choice, e) {
    const elem = e.target.closest('.one-button');
    if (!elem) {
      return;
    }

    const rect = elem.getBoundingClientRect();
    const position = {
      left: rect.left,
      top: rect.top - 200,
      width: rect.width,
      height: rect.height,
    };

    const detail = {
      panelType: 'ChoiceEditPanel',
      action: 'toggle',
      placement: 'right',
      position,
      column: currentColumn.uuid,
      choice: choice.uuid,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  function onClickInsertBefore() {
    closeColumnPanel();

    setColumns((oldColumns) => {
      let index = -1;
      for (let i = 0; i < oldColumns.length; i += 1) {
        if (oldColumns[i].name === currentColumn.name) {
          index = i;
          break;
        }
      }

      if (index === -1) {
        return oldColumns;
      }

      const name = utils.generateNewColumnName(oldColumns);
      const uuid = uuidv4();

      const newCol = {
        name,
        uuid,
        dataType: 'text',
        width: 120,
      };

      const newColumns = [];
      for (let i = 0; i < oldColumns.length; i += 1) {
        if (i === index) {
          newColumns.push(newCol);
        }

        newColumns.push(oldColumns[i]);
      }

      return newColumns;
    });
  }

  function onClickInsertAfter() {
    closeColumnPanel();

    setColumns((oldColumns) => {
      let index = -1;
      for (let i = 0; i < oldColumns.length; i += 1) {
        if (oldColumns[i].name === currentColumn.name) {
          index = i;
          break;
        }
      }

      if (index === -1) {
        return oldColumns;
      }

      const name = utils.generateNewColumnName(oldColumns);
      const uuid = uuidv4();

      const newCol = {
        name,
        uuid,
        dataType: 'text',
        width: 120,
      };

      const newColumns = [];
      for (let i = 0; i < oldColumns.length; i += 1) {
        newColumns.push(oldColumns[i]);

        if (i === index) {
          newColumns.push(newCol);
        }
      }

      return newColumns;
    });
  }

  function onClickHide() {
    closeColumnPanel();

    setColumns((oldColumns) => {
      const newColumns = [];
      for (const col of oldColumns) {
        const newCol = { ...col };
        if (col.uuid === currentColumn.uuid) {
          newCol.invisible = !col.invisible;
        }

        newColumns.push(newCol);
      }

      return newColumns;
    });
  }

  function onClickFix() {
    closeColumnPanel();

    setColumns((oldColumns) => {
      let fixed = false;
      for (const col of oldColumns) {
        if (col.uuid === currentColumn.uuid) {
          fixed = !!col.fixed;
        }
      }

      const newColumns = [];
      for (const col of oldColumns) {
        const newCol = { ...col };
        delete newCol.fixed;
        if (!fixed) { // 当前未处于固定状态，应当固定
          if (col.uuid === currentColumn.uuid) {
            newCol.fixed = true;
          }
        } else { // 当前处于固定状态，应当取消固定
          // do nothing
        }

        newColumns.push(newCol);
      }

      return newColumns;
    });
  }

  async function onClickCopyToClipboard() {
    closeColumnPanel();

    const array = [];
    for (const row of rows) {
      let str;
      const value = row.fields?.[currentColumn.uuid];
      const conv = DataTypes[currentColumn.dataType]?.valueToClipboardString;
      if (conv) {
        str = conv(value);
      } else {
        str = value ? `${value}` : '';
      }

      array.push(str);
    }

    const text = array.join('\n');

    try {
      await utils.writeTextToClipboard(text);
      message.success('列内容已复制到剪贴板');
    } catch (err) {
      message.error(`无法复制到剪贴板: ${err}`);
    }
  }

  function normalizeLineLevels(lines) {
    const outLines = [];
    const re = /^(\s*)(.*)$/;
    const stack = [
      { spaces: 0, level: 0 },
    ];

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      let spaces;
      let content;
      let level;

      const m = re.exec(line);
      if (m) {
        spaces = m[1].length;
        [, , content] = m;
      } else {
        spaces = 0;
        content = line;
      }

      let lastLineInfo = stack.at(-1);
      let lastSpaces = lastLineInfo.spaces;
      let lastLevel = lastLineInfo.level;

      while (spaces < lastSpaces) {
        stack.pop();
        lastLineInfo = stack.at(-1);
        lastSpaces = lastLineInfo.spaces;
        lastLevel = lastLineInfo.level;
      }

      if (spaces > lastSpaces) {
        level = lastLevel + 1;
        stack.push({ spaces, level });
      } else if (spaces === lastSpaces) {
        level = lastLevel;
      } else { // spaces < lastSpaces
        // impossible
      }

      let prefix = '';
      for (let j = 0; j < level; j += 1) {
        prefix += '    ';
      }

      outLines.push(prefix + content);
    }

    return outLines;
  }

  async function onClickPasteFromClipboard() {
    closeColumnPanel();

    let colIndex = -1;
    for (let i = 0; i < columns.length; i += 1) {
      if (columns[i].uuid === currentColumn.uuid) {
        colIndex = i;
        break;
      }
    }

    if (colIndex < 0) {
      return;
    }

    const rowIndex = 0;

    await pasteTableRectFromClipboard({
      colIndex,
      rowIndex,
      columns,
      setColumns,
      setRows,
      DataTypes,
    });
  }

  function onClickClone() {
    closeColumnPanel();

    const uuid = uuidv4();

    setColumns((oldColumns) => {
      let index = -1;
      for (let i = 0; i < oldColumns.length; i += 1) {
        if (oldColumns[i].name === currentColumn.name) {
          index = i;
          break;
        }
      }

      if (index === -1) {
        return oldColumns;
      }

      const oldCol = oldColumns[index];

      const name = utils.generateNewColumnName(oldColumns);

      const newCol = {
        ...oldCol,
        name,
        uuid,
      };

      const newColumns = [];
      for (let i = 0; i < oldColumns.length; i += 1) {
        newColumns.push(oldColumns[i]);

        if (i === index) {
          newColumns.push(newCol);
        }
      }

      return newColumns;
    });

    setRows((oldData) => {
      const newData = [];
      const colUUID = currentColumn.uuid;

      for (const row of oldData) {
        const newRow = {
          ...row,
          fields: {
            ...row.fields,
            [uuid]: row.fields[colUUID],
          },
        };

        newData.push(newRow);
      }

      return newData;
    });
  }

  async function onClickClear() {
    closeColumnPanel();

    if (!(await confirm('确定要清空此列数据吗？'))) {
      return;
    }

    setRows((oldData) => oldData.map((row) => {
      const newFields = {};

      for (const uuid of Object.keys(row.fields)) {
        if (uuid !== currentColumn.uuid) {
          newFields[uuid] = row.fields[uuid];
        }
      }

      return {
        ...row,
        fields: newFields,
      };
    }));
  }

  function getIcon() {
    const iconFn = DataTypes?.[currentColumn.dataType]?.icon;
    if (iconFn) {
      return iconFn?.();
    }
    return (
      <ColumnIcon dataType={currentColumn.dataType} />
    );
  }

  async function onClickDelete() {
    closeColumnPanel();

    if (!(await confirm(t('delete.col.confirm')))) {
      return;
    }

    setColumns((oldColumns) => oldColumns.filter((c) => c.name !== currentColumn.name));

    setRows((oldData) => oldData.map((row) => {
      const newFields = {};
      for (const uuid of Object.keys(row.fields)) {
        if (uuid !== currentColumn.uuid) {
          newFields[uuid] = row.fields[uuid];
        }
      }

      return {
        ...row,
        fields: newFields,
      };
    }));

    if (currentColumn.dataType === 'serialNumber') {
      setOptions((oldOptions) => ({
        ...oldOptions,
        serialNumber: false,
      }));
    }
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-columnPanel">
        <div className="column-name-editor">
          <input
            ref={refColumnName}
            className="column-name"
            autoComplete="off"
            placeholder="field name"
            readOnly={!!headLocked}
            defaultValue={currentColumn.name}
            onBlur={onBlurColumnName}
          />
        </div>

        <div className="column-type-editor">
          <div className="hint">
            {t('field.type')}
          </div>
          <div
            className={
              `one-button${(!headLocked && !hasValue) ? '' : ' disabled'}`
            }
            onClick={(e) => onClickChooseType(e)}
          >
            <div className="icon">
              {getIcon()}
            </div>
            <div className="name">
              {DataTypes[currentColumn.dataType]?.nameCN}
            </div>
            {
              !headLocked && !hasValue
              && (
                <div className="right-icon">
                  <icons.IconRight />
                </div>
              )
            }
          </div>
        </div>

        {(currentColumn.dataType === 'select'
          || currentColumn.dataType === 'taskPriority'
          || currentColumn.dataType === 'multiSelect')
          && (
            <div className="column-type-editor">
              <div className="hint">
                Option
              </div>

              <div className="choice-list">
                <SelectChoiceList
                  column={currentColumn}
                  choices={currentColumn?.choices}
                  locked={headLocked}
                  onClickEditChoice={onClickEditChoice}
                />

                {
                  !headLocked
                  && (
                    <div className="one-button" onClick={onClickAddChoice}>
                      <div className="icon">
                        <icons.IconPlus />
                      </div>
                      <div className="name">
                        Add Option
                      </div>
                    </div>
                  )
                }
              </div>
            </div>
          )}

        <Divider />

        <div className="button-list">
          {
            !headLocked
            && (currentColumn.dataType === 'number'
              || currentColumn.dataType === 'serial'
              || currentColumn.dataType === 'checkbox'
              || currentColumn.dataType === 'select'
            )
            && (
              <div className="one-button" onClick={onClickChooseFormat}>
                <div className="icon">
                  <icons.IconConfig />
                </div>
                <div className="name">
                  格式化
                </div>
                <div className="right-icon">
                  <icons.IconRight />
                </div>
              </div>
            )
          }

          {
            !headLocked
            && currentColumn.dataType === 'signature'
            && (
              <div className="one-button" onClick={onClickChooseFormat}>
                <div className="icon">
                  <icons.SignatureFormat />
                </div>
                <div className="name">
                  显示格式
                </div>
                <div className="right-icon">
                  <icons.IconRight />
                </div>
              </div>
            )
          }

          {
            !headLocked
            && ['text', 'signature', 'file', 'linkedRequirements', 'notification'].includes(currentColumn.dataType)
            && (
              <div className="one-button" onClick={onClickShowExpandPanel}>
                <div className="icon">
                  <icons.IconExpandCollapse />
                </div>
                <div className="name">
                  {t('collapse&expand')}
                </div>
                <div className="right-icon">
                  <icons.IconRight />
                </div>
              </div>
            )
          }

          {currentColumn.dataType === 'serial'
            && (
              <div className="one-button" onClick={onClickGenerateSerial}>
                <div className="icon">
                  <icons.IconNumber />
                </div>
                <div className="name">
                  生成编号
                </div>
              </div>
            )}

          {
            !bodyLocked
            && (currentColumn.dataType === 'checkbox'
              || currentColumn.dataType === 'treeNode')
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

          {
            !bodyLocked
            && (currentColumn.dataType === 'serialNumber')
            && (
              <div className="one-button" onClick={onClickEditStartSerialNum}>
                <div className="icon">
                  <icons.IconSerialStart />
                </div>
                <div className="name">
                  Starting code
                </div>
                <div className="right-icon">
                  <span style={{ color: '#4B4B4B' }}>{currentColumn?.startSerialNumber || 1}</span>
                  <icons.IconRight />
                </div>
              </div>
            )
          }

          {
            !bodyLocked && !headLocked
            && (
              <div className="one-button" onClick={onClickColExplain}>
                <div className="icon">
                  <icons.IconExplain />
                </div>
                <div className="name">
                  {t('describe')}
                </div>
              </div>
            )
          }

          {
            !headLocked
            && (
              <div className="one-button" onClick={onClickInsertBefore}>
                <div className="icon">
                  <icons.IconLeftArrow />
                </div>
                <div className="name">
                  {t('insert.to.left')}
                </div>
              </div>
            )
          }

          {
            !headLocked
            && (
              <div className="one-button" onClick={onClickInsertAfter}>
                <div className="icon">
                  <icons.IconRightArrow />
                </div>
                <div className="name">
                  {t('insert.to.right')}
                </div>
              </div>
            )
          }

          {
            !headLocked
            && (
              <div className="one-button" onClick={onClickHide}>
                {currentColumn.invisible
                  ? (
                    <>
                      <div className="icon">
                        <icons.IconVisible />
                      </div>
                      <div className="name">
                        显示
                      </div>
                    </>
                  )
                  : (
                    <>
                      <div className="icon">
                        <icons.IconInvisible />
                      </div>
                      <div className="name">
                        {t('hidden')}
                      </div>
                    </>
                  )}
              </div>
            )
          }

          {
            !headLocked
            && (
              <div className="one-button" onClick={onClickFix}>
                <div className="icon">
                  <icons.IconFixColumn />
                </div>
                <div className="name">
                  {currentColumn.fixed
                    ? t('unpin')
                    : t('fixed.col')}
                </div>
              </div>
            )
          }

          <div className="one-button" onClick={onClickCopyToClipboard}>
            <div className="icon">
              <icons.IconCopy />
            </div>
            <div className="name">
              {t('copy')}
            </div>
          </div>

          {
            !bodyLocked
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
            !headLocked
            && (
              <div className="one-button" onClick={onClickClone}>
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
            !bodyLocked
            && (
              <div className="one-button" onClick={onClickClear}>
                <div className="icon">
                  <icons.IconFormatPainter />
                </div>
                <div className="name">
                  {t('clear column')}
                </div>
              </div>
            )
          }

          {
            !(headLocked || bodyLocked)
            && currentColumn.dataType !== 'treeNode'
            && (
              <div className="one-button" onClick={onClickDelete}>
                <div className="icon">
                  <icons.IconDelete />
                </div>
                <div className="name">
                  {t('delete.col')}
                </div>
              </div>
            )
          }
        </div>
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(ColumnPanel);
