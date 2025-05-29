// @ts-nocheck
import React, {
  useContext,
  useEffect,
  useState,
  forwardRef,
  useRef,
} from 'react';

import {
  Modal,
  Input,
  Dropdown,
  message,
  Button,
} from 'antd';
import {
  AlignLeftOutlined,
  DownloadOutlined,
  ContainerOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
} from '@ant-design/icons';

import sha1 from 'js-sha1';
import { v4 as uuidv4 } from 'uuid';
import { isObject } from 'lodash';

import {
  InterfaceFunctionContext, CellRendererContext,
  LocalStateContext,
} from '../contexts';

import { saveBlobToFile } from '@/utils/file'

import { DataTypes } from '../dataType';
import useToggleablePanel from './useToggleablePanel';
import * as icons from '../SvgIcons';
import * as utils from '../utils';
import { previewFile, blobToJson } from '../../utils';

import './ColExplainPanel.less';

const { TextArea } = Input;

// 查看图片
function ImageInCell(props) {
  const {
    file, projectId, disabled, onDeleteFile,
  } = props;
  const ref = useRef(null);
  const {
    getAttachment, tableManager,
  } = useContext(CellRendererContext);

  async function loadImage() {
    const image = new Image();
    image.src = await getAttachment(`${file.uuid}-${file.name}`);

    const div = ref.current;
    if (image.src && div) {

      while (div.childElementCount) {
        div.removeChild(div.firstChild);
      }

      image.className = 'explain-img';

      div.appendChild(image);
    }
  }

  useEffect(() => {
    loadImage();
  }, [file.uuid]);

  // 下载文件
  async function onClickDownload() {
    try {
      // Get file blob from temp directory
      const blob = await tableManager.getAttachmentBlob(`${file.uuid}-${file.name}`);
      
      if (!blob) {
        message.error('Failed to download file');
        return;
      }
  
      // Save the blob to user selected location
      const filePath = await saveBlobToFile(file.name, blob);
      if(filePath){
        message.success('File downloaded successfully');
      }
    } catch (error) {
      console.error('Download failed:', error);
      message.error('Failed to download file');
    }
  }

  // 预览文件
  // async function onClickViewFile() {
  //   const blob = await getAttachment(projectId, file.digest);
  //   await previewFile(file, blob);
  // }

  // 删除文件
  function deleteFile() {
    if (onDeleteFile) {
      onDeleteFile();
    }
  }

  const menus = [
    {
      key: '0',
      label: (
        <div>
          <DownloadOutlined style={{ marginRight: 5 }} />
          下载
        </div>
      ),
      onClick: () => { onClickDownload(); },
    },
    // {
    //   key: '1',
    //   label: (
    //     <div>
    //       <ContainerOutlined style={{ marginRight: 5 }} />
    //       预览
    //     </div>
    //   ),
    //   onClick: () => { onClickViewFile(file); },
    // },
    {
      key: '2',
      label: (
        <div>
          <DeleteOutlined style={{ marginRight: 5 }} />
          删除
        </div>
      ),
      onClick: () => { deleteFile(); },
    },
  ];

  return (
    <div className="explain-file">
      <div ref={ref} />
      <div className="file-title">
        <span className="file-name" title={file.name}>
          {file.name}
        </span>

        {
          disabled ? null : (
            <Dropdown trigger="click" menu={{ items: menus }}>
              <AlignLeftOutlined className="file-toolbar" />
            </Dropdown>
          )
        }
      </div>
    </div>
  );
}

// 图片上传
function UploadImage(props) {
  const { explainFile, setExplainFile, disabled } = props;
  const { addAttachment } = useContext(CellRendererContext);

  async function uploadFile(file) {
    const relativePath = await addAttachment(file.uuid, file.file);
    setExplainFile({
      name: file.name,
      uuid: file.uuid,
    });
  }

  async function onGotFiles(files1) {
    for (const file of files1) {
      const { name, size, type } = file;

      const fileInfo = {
          file,
          name,
          size,
          type,
          uuid: uuidv4(),
      };

      await uploadFile(fileInfo);
    }
  }

  function onInputFileChange(e) {
    const { files } = e.target;
    if (files?.length) {
      onGotFiles(files);
    }

    e.target.value = '';
  }

  function onPasteImage(event) {
    event.preventDefault();
    event.stopPropagation();

    const { items } = event.clipboardData || event.originalEvent.clipboardData;
    let file = null;
    // eslint-disable-next-line no-plusplus
    if (items?.length) {
      // 检索剪切板items
      for (const value of items) {
        if (value.type.indexOf('image') !== -1) {
          file = value.getAsFile();
          break;
        }
      }
    }
    if (file) {
      onGotFiles([file]);
    }
  }

  function onClickSelectFile(e) {
    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = 'image/*';
    inputFile.hidden = true;
    inputFile.addEventListener('change', onInputFileChange);
    inputFile.click();
    inputFile.remove();
  }

  function onDeleteFile() {
    setExplainFile();
  }

  return (
    <div className="explain-file-wrap">
      {
        (disabled || explainFile?.digest) ? null : (
          <div
            className="explain-file-upload"
            onPaste={onPasteImage}
          >
            <icons.IconDropFileHere />
            <div className="hint-text">
              <div className="line-1">
                <span>点击这里</span>
                <span className="action-name">粘贴图片</span>
              </div>

              <div className="line-2">
                <span className="button action-name" onClick={onClickSelectFile}>选择图片文件</span>
              </div>
            </div>
          </div>
        )
      }

      {
        explainFile?.uuid && (
          <ImageInCell
            file={explainFile}
            disabled={disabled}
            onDeleteFile={onDeleteFile}
          />
        )
      }
    </div>
  );
}

