// @ts-nocheck
import React, {
  useEffect,
  useRef,
  useContext,
} from 'react';

import {
  PlayCircleOutlined,
} from '@ant-design/icons';

import {
  InterfaceFunctionContext,
  CellRendererContext,
} from '../contexts';

import TD from '../TD';
import * as icons from '../SvgIcons';
import * as utils from '../utils';

function FileIcon(props) {
  const { file } = props;
  if (file.name.includes('.mov')) {
    return <icons.IconMov />;
  } if (file.name.includes('.mp4')) {
    return <icons.IconMp4 />;
  } if (file.name.includes('.docx')) {
    return <icons.IconDocx />;
  } if (file.name.includes('.wdt')) {
    return <icons.IconWdt />;
  } if (file.name.includes('.xlsx')) {
    return <icons.IconXlsx />;
  } if (file.name.includes('.wdp')) {
    return <icons.IconWdp />;
  }
  return <icons.IconDropFileHere />;
}

function valueToClipboardString(value) {
  if (Array.isArray(value)) {
    const fileNames = [];

    for (const entry of value) {
      if (entry.name) {
        fileNames.push(entry.name);
      }
    }

    return fileNames.join(', ');
  }
  return '';
}

function valueFromClipboardString(str) {
  return undefined;
}

function ImageInCell(props) {
  const {
    getAttachment,
    getResourceAttachment,
    onClickImage,
    name,
    ...file
  } = props;

  const ref = useRef(null);

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (onClickImage) {
      onClickImage(file, e);
    }
  }

  async function loadImage() {
    let blob;
    // let img;

    // try {
    //   if (file.source === 'resource') {
    //     blob = await getResourceAttachment(file.fileUrl);
    //   } else {
    //     blob = await getAttachment(file.digest);
    //   }
    // } catch (err) {
    //   console.error(`cannot load attachment image: name="${name}", digest="${file.digest}"`, err);
    //   return;
    // }

    // const isSVG = name?.endsWith('.svg');
    // if (isSVG) {
    //   blob = new Blob([blob], { type: 'image/svg+xml' });
    // }

    // try {
    //   img = await utils.blob2img(blob);
    // } catch (err) {
    //   console.error(`cannot convert blob to image: name="${name}", digest="${file.digest}"`, err);
    //   return;
    // }

    const img = new Image();
    img.src = await getAttachment(`${file.uuid}-${name}`);
    img.onclick = onClick;

    const div = ref.current;
    if (img && div) {
      while (div.childElementCount) {
        div.removeChild(div.firstChild);
      }

      div.appendChild(img);
    }
  }

  useEffect(() => {
    loadImage();
  }, []);

  return (
    <div ref={ref} />
  );
}

function VideoInCell(props) {
  const {
    getAPIBaseURL,
    onClickVideo,
    ...file
  } = props;

  const {
    name,
    digest,
  } = file;

  const refThumbnail = useRef(null);

  const baseURL = getAPIBaseURL();
  const selector = `at.${digest}`;
  const thumbnailURL = `${baseURL}/projects//videos/${selector}/files/thumbnail.jpg`;

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClickVideo) {
      onClickVideo(file, e);
    }
  };

  const onThumbnailLoad = async () => {
    // show the thumbnail
    const img = refThumbnail.current;
    if (img) {
      img.style.display = 'block';
    }
  };

  const onThumbnailError = async () => {
    // hide the thumbnail
    const img = refThumbnail.current;
    if (img) {
      img.style.display = 'none';
    }
  };

  useEffect(() => {
    refThumbnail.current.addEventListener('load', onThumbnailLoad);
    refThumbnail.current.addEventListener('error', onThumbnailError);

    return () => {
      refThumbnail.current.removeEventListener('load', onThumbnailLoad);
      refThumbnail.current.removeEventListener('error', onThumbnailError);
    };
  }, []);

  return (
    <div className="video-cover" onClick={onClick}>
      <div className="btn-container">
        <div className="btn-play">
          <PlayCircleOutlined />
        </div>
      </div>
      <div className="thumbnail-container">
        <img ref={refThumbnail} src={thumbnailURL} alt="video thumbnail" />
      </div>
      <div className="bg" />
    </div>
  );
}

