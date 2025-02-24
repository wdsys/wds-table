// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { Tooltip } from 'antd';

import {
  LeftOutlined,
  RightOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  RetweetOutlined,
  ShrinkOutlined,
  CloseOutlined,
} from '@ant-design/icons';

import { getBestObjectSizeAndPosition } from './SpaceFitness';
import * as utils from './utils';
import * as icons from './SvgIcons';
import './AlbumViewer.less';

function parseSingleTransformValue(str) {
  if (str.match(/\s*([^%a-z]+)([%a-z]*)\s*/)) {
    const value = parseFloat(RegExp.$1);
    const unit = RegExp.$2;
    return [value, unit];
  }
  return [0, null];
}

function parseCombinedTransformValue(str) {
  const values = [];
  const parts = str.split(/\s*,\s*/);

  for (const part of parts) {
    if (part.length > 0) {
      const value = parseSingleTransformValue(part);
      values.push(value);
    }
  }

  return values;
}

function parseTransform(str) {
  const data = {};

  const re = /(translate|scale|rotate)\((.+?)\)/;
  let tail = str;

  while (tail.length > 0) {
    const m = tail.match(re);
    if (!m) {
      break;
    }

    const part = m[0];
    const verb = m[1];
    const value = parseCombinedTransformValue(m[2]);
    data[verb] = value;

    tail = tail.substr(part.length);
  }

  return data;
}

function formatTransform(transform) {
  const parts = [];

  for (const key of Object.keys(transform)) {
    const values = transform[key];
    const frags = [];

    for (const value of values) {
      const [val, unit] = value;
      if (unit !== null) {
        frags.push(`${val}${unit}`);
      } else {
        frags.push(`${val}`);
      }
    }

    const valueString = frags.join(',');
    const part = `${key}(${valueString})`;
    parts.push(part);
  }

  return parts.join(' ');
}

const DefaultTransform = {
  translate: [[0, 'px'], [0, 'px']],
  scale: [[1.0, ''], [1.0, '']],
  rotate: [[0, 'deg']],
};

const DeltaTranslate = 100;

function translate(dx = 0, dy = 0) {
  const img = document.querySelector('.image-gallery .image-box img');
  if (!img) {
    return;
  }

  let oldTransform = img.style.transform;
  if (!oldTransform) {
    oldTransform = DefaultTransform;
  } else {
    oldTransform = parseTransform(oldTransform);
  }

  const newTranslate = [...oldTransform.translate];

  if (newTranslate[0]) {
    newTranslate[0][0] += dx;
  } else {
    newTranslate[0] = [dx, 'px'];
  }

  if (newTranslate[1]) {
    newTranslate[1][0] += dy;
  } else {
    newTranslate[1] = [dy, 'px'];
  }

  const newTransform = { ...oldTransform };
  newTransform.translate = newTranslate;

  img.style.transform = formatTransform(newTransform);
}

function translateUp(delta = DeltaTranslate) {
  translate(0, -delta);
}

function translateDown(delta = DeltaTranslate) {
  translate(0, delta);
}

function translateLeft(delta = DeltaTranslate) {
  translate(-delta, 0);
}

function translateRight(delta = DeltaTranslate) {
  translate(delta, 0);
}

function rotateLeft() {
  const img = document.querySelector('.image-gallery .image-box img');
  if (!img) {
    return;
  }

  let oldTransform = img.style.transform;
  if (!oldTransform) {
    oldTransform = DefaultTransform;
  } else {
    oldTransform = parseTransform(oldTransform);
  }

  const newRotate = [...oldTransform.rotate];
  newRotate[0][0] -= 90;
  // newRotate[0][0] %= 360;

  const newTransform = { ...oldTransform };
  newTransform.rotate = newRotate;

  img.style.transform = formatTransform(newTransform);
}

