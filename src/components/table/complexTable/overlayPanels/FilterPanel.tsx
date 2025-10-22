// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';
import { produce } from 'immer';

import React, {
  useState,
  useContext,
} from 'react';

import {
  message,
  Divider,
  Input,
  Select,
} from 'antd';

import { useTranslation } from 'react-i18next';

import {
  CellRendererContext,
} from '../contexts';

import { ColumnIcon, DataTypes } from '../dataType';
import { TagValues } from '../ViewsChoices';
import * as icons from '../SvgIcons';

import useToggleablePanel from './useToggleablePanel';
import OverlayPanelBox from './OverlayPanelBox';

// treeNode
const TreeNodeFilterDefault = {
  operators: [
    // for cell.level
    { id: 'levelLT', name: 'deep<' },
    { id: 'levelEqual', name: 'deep=' },
    { id: 'levelGT', name: 'deep>' },
    // for cell.text
    { id: 'include', name: 'include' },
    { id: 'notInclude', name: 'notInclude' },
    { id: 'equal', name: 'equal' },
    { id: 'notEqual', name: 'notEqual' },
    { id: 'startsWith', name: 'startsWith' },
    { id: 'endsWith', name: 'endsWith' },
    { id: 'empty', name: 'empty' },
    { id: 'notEmpty', name: 'notEmpty' },
  ],
  defaultOperatorId: 'include',
  defaultOperand: undefined,
};

// text, hyperlink, email, phone
const TextFilterDefault = {
  operators: [
    { id: 'include', name: 'include' },
    { id: 'notInclude', name: 'notInclude' },
    { id: 'equal', name: 'equal' },
    { id: 'notEqual', name: 'notEqual' },
    { id: 'startsWith', name: 'startsWith' },
    { id: 'endsWith', name: 'endsWith' },
    { id: 'empty', name: 'empty' },
    { id: 'notEmpty', name: 'notEmpty' },
  ],
  defaultOperatorId: 'include',
  defaultOperand: undefined,
};

const NumberFilterDefault = {
  operators: [
    { id: 'equal', name: '=' },
    { id: 'notEqual', name: '!=' },
    { id: 'lt', name: '<' },
    { id: 'gt', name: '>' },
    { id: 'le', name: '<=' },
    { id: 'ge', name: '>=' },
  ],
  defaultOperatorId: 'equal',
  defaultOperand: 0,
};

const CheckboxFilterDefault = {
  operators: [
    { id: 'equal', name: 'equal' },
  ],
  defaultOperatorId: 'equal',
  defaultOperand: false,
};

const SelectFilterDefault = {
  operators: [
    { id: 'equal', name: 'equal' },
    { id: 'notEqual', name: 'notEqual' },
    { id: 'empty', name: 'empty' },
    { id: 'notEmpty', name: 'notEmpty' },
  ],
  defaultOperatorId: 'equal',
  defaultOperand: undefined,
};

const MultiSelectFilterDefault = {
  operators: [
    { id: 'include', name: 'include' },
    { id: 'notInclude', name: 'notInclude' },
    { id: 'empty', name: 'empty' },
    { id: 'notEmpty', name: 'notEmpty' },
  ],
  defaultOperatorId: 'include',
  defaultOperand: undefined,
};

const ViewsFilterDefault = {
  operators: [
    { id: 'include', name: 'include' },
    { id: 'notInclude', name: 'notInclude' },
    { id: 'empty', name: 'empty' },
    { id: 'notEmpty', name: 'notEmpty' },
  ],
  defaultOperatorId: 'include',
  defaultOperand: '功能',
};

const ViewLinksFilterDefault = {
  operators: [
    { id: 'empty', name: 'empty' },
    { id: 'notEmpty', name: 'notEmpty' },
  ],
  defaultOperatorId: 'notEmpty',
  defaultOperand: '功能',
};

const DateFilterDefault = {
  operators: [
    { id: 'equal', name: '=' },
    { id: 'notEqual', name: '!=' },
    { id: 'lt', name: '<' },
    { id: 'gt', name: '>' },
    { id: 'le', name: '<=' },
    { id: 'ge', name: '>=' },
    { id: 'empty', name: 'empty' },
    { id: 'notEmpty', name: 'notEmpty' },
  ],
  defaultOperatorId: 'equal',
  defaultOperand: undefined,
};

const PersonFilterDefault = {
  operators: [
    { id: 'include', name: 'include' },
    { id: 'notInclude', name: 'notInclude' },
    { id: 'empty', name: 'empty' },
    { id: 'notEmpty', name: 'notEmpty' },
  ],
  defaultOperatorId: 'include',
  defaultOperand: undefined,
};

