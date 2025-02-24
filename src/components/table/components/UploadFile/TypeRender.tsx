// @ts-nocheck
import React from 'react';
import {
  FolderFilled,
  FileOutlined,
} from '@ant-design/icons';

import * as utils from '../../complexTable/utils';
import * as svgIcons from '../../SvgIcon';

export function FileType(fileName = '') {
  const fileTypes = {
    txt: {
      txt: '文本文档',
      icon: <svgIcons.IconTxt />,
    },
    pptx: {
      txt: 'pptx演示文稿',
      icon: <svgIcons.IconPPT />,
    },
    pdf: {
      txt: 'pdf文档',
      icon: <svgIcons.IconPdf />,
    },
    js: {
      txt: 'JavaScript源文件',
      icon: <svgIcons.IconJS />,
    },
    json: {
      txt: 'JSON源文件',
      icon: <svgIcons.IconJson />,
    },
    mov: {
      txt: 'mov文件',
      icon: <svgIcons.IconMov />,
    },
    mp4: {
      txt: 'mp4文件',
      icon: <svgIcons.IconMp4 />,
    },
    xlsx: {
      txt: 'XLSX工作表',
      icon: <svgIcons.IconXlsx />,
    },
    docx: {
      txt: 'DOCX文档',
      icon: <svgIcons.IconWord />,
    },
    wdt: {
      txt: 'WDT文件',
      icon: <svgIcons.IconWdt />,
    },
    wdp: {
      txt: 'WDP文件',
      icon: <svgIcons.IconWdp />,
    },
    png: {
      txt: 'PNG图片文件',
      icon: <svgIcons.IconImage />,
    },
    jpg: {
      txt: 'JPG图片文件',
      icon: <svgIcons.IconImage />,
    },
    webp: {
      txt: 'WEBP图片文件',
      icon: <svgIcons.IconImage />,
    },
    svg: {
      txt: 'SVG图片文件',
      icon: <svgIcons.IconImage />,
    },
    zip: {
      txt: '压缩（zipped）文件夹',
      icon: <svgIcons.IconZip />,
    },
    img: {
      txt: '图片文件',
      icon: <svgIcons.IconImage />,
    },
    xml: {
      txt: 'XML文件',
      icon: <svgIcons.IconXml />,
    },
    file: {
      txt: '未知文件',
      icon: <svgIcons.IconUnknownFile />,
    },
  };

  let type = 'file';

  if (utils.isImage(fileName)) {
    type = 'img';
  }

  for (const item of Object.keys(fileTypes)) {
    const regexString = `(.${item})$`;
    const regex = new RegExp(regexString);

    if (regex.test(fileName)) {
      type = item;
      break;
    }
  }

  return fileTypes?.[type];
}

const dataTypes = {
  folder: {
    icon: <FolderFilled style={{ color: 'burlywood' }} />,
    typeTxt: '文件夹',
  },
  file: {
    icon: <FileOutlined />,
    typeTxt: '文件',
  },
};

export function IconRender(props) {
  const { nodeType = 'folder', type } = props;

  const typeInfo = dataTypes[nodeType] ?? dataTypes.folder;

  if (nodeType === 'folder') {
    return (dataTypes[nodeType + type] ?? dataTypes.folder)?.icon;
  }

  return typeInfo?.icon;
}

export function TxtRender(props) {
  const { nodeType = 'folder', type = 0 } = props;

  const typeInfo = dataTypes[nodeType] ?? dataTypes.folder;

  if (nodeType === 'folder') {
    return (dataTypes[nodeType + type] ?? dataTypes.folder)?.typeTxt;
  }

  return typeInfo?.typeTxt;
}
