// @ts-nocheck
import React from 'react';
import { Popover } from 'antd';
import './OverlayColorPicker.less';
import { useTranslation } from 'react-i18next';

const NORMALCOLORS = [
  '#ffffff', '#f1f1f1', '#dedede', '#edd9d2', '#fce1cd', '#fcf4cc',
  '#cde7e0', '#cde3f3', '#dbdcf4', '#e7d6f5', '#f4d0f0', '#fbd2d5',
];
const FLUORESCENTCOLORS = [
  '#fff88f', '#d3f8b6', '#affad1', '#b1ffff', '#fdbfff', '#d2cbff',
];

function ColorPicker({ onSelect }) {
  const { t } = useTranslation();
  function getColorsBlock(colors) {
    return colors.map((color) => (
      <div
        style={{
          backgroundColor: color,
        }}
        className="colorBlock"
        key={color}
        onClick={() => onSelect?.(color)}
      >
        {/* {color === '#ffffff' ? '默认' : ''} */}
      </div>
    ));
  }

  return (
    <div className="ctn">
      <div className="header">{t('bg.color')}</div>
      <div className="colorCtn">
        {
          getColorsBlock(NORMALCOLORS)
        }
      </div>
      <div className="header">
        {t('fluorescent')}
      </div>
      <div className="colorCtn">
        {
          getColorsBlock(FLUORESCENTCOLORS)
        }
      </div>
    </div>
  );
}

export default function BgColorPop({
  trigger = 'click', onSelect, onClose, children,
}) {
  const [open, setOpen] = React.useState(false);

  function onOpenChange(o) {
    setOpen(o);
  }

  function innerOnSelect(color) {
    onSelect?.({ backgroundColor: color });
    setOpen(false);
    onClose?.();
  }

  return (
    <Popover
      open={open}
      trigger={trigger}
      placement="right"
      showArrow={false}
      content={<ColorPicker onSelect={innerOnSelect} />}
      onOpenChange={onOpenChange}
    >
      {children}
    </Popover>
  );
}
