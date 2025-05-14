// @ts-nocheck
import React, {
  useContext,
} from 'react';

import {
  ArrowRightOutlined,
} from '@ant-design/icons';

import {
  InterfaceFunctionContext,
  CellRendererContext,
} from '../contexts';

import TD from '../TD';
import { IconRelatedRequirements } from '../SvgIcons';

function valueToClipboardString(value) {
  // return value || '';
  if (typeof value === 'undefined' || value === null) {
    return '';
  } if (Array.isArray(value)) {
    return value.join(', ');
  }
  return `${value}`;
}

function valueFromClipboardString(str) {
  // return str;
  const set = new Set();

  const parts = str.split(/,\s*/);
  for (let entry of parts) {
    entry = entry.trim();
    if (entry !== '') {
      set.add(entry);
    }
  }

  return Array.from(set);
}

function RelatedRequirementItem(props) {
  const {
    index,
    rowURL,
    otherProject,
    onClickLink,
  } = props;

  let className = 'related-requirement-item';
  if (otherProject) {
    className += ' other-project';
  } else {
    className += ' same-project';
  }

  return (
    <div className={className}>
      <span className="icon"><ArrowRightOutlined /></span>
      <span className="text" onClick={(e) => onClickLink(rowURL, index, e.ctrlKey)}>
        <span className="url">{rowURL}</span>
        <span className="name" />
      </span>
    </div>
  );
}

function RelatedRequirementsCellContent(props) {
  const {
    colUUID,
    rowUUID,
    locked,
    value,
  } = props;

  const {
    onOpenRelatedRequirement,
  } = useContext(InterfaceFunctionContext);

  const {
    projectId,
    requirementSetUUID,
    tableUUID,
  } = useContext(CellRendererContext);

  function onClickRelatedRequirementItem(rowURL, index, ctrlPressed) {
    const parts = rowURL.split('/');

    const item = {
      projectId: parts[2],
      requirementSetUUID: parts[4],
      tableUUID: parts[6],
      rowUUID: parts[8],
    };

    if (ctrlPressed && rowURL) {
      window.open(rowURL?.replace?.('requirement:', window.location.origin), '_blank');
      return;
    }

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

  if (Array.isArray(value) && value.length > 0) {
    for (let i = 0; i < value.length; i += 1) {
      const rowURL = value?.[i];
      if (!rowURL) {
        continue;
      }

      const parts = rowURL.split('/');

      const item = {
        projectId: parts[2],
        requirementSetUUID: parts[4],
        tableUUID: parts[6],
        rowUUID: parts[8],
      };

      const otherProject = (`${item.projectId}` !== `${projectId}`);

      const elem = (
        <RelatedRequirementItem
          key={i}
          index={i}
          rowURL={rowURL}
          otherProject={otherProject}
          onClickLink={onClickRelatedRequirementItem}
        />
      );

      itemElems.push(elem);
    }
  }
  function onClickEdit(e) {
    const detail = {
      panelType: 'RelatedRequirementsModal',
      action: 'toggle',
      placement: 'bottom',
      // position,
      column: colUUID,
      row: rowUUID,
    };

    const ev = new CustomEvent('notifyRequirementsModal', { detail });
    window.dispatchEvent(ev);
  }

  return (
    <div className="cell-view-related-requirements">
      <div className="related-requirement-list">
        {itemElems}
      </div>
      {
        !locked && (
          <div className="float-bar has-link">
            <div className="float-bar-content">
              <div className="button" onClick={(e) => onClickEdit(e)}>
                编辑链接
              </div>
              <span className="link-notation" />
            </div>
          </div>
        )
      }
    </div>
  );
}

const RelatedRequirementsCell = React.memo((props) => {
  const {
    colUUID,
    rowUUID,
    onPage,
    dataType,
    isFirstColumn,
    width,
    locked,
    value,
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
    value,
  };

  return (
    <TD {...tdProps}>
      {
        onPage
        && <RelatedRequirementsCellContent {...textProps} />
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
    currentPageRowUUIDs
  } = props;

  const tdList = [];

  for (let i = 0; i < rows.length; i += 1) {
    if(currentPageRowUUIDs.has(rows[i].uuid)){
      const key = `${i}-${colIndex}`;
      const row = rows[i];
      const cellValue = row?.fields?.[col?.uuid] || [];
      const cellStyle = row?.styles?.[col?.uuid] || {};
  
      const props1 = {
        colUUID: col.uuid,
        rowUUID: row.uuid,
        onPage: pageRowUUIDs.has(row.uuid),
        dataType: col.dataType,
        isFirstColumn,
        width: col.width,
        locked: readOnly || lockFullTable || col.locked || row.locked,
        value: cellValue,
        style: cellStyle,
      };
  
      const td = <RelatedRequirementsCell key={key} {...props1} />;
      tdList.push(td);
    }
  }

  return tdList;
}

const DataType = {
  name: 'relatedRequirements',
  nameCN: '相关需求',
  icon: IconRelatedRequirements,
  valueToClipboardString,
  valueFromClipboardString,
  renderOneColumn,
};

export default DataType;
