// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';
import sha1 from 'js-sha1';

import React, {
  useState,
  useEffect,
  useContext,
} from 'react';

import {
  Divider,
  Progress,
  message,
} from 'antd';

import {
  InterfaceFunctionContext,
  CellRendererContext,
  LocalStateContext,
} from '../contexts';

import { SimpleMovableList, MoveHandler } from '../MovableList';
import { showGallery } from '../AlbumViewer';
import * as icons from '../SvgIcons';
import * as utils from '../utils';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

import UploadFile from '../../components/UploadFile';

import '../AlbumViewer.less';

function FileListItem(props) {
  const {
    column,
    row,
    keyName,
    itemData,
    locked,
    onClickFile,

    moving,
    translate,
    onMoveStart,
    onMoveEnd,
    onMoving,
  } = props;

  function onClickName(e) {
    onClickFile(itemData);
  }

  function onClickMore(e) {
    const btn = e.target.closest('.right-icon');
    if (!btn) {
      return;
    }

    const rect = btn.getBoundingClientRect();

    const position = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };

    const detail = {
      panelType: 'FileOperationPanel',
      action: 'toggle',
      placement: 'right',
      position,
      file: itemData,
      column,
      row,
      locked,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  function renderRightIcon() {
    const state = itemData.state || 'done';
    if (state === 'done') {
      return (
        <div onClick={onClickMore}>
          <icons.IconOmit />
        </div>
      );
    }
    return (
      <div className="progress">
        <Progress
          strokeColor="#666"
          strokeLinecap="butt"
          strokeWidth={10}
          type="circle"
          width={18}
          percent={itemData.progress || 0}
          showInfo={false}
        />
      </div>
    );
  }

  const boxClassList = ['one-file-box'];
  if (moving) {
    boxClassList.push('moving');
  }

  return (
    <div
      className={boxClassList.join(' ')}
      style={{ transform: `translateY(${translate}px)` }}
    >
      <div className="one-file">
        <MoveHandler
          itemKey={itemData[keyName]}
          className="mover"
          boxClassName="one-file-box"
          onMoveStart={onMoveStart}
          onMoving={onMoving}
          onMoveEnd={onMoveEnd}
        >
          <icons.IconMover />
        </MoveHandler>

        <div className="name" onClick={onClickName}>
          <div className="name-text" title={itemData.name}>
            {itemData.name}
          </div>
        </div>

        <div className="right-icon">
          {renderRightIcon()}
        </div>
      </div>
    </div>
  );
}

function FileList(props) {
  const {
    files,
    setFiles,
    row,
    column,
    setRows,
    locked,
  } = props;

  const {
    projectId,
    columns, setColumns,
    rows,
    getAttachment
  } = useContext(CellRendererContext);

  const {
    getResourceAttachment,
    putAttachment,
  } = useContext(InterfaceFunctionContext);

  const rowUUID = row?.uuid;
  const colUUID = column?.uuid;

  function onMoveFile(movedFiles) {
    setFiles(movedFiles);

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

          const value = [];
          for (const file of movedFiles) {
            const newFile = {
              uuid: file.uuid,
              name: file.name,
              size: file.size,
              type: file.type,
              digest: file.digest,
            };

            value.push(newFile);
          }

          newRow.fields[colUUID] = value;
        } else {
          newRow = oldRow;
        }

        newData.push(newRow);
      }

      return newData;
    });
  }

  function onClickFile(file) {
    if (!utils.isImage(file.name || '')) {
      return;
    }

    const rowUUID1 = row?.uuid;
    const colUUID1 = column?.uuid;

    const data = [];
    for (const row1 of rows) {
      const value = row1.fields?.[colUUID1];
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
  }

  if (!files.length) {
    return (
      <div style={{ padding: '4px 10px', color: '#999' }}>
        No files
      </div>
    );
  }

  return (
    <div className="file-list">
      <div className="movable-list">
        <SimpleMovableList
          listData={files}
          keyName="uuid"
          ItemRenderer={FileListItem}
          itemProps={{
            row,
            column,
            locked,
            onClickFile,
          }}
          vertical
          onListChange={onMoveFile}
          locked={locked}
        />
      </div>

      <Divider />
    </div>
  );
}

