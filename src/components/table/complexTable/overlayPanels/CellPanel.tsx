// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';

import React, {
  useState,
  useEffect,
  useContext,
} from 'react';

import {
  message,
  Button,
  Input,
  Radio,
  Space,
  Modal,
} from 'antd';

import {
  LoadingOutlined,
  RightOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';

import {
  InterfaceFunctionContext,
  CellRendererContext,
  LocalStateContext,
} from '../contexts';

import { DataTypes } from '../dataType';
import * as icons from '../SvgIcons';
import * as utils from '../utils';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';
import OverlayColorPicker from './OverlayColorPicker';

import pasteTableRectFromClipboard from '../pasteTableRectFromClipboard';
import { useTranslation } from 'react-i18next';

/**
 * 弹出对话框面板：相关需求
 */
function RelatedRequirementsModal(props) {
  const {
    defaultValue = [],
    isModalVisible,
    setIsModalVisible,
    onChange,
  } = props;

  const [items, setItems] = useState(defaultValue);

  useEffect(() => {
    setItems(defaultValue);
  }, [defaultValue]);

  function handleOk() {
    setIsModalVisible(false);
    if (onChange) {
      onChange(items);
    }
  }

  function handleCancel() {
    setIsModalVisible(false);
  }

  function onClickAdd() {
    setItems((oldItems) => [...oldItems, '']);
  }

  async function onClickPaste(index, item) {
    // let text;
    // 支持多行链接复制
    let textArr = [];

    try {
      const text = await utils.readTextFromClipboard() || '';
      // 分割
      textArr = text.split('\r\n')?.filter((i) => i);

      if (textArr?.length) {
        // eslint-disable-next-line no-shadow
        for (let itemTxt of textArr) {
          if (itemTxt?.includes(window.location.origin) && itemTxt?.includes('requirement')) {
            // 若网址相同 则进行处理
            itemTxt = itemTxt.replace(window.location.origin, 'requirement:');
          }
        }
      }

      // if (text?.includes(window.location.origin) && text?.includes('requirement')) {
      //   // 若网址相同 则进行处理
      //   text = text.replace(window.location.origin, 'requirement:');
      // }
    } catch (err) {
      console.error(err);
      return null;
    }

    // if (text === undefined || text === null) {
    if (!textArr?.length) {
      return null;
    }

    setItems((oldItems) => {
      // const newItems = [];

      // for (let i = 0; i < oldItems.length; i += 1) {
      //   if (i === index) {
      //     newItems.push(...textArr);
      //   } else {
      //     newItems.push(oldItems[i]);
      //   }
      // }
      const newItems = [...oldItems];
      newItems.splice(index, 1, ...textArr);

      return newItems;
    });

    // return text;
    return textArr;
  }

  function onClickRemoveItem(index, item) {
    setItems((oldItems) => {
      const newItems = [];

      for (let i = 0; i < oldItems.length; i += 1) {
        if (i !== index) {
          newItems.push(oldItems[i]);
        }
      }

      return newItems;
    });
  }

  function onChangeItem(newValue, index) {
    setItems((oldItems) => {
      const newItems = [];

      for (let i = 0; i < oldItems.length; i += 1) {
        if (i === index) {
          // 使用Ctrl+V粘贴时链接处理
          if (newValue?.includes(window.location.origin) && newValue?.includes('requirement')) {
            // 若网址相同 则进行处理
            const text = newValue.replace(window.location.origin, 'requirement:');
            newItems.push(text);
          } else {
            newItems.push(newValue);
          }
        } else {
          newItems.push(oldItems[i]);
        }
      }

      return newItems;
    });
  }

  function getName(n) {
    if (!n) return '';
    return reqNames.get(n) || 'Unamed';
  }

  const itemElems = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];

    const elem = (
      <div key={i} style={{ display: 'flex', marginBottom: '10px' }}>
        <Input value={item} onChange={(e) => onChangeItem(e.target.value, i)} />
        <Input disabled value={getName(item)} style={{ width: 300, margin: '0 8px' }} title={getName(item)} />
        <Button
          style={{ marginLeft: '10px' }}
          onClick={(e) => onClickPaste(i, item)}
          title="从剪贴板粘贴"
        >
          粘贴
        </Button>

        <Button
          style={{ marginLeft: '10px' }}
          onClick={(e) => onClickRemoveItem(i, item)}
          title="移除这个链接"
        >
          移除
        </Button>
      </div>
    );

    itemElems.push(elem);
  }

  return (
    <Modal
      title="相关需求"
      width={800}
      open={isModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div>
        {itemElems}
      </div>

      <div>
        <Button type="primary" block onClick={onClickAdd}>
          添加
        </Button>
      </div>
    </Modal>
  );
}