function rotateRight() {
  const img = document.querySelector('.image-gallery .image-box img');
  if (!img) {
    return;
  }

  let oldTransform = img.style.transform;
  if (!oldTransform) {
    oldTransform = DefaultTransform;
  } else {
    oldTransform = parseTransform(oldTransform);
  }

  const newRotate = [...oldTransform.rotate];
  newRotate[0][0] += 90;
  // newRotate[0][0] %= 360;

  const newTransform = { ...oldTransform };
  newTransform.rotate = newRotate;

  img.style.transform = formatTransform(newTransform);
}

function scaleByFactor(factor = 1.0) {
  if (factor > 100.0) {
    factor = 100.0;
  } else if (factor < 0.01) {
    factor = 0.01;
  }

  const img = document.querySelector('.image-gallery .image-box img');
  if (!img) {
    return;
  }

  const width = img.naturalWidth || 1;
  const height = img.naturalHeight || 1;
  const minHScale = 1.0 / width;
  const minVScale = 1.0 / height;
  const minScale = Math.max(minHScale, minVScale);
  const maxScale = 100;

  let oldTransform = img.style.transform;
  if (!oldTransform) {
    oldTransform = DefaultTransform;
  } else {
    oldTransform = parseTransform(oldTransform);
  }

  const newScale = [...oldTransform.scale];
  for (const item of newScale) {
    const newValue = item[0] * factor;
    item[0] = utils.clamp(newValue, minScale, maxScale);
  }

  const newTransform = { ...oldTransform };
  newTransform.scale = newScale;

  img.style.transform = formatTransform(newTransform);
}

function scaleDown(factor = 0.9) {
  scaleByFactor(factor);
}

function scaleUp(factor = 1.1) {
  scaleByFactor(factor);
}

function resetTranform() {
  const img = document.querySelector('.image-gallery .image-box img');
  if (!img) {
    return;
  }

  const newTransform = { ...DefaultTransform };

  img.style.transform = formatTransform(newTransform);
}

function autoTranform() {
  const img = document.querySelector('.image-gallery .image-box img');
  if (!img) {
    return;
  }

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  const box = document.querySelector('.image-gallery .image-box');
  if (!box) {
    return;
  }

  let scaleX = 1.0;
  let scaleY = 1.0;

  if (iw > box.clientWidth || ih > box.clientHeight) {
    const space = {
      width: box.clientWidth,
      height: box.clientHeight,
      paddingX: 0,
      paddingY: 0,
    };

    const object = {
      width: iw,
      height: ih,
    };

    const fitness = getBestObjectSizeAndPosition(space, object);

    scaleX = fitness.width / object.width;
    scaleY = fitness.height / object.height;
  }

  const newTransform = { ...DefaultTransform };
  newTransform.scale = [
    [scaleX, ''],
    [scaleY, ''],
  ];

  img.style.transform = formatTransform(newTransform);
}

function TooltipButton(props) {
  const {
    title,
    onClick,
    children,
  } = props;

  return (
    <Tooltip
      title={title}
      color="#999"
      placement="bottomLeft"
      mouseEnterDelay={0.5}
      mouseLeaveDelay={0.1}
      trigger="hover"
    >
      <div className="gallery-button" onClick={onClick}>
        {children}
      </div>
    </Tooltip>
  );
}