const PeopleFilterDefault = {
  operators: [
    { id: 'include', name: 'include' },
    { id: 'notInclude', name: 'notInclude' },
    { id: 'empty', name: 'empty' },
    { id: 'notEmpty', name: 'notEmpty' },
  ],
  defaultOperatorId: 'include',
  defaultOperand: undefined,
};

const FileFilterDefault = {
  operators: [
    { id: 'include', name: 'include' },
    { id: 'notInclude', name: 'notInclude' },
    { id: 'empty', name: 'empty' },
    { id: 'notEmpty', name: 'notEmpty' },
  ],
  defaultOperatorId: 'include',
  defaultOperand: undefined,
};

const RelatedRequirementsFilterDefault = {
  operators: [
    { id: 'empty', name: 'empty' },
    { id: 'notEmpty', name: 'notEmpty' },
  ],
  defaultOperatorId: 'notEmpty',
  defaultOperand: undefined,
};

const TaskInChargerFilterDefault = {
  operators: [
    { id: 'equal', name: 'equal' },
    { id: 'notEqual', name: 'notEqual' },
    { id: 'empty', name: 'empty' },
    { id: 'notEmpty', name: 'notEmpty' },
  ],
  defaultOperatorId: 'equal',
  defaultOperand: undefined,
};

const TaskHolderFilterDefault = {
  operators: [
    { id: 'include', name: 'include' },
    { id: 'notInclude', name: 'notInclude' },
    { id: 'empty', name: 'empty' },
    { id: 'notEmpty', name: 'notEmpty' },
  ],
  defaultOperatorId: 'include',
  defaultOperand: undefined,
};

const TaskPriorityFilterDefault = {
  operators: [
    { id: 'equal', name: 'equal' },
    { id: 'notEqual', name: 'notEqual' },
    { id: 'empty', name: 'empty' },
    { id: 'notEmpty', name: 'notEmpty' },
  ],
  defaultOperatorId: 'equal',
  defaultOperand: undefined,
};

const FilterDefaults = {
  requirementStatus: SelectFilterDefault,
  treeNode: TreeNodeFilterDefault,
  text: TextFilterDefault,
  number: NumberFilterDefault,
  checkbox: CheckboxFilterDefault,
  select: SelectFilterDefault,
  multiSelect: MultiSelectFilterDefault,
  views: ViewsFilterDefault,
  date: DateFilterDefault,
  hyperlink: TextFilterDefault,
  file: FileFilterDefault,
  relatedRequirements: RelatedRequirementsFilterDefault,
  viewLinks: ViewLinksFilterDefault,
  taskInCharger: TaskInChargerFilterDefault,
  taskHolder: TaskHolderFilterDefault,
  taskPriority: TaskPriorityFilterDefault,
};

function isDataTypeSupported(dataType) {
  return !!FilterDefaults[dataType];
}

function isColumnFilterable(column) {
  return isDataTypeSupported(column.dataType);
}

function ensureOperatorId(filterDefault, operatorId) {
  for (const op of filterDefault.operators) {
    if (op.id === operatorId) {
      return operatorId;
    }
  }

  return filterDefault.defaultOperatorId;
}

function getFirstFilterableColumn(columns) {
  const result = {
    column: null,
    defaultConfig: null,
  };

  for (const col of columns) {
    const conf = FilterDefaults[col.dataType];
    if (conf) {
      result.column = col;
      result.defaultConfig = conf;
      break;
    }
  }

  return result;
}

function createCondition(column, defaultConfig) {
  const newCondition = {
    uuid: uuidv4(),
    colUUID: column.uuid,
    dataType: column.dataType,
    operatorId: defaultConfig.defaultOperatorId,
    operand: defaultConfig.defaultOperand,
  };

  if (column.dataType === 'select') {
    if (column.choices?.length) {
      newCondition.operand = column.choices[0].name;
    }
  } else if (column.dataType === 'multiSelect') {
    if (column.choices?.length) {
      newCondition.operand = column.choices[0].name;
    }
  }

  return newCondition;
}

function OperandTextEditor(props) {
  const {
    value,
    onChange,
  } = props;

  let compositing = false;

  function onInputCompositionStart(e) {
    compositing = true;
  }

  function onInputCompositionUpdate(e) {
    compositing = true;
  }

  function onInputCompositionEnd(e) {
    compositing = false;
    onChange(e.target.value);
  }

  function onInputChange(e) {
    if (!compositing) {
      onChange(e.target.value);
    }
  }

  function onInputBlur() {
    compositing = false;
  }

  return (
    <Input
      placeholder="string"
      defaultValue={value}
      onCompositionStart={onInputCompositionStart}
      onCompositionUpdate={onInputCompositionUpdate}
      onCompositionEnd={onInputCompositionEnd}
      onChange={onInputChange}
      onBlur={onInputBlur}
    />
  );
}

