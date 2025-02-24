// @ts-nocheck
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import ComplexTable from './complexTable';
import { DefaultData } from './complexTable/DefaultData';
import * as utils from './utils';
import { writeContentToFile } from '@/utils/file';

function addMissingUUIDs(array) {
  for (const entry of array) {
    if (!entry.uuid) {
      entry.uuid = uuidv4();
    }

    if (entry.choices) {
      for (const choice of entry.choices) {
        if (!choice.uuid) {
          choice.uuid = uuidv4();
        }
      }
    }
  }

  return array;
}

function createNullTableDoc(uuid) {
  const options = { ...DefaultData.options };
  options.uuid = uuid;

  const columns = addMissingUUIDs(DefaultData.columns);
  const rows = [];

  const colKeyMap = {};
  for (const col of columns) {
    colKeyMap[col.name] = col.uuid;
  }

  for (const entry of DefaultData.rows) {
    const row = {
      uuid: uuidv4(),
      fields: {},
    };

    for (const key of Object.keys(entry)) {
      const colKey = colKeyMap[key];
      if (colKey) {
        row.fields[colKey] = entry[key];
      }
    }

    rows.push(row);
  }

  return {
    options,
    columns,
    rows,
  };
}

const DefaultTableDoc = {
  options: {},
  columns: [],
  rows: [],
};

export default function Table({ fileData, filename , filePath}) {
  const [tableDoc, setTableDoc] = React.useState(DefaultData);

  function renderNullTable(uuid) {
    const newTableDoc = createNullTableDoc(uuid);
    setTableDoc(newTableDoc);
  }

  function renderTable(uuid, data) {
    const { tableDoc: table } = data;
    if (table.options) {
      table.options.uuid = uuid;
    } else {
      table.options = { uuid };
    }

    setTableDoc(table);
  }

  async function loadTable(data) {
    if (data?.options?.uuid) {
      renderTable(data.options.uuid, { tableDoc: data });
    } else {
      renderNullTable(uuidv4());
    }
  }

  async function putAttachment(projectid, file) {
    const formdata = new FormData();
    formdata.append('file', file.file);

    // const res = await HomePageApi.uploadCustomFile(projectid, formdata, file.name);
    // return res;
  }

  async function getResourceAttachment(...args) {
    // const result = await HomePageApi.getResourceAttachment(...args);
    // return result;
  }

  async function onParseExcelFile(blob) {
    const result = await utils.parseXLSXWithWorker(blob);
    return result;
  }

  const serverAPIFunctions = React.useMemo(() => ({
    putAttachment,
    getResourceAttachment,
  }), []);

  React.useEffect(() => {
    setTableDoc(DefaultTableDoc);

    if (fileData) {
      loadTable(fileData);
    }
  }, [fileData]);

  async function saveTable(doc) {
    await writeContentToFile(filePath, JSON.stringify(doc))
  }

  return (
    <ComplexTable
      tableDoc={tableDoc}
      saveTable={saveTable}
      onParseExcelFile={onParseExcelFile}
      serverAPIFunctions={serverAPIFunctions}
    />
  );
}
