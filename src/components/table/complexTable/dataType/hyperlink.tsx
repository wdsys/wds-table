// @ts-nocheck
import React from 'react';
import { LinkOutlined } from '@ant-design/icons';
import TD from '../TD';
import { IconHyperlink } from '../SvgIcons';
import {openUrlByBrowser} from '@/utils'

function valueToClipboardString(value) {
  return value || '';
}

function valueFromClipboardString(str) {
  return str;
}

function HyperLinkItem(props) {
  const {
    url,
    name,
  } = props;

  const className = 'hyperlink-item';

  function goTarget(e: any) {
    e.preventDefault();
    openUrlByBrowser(url)
  }

  return (
    <div className={className}>
      <a className="text" href={url} onClick={goTarget} target="_blank" rel="noreferrer" title={url}>
        <LinkOutlined style={{ fontSize: 16, marginRight: 4 }} />
        {/* <span className="url">{url}</span> */}
        <span className="name">{name || ''}</span>
      </a>
    </div>
  );
}

function HyperlinkCellContent(props) {
  const {
    colUUID,
    rowUUID,
    locked,
    value,
  } = props;
  // const refEditor = useRef(null);
  // const refAnchor = useRef(null);
  // const [editing, setEditing] = useState(false);
  // const isEmpty = !value;

  // useEffect(() => {
  //   if (refAnchor) {
  //     refAnchor.current.href = value;
  //   }

  //   if (editing) {
  //     refEditor.current.innerText = value || '';
  //   }
  // }, [editing, value]);

  // function onClickViewer(e) {
  //   if (locked) {
  //     return;
  //   }

  //   setEditing(true);

  //   setTimeout(() => {
  //     const elem = refEditor.current;
  //     if (elem) {
  //       elem.focus();
  //       utils.doElementSelectAll(elem);
  //     }
  //   }, 10);
  // }

  // function onClickText(e) {
  //   if (locked) {
  //     e.preventDefault();
  //     refAnchor.current.click();
  //   }
  // }

  // function onBlur(e) {
  //   setEditing(false);

  //   const newValue = utils.getContentEditableText(refEditor.current).trim();
  //   if (newValue === value) {
  //     return;
  //   }

  //   const detail = {
  //     action: 'setCellValue',
  //     colUUID,
  //     rowUUID,
  //     value: newValue,
  //   };

  //   const ev = new CustomEvent('modifyTable', { detail });
  //   window.dispatchEvent(ev);
  // }

  // function onKeyDown(e) {
  //   if (e.key === 'Enter') {
  //     e.preventDefault();
  //     onBlur();
  //   } else if (e.key === 'Escape') {
  //     e.preventDefault();
  //     onBlur();
  //   }
  // }

  // function onClickButton(e) {
  //   e.stopPropagation();
  // }

  const className = 'cell-view-hyperlink';
  // if (locked) {
  //   className += ' locked';
  // }

  // if (editing) {
  //   className += ' editing';
  // }

  // if (isEmpty) {
  //   className += ' empty';
  // } else {
  //   className += ' not-empty';
  // }
  const itemElems = [];
  if (Array.isArray(value) && value.length > 0) {
    for (let i = 0; i < value.length; i += 1) {
      const elem = (
        <HyperLinkItem
          url={value[i]?.url}
          name={value[i]?.name}
          key={value.url}
        />
      );

      itemElems.push(elem);
    }
  } else if (typeof value === 'string' && !!value) {
    const elem = (
      <HyperLinkItem
        url={value}
        name={value}
        key={value}
      />
    );
    itemElems.push(elem);
  }

  return (
    <div className={className}>
      {/* <div className="viewer" onClick={onClickViewer}>
        <div className="link-text" onClick={onClickText}>
          {value || ''}
        </div>
        <div className="link-button" onClick={onClickButton}>
          <a ref={refAnchor} target="_blank">
            <IconHyperlink />
          </a>
        </div>
      </div> */}
      {/* <div className="editor">
        <div
          ref={refEditor}
          className="cell-view-text"
          contentEditable
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
      </div> */}
      <div className="cell-view-hyperlink-list">
        {itemElems}
      </div>
    </div>
  );
}

const HyperlinkCell = React.memo((props) => {
  const {
    colUUID,
    rowUUID,
    onPage,
    dataType,
    isFirstColumn,
    width,
    locked,
    value,
    style,
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
    locked,
    value,
  };

  return (
    <TD {...tdProps}>
      {
        onPage
        && <HyperlinkCellContent {...textProps} />
      }
    </TD>
  );
});

function renderOneColumn(props) {
  const {
    readOnly,
    lockFullTable,
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
        locked: readOnly || lockFullTable || col.locked || row.locked,
        value: cellValue,
        style: cellStyle,
      };
  
      const td = <HyperlinkCell key={key} {...props1} />;
      tdList.push(td);
    }
  }

  return tdList;
}

const DataType = {
  name: 'hyperlink',
  nameCN: '网址链接',
  icon: IconHyperlink,
  valueToClipboardString,
  valueFromClipboardString,
  renderOneColumn,
};

export default DataType;
