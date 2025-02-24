// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';
import React, { useEffect } from 'react';

import {
  Input,
} from 'antd';

import { CellRendererContext } from './contexts';
// import { MultiClientMutexTool } from './MultiClientMutexTool';
import { DropdownButton } from './MyDropdown';
import HanziInput from './HanziInput';
import * as icons from './SvgIcons';
import './Toolbar.less';

const { useState, useContext, useRef } = React;

function TableNameEditor() {
  const { options, setOptions } = useContext(CellRendererContext);

  function onChangeTableName(value) {
    setOptions((oldOptions) => {
      const newOptions = {
        ...oldOptions,
        tableName: value,
      };

      if (!newOptions.uuid) {
        newOptions.uuid = uuidv4();
      }

      return newOptions;
    });
  }

  return (
    <div className="table-name-editor">
      {/* <HanziInput
        placeholder="表格标题"
        readOnly={readOnly}
        value={options.tableName}
        onChange={onChangeTableName}
      /> */}
    </div>
  );
}

function CheckedRowCount() {
  const { rows, columns } = useContext(CellRendererContext);

  let count = 0;

  const treeNode = columns?.find?.((c) => c.dataType === 'treeNode');

  if (treeNode && rows?.length) {
    for (const row of rows) {
      if (row?.fields?.[treeNode.uuid]?.checked) {
        count += 1;
      }
    }
  }

  if (!count) {
    return null;
  }

  return (
    <div style={{ marginLeft: '54px', color: '#1890ff', fontWeight: 'bold' }}>
      已选中
      {count}
      行
    </div>
  );
}

function SaveEventDisplay() {
  // state:
  // 0: 未保存
  // 1: 正在保存
  // 2: 保存成功
  // 3: 保存失败
  const [state, setState] = useState(0);

  function onAutoSaveTableStart(e) {
    setState(1);
  }

  function onAutoSaveTableDone(e) {
    setState(2);
  }

  function onAutoSaveTableFailed(e) {
    setState(3);
  }

  function renderState() {
    if (state === 2) {
      return <span className="text success">保存成功</span>;
    } if (state === 3) {
      return <span className="text failure">保存失败</span>;
    }
    return null;
  }

  useEffect(() => {
    window.addEventListener('autoSaveTableStart', onAutoSaveTableStart);
    window.addEventListener('autoSaveTableDone', onAutoSaveTableDone);
    window.addEventListener('autoSaveTableFailed', onAutoSaveTableFailed);

    return () => {
      window.removeEventListener('autoSaveTableStart', onAutoSaveTableStart);
      window.removeEventListener('autoSaveTableDone', onAutoSaveTableDone);
      window.removeEventListener('autoSaveTableFailed', onAutoSaveTableFailed);
    };
  }, []);

  return (
    <div className="table-save-event-display">
      {renderState()}
    </div>
  );
}

function TestButton() {
  return (
    <DropdownButton target="TestPanel" placement="bottom">
      <div className="table-tool-button">
        <a>
          <span className="icon"><icons.IconConfig /></span>
          <span className="text">测试工具</span>
        </a>
      </div>
    </DropdownButton>
  );
}

function ConfigButton() {
  return (
    <DropdownButton target="ConfigPanel" placement="bottom">
      <div className="table-tool-button">
        <a>
          <span className="icon"><icons.IconConfig /></span>
          <span className="text">字段配置</span>
        </a>
      </div>
    </DropdownButton>
  );
}

function FilterButton() {
  const ref = useRef(null);

  const { options, columns } = useContext(CellRendererContext);

  let {
    conditions = [],
  } = options.filter || {};

  if (conditions.length > 0) {
    const allColumnUUIDs = new Set();

    for (const col of columns) {
      if (col.uuid) {
        allColumnUUIDs.add(col.uuid);
      }
    }

    conditions = conditions.filter((cond) => allColumnUUIDs.has(cond.colUUID));
  }

  let classActive = '';
  if (conditions.length > 0) {
    classActive = ' active-button';
  }

  return (
    <DropdownButton target="FilterPanel" placement="bottom">
      <div className={`table-tool-button${classActive}`}>
        <a onClick={(e) => e.preventDefault()}>
          <span className="icon"><icons.IconFilter /></span>
          <span className="text">过滤</span>
        </a>
      </div>
    </DropdownButton>
  );
}

function SortButton() {
  const ref = useRef(null);
  const { options } = useContext(CellRendererContext);
  const {
    sortKeys = [],
  } = options.sorting || {};

  let classActive = '';
  if (sortKeys.length > 0) {
    classActive = ' active-button';
  }

  return (
    <DropdownButton target="SortPanel" placement="bottom">
      <div className={`table-tool-button${classActive}`}>
        <a onClick={(e) => e.preventDefault()}>
          <span className="icon"><icons.IconSort /></span>
          <span className="text">排序</span>
        </a>
      </div>
    </DropdownButton>
  );
}

function SearchButton() {
  const [showInput, setShowInput] = useState(false);
  const [keywords, setKeyworks] = useState('');

  let compositing = false;

  function onChangeValue(value) {
    setKeyworks(value);
  }

  function onInputCompositionStart(e) {
    compositing = true;
  }

  function onInputCompositionUpdate(e) {
    compositing = true;
  }

  function onInputCompositionEnd(e) {
    compositing = false;
    onChangeValue(e.target.value);
  }

  function onInputChange(e) {
    if (!compositing) {
      onChangeValue(e.target.value);
    }
  }

  function onInputBlur() {
    compositing = false;
    if (keywords === '') {
      setShowInput(false);
    }
  }

  function onClickButton(e) {
    const elemSearchBox = e.target.closest('.search-box');
    if (!elemSearchBox) {
      return;
    }

    setShowInput(true);

    setTimeout(() => {
      const input = elemSearchBox.querySelector('input');
      input.focus();
    }, 10);
  }

  return (
    <div className="search-box">
      <div
        className="search-input"
        style={{ display: showInput ? 'flex' : 'none' }}
      >
        <Input
          placeholder="搜索..."
          autoComplete="off"
          onCompositionStart={onInputCompositionStart}
          onCompositionUpdate={onInputCompositionUpdate}
          onCompositionEnd={onInputCompositionEnd}
          onChange={onInputChange}
          onBlur={onInputBlur}
        />
      </div>
      <div
        className="table-tool-button"
        style={{ display: showInput ? 'none' : 'flex' }}
        onClick={onClickButton}
      >
        <span className="icon"><icons.IconSearch /></span>
        <span className="text">搜索</span>
      </div>
    </div>
  );
}

function MoreButton() {
  return (
    <DropdownButton target="MorePanel" placement="bottom">
      <div className="table-tool-button">
        <a onClick={(e) => e.preventDefault()}>
          <span className="icon"><icons.IconOmit /></span>
        </a>
      </div>
    </DropdownButton>
  );
}

export default function Toolbar() {
  const { tableInfo } = useContext(CellRendererContext);

  return (
    <div className="table-toolbar">
      <div className="left-part">
        <TableNameEditor />
        <CheckedRowCount />
      </div>
      <SaveEventDisplay />
      {/* <MultiClientMutexTool /> */}
      <div className="right-part">
        {
          tableInfo?.type ? null : <ConfigButton />
        }
        <FilterButton />
        <SortButton />
        {/*
        <SearchButton />
        */}
        <MoreButton />
      </div>
    </div>
  );
}
