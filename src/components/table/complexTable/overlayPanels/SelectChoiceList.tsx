// @ts-nocheck
import React, {
  useContext,
} from 'react';

import {
  CellRendererContext,
} from '../contexts';

import { SimpleMovableList, MoveHandler } from '../MovableList';
import DefaultTagColors from '../DefaultTagColors';
import * as icons from '../SvgIcons';

function SelectChoice(props) {
  const {
    keyName,
    itemData,
    locked,
    onClickChoice,
    onClickEditChoice,

    moving,
    translate,
    onMoveStart,
    onMoveEnd,
    onMoving,
  } = props;

  function onClickName(e) {
    if (onClickChoice) {
      onClickChoice(itemData, e);
    }
  }

  const boxClassList = ['one-button-box'];
  if (moving) {
    boxClassList.push('moving');
  }

  const backgroundColor = itemData.color?.color || DefaultTagColors[0].color;

  return (
    <div
      className={boxClassList.join(' ')}
      style={{ transform: `translateY(${translate}px)` }}
    >

      <div className="one-button">
        <MoveHandler
          itemKey={itemData[keyName]}
          className="icon"
          boxClassName="one-button-box"
          onMoveStart={onMoveStart}
          onMoving={onMoving}
          onMoveEnd={onMoveEnd}
        >
          <icons.IconMover />
        </MoveHandler>

        <div className="name" onClick={onClickName}>
          <span className="tag" style={{ backgroundColor }} title={itemData.name}>
            {itemData.name}
          </span>
        </div>
        {
          !locked
          && (
            <div
              className="right-icon"
              onClick={(e) => onClickEditChoice(itemData, e)}
            >
              <icons.IconOmit />
            </div>
          )
        }
      </div>
    </div>
  );
}

function SelectChoiceList(props) {
  const {
    column,
    choices,
    locked,
    onClickChoice,
    onClickEditChoice,
  } = props;

  const { setColumns } = useContext(CellRendererContext);

  function onMoveChoice(newChoices) {
    if (locked) {
      return;
    }

    setColumns((oldColumns) => {
      const newColumns = [];

      for (const col of oldColumns) {
        const newCol = { ...col };
        if (col.uuid === column.uuid) {
          newCol.choices = newChoices;
        }

        newColumns.push(newCol);
      }

      return newColumns;
    });
  }

  return (
    <SimpleMovableList
      listData={choices}
      keyName="uuid"
      ItemRenderer={SelectChoice}
      itemProps={{
        locked,
        onClickChoice,
        onClickEditChoice,
      }}
      vertical
      locked={locked}
      onListChange={onMoveChoice}
    />
  );
}

export default SelectChoiceList;
