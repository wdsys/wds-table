// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';
import React, { useEffect } from 'react';

import {
  Input,
  Button,
  Divider,
  message
} from 'antd';

import {
  PlusOutlined
} from '@ant-design/icons';

import { RiArrowGoBackLine, RiArrowGoForwardLine } from "react-icons/ri";

import { useTranslation } from 'react-i18next';

import { CellRendererContext } from './contexts';
// import { MultiClientMutexTool } from './MultiClientMutexTool';
import { DropdownButton } from './MyDropdown';
import HanziInput from './HanziInput';
import historyManager from './history';
import filterRow from './RowFilter';
import * as utils from './utils';
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

function SaveEventDisplay() {
  // state:
  // 0: 未保存
  // 1: 正在保存
  // 2: 保存成功
  // 3: 保存失败
  const [state, setState] = useState(0);
  const {t} = useTranslation();

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
      return <span className="text success">{t('save succcess')}</span>;
    } if (state === 3) {
      return <span className="text failure">{t('save fail')}</span>;
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
  const {t} = useTranslation();
  return (
    <DropdownButton target="ConfigPanel" placement="bottom">
      <div className="table-tool-button">
        <a>
          <span className="icon"><icons.IconConfig /></span>
          <span className="text">{t('field config')}</span>
        </a>
      </div>
    </DropdownButton>
  );
}

function FilterButton() {
  const ref = useRef(null);
  const {t} = useTranslation();

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
          <span className="text">{t('filter')}</span>
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
  const {t} = useTranslation();

  let classActive = '';
  if (sortKeys.length > 0) {
    classActive = ' active-button';
  }

  return (
    <DropdownButton target="SortPanel" placement="bottom">
      <div className={`table-tool-button${classActive}`}>
        <a onClick={(e) => e.preventDefault()}>
          <span className="icon"><icons.IconSort /></span>
          <span className="text">{t('sort')}</span>
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

function handleTableBackBottom() {
  const event = new CustomEvent('backToTableBottom');
  window.dispatchEvent(event);
}

function collectFoldedRowUUIDs(columns, rows) {
  const result = new Set();

  const roots = utils.createTreeFromTable(columns, rows);

  for (const row of rows) {
    const node = utils.findTreeNodeInRoots(roots, row.uuid);
    if (node && !utils.isTreeNodeVisible(node)) {
      result.add(row.uuid);
    }
  }

  return result;
}

function NewLineButton(){

  const { setRows, columns, options, pagerState, rows,
    setPagerState } = useContext(CellRendererContext);

  function onClick(){

    const foldedRowUUIDs = collectFoldedRowUUIDs(columns, rows);

    const filteredRowUUIDs = new Set();
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      // If the row is folded, skip it.
      if (foldedRowUUIDs.has(row.uuid)) {
        continue;
      }
  
      const filterTrue = filterRow(options.filter, row, columns);
      if (filterTrue) {
        // If the row matches the filters, collect it.
        filteredRowUUIDs.add(row.uuid);
      }
    }
  
    const visibleRows = [];
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (filteredRowUUIDs.has(row.uuid)) {
        visibleRows.push(row);
      }
    }
    const visibleRowCount = visibleRows.length;
    const pages = Math.ceil(visibleRowCount / pagerState.pageSize);
    if(pages === pagerState.page){
      handleTableBackBottom();
      setTimeout(()=>{
        utils.appendNewRow(setRows, columns);
      }, 0)
    }else{
      setPagerState(p=>({...p, page: pages}))
      setTimeout(()=>{
        handleTableBackBottom();
        setTimeout(()=>{
          utils.appendNewRow(setRows, columns);
        }, 0)
      }, 0)
    }

    // 有过滤条件，可能会引发新增行被隐藏情况
    if (options?.filter?.conditions?.length) {
      message.info('当前表格存在过滤条件，新增行可能被隐藏。');
    }
  }

  return (
  <div className="table-tool-button" style={{color: '#1890ff'}} onClick={onClick}>
    <a>
      <PlusOutlined className="icon" style={{fontSize: '14px', marginTop: '-1px'}} />
      <span className="text" style={{color: '#1890ff'}}>添加记录</span>
    </a>
  </div>
  )
}

function BackAndForword(){

  // const forwordDisabled = historyManager.TableStackState.cursor >= -1;

  function goForward(){
    const event = new Event('redo');
    window.dispatchEvent(event);
  }

  function goBack(){
    const event = new Event('undo');
    window.dispatchEvent(event)
  }

  // const backDisabled = 
  

  return (
    <>
      <RiArrowGoBackLine 
       onClick={goBack}
       className="table-tool-button" style={{cursor: 'pointer'}} />
      <RiArrowGoForwardLine 
       onClick={goForward}
       className="table-tool-button" style={{cursor: 'pointer'}} />
    </>
  )
}

function PatchAction(){
  return (
    <DropdownButton target='PatchActionsPanel' placement='bottom'>
      <div className="table-tool-button">
        <a>
          <span className="icon"><icons.IconPatchSelect/></span>
          <span className="text">批量选择</span>
        </a>
      </div>
    </DropdownButton>
  )
}

function LevelChanger(){
  return (
    <DropdownButton target='LevelChangePanel' placement='bottom'>
      <div className="table-tool-button">
        <a>
        <span className="icon"><icons.IconLevelChanger/></span>
          <span className="text">层级</span>
        </a>
      </div>
    </DropdownButton>
  )
}

export default function Toolbar() {
  const { tableInfo } = useContext(CellRendererContext);

  return (
    <div className="table-toolbar">
      <div className="left-part">
        <NewLineButton />
        <Divider type='vertical' style={{marginInline: '4px', borderInlineStart: '2px solid #e7e7e7', height: '1.1em'}} />
        <BackAndForword />
        {
          tableInfo?.type ? null : <ConfigButton />
        }
        <PatchAction />
        <LevelChanger />
      </div>
      <SaveEventDisplay />
      {/* <MultiClientMutexTool /> */}
      <div className="right-part">
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
