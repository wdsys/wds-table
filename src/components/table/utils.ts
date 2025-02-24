// @ts-nocheck
import axios from 'axios';
import XLSXST from 'xlsx-js-style';

// eslint-disable-next-line import/extensions, import/no-unresolved
import ParseWorker from './workers/parseXLSX.js?worker';
// References:
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator
// https://segmentfault.com/a/1190000041234794
const Collator = Intl.Collator('zh-Hans-CN', { sensitivity: 'accent' });

export function isInt(str) {
  return /^\d+$/.test(str);
}

export function isNumber(str) {
  return /^[+-]?\d+(\.\d*)?$/.test(str);
}

export function isASCII(str, extended = false) {
  return (extended ? /^[\x00-\xFF]*$/ : /^[\x00-\x7F]*$/).test(str);
}

/**
 * Compare item names by numerical/ASCII/unicode order.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareItemNames(sa, sb) {
  const a = sa.trim();
  const b = sb.trim();

  /* eslint-disable no-restricted-globals */
  const partsA = a?.split('-')?.[0]?.split('.')?.map(Number)?.filter?.((i) => !isNaN(i));
  const partsB = b?.split('-')?.[0]?.split('.')?.map(Number)?.filter?.((i) => !isNaN(i));

  // 如果有编码排序，则使用该规则
  if (partsA?.length && partsB?.length) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;

      if (numA !== numB) {
        return numA - numB;
      }
    }
  }

  // Sort numbers before letters
  const aIsInt = isInt(a);
  const bIsInt = isInt(b);
  if (aIsInt && bIsInt) {
    return parseInt(a, 10) - parseInt(b, 10);
  } if (aIsInt && !bIsInt) {
    return -1;
  } if (!aIsInt && bIsInt) {
    return 1;
  }

  // Sort latin letters before international characters
  const aIsASCII = isASCII(a);
  const bIsASCII = isASCII(b);
  if (aIsASCII && bIsASCII) {
    // Sort by ASCII order
    if (a === b) {
      return 0;
    } if (a < b) {
      return -1;
    }
    return 1;
  } if (aIsASCII && !bIsASCII) {
    return -1;
  } if (!aIsASCII && bIsASCII) {
    return 1;
  }

  // Sort by locale
  const localeCompareResult = Collator.compare(a, b);
  if (localeCompareResult !== 0) {
    return localeCompareResult;
  }

  return localeCompareResult;
}