function FileUploader(props) {
  const {
    onGotFiles, onPaste, projectId, addProResoureFile,
  } = props;
  const [showHintDrop, setShowHintDrop] = useState(false);
  const [showUploadFile, setShowUploadFile] = useState(false);

  function onWindowPaste(e) {
    const focused = document.activeElement;
    if (focused.classList.contains('file-uploader')) {
      onPaste(e);
    }
  }

  useEffect(() => {
    window.addEventListener('paste', onWindowPaste);
    return () => {
      window.removeEventListener('paste', onWindowPaste);
    };
  }, []);

  function onInputFileChange(e) {
    const { files } = e.target;
    if (files?.length) {
      onGotFiles(files);
    }

    // reset
    e.target.value = '';
  }

  function onClickSelectFile() {
    // setShowUploadFile(true);

    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.multiple = true;
    inputFile.hidden = true;
    inputFile.addEventListener('change', onInputFileChange);
    inputFile.click();
    inputFile.remove();
  }

  function onDragEnter(e) {
    setShowHintDrop(true);
  }

  function onDragOver(e) {
    e.preventDefault();
  }

  function onDragLeave(e) {
    if (!e.target.classList.contains('hint-drop')) {
      return;
    }

    setShowHintDrop(false);
  }

  function onDrop(e) {
    const data = e.dataTransfer.getData('text');
    e.preventDefault();

    const files = [];

    if (e.dataTransfer.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i += 1) {
        if (e.dataTransfer.items[i].kind === 'file') {
          const file = e.dataTransfer.items[i].getAsFile();
          files.push(file);
        }
      }
    } else {
      for (let i = 0; i < e.dataTransfer.files.length; i += 1) {
        const file = e.dataTransfer.files[i];
        files.push(file);
      }
    }

    if (files.length) {
      onGotFiles(files);
    }

    setShowHintDrop(false);
  }

  function handleChange(params) {
    const { file, source } = params;
    if (source === 'project') {
      addProResoureFile(file);
    } else if (source === 'local') {
      onGotFiles([file]);
    }
  }

  return (
    <div
      className="file-uploader"
      tabIndex="0"
      role="button"
      onDragEnter={onDragEnter}
      onPaste={onPaste}
    >
      <div className="hint-icon">
        <icons.IconDropFileHere />
      </div>
      <div className="hint-text">
        <div className="line-1">
          <span>Click Here </span>
          <span className="action-name">to Paste</span>
        </div>

        {
          (utils.getOS() === 'mac'
            && <div className="line-2">(⌘-V)</div>)
          || <div className="line-2">(Ctrl-V)</div>
        }

        <div className="line-3">
          <span className="button action-name" onClick={onClickSelectFile}>select file</span>
          <span className="splitter">or</span>
          <span className="action-name">drop file</span>
        </div>
      </div>
      <div
        className="hint-drop"
        style={{ display: showHintDrop ? 'flex' : 'none' }}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        拖拽文件到此区域即可上传文件
      </div>
      <UploadFile
        open={showUploadFile}
        onCancel={() => { setShowUploadFile(false); }}
        projectId={projectId}
        onChange={handleChange}
      />
    </div>
  );
}