function ColExplainPanel(props, ref) {
  const { setColumns } = useContext(CellRendererContext);

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'right',
    position: {
      left: 400,
      top: 0,
      width: '70vw',
      height: '100%',
    },
  });
  const [colExplainList, setColExplainList] = useState([
    {
      explainTxt: '',
      explainFile: null,
    },
  ]);

  const {
    uuid, dataType, name, explainInfo, locked,
  } = panelState?.column || {};
  const nameCN = DataTypes[dataType]?.nameCN;
  const disabled = false;

  const explainWrapRef = useRef();

  const {
    hide: hidePanel,
  } = useToggleablePanel(ref, setPanelState);

  useEffect(() => {
    if (Array.isArray(explainInfo)) {
      setColExplainList([...explainInfo]);
    } else {
      const { text = '', file } = explainInfo || {};
      setColExplainList([{
        explainTxt: text,
        explainFile: file,
      }]);
    }
  }, [uuid, explainInfo]);

  function changeExplainVal(e, index) {
    const val = e?.target?.value;
    colExplainList[index].explainTxt = val;
    setColExplainList([...colExplainList]);
  }

  function changeExplainFile(file, index) {
    colExplainList[index].explainFile = file;
    setColExplainList([...colExplainList]);
  }

  function updateExplain() {
    setColumns((oldColumns) => {
      const newColumns = [];

      for (const col of oldColumns) {
        let newCol;

        if (col.uuid === uuid) {
          newCol = {
            ...col,
            explainInfo: colExplainList,
          };
        } else {
          newCol = col;
        }

        newColumns.push(newCol);
      }

      return newColumns;
    });

    hidePanel();
  }

  function addExplainItem() {
    colExplainList.push({
      explainTxt: '',
      explainFile: null,
    });
    setColExplainList([...colExplainList]);

    setTimeout(() => {
      if (explainWrapRef.current) {
        explainWrapRef.current.scrollTop = explainWrapRef.current.scrollHeight;
      }
    });
  }

  function deleteExplainItem(index) {
    colExplainList.splice(index, 1);
    setColExplainList([...colExplainList]);
  }

  return (
    <Modal
      open={panelState.visible}
      onCancel={hidePanel}
      title={`${name}${disabled ? '' : `[${nameCN}]`} -  ${disabled ? '' : '添加'}说明`}
      className="col-explain-modal"
      cancelText="取消"
      okText="确定"
      onOk={updateExplain}
      okButtonProps={{
        disabled,
      }}
      width="70vw"
    >
      <div className="explain-info-wrap">
        <div className="explain-list" ref={explainWrapRef}>
          {
            colExplainList?.map((item, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div className="explain-item" key={index}>
                <TextArea
                  placeholder="请添加说明"
                  style={{ marginBottom: 20 }}
                  value={item?.explainTxt}
                  onChange={(e) => { changeExplainVal(e, index); }}
                  disabled={disabled}
                  autoSize
                />
                <UploadImage
                  explainFile={item?.explainFile}
                  setExplainFile={((file) => { changeExplainFile(file, index); })}
                  disabled={disabled}
                />
                {
                  disabled ? null : <Button icon={<MinusOutlined />} style={{ border: '1px dashed #ccc', marginTop: 10 }} onClick={() => { deleteExplainItem(index); }}>删除说明</Button>
                }

              </div>
            ))
          }
        </div>

        {
          disabled ? null : (
            <Button type="primary" style={{ marginTop: 10 }} icon={<PlusOutlined />} onClick={addExplainItem}>添加说明</Button>
          )
        }
      </div>
    </Modal>
  );
}

export default forwardRef(ColExplainPanel);
