// @ts-nocheck
import React from 'react';
import DefaultTagColors from '../DefaultTagColors';
import * as icons from '../SvgIcons';

function TagColorList(props) {
  const {
    chosenColor,
    onChooseColor,
  } = props;

  return (
    <div className="button-list">
      {
        DefaultTagColors.map((item, i) => {
          const isChosen = item.code === chosenColor?.code;
          const visibility = isChosen ? 'visible' : 'hidden';
          return (
            <div key={item.nameCN} className="one-button" onClick={(e) => onChooseColor(item)}>
              <div className="color-sample" style={{ backgroundColor: item.color }} />
              <div className="name">
                {item.nameCN}
              </div>
              <div className="selected" style={{ visibility }}>
                <icons.IconCorrect />
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

export default TagColorList;