function FileCellPanel(props, ref) {
  const {
    projectId,
    options,
    columns,
    setColumns,
    rows,
    setRows,
    addAttachment,
  } = useContext(CellRendererContext);

  const {
    putAttachment,
  } = useContext(InterfaceFunctionContext);

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 230,
    minHeight: 120,
  });

  useToggleablePanel(ref, setPanelState);

  function getCurrentColumn() {
    let currentColumn;

    for (const col of columns) {
      if (col.uuid === panelState.column) {
        currentColumn = col;
        break;
      }
    }

    return currentColumn;
  }

  function getCurrentRow() {
    let currentRow;

    for (const row of rows) {
      if (row.uuid === panelState.row) {
        currentRow = row;
        break;
      }
    }

    return currentRow;
  }

  const currentColumn = getCurrentColumn();
  const currentRow = getCurrentRow();
  const colUUID = currentColumn?.uuid;
  const rowUUID = currentRow?.uuid;
  const locked = options?.lockFullTable
    || currentColumn?.locked || currentRow?.locked;
  const cellValue = currentRow?.fields?.[colUUID];

  // console.log('currentColumn:', currentColumn);
  // console.log('currentRow:', currentRow);
  // console.log('cellValue:', cellValue);

  const [files, setFiles] = useState(cellValue || []);

  useEffect(() => {
    if (Array.isArray(cellValue)) {
      setFiles(cellValue);
    } else {
      setFiles([]);
    }
  }, [panelState]);

  function addFile(file) {
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

          const value = newRow.fields[colUUID] || [];
          const newFile = {
            uuid: file.uuid,
            name: file.name,
            size: file.size,
            type: file.type,
          };

          newRow.fields[colUUID] = [...value, newFile];
        } else {
          newRow = oldRow;
        }

        newData.push(newRow);
      }

      return newData;
    });
  }

  // 添加项目资源文件
  function addProResoureFile(file) {
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
          const value = newRow.fields[colUUID] || [];
          const newFile = {
            uuid: file.uuid,
            name: file.name,
            size: file.size,
            digest: file.digest,
            fileUrl: file.resourcePath,
            source: 'resource',
          };

          newRow.fields[colUUID] = [...value, newFile];
        } else {
          newRow = oldRow;
        }

        newData.push(newRow);
      }

      return newData;
    });
  }

  function setFileProps(props1) {
    setFiles((oldFiles) => {
      const newFiles = [];

      for (const file of oldFiles) {
        if (file.uuid === props1.uuid) {
          newFiles.push({
            ...file,
            ...props1,
          });
        } else {
          newFiles.push(file);
        }
      }

      return newFiles;
    });
  }

  async function uploadFile(file) {
    const uniqueName = await addAttachment(file.uuid, file.file)

    file.name = file.file.name;
      setFileProps({
        uuid: file.uuid,
        relativePath: uniqueName,
        progress: 100,
        state: 'done',
      });

      addFile(file);
  }

  useEffect(() => {
    let uploadingFile = null;
    for (const file of files) {
      if (file.state === 'uploading') {
        uploadingFile = file;
        break;
      }
    }

    if (!uploadingFile) {
      for (const file of files) {
        if (file.state === 'pending') {
          uploadFile(file);
          setFileProps({ uuid: file.uuid, state: 'uploading' });
          break;
        }
      }
    }
  }, [files]);

  async function onPaste(event) {
    event.stopPropagation();

    const data = event.clipboardData || window.clipboardData;
    let file = null; // 存储文件数据
    if (data.items && data.items.length) {
      // 检索剪切板items
      for (const value of data.items) {
        if (value.type.indexOf('image') !== -1) {
          file = value.getAsFile();
          break;
        }
      }
    }

    if (file) {
      const uuid = uuidv4();
      const { name, size, type } = file;

      const fileInfo = {
        uuid,
        file,
        name,
        size,
        type,
        state: 'prepare',
      };

      setFiles((oldFiles) => [...oldFiles, fileInfo]);

      setFileProps({
        uuid,
        state: 'pending',
      });
    } else {
      message.error('请粘贴图片类型的文件');
      event.preventDefault();
    }
  }

  async function onGotFiles(files1) {
    for (const file of files1) {
      const uuid = uuidv4();
      const { name, size, type } = file;

      const fileInfo = {
        uuid,
        file,
        name,
        size,
        type,
        state: 'prepare',
      };

      setFiles((oldFiles) => [...oldFiles, fileInfo]);

      setFileProps({
        uuid,
        state: 'pending',
      });
    }
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="overlay-fileCellPanel">
        <FileList
          files={files}
          setFiles={setFiles}
          column={currentColumn}
          row={currentRow}
          setRows={setRows}
          locked={locked}
        />

        {
          !locked
          && (
            <FileUploader
              onGotFiles={onGotFiles}
              onPaste={onPaste}
              projectId={projectId}
              addProResoureFile={addProResoureFile}
            />
          )
        }
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(FileCellPanel);
