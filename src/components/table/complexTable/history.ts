// @ts-nocheck
const MaxHistoryCount = 100;

const TableStack = [];

const TableStackState = {
  cursor: -1,
};

function onLoaded() {
  while (TableStack.length > 1) {
    TableStack.shift();
  }

  TableStackState.cursor = -1;
}

function current() {
  return TableStack.at(TableStackState.cursor);
}

function push(snapshot) {
  while (TableStackState.cursor < -1) {
    TableStack.pop();
    TableStackState.cursor += 1;
  }

  TableStack.push(snapshot);

  while (TableStack.length > MaxHistoryCount) {
    TableStack.shift();
  }

  return TableStack.length;
}

function goBack() {
  // console.log('goBack', TableStackState.cursor, TableStack.length);

  const prevSnapshot = TableStack.at(TableStackState.cursor - 1);
  if (!prevSnapshot) {
    return null;
  }

  let doc = null;

  try {
    doc = JSON.parse(prevSnapshot);
  } catch (err) {
    return null;
  }

  if (!doc) {
    return null;
  }

  TableStackState.cursor -= 1;
  return doc;
}

function goForward() {
  // console.log('goForward', TableStackState.cursor, TableStack.length);

  if (TableStackState.cursor >= -1) {
    return null;
  }

  const nextSnapshot = TableStack.at(TableStackState.cursor + 1);
  if (!nextSnapshot) {
    return null;
  }

  let doc = null;

  try {
    doc = JSON.parse(nextSnapshot);
  } catch (err) {
    return null;
  }

  if (!doc) {
    return null;
  }

  TableStackState.cursor += 1;
  return doc;
}

export default {
  TableStack,
  TableStackState,
  onLoaded,
  current,
  push,
  goBack,
  goForward,
};