function FileCellContent(props) {
  const {
    colUUID,
    rowUUID,
    value,
    expandFormat = 'expand',
  } = props;

  const {
    getAPIBaseURL,
    getResourceAttachment,
  } = useContext(InterfaceFunctionContext);

  const {
    getAttachment
  } = useContext(CellRendererContext)

  function onClick(e) {
    const elem = e.target.closest('.cell-view-file');
    if (!elem) {
      return;
    }

    const rect = elem.getBoundingClientRect();
    const position = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };

    const detail = {
      panelType: 'FileCellPanel',
      action: 'toggle',
      placement: 'bottom',
      position,
      column: colUUID,
      row: rowUUID,
    };

    const ev = new CustomEvent('notifyPanel', { detail });
    window.dispatchEvent(ev);
  }

  function onClickImage(file) {
    const detail = {
      action: 'showColumnGallery',
      colUUID,
      file,
    };

    const ev = new CustomEvent('displayTable', { detail });
    window.dispatchEvent(ev);
  }

  function onClickVideo(file) {
    const detail = {
      action: 'showVideoCinema',
      file,
    };

    const ev = new CustomEvent('displayTable', { detail });
    window.dispatchEvent(ev);
  }

  function renderFile(file) {
    if (utils.isImage(file.name)) {
      return (
        <div className="image-box">
          <ImageInCell
            {...file}
            getAttachment={getAttachment}
            getResourceAttachment={getResourceAttachment}
            onClickImage={onClickImage}
          />
        </div>
      );
    } if (utils.isVideo(file.name)) {
      return (
        <div className="video-box">
          <VideoInCell
            {...file}
            getAttachment={getAttachment}
            getAPIBaseURL={getAPIBaseURL}
            onClickVideo={onClickVideo}
          />
        </div>
      );
    }
    return (
      <div className="file-box">
        {/* <div><icons.IconDropFileHere /></div> */}
        <div><FileIcon file={file} /></div>
        <span>{file.name}</span>
      </div>
    );
  }

  let content = null;

  if (expandFormat === 'collapse') {
    content = (
      <ul style={{ paddingLeft: 16 }}>
        {value?.map?.((file) => (
          <li>
            <div
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
              title={file.name}
            >
              {file.name}
            </div>
          </li>
        ))}
      </ul>
    );
  } else {
    content = value?.map?.((file) => (
      <div key={file.uuid} className="file-item">
        {renderFile(file)}
      </div>
    ));
  }

  return (
    <div className="cell-view-file" onClick={onClick}>
      {content}
    </div>
  );
}

const FileCell = React.memo((props) => {
  const {
    colUUID,
    rowUUID,
    onPage,
    dataType,
    isFirstColumn,
    width,
    value,
    style,
    expandFormat,
  } = props;

  const tdProps = {
    colUUID,
    rowUUID,
    dataType,
    isFirstColumn,
    width,
    style,
  };

  const textProps = {
    colUUID,
    rowUUID,
    value,
    expandFormat,
  };

  return (
    <TD {...tdProps}>
      {
        onPage
        && <FileCellContent {...textProps} />
      }
    </TD>
  );
});

function renderOneColumn(props) {
  const {
    pageRowUUIDs,
    colIndex,
    col,
    isFirstColumn,
    rows,
    currentPageRowUUIDs,
  } = props;

  const tdList = [];

  for (let i = 0; i < rows.length; i += 1) {
    if(currentPageRowUUIDs.has(rows[i].uuid)){
      const key = `${i}-${colIndex}`;
      const row = rows[i];
      const cellValue = row?.fields?.[col?.uuid];
      const cellStyle = row?.styles?.[col?.uuid] || {};
  
      const props1 = {
        colUUID: col.uuid,
        rowUUID: row.uuid,
        onPage: pageRowUUIDs.has(row.uuid),
        dataType: col.dataType,
        isFirstColumn,
        width: col.width,
        value: cellValue,
        style: cellStyle,
        expandFormat: col.expandFormat,
      };
  
      const td = <FileCell key={key} {...props1} />;
      tdList.push(td);
    }
  }

  return tdList;
}

const DataType = {
  name: 'file',
  nameCN: '媒体或文件',
  icon: icons.IconFile,
  valueToClipboardString,
  valueFromClipboardString,
  renderOneColumn,
};

export default DataType;
