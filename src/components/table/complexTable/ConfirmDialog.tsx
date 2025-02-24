// @ts-nocheck
import React, {
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';

import ReactDOM from 'react-dom/client';

import {
  Modal,
} from 'antd';

import { delay } from '../utils';

export const PromptDialog = forwardRef((props, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [value, setValue] = useState('');
  const [callback, setCallback] = useState(null);

  async function showConfirm(message) {
    setValue(message);

    return new Promise((resolve, reject) => {
      function cb(newValue) {
        resolve(newValue);
      }

      setCallback((oldCallback) => cb);
      setIsModalVisible(true);
    });
  }

  function createHandle() {
    return {
      confirm: showConfirm,
    };
  }

  useImperativeHandle(ref, createHandle, []);

  function handleOk() {
    setIsModalVisible(false);
    if (callback) {
      callback(true);
    }
  }

  function handleCancel() {
    setIsModalVisible(false);
    if (callback) {
      callback(false);
    }
  }

  return (
    <Modal
      title="请确认"
      maskClosable={false}
      open={isModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div>
        {value}
      </div>
    </Modal>
  );
});

export async function confirm(message) {
  const overlay = document.createElement('div');
  const ref = React.createRef();

  // const elem = React.createElement(PromptDialog, { ref });

  ReactDOM.createRoot(overlay).render(<PromptDialog ref={ref} />);
  await delay(100)
  const result = await ref.current.confirm(message);

  overlay.remove();
  return result;
}
