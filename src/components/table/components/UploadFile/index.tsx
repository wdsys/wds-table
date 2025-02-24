// @ts-nocheck
import React, { useContext, useEffect, useState } from 'react';
import { Modal, Button } from 'antd';
import './index.less';

const uploadTypeString = (uploadType) => {
  switch (uploadType) {
  case 'image':
    return 'image/*';
  case 'js':
    return '.js';
  default:
    return '';
  }
};

function UploadFile(props) {
  const {
    open, onCancel, uploadType, onChange, uuid, projectId,
  } = props;

  const [selectFile, setSelectFile] = useState();

  function onOk() {
    if (onChange) {
      onChange({
        file: selectFile,
        source: 'project',
        uuid,
      });
    }

    onCancel();
  }

  function handleChange(e) {
    const file = e?.target?.files?.[0];

    if (!file) {
      return;
    }

    if (onChange) {
      onChange({
        file,
        source: 'local',
        uuid,
      });
    }
  }

  function onLocalUpload() {
    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = uploadTypeString(uploadType);
    // inputFile.multiple = true;
    inputFile.hidden = true;
    inputFile.onchange = handleChange;
    inputFile.click();
    inputFile.remove();

    onCancel();
  }

  function footer() {
    return (
      <div>
        <Button onClick={onLocalUpload}>从本地上传</Button>
        <Button disabled={!selectFile} onClick={onOk}>打开</Button>
        <Button onClick={onCancel}>取消</Button>
      </div>
    );
  }

  return (
    <Modal
      title="上传文件"
      destroyOnClose
      open={open}
      onCancel={onCancel}
      width="70%"
      className="upload-file-modal"
      footer={footer()}
    >
      abc
    </Modal>
  );
}

export default UploadFile;
