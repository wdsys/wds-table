// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';

import React, {
  useState,
  useContext,
  useRef,
} from 'react';
import {
  CopyOutlined,
} from '@ant-design/icons';
import {
  message,
  Divider,
  Switch,
  Input,
  Modal,
  Select,
  Tree,
} from 'antd';

// import ztdf from 'ztdf-js';
import moment from 'moment';

import {
  InterfaceFunctionContext,
  CellRendererContext,
  LocalStateContext,
} from '../contexts';

import { PageContext } from '../../contexts';

import { DropdownButton } from '../MyDropdown';
import { confirm } from '../ConfirmDialog';
import * as icons from '../SvgIcons';
import * as utils from '../utils';
import * as globalUtils from '../../utils';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';
// import PurposeDropdown from '../../components/PurposeDropdown';
// import CopyReqSheet from '../../components/CopyReqSheet';

import { requirementStatus, currentCoorOrder } from '../DefaultData';
import { useTranslation } from 'react-i18next';
// import GlobalModalTree from '../../common/GlobalModalTree';
// import ReleaseTemplate from '../../common/modal/releaseTemplate';

const hasPermission = (role, allPermission, code, resourceUrls) => {
  const permissionIdsList = [];
  resourceUrls.forEach((item) => {
    const currentPermission = allPermission?.find?.(
      (item2) => item2.resource_url === item,
    )?.permissionIds || [];
    permissionIdsList.push(currentPermission);
  });
  // 观察者不能操作
  if ((typeof role === 'number' && role === 10)) {
    message.error('抱歉，您没有该权限');
    return false;
  }

  if ((typeof role === 'number' && role !== 0) || permissionIdsList.every((currentPermission) => currentPermission.includes(code))) {
    return true;
  }
  message.error('抱歉，您没有此权限');
  return false;
};
function isDate(str) {
  if (str instanceof Date) return true;
  if (typeof str !== 'string') return false;
  const dateRegex = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
  return dateRegex.test(str);
}
const dynamicRefObj = {};
function MorePanel(props, ref) {
  const {
    onParseExcelFile,
    onRefreshTable,
    onRemoveTable,
    getTableTemplates,
    getTableTemplateData,
    saveTable,
  } = useContext(InterfaceFunctionContext);
  const {
    options,
    setOptions,
    columns,
    setColumns,
    rows,
    setRows,
    requirementSetUUID,
    tableUUID,
    tableInfo,
  } = useContext(CellRendererContext);

  const {t} = useTranslation();

  const userId = localStorage.getItem('userid');

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 240,
    minHeight: 400,
  });

  useToggleablePanel(ref, setPanelState);
  const releaseModalRef = useRef(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [templates, setTemplates] = useState([]);
  const treeRef = useRef();
  const tableLocked = options.lockFullTable;
  const headLocked = tableLocked || options.lockTableHead;

  function handleOk() {
    setIsModalVisible(false);
    setTemplates([]);
  }

  function handleCancel() {
    setIsModalVisible(false);
    setTemplates([]);
  }

  function closeMorePanel() {
    setPanelState((oldState) => ({
      ...oldState,
      visible: false,
    }));
  }

  async function onClickCopyLink() {
    try {
      let currentHref = window.location.href;
      // 如地址栏不包含sheet的uuid，则手动赋值后进行复制
      if (!currentHref.includes('/tables/')) {
        currentHref += `/tables/${options?.uuid}`;
      }
      await utils.writeTextToClipboard(currentHref);
      message.success('表格链接已复制到剪贴板');
    } catch (err) {
      message.error(`无法复制到剪贴板: ${err}`);
    } finally {
      closeMorePanel();
    }
  }

  const [isJSONModalVisible, setIsJSONModalVisible] = useState(false);
  const [jsonData, setJSONData] = useState('');

  function onClickShowJSON() {
    const data = {
      options,
      columns,
      rows,
    };
    if (rows.length > 2000) {
      setJSONData('文件过大，暂不支持查看！');
      setIsJSONModalVisible(true);
      return;
    }
    const json = JSON.stringify(data, null, '  ');

    setIsJSONModalVisible(true);
    setJSONData(json);
  }

  function handleJSONModalOk() {
    setIsJSONModalVisible(false);
  }

  function handleJSONModalCancel() {
    setIsJSONModalVisible(false);
  }

  async function onClickUseTemplate() {
    if (!getTableTemplates) {
      return;
    }
    releaseModalRef.current.show();

    // setIsModalVisible(true);
    // if (treeRef?.current) {
    //   treeRef.current.refreshData();
    // }
  }

  async function onChooseTemplate(t) {
    console.log('onChooseTemplate:', t);
    if (t.nodeType !== 'sheet') return;
    setIsModalVisible(false);
    setTemplates([]);
    closeMorePanel();

    if (!getTableTemplateData) {
      return;
    }
    const data = await getTableTemplateData(t);
    console.log('getTableTemplateData:', data);
    setColumns(data);
  }

  // 将表格数据导出为excel
  async function onClickExportExcel() {
    closeMorePanel();

    const event = new CustomEvent('exportCurrentSheet', { detail: { tableInfo } });
    window.dispatchEvent(event);
    // 102 导出权限
    // const canExport = hasPermission(userRole, permission, 102, [`/projects/${projectId}`]);
    // if (!canExport) return;

    // const doc = {
    //   options,
    //   columns,
    //   rows,
    // };
    // const json = JSON.stringify(doc, null, 2);
    // let tableName = 'table';
    // const tab = document.querySelector('.bottom-tabs-bar .ant-tabs-tab-active .tab-title');
    // if (tab) {
    //   const tabText = tab.innerText.trim();
    //   if (tabText.length > 0) {
    //     tableName = tabText;
    //   }
    // }

    // const fileName = `${tableName}.${options.uuid}.xlsx`;
    // window.postMessage({
    //   type: 'exportExcel',
    //   payload: {
    //     data: {
    //       name: fileName,
    //       data: json,
    //       tableName,
    //     },
    //   },
    // }, '*');
  }

  // async function onClickExport() {
  //   closeMorePanel();
  //   // 102 导出权限
  //   const canExport = hasPermission(userRole, permission, 102, [`/projects/${projectId}`]);
  //   if (!canExport) return;

  //   const doc = {
  //     options,
  //     columns,
  //     rows,
  //   };

  //   const json = JSON.stringify(doc, null, 2);

  //   const res = await ztdf.dump(json, {
  //     serialize: {
  //       method: 'none',
  //     },
  //     keygen: {
  //       passwordType: -1,
  //     },
  //   });

  //   const uint8Arrays = [
  //     res.headerData,
  //     res.metadataData,
  //     res.encryptedData,
  //   ];

  //   const blob = new Blob(uint8Arrays, { type: 'application/octet-stream' });
  //   const url = window.URL.createObjectURL(blob);

  //   let tableName = 'table';
  //   const tab = document.querySelector('.bottom-tabs-bar .ant-tabs-tab-active .tab-title');
  //   if (tab) {
  //     const tabText = tab.innerText.trim();
  //     if (tabText.length > 0) {
  //       tableName = tabText;
  //     }
  //   }

  //   const fileName = `${tableName}.${options.uuid}.wdt`;

  //   const link = document.createElement('a');
  //   link.href = url;
  //   link.setAttribute('download', fileName);

  //   document.body.appendChild(link);
  //   link.click();
  //   link.remove();
  //   window.URL.revokeObjectURL(url);
  // }

  async function doImportJSON(text) {
    let doc;

    try {
      doc = JSON.parse(text);
    } catch (err) {
      console.error(err);
      message.error(`无法解析JSON字符串: ${err}`);
      return;
    }

    if (!doc) {
      message.error('数据为空，导入失败');
      return;
    }

    utils.regenerateAllUUIDsInDoc({ doc });

    if (doc.options) {
      doc.options.uuid = options.uuid;
      setOptions(doc.options);
    }

    if (doc.columns) {
      setColumns(doc.columns);
    }

    if (doc.rows) {
      setRows(doc.rows);
    }
  }

  async function doImportJSONFile(file) {
    let text;

    try {
      text = await utils.readLocalFile(file, 'text');
    } catch (err) {
      console.error(err);
      return;
    }

    await doImportJSON(text);
  }

  async function doImportExcelFile(file) {
    if (!onParseExcelFile) {
      return;
    }
    message.loading('解析中...');
    const workbook = await onParseExcelFile(file);
    message.destroy();
    // console.log('workbook:', workbook);
    let worksheet;
    if (workbook.length === 1) {
      [worksheet] = workbook;
    } else if (workbook.length > 1) {
      [worksheet] = workbook;
    }

    if (!Array.isArray(worksheet?.data)
      || !Array.isArray(worksheet.data[0]
        || worksheet.data[0].length < 1)) {
      return;
    }

    const excelColumns = [];
    for (const columnName of worksheet.data[0]) {
      excelColumns.push({
        name: isDate(columnName)
          ? moment(columnName).format('YYYY-MM-DD') : columnName,
      });
    }

    setColumns((oldColumns) => {
      const map = new Map();
      for (const col of oldColumns) {
        map.set(col.name, col);
      }

      const newColumns = [...oldColumns];
      for (let i = 0; i < excelColumns.length; i += 1) {
        const item = excelColumns[i];
        if (map.has(item.name)) {
          Object.assign(item, map.get(item.name));
        } else {
          const secondLineValue = worksheet.data[1]?.[i];
          if (isDate(secondLineValue)) {
            item.dataType = 'date';
          } else {
            item.dataType = 'text';
          }
          item.uuid = uuidv4();
          item.width = 120;
          newColumns.push(item);
        }
      }

      return newColumns;
    });

    const newRowCount = worksheet.data.length - 1;
    if (newRowCount > 0) { // it has rows data
      for (let j = 0; j < excelColumns.length; j += 1) {
        const col = excelColumns[j];
        if (!col.rows) {
          col.rows = [];
        }

        for (let i = 0; i < newRowCount; i += 1) {
          let value = worksheet.data[i + 1][j];
          value = isDate(value) ? moment(value).format('YYYY-MM-DD') : value;
          col.rows.push(value);
        }
      }

      setRows((oldData) => {
        const newData = [...oldData];

        for (let i = 0; i < newRowCount; i += 1) {
          const fields = {};
          for (const col of excelColumns) {
            const colUUID = col.uuid;
            const { dataType } = col;
            const rawValue = col.rows[i];
            if (dataType === 'text') {
              if (rawValue === undefined || rawValue === null) {
                fields[colUUID] = '';
              } else {
                fields[colUUID] = `${rawValue}`.trim();
              }
            } else if (dataType === 'number') {
              fields[colUUID] = parseFloat(rawValue);
            } else if (dataType === 'treeNode') {
              fields[colUUID] = {
                level: 0,
                closed: false,
              };

              if (rawValue === undefined || rawValue === null) {
                fields[colUUID].text = '';
              } else {
                fields[colUUID].text = `${rawValue}`.trim();
              }
            } else if (dataType === 'date' && rawValue) {
              fields[colUUID] = rawValue;
            }
          }

          const newRow = {
            uuid: uuidv4(),
            fields,
          };

          newData.push(newRow);
        }

        return newData;
      });
    }
  }

  // async function doImportWDTFile(file) {
  //   let data;

  //   try {
  //     data = await utils.readLocalFile(file, 'arrayBuffer');
  //   } catch (err) {
  //     console.error(err);
  //     message.error(`无法读取文件: ${err}`);
  //     return;
  //   }

  //   let text;

  //   try {
  //     const res = await ztdf.load(data, {
  //       keygen: {
  //         passwordType: -1,
  //       },
  //     });

  //     text = new TextDecoder('utf-8').decode(res.payload);
  //   } catch (err) {
  //     console.error(err);
  //     message.error(`无法解析WDT文件内容: ${err}`);
  //     return;
  //   }

  //   await doImportJSON(text);
  // }

  function onClickImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json, .xls, .xlsx, .wdt';

    input.addEventListener('input', () => {
      const file = input.files[0];
      if (!file) {
        return;
      }

      // console.log('read file:', file);
      if (file.name.endsWith('.json')) {
        doImportJSONFile(file);
      } else if (file.name.endsWith('.xls')
        || file.name.endsWith('.xlsx')) {
        doImportExcelFile(file);
      } 
      // else if (file.name.endsWith('.wdt')) {
      //   // doImportWDTFile(file);
      // } 
      else {
        message.error('文件类型错误');
      }
    });

    document.body.appendChild(input);
    input.click();
    input.remove();
  }

  function onChangeLockTableHead(checked) {
    setOptions((oldOptions) => ({
      ...oldOptions,
      lockTableHead: checked,
    }));
  }

  function onChangeLockFullTable(checked) {
    setOptions((oldOptions) => {
      const newOptions = {
        ...oldOptions,
        lockFullTable: checked,
        lockTableHead: checked, // 自动锁定/解锁表头
      };

      return newOptions;
    });
  }

  function onChangeTHLineWrap(checked) {
    setOptions((oldOptions) => ({
      ...oldOptions,
      thLineWrap: checked,
    }));
  }

  function onChangeLineWrap(checked) {
    setOptions((oldOptions) => ({
      ...oldOptions,
      lineWrap: checked,
    }));
  }

  function addRowIndexColumn() {
    setColumns((oldColumns) => {
      const newCol = {
        name: 'No.',
        dataType: 'rowIndex',
        uuid: uuidv4(),
        width: 60,
      };

      return [newCol, ...oldColumns];
    });
  }

  function removeRowIndexColumn() {
    setColumns((oldColumns) => oldColumns.filter((c) => c.dataType !== 'rowIndex'));
  }

  function onChangeRowIndex(checked) {
    setOptions((oldOptions) => ({
      ...oldOptions,
      rowIndex: checked,
    }));

    if (checked) {
      addRowIndexColumn();
    } else {
      removeRowIndexColumn();
    }
  }

  function onChangeSerialNumber(checked) {
    if (checked) {
      const event = new CustomEvent('addSerialNumber');
      window.dispatchEvent(event);
    } else {
      const event = new CustomEvent('removeSerialNumber');
      window.dispatchEvent(event);
    }
  }

  function onClickRefreshTable() {
    if (onRefreshTable) {
      onRefreshTable(options);
    }

    closeMorePanel();
  }

  async function onClickRemoveAllRows() {
    if (!(await confirm(t('delete.all.row.confirm')))) {
      return;
    }
      setRows([]);

    closeMorePanel();
  }

  function onClickRemoveTable() {
    if (onRemoveTable) {
      onRemoveTable(options);
    }

    closeMorePanel();
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="table-config-overlay">
        <div className="all-columns">
          {/* <div className="one-column-box">
            <div className="one-column" onClick={onClickCopyLink}>
              <div className="icon">
                <icons.IconCopy />
              </div>
              <div className="name">
                复制访问链接
              </div>
            </div>
          </div> */}

          <div className="one-column-box">
            <div className="one-column" onClick={onClickShowJSON}>
              <div className="icon">
                <icons.IconCopy />
              </div>
              <div className="name">
                {t('check json')}
              </div>
            </div>
          </div>
        </div>

        {
          (!headLocked && !tableInfo?.type) ? <Divider /> : null
        }

        <div className="all-columns">

          {
            (!headLocked && !tableInfo?.type) ? (
              <div className="one-column-box">
                <DropdownButton target="ConfigPanel" placement="left">
                  <div className="one-column">
                    <div className="icon">
                      <icons.IconConfig />
                    </div>
                    <div className="name">
                      {t('field config')}
                    </div>
                  </div>
                </DropdownButton>
              </div>
            ) : null
          }

          {/*
          <div className="one-column-box">
            <DropdownButton target="FilterPanel" placement="left">
              <div className="one-column">
                <div className="icon">
                  <icons.IconFilter />
                </div>
                <div className="name">
                  过滤...
                </div>
              </div>
            </DropdownButton>
          </div>

          <div className="one-column-box">
            <DropdownButton target="SortPanel" placement="left">
              <div className="one-column">
                <div className="icon">
                  <icons.IconSort />
                </div>
                <div className="name">
                  排序...
                </div>
              </div>
            </DropdownButton>
          </div>
          */}

        </div>

        {(!tableInfo?.type) ? (
          <Divider />
        ) : null}

        {(!tableInfo?.type) ? (
          <div className="all-columns">

            {/* <div className="one-column-box">
              <div className="one-column">
                <div className="name">
                  {t('lock all table')}
                </div>
                <div className="visible">
                  <Switch
                    size="small"
                    checked={!!options.lockFullTable}
                    onChange={onChangeLockFullTable}
                  />
                </div>
              </div>
            </div> */}

            {/* {
              !options.lockFullTable
              && (
                <div className="one-column-box">
                  <div className="one-column">
                    <div className="name">
                      {t('lock table head')}
                    </div>
                    <div className="visible">
                      <Switch
                        size="small"
                        checked={!!options.lockTableHead}
                        onChange={onChangeLockTableHead}
                      />
                    </div>
                  </div>
                </div>
              )
            } */}

            {
              !headLocked
              && (
                <div className="one-column-box">
                  <div className="one-column">
                    <div className="name">
                      {t('table head wrap')}
                    </div>
                    <div className="visible">
                      <Switch
                        size="small"
                        checked={!!options.thLineWrap}
                        onChange={onChangeTHLineWrap}
                      />
                    </div>
                  </div>
                </div>
              )
            }

            {/*
          <div className="one-column-box">
            <div className="one-column">
              <div className="name">
                自动换行
              </div>
              <div className="visible">
                <Switch size="small" checked={!!options.lineWrap}
                  onChange={onChangeLineWrap}
                />
              </div>
            </div>
          </div>
          */}

            {
              !headLocked
              && (
                <div className="one-column-box">
                  <div className="one-column">
                    <div className="name">
                      {t('show no')}
                    </div>
                    <div className="visible">
                      <Switch
                        size="small"
                        checked={!!options.rowIndex}
                        onChange={onChangeRowIndex}
                      />
                    </div>
                  </div>
                </div>
              )
            }

            {
              !headLocked
              && (
                <div className="one-column-box">
                  <div className="one-column">
                    <div className="name">
                      {t('show code')}
                    </div>
                    <div className="visible">
                      <Switch
                        size="small"
                        checked={!!options.serialNumber}
                        onChange={onChangeSerialNumber}
                      />
                    </div>
                  </div>
                </div>
              )
            }

          </div>
        ) : null}

        <Divider />

        <div className="all-columns">
          {/* {
            tableInfo?.type === 2 ? (
              <div className="one-column-box">
                <div className="one-column-box">
                  <div className="one-column" onClick={onClickExportExcel}>
                    <div className="icon">
                      <icons.IconDownloadExcel />
                    </div>
                    <div className="name">
                      导出xlsx表格
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          } */}
          {
            !tableInfo?.type ? ( // 虚拟表也包含导出功能
              <>
                {/* <div className="one-column-box">
                  <div className="one-column" onClick={onClickRefreshTable}>
                    <div className="icon">
                      <icons.IconRefresh />
                    </div>
                    <div className="name">
                      重新加载表格
                    </div>
                  </div>
                </div> */}

                {/* <div className="one-column-box">
                  <div className="one-column" onClick={onClickExport}>
                    <div className="icon">
                      <icons.IconDownload />
                    </div>
                    <div className="name">
                      导出数据表格
                    </div>
                  </div>
                </div> */}

                {/* <div className="one-column-box">
                  <div className="one-column" onClick={onClickExportExcel}>
                    <div className="icon">
                      <icons.IconDownloadExcel />
                    </div>
                    <div className="name">
                      导出xlsx表格
                    </div>
                  </div>
                </div> */}

                {
                  !headLocked
                  && (
                    <div className="one-column-box">
                      <div className="one-column" onClick={onClickImport}>
                        <div className="icon">
                          <icons.IconUpload />
                        </div>
                        <div className="name">
                          {t('import table')}
                        </div>
                      </div>
                    </div>
                  )
                }
              </>
            ) : null
          }

          {
            (!tableLocked && !tableInfo?.type) ? (
              <div className="one-column-box">
                <div className="one-column" onClick={onClickRemoveAllRows}>
                  <div className="icon">
                    <icons.IconDelete />
                  </div>
                  <div className="name">
                    {t('delete all rows')}
                  </div>
                </div>
              </div>
            ) : null
          }

        </div>

        <Modal
          title="查看JSON"
          width={800}
          open={isJSONModalVisible}
          onOk={handleJSONModalOk}
          onCancel={handleJSONModalCancel}
        >
          <Input.TextArea value={jsonData} autoSize style={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }} />
        </Modal>
        {/* <Modal
          title="选择表格模版"
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
        >
          <div style={{
            maxHeight: '70vh',
            overflow: 'auto',
          }}
          >
            <GlobalModalTree callBack={{ treeDataMap }} ref={treeRef} onSelect={onChooseTemplate} />
          </div>
        </Modal> */}

      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(MorePanel);
