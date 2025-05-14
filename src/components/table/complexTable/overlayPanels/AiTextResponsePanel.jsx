import React, {
  useState,
  useContext,
  useRef,
  useEffect,
  useLayoutEffect,
} from 'react';
import { Spin, Input, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import AISocketManager from '../../aiSocketClass';

import {
  getElementRectInPage,
} from '../utils';
import {
  CellRendererContext,
} from '../contexts';

import useToggleablePanel from './useToggleablePanel';

import './AiTextResponsePanel.less';

function AiTextResponsePanel(props, ref) {
  const {
    setRows,
    tableUUID,
    columns,
  } = useContext(CellRendererContext);

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 191,
    minHeight: 168,
  });
  const [loading, setLoading] = useState(false);
  const [searchVal, setSeatchVal] = useState();
  const [responseText, setResponseText] = useState(null);
  const [location, setLocation] = useState({ left: 0, top: 0 });
  const socketRef = useRef();
  const contentRef = useRef();

  const {
    isTreeNodeCell, cellValue, visible, cellElem,
  } = panelState || {};

  const AiTextPanelRef = useRef(null);

  const {
    hide: hidePanel,
  } = useToggleablePanel(ref, setPanelState);

  useLayoutEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [responseText]);

  // 位置计算
  function initPosition() {
    if (!cellElem) {
      return;
    }
    if (visible) {
      const rect = cellElem.getBoundingClientRect();
      const width = AiTextPanelRef.current?.clientWidth || panelState.minWidth || 100;
      const height = AiTextPanelRef.current?.clientHeight || panelState.minHeight || 100;
      let { left } = rect;
      let top = rect.top + rect.height + 4;
      let right = left + width;
      let bottom = top + height;

      const cont = document.querySelector('.table-global-overlay .container');
      const contRect = getElementRectInPage(cont);
      if (contRect) {
        left -= contRect.left;
        right -= contRect.left;
        top -= contRect.top;
        bottom -= contRect.top;

        if (bottom > (window.innerHeight - contRect.top)) {
          top -= bottom - window.innerHeight + contRect.top + 10;
        }

        if (right > (window.innerWidth - contRect.left)) {
          left -= right - window.innerWidth + contRect.left + 30;
        }

        if (left < 64) {
          left = 64;
        }
      }
      setLocation({ left, top });

      // console.log(`left: ${left}, top: ${top}, right: ${right}, bottom: ${bottom}`);
    }
  }

  function getTipWords(type, content) {
    const cellTxt = isTreeNodeCell ? cellValue?.text : cellValue;
    // return `${searchVal || content}: ${cellTxt}`;
    if (type === '扩写') {
      const currentColumn = columns.find((item) => item.uuid === panelState.colUUID);
      const currentColumnName = currentColumn?.name || '';
      return `You are supposed to continue writing the given text "${cellTxt}".
     If the texts' title "{${currentColumnName}}" suggests an knowledge domain,
    then please respond as an expert in that domain inferred by the title.

    The hint for filling it is as follows:
    ${searchVal || content}

    Note: your response is will not be markdown-rendered, so please answer with
     pure text, without any markdown-formatting token, such as **.`;
    }

    return `The given text: ${cellTxt}.
    
    The hint is as follows:
    ${searchVal || content}

    Note: your response is will not be markdown-rendered, so please answer with
     pure text, without any markdown-formatting token, such as **.
    `;
  }

  async function responseAiText(defaultVal = '') {
    if (!defaultVal && !searchVal && (panelState?.searchType !== '填充')) {
      return;
    }
    setLoading(true);
    setResponseText(null);
    socketRef.current?.leaveRoom?.();
    try {
      // const res = await client.getAIResponse({ content:
      // `请${panelState.searchType}：${defaultVal || searchVal}` });
      // setResponseText(res);
      let res = {};
      if (panelState.searchType === '填充') {
        res = await client.getAITableRoomId({
          projectId, tableUUID, row_uuid: panelState.rowUUID, col_uuid: panelState.colUUID,
        });
      } else {
        res = await client.getAIResponseRoomId({
          content: getTipWords(
            panelState.searchType,
            defaultVal || searchVal,
          ),
        });
      }

      const socket = new AISocketManager();
      socketRef.current = socket;
      socket.getAIData(
        res.room,
        localStorage.getItem('userid'),
        (d) => {
          setResponseText((p) => {
            if (p?.room !== d.room) {
              return { room: res.room, data: d?.result || '' };
            }
            return { room: d.room, data: (p?.data || '') + (d?.result || '') };
          });
        },
        () => { setLoading(false); console.log('end'); },
        () => { setLoading(false); },
      );
    } catch (e) {
      console.error(e);
      setLoading(false);
    } finally {
      setTimeout(() => {
        initPosition();
      }, 100);
    }
  }

  useEffect(() => {
    if (visible) {
      const cellTxt = isTreeNodeCell ? cellValue?.text : cellValue;
      console.log(panelState, 'panelStatepanelState');
      setSeatchVal(`请将以上内容进行${panelState?.searchType}`);
      if (cellTxt || panelState?.searchType === '填充') {
        responseAiText(`请将以上内容进行${panelState?.searchType}`);
      }
      initPosition();
    } else {
      socketRef.current?.leaveRoom?.();
      socketRef.current?.disconnect?.();
    }
  }, [panelState.visible]);

  function onChangeSearchVal(e) {
    const val = e?.target?.value;
    setSeatchVal(val);
  }

  function closePanel() {
    socketRef.current?.leaveRoom?.();
    socketRef.current?.disconnect?.();
    setSeatchVal('');
    setResponseText('');
    setLocation({ top: 0, left: 0 });
    hidePanel();
  }

  function onScroll(e) {
    const rect = cellElem.getBoundingClientRect();
    const cont = document.querySelector('.table-global-overlay .container');
    const contRect = getElementRectInPage(cont);

    const caculationTop = rect.top + rect.height - contRect.top;
    const caculationLeft = rect.left + rect.width - contRect.left;
    if ((caculationTop <= (e.target.offsetTop + 42)) || caculationLeft <= 64) {
      closePanel();
    } else {
      initPosition();
    }
  }

  useEffect(() => {
    // Y
    const table = document.querySelector('.complex-table');
    const tbody = table?.querySelector?.('.tbody');
    // X
    const scrollCols = document.querySelector('.scroll-columns');

    if (visible) {
      if (tbody) {
        tbody.addEventListener('scroll', onScroll);
      }

      if (scrollCols) {
        scrollCols.addEventListener('scroll', onScroll);
      }
    }

    return () => {
      if (tbody) {
        tbody.removeEventListener('scroll', onScroll);
        scrollCols.removeEventListener('scroll', onScroll);
      }
    };
  }, [location, visible]);

  function replaceRowContent() {
    socketRef.current?.leaveRoom?.();
    setRows((oldRows) => {
      const newRows = [];

      for (const item of oldRows) {
        if (item.uuid === panelState.rowUUID) {
          const cellTxt = isTreeNodeCell
            ? { ...(cellValue || {}), text: responseText?.data } : responseText?.data;
          newRows.push({
            uuid: item.uuid,
            fields: {
              ...(item?.fields || {}),
              [panelState.colUUID]: cellTxt,
            },
          });
        } else {
          newRows.push(item);
        }
      }

      return newRows;
    });

    closePanel();
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <div
      className="overlay-aiTextResponse"
      ref={AiTextPanelRef}
      style={{
        display: panelState.visible ? 'block' : 'none',
        left: `${location?.left || 0}px`,
        top: `${location?.top || 0}px`,
      }}
    >
      <Button icon={<CloseOutlined />} onClick={closePanel} className="overlay-close" />

      <div className="aiTextResponse-title">AI搜索 </div>
      <Input.TextArea className="aiTextResponse-search" value={searchVal} rows={2} onChange={onChangeSearchVal} />
      {
        loading ? (
          <div className="overlay-loading">
            <Spin />
          </div>
        ) : (
          <>
            <div ref={contentRef} className="aiTextResponse-content">
              {responseText?.data || ''}
            </div>
            <div className="overlay-footer">
              <Button type="primary" onClick={replaceRowContent}>替换</Button>
              <Button type="primary" onClick={() => { responseAiText(); }}>重新生成</Button>
              <Button onClick={closePanel}>关闭</Button>
            </div>
          </>
        )
      }
    </div>
  );
}

export default React.forwardRef(AiTextResponsePanel);
