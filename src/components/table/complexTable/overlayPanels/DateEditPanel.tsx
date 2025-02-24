// @ts-nocheck
import moment from 'moment';
import lodash from 'lodash';

import React, {
  useState,
  useEffect,
  useContext,
  useReducer,
} from 'react';

import Calendar from '../../components/Calendar';

import {
  CellRendererContext,
} from '../contexts';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

function getCurrentColumnByUUID(columns, uuid) {
  for (const col of columns) {
    if (col.uuid === uuid) {
      return col;
    }
  }

  return null;
}

function getCurrentRowByUUID(rows, uuid) {
  for (const row of rows) {
    if (row.uuid === uuid) {
      return row;
    }
  }

  return null;
}

function calendarReducer(state, action) {
  if (action.type === 'select') {
    return { value: moment(action.value) };
  }

  if (action.type === 'clear') {
    return { value: null };
  }

  throw new Error(`invalid action ${action.type}`);
}

function setCellValue(setRows, colUUID, rowUUID, newValue) {
  setRows((oldData) => {
    const newData = [];

    for (const row of oldData) {
      let newRow;
      if (row.uuid === rowUUID) {
        newRow = {
          ...row,
          fields: {
            ...row.fields,
            [colUUID]: newValue,
          },
        };
      } else {
        newRow = row;
      }

      newData.push(newRow);
    }

    return newData;
  });
}

const DateEditerMemo = React.memo((props) => {
  const { value, dispatch, closePanel } = props;

  function onSelectDate(val) {
    closePanel();
    dispatch({ type: 'select', value: val });
  }

  function onClickClear() {
    closePanel();
    dispatch({ type: 'clear' });
  }
  return (
    <div className="overlay-dateEditPanel">
      <div className="calendar">
        <Calendar
          value={value}
          onOk={onSelectDate}
          onReset={onClickClear}
        />
      </div>
    </div>
  );
});

function DateEditPanel(props, ref) {
  const {
    columns,
    rows,
    setRows,
  } = useContext(CellRendererContext);

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 300,
    minHeight: 266,
  });

  useToggleablePanel(ref, setPanelState);
  // 初始化当日时间默认选中
  const now = moment();
  const initialState = { value: now };
  const [state, dispatch] = useReducer(calendarReducer, initialState);

  const currentColumn = getCurrentColumnByUUID(columns, panelState.column);
  const currentRow = getCurrentRowByUUID(rows, panelState.row);

  useEffect(() => {
    if (!panelState?.visible) {
      return;
    }

    if (!currentColumn || !currentRow) {
      return;
    }

    let currentDate = moment();

    const cellValue = currentRow.fields?.[currentColumn.uuid];
    if (lodash.isString(cellValue)) {
      if (cellValue.match(/\d{4}-\d{2}-\d{2}/)) {
        currentDate = moment(cellValue);
      }
    }
    if (currentDate !== state.value) {
      dispatch({ type: 'select', value: currentDate });
    }
  }, [panelState]);

  useEffect(() => {
    if (!currentColumn || !currentRow) {
      return;
    }

    const cellValue = currentRow.fields?.[currentColumn.uuid];
    if (state.value) {
      const dateString = state.value?.format?.('YYYY-MM-DD');
      if (dateString !== cellValue) {
        setCellValue(setRows, currentColumn.uuid, currentRow.uuid, dateString);
        // 此处当日期不同时认为日期修改完成，避免因调整月份以及年份修改导致的关闭
        const dayNew = state.value?.date?.();
        const dayOld = cellValue ? moment(cellValue).date() : null;
        const tempTime = moment(state.value).format('YYYY-MM-DD');
        // 获取当天时间
        const currentTime = moment().format('YYYY-MM-DD');
        // 当天时间与选中value值比较
        let todayStatus = null;
        // 如果相等，则时间弹框出现 否则隐藏
        if (currentTime === tempTime) {
          todayStatus = true;
        } else {
          todayStatus = false;
        }
        // if (dayNew !== dayOld) {
        //   setPanelState({
        //     ...panelState,
        //     visible: todayStatus,
        //   });
        // }
      }
    } else if (state.value !== cellValue) {
      setCellValue(setRows, currentColumn.uuid, currentRow.uuid, undefined);
    }
  }, [state.value]);

  if (!panelState.visible) {
    return null;
  }

  function closePanel() {
    setPanelState((v) => ({ ...v, visible: false }));
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <DateEditerMemo
        value={state.value}
        closePanel={closePanel}
        dispatch={dispatch}
      />
    </OverlayPanelBox>
  );
}

export default React.forwardRef(DateEditPanel);
