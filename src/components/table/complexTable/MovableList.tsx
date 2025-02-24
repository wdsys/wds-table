// @ts-nocheck
import React, { useState, useEffect } from 'react';

//----------------------------------------------------------
// utility functions
//----------------------------------------------------------

function resortKeySeq(list, keyName, movedKey, dn) {
  const oldKeySeq = list.map((item) => item[keyName]);

  if (Math.abs(dn) < 0.9) {
    return oldKeySeq;
  }

  let oldIndex = -1;
  for (let i = 0; i < list.length; i += 1) {
    if (list[i][keyName] === movedKey) {
      oldIndex = i;
      break;
    }
  }

  if (oldIndex === -1) { // not found
    return oldKeySeq;
  }

  let newIndex = oldIndex + dn;
  if (newIndex < 0) {
    newIndex = 0;
  } else if (newIndex > list.length - 1) {
    newIndex = list.length - 1;
  }

  if (Math.abs(newIndex - oldIndex) < 0.9) {
    return oldKeySeq;
  }

  const newSeq = oldKeySeq.filter((k) => k !== movedKey);
  newSeq.splice(newIndex, 0, movedKey);

  return newSeq;
}

function applyKeySeq(list, keyName, newSeq) {
  const itemMap = {};
  for (const item of list) {
    const key = item[keyName];
    itemMap[key] = item;
  }

  const newList = [];
  for (const key of newSeq) {
    const item = itemMap[key];
    newList.push(item);
  }

  return newList;
}

//----------------------------------------------------------
// React components
//----------------------------------------------------------

export function MoveHandler(props) {
  const {
    itemKey,
    boxClassName,
    onMoveStart,
    onMoving,
    onMoveEnd,
    children,
    ...config
  } = props;

  let movingBox = null;
  let isMoving = false;
  let startPosition = null;

  function onMoverMouseMove(e) {
    if (!(isMoving && movingBox && startPosition)) {
      return;
    }

    if (onMoving) {
      const newPosition = [e.pageX, e.pageY];
      onMoving(itemKey, newPosition);
    }
  }

  function onMoverMouseUp(e) {
    document.removeEventListener('mousemove', onMoverMouseMove);
    document.removeEventListener('mouseup', onMoverMouseUp);

    movingBox = null;
    isMoving = false;
    startPosition = null;

    if (onMoveEnd) {
      const newPosition = [e.pageX, e.pageY];
      onMoveEnd(itemKey, newPosition);
    }
  }

  function onMouseDown(e) {
    movingBox = e.target.closest(`.${boxClassName}`);
    if (!movingBox) {
      return;
    }

    isMoving = true;
    startPosition = [e.pageX, e.pageY];

    if (onMoveStart) {
      onMoveStart(itemKey, startPosition, movingBox);
    }

    document.addEventListener('mousemove', onMoverMouseMove);
    document.addEventListener('mouseup', onMoverMouseUp);
  }

  return (
    <div {...config} onMouseDown={onMouseDown}>
      {children}
    </div>
  );
}

export function SimpleMovableList(props) {
  const {
    listData,
    keyName,
    ItemRenderer,
    itemProps = {},
    vertical = true,
    locked = false,
    onListChange,
  } = props;

  const [itemMoving, setItemMoving] = useState({});
  const [itemTranslates, setItemTranslates] = useState({});

  useEffect(() => {
    if (Object.keys(itemTranslates).length > 0) {
      setItemMoving({});
      setItemTranslates({});
    }
  }, [listData]);

  const moveState = {
    key: null,
    startPosition: null,
    elementSize: 1, // width or height
  };

  function onItemMoveStart(key, startPosition, box) {
    if (locked) {
      return;
    }

    moveState.key = key;
    moveState.startPosition = startPosition;

    if (vertical) {
      moveState.elementSize = box.clientHeight;
    } else {
      moveState.elementSize = box.clientWidth;
    }

    setItemMoving((old) => ({
      ...old,
      [key]: true,
    }));
  }

  function onItemMoveEnd(key, newPosition) {
    if (moveState?.key !== key) {
      return;
    }

    if (!moveState?.startPosition) {
      return;
    }

    const dx = newPosition[0] - moveState.startPosition[0];
    const dy = newPosition[1] - moveState.startPosition[1];

    let dn = 0;
    if (vertical) {
      dn = Math.ceil(dy / moveState.elementSize - 0.5);
    } else {
      dn = Math.ceil(dx / moveState.elementSize - 0.5);
    }

    const newSeq = resortKeySeq(listData, keyName, key, dn);
    const newList = applyKeySeq(listData, keyName, newSeq);

    if (onListChange) {
      onListChange(newList);
    }

    setItemMoving((old) => ({
      ...old,
      [key]: false,
    }));

    setItemTranslates({});

    moveState.key = null;
    moveState.startPosition = null;
  }

  function onItemMoving(key, newPosition) {
    if (moveState?.key !== key) {
      return;
    }

    if (!moveState?.startPosition) {
      return;
    }

    const dx = newPosition[0] - moveState.startPosition[0];
    const dy = newPosition[1] - moveState.startPosition[1];

    let dn = 0;
    if (vertical) {
      dn = Math.ceil(dy / moveState.elementSize - 0.5);
    } else {
      dn = Math.ceil(dx / moveState.elementSize - 0.5);
    }

    const newSeq = resortKeySeq(listData, keyName, key, dn);
    const translates = {};

    for (let i = 0; i < listData.length; i += 1) {
      const item = listData[i];
      const key1 = item[keyName];
      const oldIndex = i;

      const newIndex = newSeq.indexOf(key1);
      if (newIndex === -1) {
        console.error('error: cannot find key:', key1);
        return;
      }

      const dn1 = newIndex - oldIndex;
      const disp = dn1 * moveState.elementSize;
      translates[key1] = disp;
    }

    setItemTranslates((old) => ({
      ...translates,
      [key]: vertical ? dy : dx,
    }));
  }

  if (!listData?.length) {
    return null;
  }

  return (
    <>
      {
        listData.map((item) => (
          <ItemRenderer
            key={item[keyName]}
            keyName={keyName}
            itemData={item}
            {...itemProps}
            moving={itemMoving[item[keyName]] || false}
            translate={itemTranslates[item[keyName]] || 0}
            onMoveStart={onItemMoveStart}
            onMoveEnd={onItemMoveEnd}
            onMoving={onItemMoving}
          />
        ))
      }
    </>
  );
}
