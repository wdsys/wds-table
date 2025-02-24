// @ts-nocheck
import React, {
  useState,
  useMemo,
  useContext,
  createContext,
  useEffect,
} from 'react';

import history from './history';
import { DataTypes } from './dataType';

//--------------------------------------------------------------------
// Contexts
//--------------------------------------------------------------------

export const InterfaceFunctionContext = createContext(null);

export const CellRendererContext = createContext(null);

export const OverlayStateContext = createContext(null);

export const LocalStateContext = createContext(null);

export const SheetStampsContext = createContext(null);

//--------------------------------------------------------------------
// Context Providers
//--------------------------------------------------------------------

export function InterfaceFunctionContextProvider(props) {
  const {
    functions,
    children,
  } = props;
  return (
    <InterfaceFunctionContext.Provider value={functions}>
      {children}
    </InterfaceFunctionContext.Provider>
  );
}

export function OverlayStateContextProvider(props) {
  const {
    children,
  } = props;

  const providerValue = useMemo(() => ({
  }), []);

  return (
    <OverlayStateContext.Provider value={providerValue}>
      {children}
    </OverlayStateContext.Provider>
  );
}

function hiddenNotExistColumnType(data, allTypes) {
  data.columns?.forEach?.((col) => {
    if (!allTypes?.[col?.dataType]) {
      col.invisible = true;
    }
  });
}

export function CellRendererContextProvider(props) {
  const {
    projectId,
    requirementSetUUID,
    tableUUID,
    tableDoc,
    treeNodeID,
    treeNodeSpace,
    children,
    tableInfo,
  } = props;

  const [localTable, setLocalTableNoHistory] = useState(tableDoc || {});
  const attachmentsRef = React.useRef();
  
  hiddenNotExistColumnType(localTable, DataTypes);

  useEffect(()=>{
    attachmentsRef.current={
      attachments: tableDoc.attachments
    }
  }, [tableDoc])

  const setLocalTable = (arg, options) => {
    const {
      addHistory = true,
      notifyTableEdited = true,
    } = options || {};

    setLocalTableNoHistory((oldData) => {
      let newData;
      if (typeof arg === 'function') {
        newData = arg(oldData);
      } else {
        newData = arg;
      }

      if (addHistory) {
        const newSnapshot = JSON.stringify(newData);
        const currSnapshot = history.current();
        if (newSnapshot !== currSnapshot) {
          history.push(newSnapshot);
        }
      }

      return newData;
    });

    if (notifyTableEdited) {
      const detail = { tableUUID };
      const event = new CustomEvent('tableEdited', { detail });
      window.dispatchEvent(event);
    }
  };

  const { options } = localTable;

  const setOptions = (arg) => {
    setLocalTable((oldData) => {
      let newOptions;
      if (typeof arg === 'function') {
        newOptions = arg(oldData.options);
      } else {
        newOptions = arg;
      }

      return {
        ...oldData,
        options: newOptions,
      };
    });
  };

  const { columns } = localTable;

  const setColumns = (arg) => {
    setLocalTable((oldData) => {
      let newColumns;
      if (typeof arg === 'function') {
        newColumns = arg(oldData.columns);
      } else {
        newColumns = arg;
      }

      return {
        ...oldData,
        columns: newColumns,
      };
    });
  };

  const { rows } = localTable;

  const setRows = (arg) => {
    setLocalTable((oldData) => {
      let newRows;
      if (typeof arg === 'function') {
        newRows = arg(oldData.rows);
      } else {
        newRows = arg;
      }

      return {
        ...oldData,
        rows: newRows,
      };
    });
  };

  const addAttachment = (id: string, data: string) => {
    if(attachmentsRef.current.attachments){
      attachmentsRef.current.attachments[id] = data
    }else{
      attachmentsRef.current.attachments = {
        [id]: data
      }
    }
  }

  const deleteAttachment = (id: string) => {
    if(attachmentsRef.current.attachments){
      delete attachmentsRef.current.attachments[id]
    }
  }

  const getAttachment = (id: string)=>{
    return attachmentsRef.current.attachments?.[id]
  }

  // const [options, setOptions] = useState(tableDoc.options);
  // const [columns, setColumns] = useState(tableDoc.columns);
  // const [rows, setRows] = useState(tableDoc.rows);
  const [tableSelectable, setTableSelectable] = useState(false);

  const [pagerState, setPagerState] = useState({
    page: 1,
    pageSize: 50,
  });

  const providerValue = useMemo(() => ({
    projectId,
    requirementSetUUID,
    tableUUID,
    treeNodeID,
    treeNodeSpace,
    tableDoc,
    localTable,
    setLocalTable,
    setLocalTableNoHistory,
    options,
    setOptions,
    columns,
    setColumns,
    rows,
    setRows,
    tableSelectable,
    setTableSelectable,
    pagerState,
    setPagerState,
    tableInfo,
    addAttachment,
    deleteAttachment,
    getAttachment,
    attachmentsRef
  }), [
    projectId,
    requirementSetUUID,
    tableUUID,
    treeNodeID,
    treeNodeSpace,
    tableDoc,
    localTable,
    setLocalTable,
    setLocalTableNoHistory,
    options,
    setOptions,
    columns,
    setColumns,
    rows,
    setRows,
    tableSelectable,
    setTableSelectable,
    pagerState,
    setPagerState,
    tableInfo,
    addAttachment,
    deleteAttachment,
  ]);

  return (
    <CellRendererContext.Provider value={providerValue}>
      {children}
    </CellRendererContext.Provider>
  );
}

export function LocalStateContextProvider(props) {
  const {
    lockState,
    acquireLock,
    releaseLock,
    children,
  } = props;

  const [linkedRequirements, setLinkedRequirements] = useState({});

  const [viewLinks, setViewLinks] = useState([]);

  const [currentCoorList, setCurrentCoorList] = useState({});

  const providerValue = useMemo(() => ({
    lockState,
    acquireLock,
    releaseLock,
    linkedRequirements,
    setLinkedRequirements,
    viewLinks,
    setViewLinks,
    currentCoorList,
    setCurrentCoorList,
  }), [
    lockState,
    acquireLock,
    releaseLock,
    linkedRequirements,
    setLinkedRequirements,
    viewLinks,
    setViewLinks,
    currentCoorList,
    setCurrentCoorList,
  ]);
  useEffect(() => {
    window.lockState = lockState;
  }, [lockState]);
  return (
    <LocalStateContext.Provider value={providerValue}>
      {children}
    </LocalStateContext.Provider>
  );
}

export function SheetStampsContextProvider(props) {
  const {
    children,
    projectId, requirementSetUUID,
    tableUUID,
  } = props;

  const [sheetStamps, setSheetStamps] = useState([]);

  async function getData() {
    // const res = await client.getSheetStamps({
    //   projectId,
    //   sheet_uuid: tableUUID,
    //   requirement_uuid: requirementSetUUID,
    // });
    // if (Array.isArray(res)) {
    //   setSheetStamps(res?.filter((i) => i.state === 0));
    // }
  }

  useEffect(() => {
    getData();
  }, [projectId, requirementSetUUID, tableUUID]);

  const context = React.useMemo(() => ({
    sheetStamps,
    refresh: getData,
  }));

  return (
    <SheetStampsContext.Provider value={context}>
      {children}
    </SheetStampsContext.Provider>
  );
}