export function ImageGallery(props) {
  const {
    data,
    defaultIndex = 0,
    projectId,
    onClose,
    getAttachment,
    getResourceAttachment,
  } = props;

  const refImage = useRef(null);

  const [index, setIndex] = useState(defaultIndex);
  const image = data.at(index);

  const [imageURL, setImageURL] = useState('');

  const getImageURL = async (file) => {
    const {
      name, digest, fileUrl, source,
    } = file;

    let blob;

    if (source === 'resource') { // 资源
      blob = await getResourceAttachment(projectId, fileUrl);
    } else { // 本地
      blob = await getAttachment(projectId, digest);
    }

    const isSVG = name?.endsWith('.svg');
    if (isSVG) {
      blob = new Blob([blob], { type: 'image/svg+xml' });
    }

    return URL.createObjectURL(blob);
  };

  useEffect(() => {
    if (image) {
      getImageURL(image).then((url) => {
        setImageURL(url);
      });
    }
  }, [image]);

  function onImageLoad(e) {
    autoTranform();

    if (refImage.current) {
      setTimeout(() => {
        refImage.current.style.transition = 'transform 0.2s linear';
      }, 100);
    }
  }

  let oldPosition = null;

  function onImageMouseMove(e) {
    // TODO
  }

  function onImageMouseUp(e) {
    window.removeEventListener('mousemove', onImageMouseMove);
    window.removeEventListener('mouseup', onImageMouseUp);

    if (!oldPosition) {
      return;
    }

    const newPosition = {
      x: e.pageX,
      y: e.pageY,
    };

    const dx = newPosition.x - oldPosition.x;
    const dy = newPosition.y - oldPosition.y;
    translate(dx, dy);

    oldPosition = null;
  }

  function onImageMouseDown(e) {
    window.addEventListener('mousemove', onImageMouseMove);
    window.addEventListener('mouseup', onImageMouseUp);

    oldPosition = {
      x: e.pageX,
      y: e.pageY,
    };
  }

  function onImageDragStart(e) {
    e.preventDefault();
  }

  function gotoPrev() {
    if (refImage.current) {
      refImage.current.style.transition = 'none';
    }

    setIndex((oldIndex) => {
      if (oldIndex > 0) {
        return oldIndex - 1;
      }
      return oldIndex;
    });
  }

  function gotoNext() {
    if (refImage.current) {
      refImage.current.style.transition = 'none';
    }

    setIndex((oldIndex) => {
      if (oldIndex < data.length - 1) {
        return oldIndex + 1;
      }
      return oldIndex;
    });
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (onClose) {
        onClose();
      }
    } else if (e.key === '['
      || e.key === 'j'
      || e.key === 'ArrowLeft') {
      gotoPrev();
    } else if (e.key === ']'
      || e.key === 'l'
      || e.key === 'ArrowRight') {
      gotoNext();
    } else if (e.key === 'w') {
      translateDown();
    } else if (e.key === 's') {
      translateUp();
    } else if (e.key === 'a') {
      translateRight();
    } else if (e.key === 'd') {
      translateLeft();
    } else if (e.key === 'q') {
      rotateLeft();
    } else if (e.key === 'e') {
      rotateRight();
    } else if (e.key === '-'
      || e.key === '_') {
      scaleDown();
    } else if (e.key === '='
      || e.key === '+') {
      scaleUp();
    } else if (e.key === 'r') {
      resetTranform();
    } else if (e.key === 'f') {
      autoTranform();
    }
  }

  function onWheelCapture(e) {
    const os = utils.getOS();

    let { deltaY } = e;
    if (os === 'mac') {
      deltaY *= -1;
    }

    if (e.deltaY > 0) {
      scaleUp(1.0 - Math.abs(e.deltaY) * 0.0005);
    } else {
      scaleDown(1.0 + Math.abs(e.deltaY) * 0.0005);
    }
  }

  function onClickClose() {
    if (onClose) {
      onClose();
    }
  }

  function selectBackground(color) {
    const elem = document.querySelector('.image-gallery-container');
    if (!elem) {
      return;
    }

    elem.style.backgroundColor = color;
    window.localStorage?.setItem('AlbumViewer.backgroundColor', color);
  }

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className="image-gallery">
      {image
        && (
          <>
            <div className="image-container">
              <div className="image-box" onWheelCapture={onWheelCapture}>
                <img
                  ref={refImage}
                  src={imageURL}
                  alt={image.name}
                  onLoad={onImageLoad}
                  onMouseDown={onImageMouseDown}
                  onDragStart={onImageDragStart}
                />
              </div>
            </div>
            <div className="image-title">
              <span style={{ marginRight: '5px' }}>
                (
                {index + 1}
                /
                {data.length}
                )
              </span>
              <span>{image.name}</span>
            </div>
            {(index > 0)
              && <div className="left-button" onClick={gotoPrev} />}
            {(index < data.length - 1)
              && <div className="right-button" onClick={gotoNext} />}
          </>
        )}

      <div className="gallery-toolbar">
        <TooltipButton
          title="查看上一张照片。快捷键: J, ⬅️"
          onClick={gotoPrev}
        >
          <LeftOutlined />
        </TooltipButton>

        <TooltipButton
          title="查看下一张照片。快捷键: L, ➡️"
          onClick={gotoNext}
        >
          <RightOutlined />
        </TooltipButton>

        <TooltipButton
          title="镜头向上平移。快捷键: W"
          onClick={(e) => translateDown()}
        >
          <ArrowUpOutlined />
        </TooltipButton>

        <TooltipButton
          title="镜头向下平移。快捷键: S"
          onClick={(e) => translateUp()}
        >
          <ArrowDownOutlined />
        </TooltipButton>

        <TooltipButton
          title="镜头向左平移。快捷键: A"
          onClick={(e) => translateRight()}
        >
          <ArrowLeftOutlined />
        </TooltipButton>

        <TooltipButton
          title="镜头向右平移。快捷键: D"
          onClick={(e) => translateLeft()}
        >
          <ArrowRightOutlined />
        </TooltipButton>

        <TooltipButton
          title="向左旋转。快捷键: Q"
          onClick={rotateLeft}
        >
          <RotateLeftOutlined />
        </TooltipButton>

        <TooltipButton
          title="向右旋转。快捷键: E"
          onClick={rotateRight}
        >
          <RotateRightOutlined />
        </TooltipButton>

        <TooltipButton
          title="放大图像。快捷键: +"
          onClick={(e) => scaleUp()}
        >
          <ZoomInOutlined />
        </TooltipButton>

        <TooltipButton
          title="缩小图像。快捷键: -"
          onClick={(e) => scaleDown()}
        >
          <ZoomOutOutlined />
        </TooltipButton>

        <TooltipButton
          title="显示原始大小。快捷键: R"
          onClick={resetTranform}
        >
          <RetweetOutlined />
        </TooltipButton>

        <TooltipButton
          title="自动选择合适比例。快捷键: F"
          onClick={autoTranform}
        >
          <ShrinkOutlined />
        </TooltipButton>

        <TooltipButton
          title="退出看图模式。快捷键: Esc"
          onClick={onClickClose}
        >
          <CloseOutlined />
        </TooltipButton>
      </div>

      <div className="background-selector">
        <div className="background-option bg-black" onClick={() => selectBackground('black')} />

        <div className="background-option bg-gray" onClick={() => selectBackground('gray')} />

        <div className="background-option bg-white" onClick={() => selectBackground('white')} />
      </div>
    </div>
  );
}