/**
 * 弹出对话框面板：超链接
 */
function HyperLinkModal(props) {
  const {
    defaultValue = [],
    isModalVisible,
    setIsModalVisible,
    onChange,
  } = props;

  function vertDefault() {
    if (typeof defaultValue === 'string') {
      return [{ url: defaultValue, name: '' }];
    }
    return defaultValue;
  }

  const [items, setItems] = useState(vertDefault(defaultValue));

  useEffect(() => {
    setItems(vertDefault(defaultValue));
  }, [defaultValue]);

  function handleOk() {
    setIsModalVisible(false);
    if (onChange) {
      onChange(items);
    }
  }

  function handleCancel() {
    setIsModalVisible(false);
  }

  function onClickAdd() {
    setItems((oldItems) => [...oldItems, { url: '', name: 'Unamed' }]);
  }

  async function onClickPaste(index, item) {
    let text;

    try {
      text = await utils.readTextFromClipboard();
    } catch (err) {
      console.error(err);
      return null;
    }

    if (text === undefined || text === null) {
      return null;
    }

    setItems((oldItems) => {
      const newItems = [];

      for (let i = 0; i < oldItems.length; i += 1) {
        if (i === index) {
          newItems.push({ ...item, url: text });
        } else {
          newItems.push(oldItems[i]);
        }
      }

      return newItems;
    });

    return text;
  }

  function onClickRemoveItem(index, item) {
    setItems((oldItems) => {
      const newItems = [];

      for (let i = 0; i < oldItems.length; i += 1) {
        if (i !== index) {
          newItems.push(oldItems[i]);
        }
      }

      return newItems;
    });
  }

  function onChangeItem(newValue, index, key) {
    setItems((oldItems) => {
      const newItems = [];

      for (let i = 0; i < oldItems.length; i += 1) {
        if (i === index) {
          newItems.push({ ...oldItems[i], [key]: newValue });
        } else {
          newItems.push(oldItems[i]);
        }
      }

      return newItems;
    });
  }

  const itemElems = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];

    const elem = (
      <div key={i} style={{ marginBottom: '10px' }}>
        <span style={{ display: 'inline-block', marginRight: 8 }}>Link</span>
        <Input value={item.url} style={{ width: '270px' }} onChange={(e) => onChangeItem(e.target.value, i, 'url')} />
        <span style={{ display: 'inline-block', margin: '0 8px' }}>Name</span>
        <Input value={item.name} style={{ width: '150px' }} onChange={(e) => onChangeItem(e.target.value, i, 'name')} />
        <Button
          style={{ marginLeft: '10px' }}
          onClick={(e) => onClickPaste(i, item)}
          title="paste"
        >
          Paste
        </Button>

        <Button
          style={{ marginLeft: '10px' }}
          onClick={(e) => onClickRemoveItem(i, item)}
          title="移除这个链接"
        >
          Reomove
        </Button>
      </div>
    );

    itemElems.push(elem);
  }

  return (
    <Modal
      title="Hyperlink"
      width={730}
      open={isModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div>
        {itemElems}
      </div>

      <div>
        <Button type="primary" block onClick={onClickAdd}>
          Add
        </Button>
      </div>
    </Modal>
  );
}