export async function delay(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

export function addOneTab(oldState, item) {
  const {
    panes: oldPanes,
    activeKey: oldActiveKey,
  } = oldState;

  let alreadyOpen = false;
  for (const pane of oldPanes) {
    if (pane.uuid === item.uuid) {
      alreadyOpen = true;
      break;
    }
  }

  if (alreadyOpen) {
    return {
      panes: oldPanes,
      activeKey: `${item.uuid}`,
    };
  }
  // console.log('addOneTab:', item);
  const newPane = {
    key: item.uuid,
    title: item.name,
    ...item, // id, uuid
  };

  return {
    panes: [...oldPanes, newPane],
    activeKey: `${item.uuid}`,
  };
}

export function removeOneTab({ panes, activeKey }, targetKey) {
  const newTabs = [];
  let index = -1; // targetKey index in panes
  let newItem = null; // new activeKey item

  for (let i = 0; i < panes.length; i += 1) {
    const entry = panes[i];
    if (entry.key === targetKey) {
      index = i;
    } else {
      newTabs.push(entry);
    }
  }

  if (newTabs.length > 0) {
    if (index === -1) {
      [newItem] = newTabs; // first item
    } else if (index + 1 <= newTabs.length) {
      newItem = newTabs[index];
    } else {
      newItem = newTabs[newTabs.length - 1]; // last item
    }
  }

  return {
    panes: newTabs,
    activeKey: newItem?.key,
  };
}

export function pushStateOfRequirement(req) {
  const projectId = req?.project_id;
  const requirementUUID = req?.uuid;
  if (!(projectId && requirementUUID)) {
    return;
  }

  const url = `/projects/${projectId}/requirements/${requirementUUID}`;
  const state = { pathname: url };
  window.history.pushState(state, '', url);
}

export function findURLParameter(url) {
  // eslint-disable-next-line no-param-reassign
  url = url || window.location.href;
  const ary = url.split('/');
  const obj = ary.reduce((pre, current, currentIndex, list) => {
    if (current && currentIndex + 1) {
      // eslint-disable-next-line no-param-reassign
      pre[current] = list[currentIndex + 1];
    }
    return pre;
  }, {});
  return obj;
}
export function pushStateOfTable(table) {
  const projectId = table?.requirementSet?.project_id;
  const requirementUUID = table?.requirementSet?.uuid;
  const tableUUID = table?.uuid;
  if (!(projectId && requirementUUID && tableUUID)) {
    return;
  }
  const url = `/projects/${projectId}/requirements/${requirementUUID}/tables/${tableUUID}`;
  const state = { pathname: url };
  window.history.pushState(state, '', url);
}
// 遍历出所有表中的引用需求所在的需求表
export function lookupReqLinkedTable(data) {
  // 已有表数据的uuid
  const existingTable = data.map((item) => item.uuid);
  // 需要请求的表
  const paramsTables = [];
  const reg = /tables\/.*?\/rows/g;

  for (const table of data) {
    const urls = table.result?.match(reg) || [];
    for (const url of urls) {
      const uuid = url.replace(/(tables\/|\/rows)/g, '');
      if (!existingTable.includes(uuid)) {
        if (!paramsTables.includes(uuid)) {
          paramsTables.push(uuid);
        }
      }
    }
  }

  return paramsTables;
}

// 获取url参数

export function blobToJson(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const jsonString = reader.result;
        const json = JSON.parse(jsonString);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

// 预览文件

// 获取系统
const getSystem = () => {
  const url = 'http://127.0.0.1:12500/api/system/type';
  return axios({
    url,
    method: 'get',
  });
};
// 获取当前环境的文件位置
const getEnv = async (name) => {
  const url = `http://127.0.0.1:12500/api/system/env/${name}`;
  return axios({
    url,
    method: 'get',
  });
};
// 读取文件
const writeFile = async (data) => {
  const url = 'http://127.0.0.1:12500/api/fs/write_file';
  return axios({
    url,
    hearders: {
      'Content-Type': 'multipart/form-data',
    },
    method: 'post',
    data,
  });
};
// 预览文件
const openFile = async (data) => {
  const url = `http://127.0.0.1:12500/api/shell/open_file?path=${data}`;
  return axios({
    url,
    method: 'post',
  });
};

// 预览文件
export async function previewFile(file, blob) {
  const form = new FormData();
  const system = await getSystem();
  console.log(`系统类型：${system.data.result}`);
  let url = '';
  if (system.data.result === 'windows') {
    let res = {};
    res = await getEnv('TEMP');
    url = res.data.result;
    if (url === '') {
      res = await getEnv('TMP');
    }
  } else if (system.data.result === 'linux') {
    let res = {};
    res = await getEnv('HOME');
    url = res.data.result;
  }
  form.append('path', `${url}\\${file.name}`);
  form.append('file', blob, file?.name);
  writeFile(form).then((res) => {
    console.log(res);
    openFile(`${url}\\${file.name}`);
  });
}

export function encodeNumberReqTree(treeData = []) {
  const regex = /^[\d.]+-/;

  const numberTreeData = [...treeData];
  function mapTreeData(list, code = '') {
    let num = 1;
    for (const item of list) {
      if (item.type !== 2) {
        item.title = `${code + num}-${item.title?.replace(regex, '')}`;
        if (item?.children?.length) {
          mapTreeData(item?.children, `${code + num}.`);
        }
        num += 1;
      }
    }
  }
  mapTreeData(numberTreeData, '');

  return numberTreeData;
}

export function getChildUUIDByParent(treeData = [], parentUUID = null) {
  const regex = /^[\d.]+-/;

  const numberTreeData = [...treeData];
  const childUUIDs = [];
  function mapTreeData(list) {
    for (const item of list) {
      if (item.id === parentUUID) {
        for (const i of (item?.children || [])) {
          childUUIDs.push(i.uuid);
        }
        break;
      } else if (item?.children?.length) {
        mapTreeData(item?.children);
      }
    }
  }

  if (parentUUID) {
    mapTreeData(numberTreeData, '');
  } else {
    for (const item of numberTreeData) {
      childUUIDs.push(item.uuid);
    }
  }
  return childUUIDs;
}
function sortFolderAndReqset(a, b) {
  if (b.nodeType === 'folder' && a.nodeType === 'reqset') {
    return 1;
  }

  if (a.nodeType === 'folder' && b.nodeType === 'reqset') {
    return -1;
  }

  return 0;
}

export function sortAndEncodeReqTree(treeData, node, dragNode, parentId) {
  const isChild = node.id === parentId;
  const regex = /^[\d.]+-/;

  function mapTreeData(list, code = '', isEdit = false) {
    let num = 1;
    return list.map((item) => {
      const newCode = `${code}${num}`;
      item.title = `${newCode.replace(/^(1.)/, '')}-${item.title?.replace(regex, '')}`;

      if (item.id === parentId) {
        if (item?.children?.length) {
          const childrens = [];

          if (isChild) { // 子集，放置第一位
            childrens.push(dragNode);
          }
          for (const i of item.children) {
            if (i.uuid === node.uuid) {
              childrens.push(i, dragNode);
            } else if (i.uuid !== dragNode.uuid) {
              childrens.push(i);
            }
          }
          childrens.sort(sortFolderAndReqset);
          item.children = mapTreeData(childrens, `${newCode}.`, true);
        }
      } else if (item?.children?.length) {
        mapTreeData(item?.children, `${newCode}.`, isEdit);
      }
      num += 1;

      return item;
    });
  }
  const newTreeData = mapTreeData([{ id: null, children: [...treeData] }], '');

  return newTreeData[0]?.children || [];
}

export function utcTimeStampToLocal(timeStamp) {
  if (typeof timeStamp !== 'number') return timeStamp;
  const offset = new Date().getTimezoneOffset();
  return timeStamp - offset * 60 * 1000;
}

function getTableData(table) {
  const {
    result, relatedRequirements, linkedRequirementObj, viewLinks,
  } = table;
  const { columns = [], rows = [] } = result ? JSON.parse(result) : {};
  const includesDataType = ['treeNode', 'text', 'number', 'select', 'multiSelect', 'checkbox', 'date', 'relatedRequirements', 'linkedRequirements', 'viewLinks'];
  // 'relatedRequirements', 'linkedRequirements'
  const tableData = []; // 表格内容
  const colStyles = []; // 表格列宽度

  const columnsId = [];
  // 添加表头
  const head = [];
  for (const item of columns) {
    if (includesDataType?.includes(item.dataType)) {
      head.push(item.name);
      columnsId.push(item.uuid);

      colStyles.push({ wpx: item?.width || 60 });
    }
  }
  tableData.push(head);

  // 表格内容
  for (const row of rows) {
    const { fields = {}, uuid } = row || {};
    const arr = [];
    for (const item of columns) {
      if (item.dataType === 'treeNode') {
        arr.push(fields[item?.uuid]?.text || '');
      } else if (['text', 'number', 'date']?.includes(item.dataType)) {
        arr.push(fields[item?.uuid] || '');
      } else if (['select', 'multiSelect']?.includes(item.dataType)) {
        const text = fields[item?.uuid]?.join?.('、');
        arr.push(text || '');
      } else if (item.dataType === 'checkbox') {
        arr.push(fields[item?.uuid] ? '是' : '否');
      } else if (item.dataType === 'relatedRequirements') {
        const relatedItems = [];

        for (const i of (fields[item?.uuid] || [])) {
          const relatedItem = relatedRequirements.find((j) => j.url === i);
          if (relatedItem) {
            relatedItems.push(relatedItem.name);
          }
        }
        const relatedTxt = relatedItems.join('、');
        arr.push(relatedTxt);
      } else if (item.dataType === 'linkedRequirements') {
        const linkedItems = linkedRequirementObj[uuid]?.map?.((i) => i.name) || [];
        const linkedTxt = linkedItems.join('、');
        arr.push(linkedTxt);
      } else if (item.dataType === 'viewLinks') {
        const viewLinkItems = viewLinks.find((i) => i.row_uuid === uuid)?.links || [];
        const viewLinkTxt = viewLinkItems.map((i) => i.name).join('、');
        arr.push(viewLinkTxt);
      }
    }

    tableData.push(arr);
  }

  return {
    colStyles,
    tableData,
  };
}

export function exportReqSheetExcel(table, infos) {
  const workbook = XLSXST.utils.book_new();
  // eslint-disable-next-line guard-for-in
  for (const ind in table) {
    const item = table[ind];

    const tableName = infos.find?.((i) => i.uuid === item.uuid)?.name || '无标题';

    const { tableData, colStyles } = getTableData(item);
    // 创建工作簿
    const worksheet = XLSXST.utils.json_to_sheet(tableData, { skipHeader: true });

    // 列宽
    worksheet['!cols'] = [...colStyles];

    XLSXST.utils.book_append_sheet(workbook, worksheet, `${tableName}(${Number(ind) + 1})`);
  }

  const excelBuffer = XLSXST.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // 创建下载链接并触发下载
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = 'tableData.xlsx';
  downloadLink.click();
}

export function parseXLSXWithWorker(file) {
  return new Promise((resolve, reject) => {
    const worker = new ParseWorker();

    worker.onmessage = (e) => {
      if (e.data?.type === 'finish') {
        worker.terminate();
        resolve(e.data.data);
      }
    };

    worker.postMessage({
      type: 'start',
      file,
    });
  });
}
