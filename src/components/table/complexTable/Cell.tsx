// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

import React, {
  useState,
  useEffect,
  useRef,
  useContext,
} from 'react';

import {
  Input,
  Switch,
  Progress,
  Checkbox,
} from 'antd';

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

import {
  InterfaceFunctionContext,
  CellRendererContext,
} from './contexts';

import DefaultTagColors from './DefaultTagColors';
import { vsprintf } from './sprintf';
import * as icons from './SvgIcons';
import * as utils from './utils';
import './Cell.less';

function createCellDataSetter(rowKey, colKey, value) {
  return (oldData) => oldData.map((_row) => {
    if (_row.uuid === rowKey) {
      return {
        ..._row,
        fields: {
          ..._row.fields,
          [colKey]: value,
        },
      };
    }
    return _row;
  });
}

function RowIndexCell(props) {
  const { row } = props;
  return (
    <div className="cell-view-rowIndex">
      {row.rowIndex + 1}
    </div>
  );
}

function TextCell(props) {
  const { col, row } = props;
  const { setRows } = useContext(CellRendererContext);
  const ref = useRef(null);
  const [value, setValue] = useState(row?.fields?.[col?.uuid]);

  useEffect(() => {
    const newValue = row?.fields?.[col?.uuid];
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [props]);

  useEffect(() => {
    ref.current.innerText = value || '';
  }, [value]);

  function onBlur(e) {
    const text = utils.getContentEditableText(e.target);
    // console.log('text:', JSON.stringify(text));
    // if you found text wrong, then check e.target.innerHTML

    setRows((oldData) => oldData.map((_row) => {
      if (_row.uuid === row.uuid) {
        return {
          ..._row,
          fields: {
            ..._row.fields,
            [col.uuid]: text,
          },
        };
      }
      return _row;
    }));

    // setEndOfContenteditable(ref.current);
  }

  return (
    <div
      ref={ref}
      className="cell-view-text"
      contentEditable
      onBlur={(e) => onBlur(e)}
    />
  );
}

const MoneyPrefixes = {
  RMB: '¥',
  USD: '$',
  EUR: '€',
  JPY: 'JP¥',
  HKD: 'HK$',
};

function ProgressBar(props) {
  const {
    value,
    onChange,
  } = props;

  const ref = useRef(null);
  const clampValue = utils.clamp(value, 0.0, 1.0);
  const [percent, setPercent] = useState(clampValue * 100);

  let isMoving = false;
  let barWidth = 100;

  function onMouseMove(e) {
    if (!isMoving) {
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

function NumberEditor(props) {
  const {
    value,
    onBlur,
  } = props;

  const ref = useRef(null);

  useEffect(() => {
    const input = ref.current;
    if (input) {
      input.focus();
    }
  }, []);

  function onInputKeyDown(e) {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  }

  function onInputBlur(e) {
    if (onBlur) {
      onBlur(e.target.value);
    }
  }

  return (
    <div className="editor-box">
      <Input
        ref={ref}
        type="text"
        defaultValue={value}
        onKeyDown={onInputKeyDown}
        onBlur={onInputBlur}
      />
    </div>
  );
}

function NumberCell(props) {
  const { col, row } = props;
  const { setRows } = useContext(CellRendererContext);
  const [editing, setEditing] = useState(false);

  function onClick() {
    if (!editing) {
      setEditing(true);
    }
  }

  function onChange(newValue) {
    setRows((oldData) => oldData.map((_row) => {
      if (_row.uuid === row.uuid) {
        return {
          ..._row,
          fields: {
            ..._row.fields,
            [col.uuid]: `${newValue}`,
          },
        };
      }
      return _row;
    }));
  }

  function onEditorBlur(newValue) {
    setEditing(false);
    onChange(newValue);
  }

  if (editing) {
    const value = row?.fields?.[col?.uuid];

    return (
      <div className="cell-view-number">
        <NumberEditor
          value={value}
          onBlur={onEditorBlur}
        />
      </div>
    );
  }

  const format = col.format || 'number';
  const value = parseFloat(row?.fields?.[col?.uuid]) || 0;

  if (format === 'progress') { // 渲染为进度条
    return (
      <div className="cell-view-number">
        <div className="progress-box" onClick={onClick}>
          <ProgressBar value={value} onChange={onChange} />
        </div>
      </div>
    );
  } // 渲染为文本
  let text;
  const moneyPrefix = MoneyPrefixes[format];

  if (moneyPrefix) { // 渲染为货币格式
    const s = utils.formatNumberAsCommaSeparatedAndFixed(value, 3, 2);
    text = `${moneyPrefix}${s}`;
  } else if (format === 'int') {
    text = parseInt(value, 10).toString();
  } else if (format === 'thousands') {
    text = utils.formatNumberAsCommaSeparated(value, 3);
  } else if (format === 'frac2') {
    text = value.toFixed(2);
  } else if (format === 'percent') {
    text = `${value * 100}%`;
  } else { // default: number
    text = `${value}`;
  }

  return (
    <div className="cell-view-number">
      <div className="text-box" onClick={onClick}>
        <div>{text}</div>
      </div>
    </div>
  );
}

function SerialCell(props) {
  const { col, row } = props;
  const { setRows } = useContext(CellRendererContext);

  const value = row?.fields?.[col?.uuid];
  const serial = value || 0;
  const format = col.format || '%d';
  let text;

  try {
    text = vsprintf(format, [serial]);
  } catch (err) {
    text = 'FORMAT ERROR';
  }

  return (
    <div className="cell-view-number">
      <div className="text-box">
        <div>{text}</div>
      </div>
    </div>
  );
}

function CheckboxCell(props) {
  const { col, row } = props;
  const { setRows } = useContext(CellRendererContext);
  const [value, setValue] = useState(row?.fields?.[col?.uuid]);

  useEffect(() => {
    const newValue = row?.fields?.[col?.uuid];
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [props]);

  function onChange(checked) {
    const setter = createCellDataSetter(row.uuid, col.uuid, checked);
    setRows(setter);
  }

  function onClick(e) {
    if (e.target.tagName === 'INPUT' || e.target.type === 'checkbox') {
      return;
    }

    const box = e.target.closest('.checkbox-box');
    if (!box) {
      return;
    }

    const input = box.querySelector('input');
    if (!input) {
      return;
    }

    onChange(!input.checked);
  }

  const view = col.view || 'checkbox';

  if (view === 'switch') {
    return (
      <div className="cell-view-checkbox">
        <Switch size="small" checked={!!value} onChange={onChange} />
      </div>
    );
  } // default: checkbox
  return (
    <div className="cell-view-checkbox">
      <div className="checkbox-box" onClick={onClick}>
        <div className="input-box">
          <Input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
        </div>
      </div>
    </div>
  );
}

function TagList(props) {
  const {
    choices,
    value,
    limit = -1,
  } = props;

  const tags = [];

  if (!(choices?.length && value)) {
    return tags;
  }

  let array;
  if (Array.isArray(value)) {
    array = value;
  } else {
    array = [value];
  }

  for (let i = 0; i < array.length; i += 1) {
    if (limit >= 0 && tags.length >= limit) {
      break;
    }

    const item = array[i];

    let choice = null;
    for (const ch of choices) {
      if (ch.name === item) {
        choice = ch;
        break;
      }
    }

    if (!choice) {
      continue;
    }

    const bg = choice?.color?.color || DefaultTagColors[0].color;

    const tag = (
      <span
        key={i}
        className="tag"
        style={{
          backgroundColor: bg,
        }}
      >
        <span className="name">{item}</span>
      </span>
    );

    tags.push(tag);
  }

  return tags;
}

function MultiSelectCell(props) {
  const { col, row } = props;
  const { setRows } = useContext(CellRendererContext);
  const [value, setValue] = useState(row?.fields?.[col?.uuid]);

  useEffect(() => {
    const newValue = row?.fields?.[col?.uuid];
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [props]);

  function onClick(e) {
    const elem = e.target.closest('.cell-view-select');
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
      panelType: 'SelectionPanel',
      action: 'toggle',
      placement: 'bottom',
      position,
      column: col.uuid,
      row: row.uuid,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  let limit;
  if (col.dataType === 'select') {
    limit = 1; // 单选
  } else {
    limit = -1; // 多选
  }

  return (
    <div className="cell-view-select" onClick={onClick}>
      <TagList choices={col.choices} value={value} limit={limit} />
    </div>
  );
}

function DateCell(props) {
  const { col, row } = props;
  const { setRows } = useContext(CellRendererContext);
  const [value, setValue] = useState(row?.fields?.[col?.uuid]);

  useEffect(() => {
    const newValue = row?.fields?.[col?.uuid];
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [props]);

  function onClick(e) {
    const elem = e.target.closest('.cell-view-date');
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
      panelType: 'DateEditPanel',
      action: 'toggle',
      placement: 'bottom',
      position,
      column: col.uuid,
      row: row.uuid,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  let dateString;
  if (value) {
    const date = moment(value);
    dateString = date.format('YYYY-MM-DD');
  }

  return (
    <div className="cell-view-date" onClick={onClick}>
      <div className="text">
        {dateString}
      </div>
    </div>
  );
}

function ImageInCell(props) {
  const file = props;
  const { getAttachment } = props;
  const ref = useRef(null);

  async function loadImage() {
    let img;

    try {
      const blob = await getAttachment(file.digest);
      img = await utils.blob2img(blob);
    } catch (err) {
      console.error(`cannot load attachment image ${file.digest}`, err);
      return;
    }

    const div = ref.current;
    if (img && div) {
      while (div.childElementCount) {
        div.removeChild(div.firstChild);
      }

      div.appendChild(img);
    }
  }

  useEffect(() => {
    loadImage();
  }, []);

  return (
    <div ref={ref} />
  );
}

function FileCell(props) {
  const { col, row } = props;

  const {
    getAttachment,
  } = useContext(InterfaceFunctionContext);

  const { setRows } = useContext(CellRendererContext);

  const [value, setValue] = useState(row?.fields?.[col?.uuid]);

  useEffect(() => {
    const newValue = row?.fields?.[col?.uuid];
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [props]);

  function onClick(e) {
    const elem = e.target.closest('.cell-view-file');
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
      panelType: 'FileCellPanel',
      action: 'toggle',
      placement: 'bottom',
      position,
      column: col.uuid,
      row: row.uuid,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  function renderFile(file) {
    if (utils.isImage(file.name)) {
      return (
        <div className="image-box">
          <ImageInCell {...file} getAttachment={getAttachment} />
        </div>
      );
    }
    return (
      <div className="file-box">
        <div><icons.IconDropFileHere /></div>
        <span>{file.name}</span>
      </div>
    );
  }

  return (
    <div className="cell-view-file" onClick={onClick}>
      {
        value?.map?.((file) => (
          <div key={file.uuid} className="file-item">
            {renderFile(file)}
          </div>
        ))
      }
    </div>
  );
}

function HyperlinkCell(props) {
  const { col, row } = props;
  const { setRows } = useContext(CellRendererContext);
  const refEditor = useRef(null);
  const refAnchor = useRef(null);
  const [editing, setEditing] = useState(false);
  const value = row.fields?.[col.uuid];
  const isEmpty = !value;

  useEffect(() => {
    if (refAnchor) {
      refAnchor.current.href = value;
    }

    if (editing) {
      refEditor.current.innerText = value || '';
    }
  }, [editing, value]);

  function onClickViewer(e) {
    setEditing(true);

    setTimeout(() => {
      const elem = refEditor.current;
      if (elem) {
        elem.focus();
        utils.doElementSelectAll(elem);
      }
    }, 10);
  }

  function onBlur(e) {
    const text = utils.getContentEditableText(refEditor.current).trim();

    setRows((oldData) => oldData.map((_row) => {
      if (_row.uuid === row.uuid) {
        return {
          ..._row,
          fields: {
            ..._row.fields,
            [col.uuid]: text,
          },
        };
      }
      return _row;
    }));

    setEditing(false);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onBlur();
    }
  }

  function onClickButton(e) {
    e.stopPropagation();
  }

  let className = 'cell-view-hyperlink';
  if (editing) {
    className += ' editing';
  }

  if (isEmpty) {
    className += ' empty';
  } else {
    className += ' not-empty';
  }

  return (
    <div className={className}>
      <div className="viewer" onClick={onClickViewer}>
        <div className="link-text">
          {value || ''}
        </div>
        <div className="link-button" onClick={onClickButton}>
          <a ref={refAnchor} target="_blank">
            <icons.IconHyperlink />
          </a>
        </div>
      </div>
      <div className="editor">
        <div
          ref={refEditor}
          className="cell-view-text"
          contentEditable
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}

function RelatedRequirementItem(props) {
  const {
    index,
    rowURL,
    onClickLink,
  } = props;

  return (
    <div className="related-requirement-item">
      <span className="icon"><ArrowRightOutlined /></span>
      <span className="text" onClick={(e) => onClickLink(rowURL, index)}>
        <span className="url">{rowURL}</span>
        <span className="name" />
      </span>
    </div>
  );
}

function RelatedRequirementsCell(props) {
  const { col, row } = props;

  const {
    onOpenRelatedRequirement,
  } = useContext(InterfaceFunctionContext);

  const {
    projectId,
    requirementSetUUID,
    tableUUID,
  } = useContext(CellRendererContext);

  function onClickRelatedRequirementItem(rowURL, index) {
    const parts = rowURL.split('/');

    const item = {
      projectId: parts[2],
      requirementSetUUID: parts[4],
      tableUUID: parts[6],
      rowUUID: parts[8],
    };

    const isSameProject = (item.projectId.toString() === projectId);
    const isSameReqSet = (item.requirementSetUUID === requirementSetUUID);
    const isSameTable = (item.tableUUID === tableUUID);

    if (isSameProject && isSameReqSet && isSameTable) {
      const detail = { uuid: item.rowUUID };
      const e = new CustomEvent('locateBlinkRow', { detail });
      window.dispatchEvent(e);
      return;
    }

    if (onOpenRelatedRequirement) {
      onOpenRelatedRequirement(rowURL);
    }
  }

  const itemElems = [];
  const value = row?.fields?.[col?.uuid] || [];

  if (Array.isArray(value) && value.length > 0) {
    for (let i = 0; i < value.length; i += 1) {
      const rowURL = value?.[i];
      if (!rowURL) {
        continue;
      }

      const elem = (
        <RelatedRequirementItem
          key={i}
          index={i}
          rowURL={rowURL}
          onClickLink={onClickRelatedRequirementItem}
        />
      );

      itemElems.push(elem);
    }
  }

  return (
    <div className="cell-view-related-requirements">
      <div className="related-requirement-list">
        {itemElems}
      </div>
    </div>
  );
}

function LinkedRequirementItem(props) {
  const {
    index,
    item,
    onClickLink,
  } = props;

  return (
    <div className="related-requirement-item">
      <span className="icon"><ArrowLeftOutlined /></span>
      <span className="text" onClick={(e) => onClickLink(item, index)}>
        <span className="url">{item.rowName || '无标题'}</span>
        <span className="name" />
      </span>
    </div>
  );
}

function LinkedRequirementsCell(props) {
  const { col, row } = props;

  const {
    onOpenRelatedRequirement,
  } = useContext(InterfaceFunctionContext);

  const {
    projectId,
    requirementSetUUID,
    tableUUID,
  } = useContext(CellRendererContext);

  function onClickLinkedRequirementItem(item, index) {
    const isSameProject = (item.projectId.toString() === projectId);
    const isSameReqSet = (item.requirementSetUUID === requirementSetUUID);
    const isSameTable = (item.tableUUID === tableUUID);

    if (isSameProject && isSameReqSet && isSameTable) {
      const detail = { uuid: item.rowUUID };
      const e = new CustomEvent('locateBlinkRow', { detail });
      window.dispatchEvent(e);
      return;
    }

    if (onOpenRelatedRequirement) {
      let rowURL = 'requirement:';
      rowURL += `/projects/${item.projectId}`;
      rowURL += `/requirements/${item.requirementSetUUID}`;
      rowURL += `/tables/${item.tableUUID}`;
      rowURL += `/rows/${item.rowUUID}`;

      onOpenRelatedRequirement(rowURL);
    }
  }

  const itemElems = [];
  const value = linkedRequirements[row.uuid];

  if (Array.isArray(value) && value.length > 0) {
    for (let i = 0; i < value.length; i += 1) {
      const item = value[i];
      if (!item) {
        continue;
      }

      const elem = (
        <LinkedRequirementItem
          key={i}
          index={i}
          item={item}
          onClickLink={onClickLinkedRequirementItem}
        />
      );

      itemElems.push(elem);
    }
  }

  return (
    <div className="cell-view-related-requirements">
      <div className="related-requirement-list">
        {itemElems}
      </div>
    </div>
  );
}

function TreeNodeCell(props) {
  const { col, row } = props;

  const {
    onOpenSubtable,
  } = useContext(InterfaceFunctionContext);

  const {
    treeNodeSpace,
    columns,
    setRows,
  } = useContext(CellRendererContext);

  const ref = useRef(null);
  const [value, setValue] = useState(row?.fields?.[col?.uuid]);

  let linkUUID = null;
  let linkExist = false;
  if (value?.uuid) {
    linkUUID = value.uuid;
    linkExist = !!treeNodeSpace[linkUUID];
  }

  useEffect(() => {
    const newValue = row?.fields?.[col?.uuid];
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [props]);

  useEffect(() => {
    ref.current.innerText = value?.text || '';
  }, [value]);

  function onChangeCheckbox(e) {
    const { checked } = e.target;

    setRows((oldData) => {
      const selectedRows = [];
      const roots = utils.createTreeFromTable(columns, oldData);
      const node = utils.findTreeNodeInRoots(roots, row.uuid);
      utils.getTreeNodeAllRows(node, selectedRows);
      const selectedRowUUIDs = selectedRows.map((r) => r.uuid);

      const newData = [];
      for (const row1 of oldData) {
        const index = selectedRowUUIDs.indexOf(row1.uuid);
        if (index !== -1) {
          const oldValue = row1.fields?.[col.uuid];
          let newValue;
          if (typeof oldValue === 'object' && oldValue) {
            newValue = {
              ...oldValue,
              checked,
            };
          } else {
            newValue = {
              checked,
            };
          }

          const newRow = {
            ...row1,
            fields: {
              ...row1.fields,
              [col.uuid]: newValue,
            },
          };

          newData.push(newRow);
        } else {
          newData.push(row1);
        }
      }

      return newData;
    });
  }

  function onClickOpenClose(e) {
    setRows((oldData) => oldData.map((_row) => {
      if (_row.uuid === row.uuid) {
        const oldValue = _row.fields?.[col.uuid];
        let newValue;
        if (typeof oldValue === 'object' && oldValue) {
          newValue = {
            ...oldValue,
            closed: !oldValue.closed,
          };
        } else {
          newValue = {
            closed: true,
          };
        }

        return {
          ..._row,
          fields: {
            ..._row.fields,
            [col.uuid]: newValue,
          },
        };
      }
      return _row;
    }));
  }

  function onMoveLeft() {
    setRows((oldData) => {
      const selectedRowUUIDs = [row.uuid];
      const newData = [];

      for (const row1 of oldData) {
        const newRow = { ...row1 };
        if (selectedRowUUIDs.includes(row1.uuid)) {
          const oldValue = row1.fields?.[col.uuid];
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
            [col.uuid]: newValue,
          };
        }

        newData.push(newRow);
      }

      return newData;
    });
  }

  function onMoveRight() {
    setRows((oldData) => {
      const selectedRowUUIDs = [row.uuid];
      const newData = [];

      for (const row1 of oldData) {
        const newRow = { ...row1 };
        if (selectedRowUUIDs.includes(row1.uuid)) {
          const oldValue = row1.fields?.[col.uuid];
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
            [col.uuid]: newValue,
          };
        }

        newData.push(newRow);
      }

      return newData;
    });
  }

  function onKeyDown(event) {
    if (event.key === ',') {
      if ((event.metaKey && event.shiftKey)
        || (event.ctrlKey && event.shiftKey)) {
        onMoveLeft();
        event.preventDefault();
      }
    } else if (event.key === '.') {
      if ((event.metaKey && event.shiftKey)
        || (event.ctrlKey && event.shiftKey)) {
        onMoveRight();
        event.preventDefault();
      }
    }
  }

  function onBlur(e) {
    const text = utils.getContentEditableText(e.target);
    // console.log('text:', JSON.stringify(text));
    // if you found text wrong, then check e.target.innerHTML

    setRows((oldData) => oldData.map((_row) => {
      if (_row.uuid === row.uuid) {
        const oldValue = _row.fields?.[col.uuid];
        let newValue;
        if (typeof oldValue === 'object' && oldValue) {
          newValue = {
            ...oldValue,
            text,
          };
        } else {
          newValue = {
            level: 0,
            text,
          };
        }

        return {
          ..._row,
          fields: {
            ..._row.fields,
            [col.uuid]: newValue,
          },
        };
      }
      return _row;
    }));
  }

  function onClickOpen(e) {
    let cellUUID;

    setRows((oldData) => {
      const newData = [];
      for (const row1 of oldData) {
        if (row1.uuid === row.uuid) {
          const oldValue = row1.fields?.[col?.uuid] || {};
          const newValue = {
            ...oldValue,
            uuid: oldValue.uuid || uuidv4(),
          };

          const newRow = {
            ...row1,
            fields: {
              ...row1.fields,
              [col.uuid]: newValue,
            },
          };

          cellUUID = newValue.uuid;
          newData.push(newRow);
        } else {
          newData.push(row1);
        }
      }

      return newData;
    });

    setTimeout(() => {
      if (onOpenSubtable) {
        onOpenSubtable(col, row, cellUUID);
      }
    }, 30);
  }

  return (
    <div
      className="cell-view-treeNode"
      style={{ marginLeft: `${(value?.level || 0) * 50}px` }}
    >
      <div className="checkbox">
        <Checkbox checked={value?.checked} onChange={onChangeCheckbox} />
      </div>
      <div className="open-close" onClick={onClickOpenClose}>
        {value?.closed
          ? <icons.IconTreeNodeClosed />
          : <icons.IconTreeNodeOpen />}
      </div>
      <div
        ref={ref}
        className="cell-view-text"
        contentEditable
        onKeyDown={(e) => onKeyDown(e)}
        onBlur={(e) => onBlur(e)}
      />
      <div className={`float-bar${linkExist ? ' has-link' : ''}`}>
        <div className="float-bar-content">
          {linkExist
            && (
              <div className="button" onClick={onClickOpen}>
                {linkExist ? '打开' : '新建'}
              </div>
            )}
          <span className="link-notation" />
        </div>
      </div>
    </div>
  );
}

export default {
  rowIndex: RowIndexCell,
  text: TextCell,
  // number: NumberCell,
  serial: SerialCell,
  // checkbox: CheckboxCell,
  // select: MultiSelectCell,
  // multiSelect: MultiSelectCell,
  // date: DateCell,
  // file: FileCell,
  // hyperlink: HyperlinkCell,
  // relatedRequirements: RelatedRequirementsCell,
  // linkedRequirements: LinkedRequirementsCell,
  email: TextCell,
  phone: TextCell,
  // treeNode: TreeNodeCell,
};