function ViewLinksModal(props) {
  const {
    cellInfo,
    isModalVisible,
    setIsModalVisible,
    onChange,
  } = props;

  const {
    projectId,
    requirementSetUUID,
    tableUUID,
    colUUID,
    rowUUID,
  } = cellInfo;

  const {
    onGetViewLinks,
  } = useContext(InterfaceFunctionContext);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  async function getViewLinks(columnUUIDs, rowUUIDs) {
    const options = {
      projectId,
      requirementSetUUID,
      sheetUUID: tableUUID,
      columnUUIDs,
      rowUUIDs,
    };

    try {
      return onGetViewLinks(options);
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async function getCellViewLinks() {
    const result = await getViewLinks([colUUID], [rowUUID]);
    if (!result?.viewLinks) {
      return [];
    }

    const urls = [];
    for (const item of result.viewLinks) {
      const { row_uuid: ru, column_uuid: cu, links } = item;
      if (ru !== rowUUID || cu !== colUUID) {
        continue;
      }

      for (const link of links) {
        // { link, name }
        urls.push(link.link);
      }
    }

    return urls;
  }

  async function loadViewLinks() {
    setLoading(true);
    const result = await getCellViewLinks();
    setLoading(false);
    setItems(result);
  }

  useEffect(() => {
    if (isModalVisible) {
      loadViewLinks();
    }
  }, [isModalVisible]);

  function handleOk() {
    setIsModalVisible(false);
    if (onChange) {
      onChange(items);
    }
  }

  function handleCancel() {
    setIsModalVisible(false);
  }

  function onClickAdd() {
    setItems((oldItems) => [...oldItems, '']);
  }

  async function onClickPaste(index, item) {
    let text;

    try {
      text = await utils.readTextFromClipboard();
    } catch (err) {
      console.error(err);
      return null;
    }

    if (text === undefined || text === null) {
      return null;
    }

    setItems((oldItems) => {
      const newItems = [];

      for (let i = 0; i < oldItems.length; i += 1) {
        if (i === index) {
          newItems.push(text);
        } else {
          newItems.push(oldItems[i]);
        }
      }

      return newItems;
    });

    return text;
  }

  function onClickRemoveItem(index, item) {
    setItems((oldItems) => {
      const newItems = [];

      for (let i = 0; i < oldItems.length; i += 1) {
        if (i !== index) {
          newItems.push(oldItems[i]);
        }
      }

      return newItems;
    });
  }

  function onChangeItem(newValue, index) {
    setItems((oldItems) => {
      const newItems = [];

      for (let i = 0; i < oldItems.length; i += 1) {
        if (i === index) {
          newItems.push(newValue);
        } else {
          newItems.push(oldItems[i]);
        }
      }

      return newItems;
    });
  }

  if (loading) {
    return (
      <Modal
        title="视图链接"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <div>
          <LoadingOutlined />
          {' '}
          正在加载...
        </div>
      </Modal>
    );
  }

  const itemElems = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];

    const elem = (
      <div key={i} style={{ display: 'flex', marginBottom: '10px' }}>
        <Input value={item} onChange={(e) => onChangeItem(e.target.value, i)} />

        <Button
          style={{ marginLeft: '10px' }}
          onClick={(e) => onClickPaste(i, item)}
          title="从剪贴板粘贴"
        >
          Paste
        </Button>

        <Button
          style={{ marginLeft: '10px' }}
          onClick={(e) => onClickRemoveItem(i, item)}
          title="移除这个链接"
        >
          Remove
        </Button>
      </div>
    );

    itemElems.push(elem);
  }

  return (
    <Modal
      title="视图链接"
      open={isModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div>
        {itemElems}
      </div>

      <div>
        <Button type="primary" block onClick={onClickAdd}>
          Add
        </Button>
      </div>
    </Modal>
  );
}

/**
 * 弹出对话框面板：关联需求集   子需求集概念淡化2024.3.25
 */
function SubRequirementSetPopup(props) {
  const {
    getProjectRequirements,
  } = useContext(InterfaceFunctionContext);

  const {
    requirementSetUUID,
  } = useContext(CellRendererContext);

  const {
    isModalVisible,
    setIsModalVisible,
    currentValue,
    onChange,
  } = props;

  const [requirements, setRequirements] = useState([]);
  const [choice, setChoice] = useState(null);

  useEffect(() => {
    if (!isModalVisible) {
      return;
    }

    getProjectRequirements().then((newRequirements) => {
      setRequirements(newRequirements);
    }).catch((err) => {
      console.error(err);
    });
  }, [isModalVisible]);

  useEffect(() => {
    setChoice(currentValue);
  }, [currentValue]);

  function handleOk() {
    setIsModalVisible(false);
    if (onChange) {
      onChange(choice);
    }
  }

  function handleCancel() {
    setIsModalVisible(false);
  }

  function handleChangeChoice(e) {
    setChoice(e.target.value);
  }

  function onClickRadioLabel(e, value) {
    e.preventDefault();
    if (value === requirementSetUUID) {
      // do nothing
    } else {
      setChoice(value);
    }
  }

  function renderRadioItem(requirement) {
    const disabled = (requirement.uuid === requirementSetUUID);
    return (
      <Radio
        key={requirement.uuid}
        value={requirement.uuid}
        disabled={disabled}
      >
        <span onClick={(e) => onClickRadioLabel(e, requirement.uuid)}>
          <span>{requirement.name || '无标题需求集'}</span>
          {disabled && ' （当前需求集）'}
        </span>
      </Radio>
    );
  }

  return (
    <Modal
      title="关联需求集"
      open={isModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div>
        <Radio.Group onChange={handleChangeChoice} value={choice}>
          <Space direction="vertical">
            {
              requirements.map((requirement) => renderRadioItem(requirement))
            }
          </Space>
        </Radio.Group>
      </div>
    </Modal>
  );
}

function ButtonEditRelatedRequirements(props) {
  const {
    onClick,
  } = props;

  const { t } = useTranslation();

  return (
    <div className="one-button" onClick={onClick}>
      <div className="icon">
        <icons.IconConfig />
      </div>
      <div className="name">
        {t('edit.link')}
      </div>
    </div>
  );
}

function ButtonEditHyperLink(props) {
  const { onClick } = props;
  const { t } = useTranslation();

  return (
    <div className="one-button" onClick={onClick}>
      <div className="icon">
        <icons.IconConfig />
      </div>
      <div className="name">
        {t('edit.link')}
      </div>
    </div>
  );
}

function ButtonEditViewLinks(props) {
  const {
    onClick,
  } = props;

  const { t } = useTranslation();

  return (
    <div className="one-button" onClick={onClick}>
      <div className="icon">
        <icons.IconConfig />
      </div>
      <div className="name">
        {t('edit')}
      </div>
    </div>
  );
}

function ButtonOpenSubtable(props) {
  const {
    onClick,
  } = props;

  return (
    <div className="one-button" onClick={onClick}>
      <div className="icon">
        <icons.IconConfig />
      </div>
      <div className="name">
        打开关联需求集
      </div>
    </div>
  );
}

function ButtonCreateSubtable(props) {
  const {
    onClick,
  } = props;

  return (
    <div className="one-button" onClick={onClick}>
      <div className="icon">
        <icons.IconConfig />
      </div>
      <div className="name">
        新建子需求集
      </div>
    </div>
  );
}

function ButtonLinkSubtable(props) {
  const {
    onClick,
  } = props;

  return (
    <div className="one-button" onClick={onClick}>
      <div className="icon">
        <icons.IconConfig />
      </div>
      <div className="name">
        关联需求集
      </div>
    </div>
  );
}

function ButtonClearSubtable(props) {
  const {
    onClick,
  } = props;

  return (
    <div className="one-button" onClick={onClick}>
      <div className="icon">
        <icons.IconConfig />
      </div>
      <div className="name">
        清除关联需求集
      </div>
    </div>
  );
}

function CellPanel(props, ref) {
  const {
    onOpenSubtable,
    onUpdateViewLinks,
    onDeleteViewLinks,
  } = useContext(InterfaceFunctionContext);

  const {
    projectId,
    requirementSetUUID,
    tableUUID,
    options,
    columns,
    setColumns,
    rows,
    setRows,
    treeNodeSpace,
  } = useContext(CellRendererContext);

  const {t} = useTranslation();

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 216,
    minHeight: 200,
  });

  const {
    hide: hidePanel,
  } = useToggleablePanel(ref, setPanelState);

  const {
    colUUID,
    rowUUID,
  } = panelState;

  const [isModal1Visible, setIsModal1Visible] = useState(false);
  const [isModal2Visible, setIsModal2Visible] = useState(false);
  const [isModal3Visible, setIsModal3Visible] = useState(false);
  const [isModalHyperLinkVisible, setIsModalHyperLinkVisible] = useState(false);

  const currentColumn = utils.getColumnByUUID(columns, colUUID);
  const currentRow = utils.getRowByUUID(rows, rowUUID);
  const headLocked = options.lockFullTable
    || options.lockTableHead || currentColumn?.locked;
  const bodyLocked = options.lockFullTable
    || currentColumn?.locked || currentRow?.locked;
  const currentValue = currentRow?.fields?.[colUUID];
  const isTreeNodeCell = (currentColumn?.dataType === 'treeNode');

  let linkUUID = null;
  let linkExist = false;
  if (isTreeNodeCell) {
    const value = currentRow?.fields?.[colUUID];
    if (value?.uuid) {
      linkUUID = value.uuid;
      linkExist = !!treeNodeSpace[linkUUID];
    }
  }

  function onClickSetAsColumnDefault() {
    hidePanel();

    if (!(currentColumn && currentRow?.fields)) {
      return;
    }

    const cellValue = currentRow.fields[colUUID];
    if ((cellValue === undefined)
      || (typeof cellValue === 'undefined')) {
      return;
    }

    setColumns((oldColumns) => {
      const newColumns = [];

      for (const item of oldColumns) {
        if (item.uuid === colUUID) {
          const newCol = { ...item };
          newCol.defaultValue = cellValue;
          newColumns.push(newCol);
        } else {
          newColumns.push(item);
        }
      }

      return newColumns;
    });
  }

  function onClicClearColumnDefault() {
    hidePanel();

    if (!(currentColumn && currentRow?.fields)) {
      return;
    }

    const cellValue = currentRow.fields[colUUID];

    setColumns((oldColumns) => {
      const newColumns = [];

      for (const item of oldColumns) {
        if (item.uuid === colUUID) {
          const newCol = { ...item };
          if (newCol.defaultValue) delete newCol.defaultValue;
          newColumns.push(newCol);
        } else {
          newColumns.push(item);
        }
      }

      return newColumns;
    });
  }

  async function onClickCopyCellValue() {
    hidePanel();

    const value = currentRow?.fields?.[colUUID];
    const conv = DataTypes[currentColumn?.dataType]?.valueToClipboardString;

    let str;
    if (conv) {
      str = conv(value);
    } else {
      str = value ? `${value}` : '';
    }

    try {
      await utils.writeTextToClipboard(str);
      message.success('单元格内容已复制到剪贴板');
    } catch (err) {
      message.error(`无法复制到剪贴板: ${err}`);
    }
  }

  async function onClickPasteCellValue() {
    hidePanel();

    let text;

    try {
      text = await utils.readTextFromClipboard();
    } catch (err) {
      message.error(`无法读取剪贴板: ${err}`);
      return;
    }

    // 根据剪切板行数依次往下粘贴
    let colIndex = -1;
    for (let i = 0; i < columns.length; i += 1) {
      if (columns[i].uuid === colUUID) {
        colIndex = i;
        break;
      }
    }

    if (colIndex < 0) {
      return;
    }

    let rowIndex = 0;

    for (let i = 0; i < rows.length; i += 1) {
      if (rows[i].uuid === rowUUID) {
        rowIndex = i;
        break;
      }
    }

    await pasteTableRectFromClipboard({
      colIndex,
      rowIndex,
      columns,
      setColumns,
      setRows,
    });

    // 所有内容只粘贴到本行，按照换行处理
    // let value;

    // try {
    //   const conv = DataTypes[currentColumn?.dataType]?.valueFromClipboardString;
    //   if (conv) {
    //     value = conv(text);
    //   }
    // } catch (err) {
    //   message.error(`无法处理粘贴数据: ${err}`);
    //   return;
    // }

    // setRows((oldData) => {
    //   const newData = [];

    //   for (const row1 of oldData) {
    //     if (row1.uuid === rowUUID) {
    //       const newFields = {
    //         ...row1.fields,
    //       };

    //       if (value === undefined || value === null) {
    //         delete newFields[colUUID];
    //       } else {
    //         newFields[colUUID] = value;
    //       }

    //       const newRow = {
    //         ...row1,
    //         fields: newFields,
    //       };

    //       newData.push(newRow);
    //     } else {
    //       newData.push(row1);
    //     }
    //   }

    //   return newData;
    // });
  }

  async function onClickClearCellValue() {
    hidePanel();

    setRows((oldData) => {
      const newData = [];

      for (const row1 of oldData) {
        if (row1.uuid === rowUUID) {
          const newFields = {
            ...row1.fields,
          };

          delete newFields[colUUID];

          const newRow = {
            ...row1,
            fields: newFields,
          };

          newData.push(newRow);
        } else {
          newData.push(row1);
        }
      }

      return newData;
    });
  }

  async function onClickSetCellStyle(style = {}) {
    hidePanel();

    setRows((oldData) => {
      const newData = [];

      for (const row1 of oldData) {
        if (row1.uuid === rowUUID) {
          const newStyles = {
            ...(row1.styles || {}),
            [colUUID]: { ...(row1?.styles?.[colUUID] || {}), ...style },
          };

          const newRow = {
            ...row1,
            styles: newStyles,
          };

          newData.push(newRow);
        } else {
          newData.push(row1);
        }
      }

      return newData;
    });
  }

  async function onClickClearColumnBgColor() {
    hidePanel();

    setRows((oldData) => {
      const newData = [];

      for (const row1 of oldData) {
        const style = { ...(row1?.styles?.[colUUID] || {}) };
        delete style.backgroundColor;

        const newStyles = {
          ...(row1.styles || {}),
          [colUUID]: style,
        };

        const newRow = {
          ...row1,
          styles: newStyles,
        };

        newData.push(newRow);
      }

      return newData;
    });
  }

  function onClickCreateSubtable() {
    hidePanel();

    let cellUUID;
    let cellName;
    const col = currentColumn;
    const row = currentRow;

    // TODO: 不必每次都调用setRows
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
          cellName = newValue.text;
          newData.push(newRow);
        } else {
          newData.push(row1);
        }
      }

      return newData;
    });

    setTimeout(() => {
      if (onOpenSubtable) {
        onOpenSubtable(col, row, cellUUID, cellName);
      }
    }, 30);
  }

  function onClickOpenSubtable() {
    hidePanel();

    let cellUUID;
    let cellName;
    const col = currentColumn;
    const row = currentRow;

    for (const row1 of rows) {
      if (row1.uuid === row.uuid) {
        const oldValue = row1.fields?.[col?.uuid] || {};
        cellUUID = oldValue.uuid;
        cellName = oldValue.text;
      }
    }

    setTimeout(() => {
      if (onOpenSubtable) {
        onOpenSubtable(col, row, cellUUID, cellName);
      }
    }, 30);
  }

  function onClickLinkSubtable(e) {
    hidePanel();
    setIsModal2Visible(true);
  }

  function onClickClearSubtable() {
    hidePanel();

    const col = currentColumn;
    const row = currentRow;

    setRows((oldData) => {
      const newData = [];
      for (const row1 of oldData) {
        if (row1.uuid === row.uuid) {
          const oldValue = row1.fields?.[col?.uuid] || {};
          const newValue = { ...oldValue };
          delete newValue.uuid;

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

  function onClickEditRelatedRequirements() {
    hidePanel();
    setIsModal1Visible(true);
  }

  function onClickEditHyperLink() {
    hidePanel();
    setIsModalHyperLinkVisible(true);
  }

  function onClickEditViewLinks() {
    hidePanel();
    setIsModal3Visible(true);
  }

  function onChangeRelatedRequirements(newValue) {
    if (!(currentRow?.uuid && currentColumn?.uuid)) {
      return;
    }

    setRows((oldData) => {
      const newData = [];

      for (const row1 of oldData) {
        if (row1.uuid === currentRow.uuid) {
          const newRow = { ...row1 };
          newRow.fields = {
            ...row1.fields,
            [currentColumn.uuid]: newValue,
          };

          newData.push(newRow);
        } else {
          newData.push(row1);
        }
      }

      return newData;
    });
  }

  function onChangeHyperLink(newValue) {
    if (!(currentRow?.uuid && currentColumn?.uuid)) {
      return;
    }

    setRows((oldData) => {
      const newData = [];

      for (const row1 of oldData) {
        if (row1.uuid === currentRow.uuid) {
          const newRow = { ...row1 };
          newRow.fields = {
            ...row1.fields,
            [currentColumn.uuid]: newValue,
          };

          newData.push(newRow);
        } else {
          newData.push(row1);
        }
      }

      return newData;
    });
  }

  async function onChangeViewLinks(newValue) {
    const links = newValue || [];

    if (links.length === 0) { // 删除所有链接
      const options1 = {
        projectId,
        requirementSetUUID,
        sheetUUID: tableUUID,
        rowUUIDs: [currentRow.uuid],
        columnUUID: currentColumn.uuid,
      };

      await onDeleteViewLinks(options1);
    } else { // 增加或修改链接
      const options1 = {
        projectId,
        requirementSetUUID,
        sheetUUID: tableUUID,
        columnUUID: currentColumn.uuid,
        viewLinks: {
          [currentRow.uuid]: newValue,
        },
      };

      await onUpdateViewLinks(options1);
    }

    await utils.delay(500);

    const event = new CustomEvent('viewLinksChanged');
    window.dispatchEvent(event);
  }

  function onChangeSubRequirementSet(reqSetUUID) {
    console.log('onChangeSubRequirementSet', reqSetUUID);
    if (!(currentRow?.uuid && currentColumn?.uuid)) {
      return;
    }

    const col = currentColumn;
    const row = currentRow;

    setRows((oldData) => {
      const newData = [];
      for (const row1 of oldData) {
        if (row1.uuid === row.uuid) {
          const oldValue = row1.fields?.[col?.uuid] || {};
          const newValue = {
            ...oldValue,
            uuid: reqSetUUID,
          };

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

  function onClickOpenAIText(e) {
    const elem = e.target.closest('.one-button');
    if (!elem) {
      return;
    }

    const rect = elem.getBoundingClientRect();
    const position = {
      left: rect.left + 10,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };

    const panelType = 'AiTextPanel';
    const detail = {
      panelType,
      action: 'toggle',
      placement: 'right',
      position,
      currentValue,
      colUUID,
      rowUUID,
      isTreeNodeCell,
      cellElem: panelState.cellElem,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  const buttonList = [];

  if (!bodyLocked
    && (currentColumn?.dataType === 'relatedRequirements')) {
    const btn = (
      <ButtonEditRelatedRequirements
        key="btn-edit-related-requirements"
        onClick={onClickEditRelatedRequirements}
      />
    );

    buttonList.push(btn);
  }

  if (!bodyLocked
    && (currentColumn?.dataType === 'hyperlink')) {
    const btn = (
      <ButtonEditHyperLink
        key="btn-edit-hyperlink"
        onClick={onClickEditHyperLink}
      />
    );

    buttonList.push(btn);
  }

  if (!bodyLocked
    && (currentColumn?.dataType === 'viewLinks')) {
    const btn = (
      <ButtonEditViewLinks
        key="btn-edit-viewLinks"
        onClick={onClickEditViewLinks}
      />
    );

    buttonList.push(btn);
  }

  if (isTreeNodeCell && !bodyLocked) {
    if (linkExist) {
      const btnOpen = (
        <ButtonOpenSubtable
          key="btn-open-subtable"
          onClick={onClickOpenSubtable}
        />
      );

      const btnLink = (
        <ButtonLinkSubtable
          key="btn-link-subtable"
          onClick={onClickLinkSubtable}
        />
      );

      const btnClear = (
        <ButtonClearSubtable
          key="btn-clear-subtable"
          onClick={onClickClearSubtable}
        />
      );

      buttonList.push(btnOpen);
      buttonList.push(btnLink);
      buttonList.push(btnClear);
    } else {
      const btnCreate = (
        <ButtonCreateSubtable
          key="btn-create-subtable"
          onClick={onClickCreateSubtable}
        />
      );

      const btnLink = (
        <ButtonLinkSubtable
          key="btn-link-subtable"
          onClick={onClickLinkSubtable}
        />
      );
        // 2024.3.25 开始淡化子需求集概念 不再提供子需求集新增
      // buttonList.push(btnCreate);
      buttonList.push(btnLink);
    }
  }

  if (!headLocked) {
    const btn = (
      <div
        key="btn-set-as-default"
        className="one-button"
        onClick={onClickSetAsColumnDefault}
      >
        <div className="icon">
          <icons.IconConfig />
        </div>
        <div className="name">
          {t('set.col.default')}
        </div>
      </div>
    );

    buttonList.push(btn);
  }
  if (!headLocked) {
    const btn = (
      <div
        key="btn-clear-cell-default"
        className="one-button"
        onClick={onClicClearColumnDefault}
      >
        <div className="icon">
          <icons.IconDelete />
        </div>
        <div className="name">
          {t('clear.col.default')}
        </div>
      </div>
    );

    buttonList.push(btn);
  }
  {
    const btn = (
      <div
        key="btn-copy-cell-value"
        className="one-button"
        onClick={onClickCopyCellValue}
      >
        <div className="icon">
          <icons.IconCopy />
        </div>
        <div className="name">
          {t('copy')}
        </div>
      </div>
    );

    buttonList.push(btn);
  }

  if (!bodyLocked) {
    const btn = (
      <div
        key="btn-paste-cell-value"
        className="one-button"
        onClick={onClickPasteCellValue}
      >
        <div className="icon">
          <icons.IconCopy />
        </div>
        <div className="name">
          {t('paste')}
        </div>
      </div>
    );

    buttonList.push(btn);
  }

  if (!bodyLocked) {
    const btn = (
      <div
        key="btn-clear-cell-value"
        className="one-button"
        onClick={onClickClearCellValue}
      >
        <div className="icon">
          <icons.IconFormatPainter />
        </div>
        <div className="name">
          {t('clear')}
        </div>
      </div>
    );

    buttonList.push(btn);
  }

  if (!bodyLocked) {
    const btn = (
      <OverlayColorPicker
        onSelect={onClickSetCellStyle}
        onClose={() => { setPanelState(false); }}
      >
        <div
          key="btn-paint-cell-color"
          className="one-button"
          onClick={(e) => { e.stopPropagation(); }}
        >
          <div className="icon">
            <icons.IconSetBgColor />
          </div>
          <div className="name">
            <div style={{
              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
            >
              <span>{t('colors')}</span>
              <RightOutlined style={{ float: 'right', marginTop: '2px' }} />
            </div>
          </div>
        </div>
      </OverlayColorPicker>
    );

    buttonList.push(btn);
  }

  if (!bodyLocked) {
    const btn = (
      <div
        key="btn-clear-column-color"
        className="one-button"
        onClick={onClickClearColumnBgColor}
      >
        <div className="icon">
          <icons.IconClearBgColor />
        </div>
        <div className="name">
          {t('clear.col.bg')}
        </div>
      </div>
    );

    buttonList.push(btn);
  }

  // if (!bodyLocked && (['text', 'treeNode'].includes(currentColumn?.dataType))) {
  //   const btn = (
  //     <div
  //       key="btn-paint-cell-color"
  //       className="one-button"
  //       onClick={onClickOpenAIText}
  //     >
  //       <div className="icon">
  //         <icons.IconAi />
  //       </div>
  //       <div className="name">
  //         <div style={{
  //           width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  //         }}
  //         >
  //           <span>AI助手</span>
  //           <RightOutlined style={{ float: 'right', marginTop: '2px' }} />
  //         </div>
  //       </div>
  //     </div>
  //   );

  //   buttonList.unshift(btn);
  // }

  if (!buttonList.length) {
    const btn = (
      <div
        key="btn-empty"
        style={{
          margin: '3px 7px',
          color: '#999',
        }}
      >
        此单元格暂无功能
      </div>
    );

    buttonList.push(btn);
  }

  function onNotifyRequirementsModal(e) {
    setPanelState({
      colUUID: e.detail.column,
      rowUUID: e.detail.row,
    });
    onClickEditRelatedRequirements();
  }
  useEffect(() => {
    window.addEventListener('notifyRequirementsModal', onNotifyRequirementsModal);

    return () => {
      window.removeEventListener('notifyRequirementsModal', onNotifyRequirementsModal);
    };
  }, []);

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-rowPanel">
        <div className="button-list">
          {buttonList}
        </div>

        {isModal1Visible && (
          <RelatedRequirementsModal
            defaultValue={currentValue || []}
            isModalVisible={isModal1Visible}
            setIsModalVisible={setIsModal1Visible}
            onChange={onChangeRelatedRequirements}
          />
        )}

        <HyperLinkModal
          defaultValue={currentValue || []}
          isModalVisible={isModalHyperLinkVisible}
          setIsModalVisible={setIsModalHyperLinkVisible}
          onChange={onChangeHyperLink}
        />

        <SubRequirementSetPopup
          isModalVisible={isModal2Visible}
          setIsModalVisible={setIsModal2Visible}
          currentValue={linkUUID}
          onChange={onChangeSubRequirementSet}
        />

        <ViewLinksModal
          cellInfo={{
            projectId,
            requirementSetUUID,
            tableUUID,
            colUUID,
            rowUUID,
          }}
          isModalVisible={isModal3Visible}
          setIsModalVisible={setIsModal3Visible}
          onChange={onChangeViewLinks}
        />
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(CellPanel);