function onCloseGallery(elem) {
  ReactDOM.unmountComponentAtNode(elem);
  elem.remove();
}

export function showGallery(props) {
  const {
    data, projectId, getAttachment, getResourceAttachment,
  } = props;

  let defaultIndex = 0;
  if (Object.keys(props).includes('defaultIndex')) {
    defaultIndex = props.defaultIndex;
  } else if (Object.keys(props).includes('defaultFileDigest')) {
    const { defaultFileDigest } = props;
    for (let i = 0; i < data.length; i += 1) {
      const image = data[i];
      if (image.digest === defaultFileDigest) {
        defaultIndex = i;
        break;
      }
    }
  }

  const elem = document.createElement('div');
  const className = 'image-gallery-container';
  elem.classList.add(className);

  const backgroundColor = window.localStorage?.getItem('AlbumViewer.backgroundColor') || 'black';
  elem.style.backgroundColor = backgroundColor;

  const body = document.querySelector('body');
  body.appendChild(elem);

  ReactDOM.createRoot(elem).render(
    <ImageGallery
      data={data}
      defaultIndex={defaultIndex}
      projectId={projectId}
      onClose={(e) => onCloseGallery(elem)}
      getAttachment={getAttachment}
      getResourceAttachment={getResourceAttachment}
    />
  )
}
