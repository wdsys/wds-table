// @ts-nocheck
import React, {
  useState,
  useContext,
} from 'react';

import { DataTypes, ColumnIcon } from '../dataType';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

function ColumnTypePanel(props, ref) {
  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'right',
    position: null,
    minWidth: 216,
    minHeight: 458,
  });
  useToggleablePanel(ref, setPanelState);

  const menuData = [
    {
      category: '普通',
      contents: [
        'treeNode',
        'text',
        'number',
        // 'serial',
        'select',
        'multiSelect',
        'checkbox',
        'date',
        'serialNumber',
        // 'signature',
        // 'notification',
        // 'time',
        // 'person',
        // 'people',
        'file',
        'hyperlink',
        // 'relatedRequirements',
        // 'linkedRequirements',
        // 'email',
        // 'phone',
        // 'views',
        // 'viewLinks',
      ],
    },
    // {
    //   category: '进阶',
    //   contents: [
    //     'taskmgr',
    //   ],
    // },
  ];

  const allDataTypeList = Object.values(DataTypes);
  const advanceCategoryTypes = [];
  allDataTypeList?.forEach?.((dataType) => {
    if (dataType.belongTo === 'advance') {
      advanceCategoryTypes.push(dataType.name);
    }
  });
  if (advanceCategoryTypes.length) {
    menuData.push({
      category: '进阶',
      contents: advanceCategoryTypes,
    });
  }

  function onClickType(type) {
    if (panelState.callback) {
      setTimeout(() => {
        panelState.callback(type);
      }, 10);
    }

    setPanelState((oldState) => ({
      ...oldState,
      visible: false,
    }));
  }

  function createMenuItem(type) {
    if (DataTypes[type]?.justRender) {
      const Component = DataTypes[type].component;
      return (
        <Component onChangeType={onClickType} />
      );
    }

    return (
      <div
        key={type}
        className="one-button"
        onClick={(e) => onClickType(type)}
      >
        <div className="icon">
          <ColumnIcon dataType={type} />
        </div>
        <div className="name">
          {DataTypes[type]?.nameCN}
        </div>
      </div>
    );
  }

  function createMenuSection({ category, contents }) {
    return (
      <div key={category}>
        <div className="hint">
          {category}
        </div>

        {
          contents.map((type) => createMenuItem(type))
        }
      </div>
    );
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-columnPanel">
        <div className="column-type-editor">
          {
            menuData.map((item) => createMenuSection(item))
          }
        </div>
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(ColumnTypePanel);