function OperandIntEditor(props) {
  const {
    value,
    onChange,
  } = props;

  function onNumberChange(e) {
    let value1;
    const text = e.target.value.trim();
    if (text !== '') {
      value1 = parseInt(text, 10);
    }

    onChange(value1);
  }

  function onNumberBlur(e) {
    let value1;

    const text = e.target.value.trim();
    if (text !== '') {
      value1 = parseInt(text, 10);
    }

    setTimeout(() => {
      e.target.value = value1;
    }, 50);
  }

  return (
    <Input
      placeholder="Integer"
      type="number"
      step={1}
      min={0}
      defaultValue={value}
      onChange={onNumberChange}
      onBlur={onNumberBlur}
    />
  );
}

function OperandNumberEditor(props) {
  const {
    value,
    onChange,
  } = props;

  function onNumberChange(e) {
    let value1;
    const text = e.target.value.trim();
    if (text !== '') {
      value1 = parseFloat(text);
    }

    onChange(value1);
  }

  function onNumberBlur(e) {
    let value1;

    const text = e.target.value.trim();
    if (text !== '') {
      value1 = parseFloat(text);
    }

    setTimeout(() => {
      e.target.value = value1;
    }, 50);
  }

  return (
    <Input
      placeholder="number"
      type="number"
      defaultValue={value}
      onChange={onNumberChange}
      onBlur={onNumberBlur}
    />
  );
}

function OperandCheckboxEditor(props) {
  const {
    value,
    onChange,
  } = props;

  return (
    <Select value={!!value} onChange={onChange}>
      {
        [true, false].map((choice) => {
          const name = choice ? '是' : '否';
          return (
            <Select.Option key={name} value={choice}>
              {name}
            </Select.Option>
          );
        })
      }
    </Select>
  );
}

function OperandSelectEditor(props) {
  const {
    column,
    operatorId,
    value,
    onChange,
  } = props;

  if (operatorId !== 'equal' && operatorId !== 'notEqual') {
    return null;
  }

  if (!column?.choices?.length) {
    return <span>暂无选项</span>;
  }

  let choice = null;
  if (column.choices?.length) {
    for (const item of column.choices) {
      if (item.name === value) {
        choice = item;
        break;
      }
    }
  }

  return (
    <Select value={choice?.name} onChange={onChange}>
      {
        column.choices.map((choice1) => (
          <Select.Option key={choice1.uuid} value={choice1.name}>
            {choice1.name}
          </Select.Option>
        ))
      }
    </Select>
  );
}

function OperandMultiSelectEditor(props) {
  const {
    column,
    operatorId,
    value,
    onChange,
  } = props;

  if (operatorId !== 'include' && operatorId !== 'notInclude') {
    return null;
  }

  if (!column?.choices?.length) {
    return <span>暂无选项</span>;
  }

  let choice = null;
  if (column.choices?.length) {
    for (const item of column.choices) {
      if (item.name === value) {
        choice = item;
        break;
      }
    }
  }

  return (
    <Select value={choice?.name} onChange={onChange}>
      {
        column.choices.map((choice1) => (
          <Select.Option key={choice1.uuid} value={choice1.name}>
            {choice1.name}
          </Select.Option>
        ))
      }
    </Select>
  );
}

function OperandViewsEditor(props) {
  const {
    column,
    operatorId,
    value,
    onChange,
  } = props;

  if (operatorId !== 'include' && operatorId !== 'notInclude') {
    return null;
  }

  let safeValue;
  if (TagValues[value]) {
    safeValue = value;
  }

  return (
    <Select value={safeValue} onChange={onChange}>
      {
        Object.keys(TagValues).map((tag) => (
          <Select.Option key={tag} value={tag}>
            {tag}
          </Select.Option>
        ))
      }
    </Select>
  );
}

