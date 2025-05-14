// @ts-nocheck
import React, {
  useState,
  useContext,
  useEffect, useRef, useMemo, createRef,
} from 'react';
import axios from 'axios';
import { func } from 'prop-types';
import {
  Button, Modal, message, Popover,
} from 'antd';
import CheckItem from '../../components/CheckItem';
import { blobToJson } from '../../utils';

import {
  InterfaceFunctionContext,
  CellRendererContext,
} from '../contexts';

import { PageContext } from '../../contexts';

import { showGallery } from '../AlbumViewer';
import { showCinema } from '../VideoViewer';
import { confirm } from '../ConfirmDialog';
import * as utils from '../utils';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

import { base64ToBlob, saveBlobToFile, openFilePathWithDefaultApp } from '@/utils/file'

function ModalTitle({ name, preId }) {
  function toggleWrap() {
    document.getElementById(preId).classList.toggle('wrap');
  }
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
    >
      <div>{name}</div>
      <Popover
        content={<CheckItem option={{ label: '自动换行' }} onChange={toggleWrap} />}
        trigger={['click']}
        placement="bottomRight"
        showArrow={false}
        overlayClassName="nopadding"
      >
        <Button type="text">查看</Button>
      </Popover>
    </div>
  );
}

function FileOperationPanel(props, ref) {
  const {
    getAPIBaseURL,
    getAttachmentVideo,
    createAttachmentVideo,
    deleteAttachmentVideo,
    getResourceAttachment,
  } = useContext(InterfaceFunctionContext);

  const {
    projectId,
    columns, setColumns,
    rows, setRows,
    tableUUID,
    getAttachment,
    deleteAttachment,
    tableManager,
  } = useContext(CellRendererContext);

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 190,
    minHeight: 395,
  });
  useToggleablePanel(ref, setPanelState);

  const {
    row,
    column,
    file,
    locked,
  } = panelState;

  const rowUUID = row?.uuid;
  const colUUID = column?.uuid;
  const isImage = utils.isImage(file?.name || '');
  const isVideo = utils.isVideo(file?.name || '');
  const isSupportFile = utils.isSupportFileExt(file?.name || '');
  let currentColumn = null;
  for (const col of columns) {
    if (col.uuid === panelState.column) {
      currentColumn = col;
      break;
    }
  }
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
  const getEnv = async (name) => {
    const url = `http://127.0.0.1:12500/api/system/env/${name}`;
    return axios({
      url,
      method: 'get',
    });
  };
  const getSystem = () => {
    const url = 'http://127.0.0.1:12500/api/system/type';
    return axios({
      url,
      method: 'get',
    });
  };
  const openFile = async (data) => {
    const url = `http://127.0.0.1:12500/api/shell/open_file?path=${data}`;
    return axios({
      url,
      method: 'post',
    });
  };
  function closePanel() {
    const detail = {
      panelType: 'FileCellPanel',
      action: 'hide',
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);

    setPanelState((oldState) => ({
      ...oldState,
      visible: false,
    }));
  }

  async function onClickOpen() {
    if (!file.digest) {
      return;
    }

    let blob;
    if (file.source === 'resource') {
      blob = await getResourceAttachment(projectId, file.fileUrl);
    } else {
      blob = await getAttachment(projectId, file.digest);
    }

    if (!blob) {
      return;
    }
    utils.openBlobByOS(blob, file.name);
    // getAttachment(projectId, file.digest).then((blob) => {
    //   utils.openBlobByOS(blob, file.name);
    // });

    closePanel();
  }

  async function onClickDownload() {
    // let blob;
    // if (file.source === 'resource') {
    //   blob = await getResourceAttachment(projectId, file.fileUrl);
    // } else {
    //   blob = await getAttachment(projectId, file.digest);
    // }

    // const base64String = getAttachment(file.uuid);
    // if(base64String){
    //   blob = base64ToBlob(base64String)
    // }

    // if (!blob) {
    //   return;
    // }

    // // eslint-disable-next-line consistent-return
    // // getAttachment(projectId, file.digest, tableUUID).then(async (blob) => {

    // // utils.downloadFile(blob, file.name);
    // // });

    // await saveBlobToFile(file.name, blob)

    // closePanel();

    try {
      // Get file blob from temp directory
      const blob = await tableManager.getAttachmentBlob(`${file.uuid}-${file.name}`);
      
      if (!blob) {
        message.error('Failed to download file');
        return;
      }
  
      // Save the blob to user selected location
      await saveBlobToFile(file.name, blob);
      
      message.success('File downloaded successfully');
      closePanel();
    } catch (error) {
      console.error('Download failed:', error);
      message.error('Failed to download file');
    }
  }

  function getOnlinePreviewType(filename) {
    let type = null;
    let ect = '';
    ect = ['.txt', '.md', '.json', '.xml',
      '.csv', '.log'].find((i) => filename?.endsWith?.(i));
    if (ect) {
      type = 'txt';
    }
    ect = ['.mp3', '.aac', '.ogg'].find((i) => filename?.endsWith(i));
    if (ect) {
      type = 'audio';
    }
    return type ? [type, ect] : null;
  }

  function previewOnline(name, blob, [type]) {
    if (type === 'txt') {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        Modal.info({
          title: <ModalTitle name={name} preId="preview-table-file" />,
          okText: '关闭',
          width: 1000,
          icon: <span />,
          maskClosable: false,
          content: (
            <div style={{
              maxHeight: 600,
              overflowY: 'auto',
            }}
            >
              <pre id="preview-table-file">{reader.result}</pre>
            </div>
          ),
        });
      });
      reader.readAsText(blob);
    }
    function closeAudio() {
      document.getElementById('preview-audio')?.pause?.();
    }
    if (type === 'audio') {
      const url = URL.createObjectURL(blob);
      Modal.info({
        title: name || '文件预览',
        icon: <span />,
        maskClosable: false,
        okText: '关闭',
        onOk: closeAudio,
        content: (
          <audio id="preview-audio" style={{ width: '100%', paddingTop: 20 }} src={url} controls />
        ),
      });
    }
  }

  async function onClickViewFile() {
    const { name } = file;
    if (!name) return;

      const path = await tableManager.getAttachmentPath(`${file.uuid}-${file.name}`);


      if (!path) {
        return;
      }
      await openFilePathWithDefaultApp(path)
      closePanel();
  }
  function onClickViewImage() {
    const data = [];
    for (const oneRow of rows) {
      const value = oneRow.fields?.[colUUID];
      if (value?.length) {
        for (const item of value) {
          if (utils.isImage(item.name)) {
            data.push(item);
          }
        }
      }
    }

    showGallery({
      data,
      projectId,
      getAttachment,
      getResourceAttachment,
      defaultFileDigest: file.digest,
    });

    closePanel();
  }

  function onClickWatchVideo() {
    console.log('onClickWatchVideo: projectId:', projectId);
    console.log('onClickWatchVideo: rowUUID:', rowUUID);
    console.log('onClickWatchVideo: colUUID:', colUUID);
    console.log('onClickWatchVideo: row:', row);
    console.log('onClickWatchVideo: column:', column);
    console.log('onClickWatchVideo: file:', file);

    const data = {
      file,
    };

    showCinema({
      data,
      projectId,
      getAPIBaseURL,
      getAttachmentVideo,
      createAttachmentVideo,
      deleteAttachmentVideo,
      getResourceAttachment,
    });

    closePanel();
  }
  async function onClickDelete() {
    if (locked) {
      return;
    }

    if (!(await confirm('确定要删除吗？'))) {
      return;
    }

    setRows((oldData) => {
      const newData = [];

      for (const oldRow of oldData) {
        let newRow;
        if (oldRow.uuid === rowUUID) {
          newRow = { ...oldRow };

          if (oldRow.fields) {
            newRow.fields = { ...oldRow.fields };
          } else {
            newRow.fields = {};
          }

          const oldValue = newRow.fields[colUUID] || [];
          const newValue = [];
          for (const item of oldValue) {
            if (item.uuid === file.uuid) {
              // do nothing
            } else {
              newValue.push(item);
            }
          }

          newRow.fields[colUUID] = newValue;
        } else {
          newRow = oldRow;
        }

        newData.push(newRow);
      }

      return newData;
    });
    deleteAttachment(file.uuid)
    closePanel();
  }

  if (!panelState.visible) {
    return null;
  }
  return (

    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-fileOperationPanel">
        <div className="button-list">
          {
            utils.isElectron()
            && (
              <div className="one-button" onClick={onClickOpen}>
                <span className="name">
                  打开
                </span>
              </div>
            )
          }

          {
            isImage
            && (
              <div className="one-button" onClick={onClickViewImage}>
                <span className="name">
                  查看原图
                </span>
              </div>
            )
          }
          {
            isSupportFile
            && (
              <div className="one-button" onClick={onClickViewFile}>
                <span className="name">
                  打开
                </span>
              </div>
            )
          }

          <div className="one-button" onClick={onClickDownload}>
            <span className="name">
              下载
            </span>
          </div>

          {
            isVideo
            && (
              <div className="one-button" onClick={onClickWatchVideo}>
                <span className="name">
                  观看视频
                </span>
              </div>
            )
          }

          {
            !locked
            && (
              <div className="one-button" onClick={onClickDelete}>
                <span className="name">
                  删除
                </span>
              </div>
            )
          }
        </div>
      </div>
    </OverlayPanelBox>

  );
}

export default React.forwardRef(FileOperationPanel);
