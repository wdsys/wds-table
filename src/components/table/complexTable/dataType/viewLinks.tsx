// @ts-nocheck
import React, {
  useContext,
} from 'react';

import {
  InterfaceFunctionContext,
  CellRendererContext,
  LocalStateContext,
} from '../contexts';

import TD from '../TD';
import { IconViewLinks } from '../SvgIcons';

function valueToClipboardString(value) {
  return value || '';
}

function valueFromClipboardString(str) {
  return str;
}

function ViewLinksItem(props) {
  const {
    index,
    item,
    otherProject,
    onClickLink,
  } = props;

  let className = `viewLinks-item viewLinks-item_${item.aspect}`;
  if (otherProject) {
    className += ' other-project';
  } else {
    className += ' same-project';
  }

  return (
    <div className={className}>
      <span className="icon"><IconViewLinks /></span>
      <span className="text" onClick={(e) => onClickLink(item, index)}>
        <span className="url" />
        <span className="name">{item.name || '无标题'}</span>
      </span>
    </div>
  );
}

/**
 * @param {String} modelPath: path of the related model
 * Example URL:
 * "/projects/725/code/functional/view/148/dataUrl/20230704134020267669/model/8863d43c-..."
 * Parsed object: {
 *   projectId: "725",
 *   aspect: "functional",
 *   viewId: "148",
 *   nodeId: "20230704134020267669",
 *   modelUUID: "8863d43c-cac8-4fea-a407-2a7e1ecde12e",
 * }
 */
export function parseModelPath(modelPath) {
  const parts = modelPath.split('/');
  let projectsIndex = -1;
  for (let i = 0; i < parts.length; i += 1) {
    if (parts[i] === 'projects') {
      projectsIndex = i;
      break;
    }
  }

  if (projectsIndex < 0) { // cannot find 'projects'
    return null;
  }

  const projectId = parts[projectsIndex + 1];
  if (projectId === '') {
    return null;
  }

  if (parts[projectsIndex + 2] !== 'code') {
    return null;
  }

  const aspect = parts[projectsIndex + 3];
  if (aspect === '') {
    return null;
  }

  if (parts[projectsIndex + 4] !== 'view') {
    return null;
  }

  const viewId = parts[projectsIndex + 5];
  if (viewId === '') {
    return null;
  }

  if (parts[projectsIndex + 6] !== 'dataUrl') {
    return null;
  }

  const nodeId = parts[projectsIndex + 7];
  if (nodeId === '') {
    return null;
  }

  if (parts[projectsIndex + 8] !== 'model') {
    return null;
  }

  const modelUUID = parts[projectsIndex + 9];
  if (modelUUID === '') {
    return null;
  }

  return {
    projectId,
    aspect,
    viewId,
    nodeId,
    modelUUID,
  };
}

/**
 * @param {String} url: URL of the related model
 * Example URL:
 * "https://dev.wiseverds.com/projects/725/code/functional/view/148/dataUrl/20230704134020267669/model/8863d43c-cac8-4fea-a407-2a7e1ecde12e"
 * Parsed object: {
 *   urlObject: JavaScript URL instance, optional
 *   projectId: "725",
 *   aspect: "functional",
 *   viewId: "148",
 *   nodeId: "20230704134020267669",
 *   modelUUID: "8863d43c-cac8-4fea-a407-2a7e1ecde12e",
 * }
 */
export function parseModelURL(str) {
  const isValidURL = (str.indexOf('://') > 0);
  if (isValidURL) {
    const urlObject = new URL(str);
    const modelPath = urlObject.pathname;
    const res = parseModelPath(modelPath);
    if (!res) {
      return null;
    }

    res.urlObject = urlObject;
    return res;
  }

  // It is not a valid URL, so it is a model path
  return parseModelPath(str);
}

function ViewLinksCellContent(props) {
  const {
    colUUID,
    rowUUID,
    locked,
  } = props;

  const {
    onOpenViewLink,
  } = useContext(InterfaceFunctionContext);

  const {
    projectId,
    requirementSetUUID,
    tableUUID,
  } = useContext(CellRendererContext);

  const {
    viewLinks,
  } = useContext(LocalStateContext);

  function onClickViewLinksItem(item, index) {
    onOpenViewLink(item);
  }

  const itemElems = [];
  let value = [];
  for (const entry of viewLinks) {
    if (entry.row_uuid === rowUUID && entry.column_uuid === colUUID) {
      value = entry.links;
      break;
    }
  }

  if (Array.isArray(value) && value.length > 0) {
    for (let i = 0; i < value.length; i += 1) {
      const entry = value[i];
      if (!entry) {
        continue;
      }

      const {
        name = '无标题',
        link = '',
      } = entry;

      if (link === '') {
        continue;
      }

      const item = parseModelURL(link);
      if (!item) {
        continue;
      }

      item.name = name;
      item.link = link;

      const otherProject = (`${item.projectId}` !== `${projectId}`);

      const elem = (
        <ViewLinksItem
          key={i}
          index={i}
          item={item}
          otherProject={otherProject}
          onClickLink={onClickViewLinksItem}
        />
      );

      itemElems.push(elem);
    }
  }

  return (
    <div className="cell-view-viewLinks">
      <div className="viewLinks-list">
        {itemElems}
      </div>
    </div>
  );
}

const ViewLinksCell = React.memo((props) => {
  const {
    colUUID,
    rowUUID,
    onPage,
    dataType,
    isFirstColumn,
    width,
    locked,
    style,
  } = props;

  const tdProps = {
    colUUID,
    rowUUID,
    dataType,
    isFirstColumn,
    width,
    style,
  };

  const textProps = {
    colUUID,
    rowUUID,
    locked,
  };

  return (
    <TD {...tdProps}>
      {
        onPage
        && <ViewLinksCellContent {...textProps} />
      }
    </TD>
  );
});

function renderOneColumn(props) {
  const {
    readOnly,
    lockFullTable,
    pageRowUUIDs,
    colIndex,
    col,
    isFirstColumn,
    rows,
    currentPageRowUUIDs,
  } = props;

  const tdList = [];

  for (let i = 0; i < rows.length; i += 1) {
    if(currentPageRowUUIDs.has(rows[i].uuid)){
      const key = `${i}-${colIndex}`;
      const row = rows[i];
      const cellStyle = row?.styles?.[col?.uuid] || {};
  
      const props1 = {
        colUUID: col.uuid,
        rowUUID: row.uuid,
        onPage: pageRowUUIDs.has(row.uuid),
        dataType: col.dataType,
        isFirstColumn,
        width: col.width,
        locked: readOnly || lockFullTable || col.locked || row.locked,
        style: cellStyle,
      };
  
      const td = <ViewLinksCell key={key} {...props1} />;
      tdList.push(td);
    }
  }

  return tdList;
}

const DataType = {
  name: 'viewLinks',
  nameCN: '视图链接',
  icon: IconViewLinks,
  valueToClipboardString,
  valueFromClipboardString,
  renderOneColumn,
};

export default DataType;