function OperandEditor(props) {
  const {
    column,
    operatorId,
    operand,
    onChangeOperand,
  } = props;

  if (column.dataType === 'treeNode') {
    if (operatorId === 'levelLT'
      || operatorId === 'levelEqual'
      || operatorId === 'levelGT') { // for cell.level
      return (
        <OperandIntEditor
          value={parseInt(operand, 10) || 0}
          onChange={onChangeOperand}
        />
      );
    } // for cell.text
    return (
      <OperandTextEditor
        value={operand}
        onChange={onChangeOperand}
      />
    );
  } if (column.dataType === 'text'
    || column.dataType === 'date'
    || column.dataType === 'hyperlink'
    || column.dataType === 'file') {
    return (
      <OperandTextEditor
        value={operand}
        onChange={onChangeOperand}
      />
    );
  } if (column.dataType === 'number') {
    return (
      <OperandNumberEditor
        value={operand}
        onChange={onChangeOperand}
      />
    );
  } if (column.dataType === 'checkbox') {
    // select
    return (
      <OperandCheckboxEditor
        value={operand}
        onChange={onChangeOperand}
      />
    );
  } if (['select', 'requirementStatus', 'taskPriority'].includes(column.dataType)) {
    // select
    return (
      <OperandSelectEditor
        column={column}
        operatorId={operatorId}
        value={operand}
        onChange={onChangeOperand}
      />
    );
  } if (column.dataType === 'multiSelect') {
    // select
    return (
      <OperandMultiSelectEditor
        column={column}
        operatorId={operatorId}
        value={operand}
        onChange={onChangeOperand}
      />
    );
  } if (column.dataType === 'views') {
    // select
    return (
      <OperandViewsEditor
        column={column}
        operatorId={operatorId}
        value={operand}
        onChange={onChangeOperand}
      />
    );
  } if (column.dataType === 'date') {
    // select, complex
    return null;
  } if (column.dataType === 'time') {
    // select, complex
    return null;
  } if (column.dataType === 'person') {
    // select
    return null;
  } if (column.dataType === 'people') {
    // select
    return null;
  } if (column.dataType === 'file') {
    return null;
  }
  return null;
}

