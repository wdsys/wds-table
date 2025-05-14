// @ts-nocheck
import React, {
  useState,
  useEffect,
  useRef,
} from 'react';

import TestPanel from './TestPanel';
import ConfigPanel from './ConfigPanel';
import FilterPanel from './FilterPanel';
import SortPanel from './SortPanel';
import MorePanel from './MorePanel';
import ColumnPanel from './ColumnPanel';
import ColumnTypePanel from './ColumnTypePanel';
import RowPanel from './RowPanel';
import CellPanel from './CellPanel';
import NumberFormatPanel from './NumberFormatPanel';
import SerialFormatPanel from './SerialFormatPanel';
import CheckboxViewPanel from './CheckboxViewPanel';
import SelectFormatPanel from './SelectFormatPanel';
import CheckboxSelectPanel from './CheckboxSelectPanel';
import ChoiceNewPanel from './ChoiceNewPanel';
import ChoiceEditPanel from './ChoiceEditPanel';
import DateEditPanel from './DateEditPanel';
import SelectionPanel from './SelectionPanel';
import FileCellPanel from './FileCellPanel';
import FileOperationPanel from './FileOperationPanel';
import ViewsPanel from './ViewsPanel';
import SignFormatPanel from './SignFormatPanel';
import ColExplainPanel from './ColExplainPanel';
import ExpandFormatPanel from './ExpandFormatPanel';
import EditSerialNumberPanel from './EditSerialNumber';
import CheckboxSelectRowsPanel from './CheckboxSelectRowsPanel';
import AiTextPanel from './AiTextPanel';
import AiTextResponsePanel from './AiTextResponsePanel';
import PatchActionsPanel from './PatchActionsPanel';
import LevelChangePanel from './LevelChangePanel'

import './Overlay.less';

const PanelTypes = [
  'TestPanel',
  'ConfigPanel',
  'FilterPanel',
  'SortPanel',
  'MorePanel',
  'ColumnPanel',
  'ColumnTypePanel',
  'RowPanel',
  'CellPanel',
  'NumberFormatPanel',
  'SerialFormatPanel',
  'CheckboxViewPanel',
  'SelectFormatPanel',
  'CheckboxSelectPanel',
  'DateEditPanel',
  'ChoiceNewPanel',
  'ChoiceEditPanel',
  'SelectionPanel',
  'FileCellPanel',
  'FileOperationPanel',
  'ViewsPanel',
  'signSelectSignFormat',
  'SignFormatPanel',
  'ColExplainPanel',
  'ExpandFormatPanel',
  'EditSerialNumberPanel',
  'CheckboxSelectRowsPanel',
  'AiTextPanel',
  'AiTextResponsePanel',
  'PatchActionsPanel',
  'LevelChangePanel',
];

function Overlay() {
  const [panels, setPanels] = useState([]);

  const panelRefs = {};
  for (const typeName of PanelTypes) {
    panelRefs[typeName] = useRef(null);
  }

  function onNotifyPanel(e) {
    const { detail } = e;
    // console.log('onNotifyPanel:', detail);
    const ref = panelRefs[detail.panelType];
    ref?.current?.notify(detail);
  }

  useEffect(() => {
    window.addEventListener('notifyPanel', onNotifyPanel);

    return () => {
      window.removeEventListener('notifyPanel', onNotifyPanel);
    };
  }, []);

  return (
    <div className="table-global-overlay">
      <div className="container">
        <TestPanel ref={panelRefs.TestPanel} />

        <ConfigPanel ref={panelRefs.ConfigPanel} />

        <FilterPanel ref={panelRefs.FilterPanel} />

        <SortPanel ref={panelRefs.SortPanel} />

        <MorePanel ref={panelRefs.MorePanel} />

        <ColumnPanel ref={panelRefs.ColumnPanel} />

        <ColumnTypePanel ref={panelRefs.ColumnTypePanel} />

        <RowPanel ref={panelRefs.RowPanel} />

        <CellPanel ref={panelRefs.CellPanel} />

        <NumberFormatPanel ref={panelRefs.NumberFormatPanel} />

        <SerialFormatPanel ref={panelRefs.SerialFormatPanel} />

        <CheckboxViewPanel ref={panelRefs.CheckboxViewPanel} />

        <SelectFormatPanel ref={panelRefs.SelectFormatPanel} />

        <CheckboxSelectPanel ref={panelRefs.CheckboxSelectPanel} />

        <DateEditPanel ref={panelRefs.DateEditPanel} />

        <ChoiceNewPanel ref={panelRefs.ChoiceNewPanel} />

        <ChoiceEditPanel ref={panelRefs.ChoiceEditPanel} />

        <SelectionPanel ref={panelRefs.SelectionPanel} />

        <FileCellPanel ref={panelRefs.FileCellPanel} />

        <FileOperationPanel ref={panelRefs.FileOperationPanel} />

        <ViewsPanel ref={panelRefs.ViewsPanel} />

        <SignFormatPanel ref={panelRefs.SignFormatPanel} />

        <ColExplainPanel ref={panelRefs.ColExplainPanel} />

        <ExpandFormatPanel ref={panelRefs.ExpandFormatPanel} />

        <EditSerialNumberPanel ref={panelRefs.EditSerialNumberPanel} />

        <CheckboxSelectRowsPanel ref={panelRefs.CheckboxSelectRowsPanel} />

        <AiTextPanel ref={panelRefs.AiTextPanel} />

        <AiTextResponsePanel ref={panelRefs.AiTextResponsePanel} />

        <PatchActionsPanel ref={panelRefs.PatchActionsPanel} />

        <LevelChangePanel ref={panelRefs.LevelChangePanel} />
        
        {
          Object.keys(panels).map((id) => <div key={id} id={`panel-${id}`}>{panels[id]}</div>)
        }
      </div>
    </div>
  );
}

/**
 * @deprecated
 */
// Overlay.addPanel = (id, panel) => {
//   if (!(id && panel)) {
//     return;
//   }

//   setPanels((oldPanels) => ({
//     ...oldPanels,
//     [id]: panel,
//   }));
// };

/**
 * @deprecated
 */
// Overlay.removePanel = (id) => {
//   if (!id) {
//     return;
//   }

//   setPanels((oldPanels) => {
//     const newPanels = {};

//     for (const _id of Object.keys(oldPanels)) {
//       if (_id !== id) {
//         newPanels[_id] = oldPanels[_id];
//       }
//     }

//     return newPanels;
//   });
// };

export default Overlay;