function FilterCondition(props) {
  const {
    columns,
    uuid,
    colUUID,
    operatorId,
    operand,
    onChangeCondition,
    onRemoveCondition,
  } = props;

  const column = columns.filter((col) => col.uuid === colUUID)[0];
  if (!column) {
    return null;
  }

  const defaultConfig = FilterDefaults[column.dataType];
  if (!defaultConfig) {
    return null;
  }

  // Check if the operatorId is valid.
  // If not, fallback to the default operatorId.
  const safeOperatorId = ensureOperatorId(defaultConfig, operatorId);

  function onChangeColumn(value) {
    const newColumn = columns.filter((c) => c.uuid === value)[0];
    if (!newColumn) {
      return;
    }

    const newDefaultConfig = FilterDefaults[newColumn.dataType];
    if (!newDefaultConfig) {
      return;
    }

    if (newColumn.dataType === column.dataType) {
      onChangeCondition(uuid, {
        colUUID: value,
      });

      return;
    }

    onChangeCondition(uuid, {
      colUUID: value,
      operatorId: newDefaultConfig.defaultOperatorId,
      operand: newDefaultConfig.defaultOperand,
    });
  }

  function onChangeOperatorId(operatorId1) {
    onChangeCondition(uuid, {
      operatorId: operatorId1,
    });
  }

  function onChangeOperand(operand1) {
    onChangeCondition(uuid, {
      operand: operand1,
    });
  }

  function onClickDelete() {
    if (!onRemoveCondition) {
      return;
    }

    onRemoveCondition(uuid);
  }

  // 根据数据类型，过滤掉不支持的列
  const filterableColumns = columns.filter((col) => isColumnFilterable(col));

  return (
    <div className="one-condition-box">
      <div className="one-condition">
        <div className="column">
          <Select value={column.uuid} onChange={onChangeColumn}>
            {
              filterableColumns.map((item) => (
                <Select.Option key={item.uuid} value={item.uuid} title={item.name}>
                  <span className="column-name">
                    <span className="icon">
                      <ColumnIcon dataType={item.dataType} DataTypes={DataTypes} />
                    </span>
                    <span className="text">{item.name}</span>
                  </span>
                </Select.Option>
              ))
            }
          </Select>
        </div>

        <div className="operator">
          <Select value={safeOperatorId} onChange={onChangeOperatorId}>
            {
              defaultConfig.operators.map((item) => (
                <Select.Option key={item.id} value={item.id}>
                  <span className="text">{item.name}</span>
                </Select.Option>
              ))
            }
          </Select>
        </div>

        <div className="operand">
          <OperandEditor
            column={column}
            operatorId={operatorId}
            operand={operand}
            onChangeOperand={onChangeOperand}
          />
        </div>

        <div className="other">
          <div className="button" onClick={onClickDelete}>
            <icons.IconMultiply />
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterConditionList(props) {
  const {
    columns,
    conditions,
    onChangeCondition,
    onRemoveCondition,
  } = props;

  const {t} = useTranslation();

  const validConditions = [];

  if (conditions?.length) {
    const allColumnUUIDs = new Set();

    for (const col of columns) {
      if (col.uuid) {
        allColumnUUIDs.add(col.uuid);
      }
    }

    for (let i = 0; i < conditions.length; i += 1) {
      const cond = conditions[i];
      if (allColumnUUIDs.has(cond.colUUID)) {
        validConditions.push(cond);
      }
    }
  }

  if (validConditions.length === 0) {
    return (
      <div className="one-condition-box">
        <div className="one-condition">
          <div className="name">
            <span style={{ color: '#8E8E8E' }}>{t('no filters')}</span>
          </div>
        </div>
      </div>
    );
  }

  return conditions.map((cond) => (
    <FilterCondition
      key={cond.uuid}
      columns={columns}
      uuid={cond.uuid}
      colUUID={cond.colUUID}
      operatorId={cond.operatorId}
      operand={cond.operand}
      onChangeCondition={onChangeCondition}
      onRemoveCondition={onRemoveCondition}
    />
  ));
}

/**
 * 过滤器面板
 */
function FilterPanel(props, ref) {
  const {
    options,
    setOptions,
    columns,
  } = useContext(CellRendererContext);

  const {t} = useTranslation();

  const {
    relation = 'any',
    conditions = [],
  } = options.filter || {};

  const [panelState, setPanelState] = useState({
    visible: false,
    placement: 'bottom',
    position: null,
    minWidth: 360,
    minHeight: 135,
  });

  useToggleablePanel(ref, setPanelState);

  function onChangeRelation(value) {
    setOptions(produce((draft) => {
      if (draft.filter) {
        draft.filter.relation = value;
      } else {
        draft.filter = {
          relation: value,
          conditions: [],
        };
      }
    }));
  }

  function onClickAddCondition() {
    const { column, defaultConfig } = getFirstFilterableColumn(columns);

    if (!column || !defaultConfig) {
      message.error('当前表格中的字段类型不支持过滤');
      return;
    }

    const newCondition = createCondition(column, defaultConfig);

    setOptions(produce((draft) => {
      if (!draft.filter) {
        draft.filter = {
          relation: 'any',
          conditions: [],
        };
      }

      draft.filter.conditions.push(newCondition);
    }));
  }

  function onClickClearConditions() {
    setOptions(produce((draft) => {
      draft.filter = {
        relation: 'any',
        conditions: [],
      };
    }));
  }

  function onChangeCondition(uuid, props1) {
    setOptions(produce((draft) => {
      const { conditions: conditions1 } = draft.filter || {};
      if (conditions1?.length) {
        const index = conditions1.findIndex((c) => c.uuid === uuid);
        if (index >= 0) {
          const cond = conditions1[index];
          Object.assign(cond, props1);
        }
      }
    }));
  }

  function onRemoveCondition(uuid) {
    setOptions(produce((draft) => {
      const { conditions: conditions1 } = draft.filter || {};
      if (conditions1?.length) {
        const index = conditions1.findIndex((c) => c.uuid === uuid);
        if (index >= 0) {
          conditions1.splice(index, 1);
        }
      }
    }));
  }

  if (!panelState.visible) {
    return null;
  }

  return (
    <OverlayPanelBox state={panelState} setState={setPanelState}>
      <div className="table-filter-overlay" style={{ width: 360 }}>
        <div className="card-title">
          <span style={{ marginRight: '5px' }}>
            <span>{t('filter des part1')}</span>
            <span style={{ margin: '0 5px' }}>
              <Select value={relation} onChange={onChangeRelation}>
                <Select.Option value="any">{t('any')}</Select.Option>
                <Select.Option value="all">{t('every')}</Select.Option>
              </Select>
            </span>
            <span>{t('filter des part2')}</span>
          </span>
          <icons.IconHelp />
        </div>

        <Divider />

        <div className="all-conditions" style={{overflow: 'auto'}}>
          <FilterConditionList
            columns={columns}
            conditions={conditions}
            onChangeCondition={onChangeCondition}
            onRemoveCondition={onRemoveCondition}
          />
        </div>

        <Divider />

        <div className="one-condition-box">
          <div className="one-condition button-group">
            <div className="button" onClick={onClickAddCondition}>
              <div className="icon">
                <icons.IconPlus />
              </div>
              <div className="name">
                {t('new rule')}
              </div>
            </div>
            <div className="button" onClick={onClickClearConditions}>
              <div className="icon">
                <icons.IconDelete />
              </div>
              <div className="name">
                {t('delete filter')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OverlayPanelBox>
  );
}

export default React.forwardRef(FilterPanel);
