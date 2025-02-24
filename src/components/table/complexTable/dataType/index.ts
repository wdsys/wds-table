// @ts-nocheck
import React from 'react';

import RowIndexType from './rowIndex';
import TextType from './text';
import NumberTyep from './number';
import SerialType from './serial';
import SelectType from './select';
import MultiSelectType from './multiSelect';
import CheckboxType from './checkbox';
import DateType from './date';
import TimeType from './time';
import PersonType from './person';
import PeopleType from './people';
import FileType from './file';
import HyperlinkType from './hyperlink';
import RelatedRequirements from './relatedRequirements';
import LinkedRequirements from './linkedRequirements';
import EmailType from './email';
import PhoneType from './phone';
import TreeNodeType from './treeNode';
import ViewsType from './views';
import ViewLinksType from './viewLinks';
import RequirementStatus from './requirementStatus';
import SerialNumber from './serialNumber';
// import NotificationMember from './notification';
// import TaskMgr from './taskmgr';
// import TaskStartDate from './taskStartDate';
// import TaskEndDate from './taskEndDate';
// import TaskHolder from './taskHolder';

export const DataTypes = {
  rowIndex: RowIndexType,
  text: TextType,
  number: NumberTyep,
  serial: SerialType,
  select: SelectType,
  multiSelect: MultiSelectType,
  checkbox: CheckboxType,
  date: DateType,
  time: TimeType,
  person: PersonType,
  people: PeopleType,
  file: FileType,
  hyperlink: HyperlinkType,
  relatedRequirements: RelatedRequirements,
  linkedRequirements: LinkedRequirements,
  email: EmailType,
  phone: PhoneType,
  treeNode: TreeNodeType,
  views: ViewsType,
  viewLinks: ViewLinksType,
  requirementStatus: RequirementStatus,
  // currentCoorOrder: CurrentCoorOrder,
  // signature: Signature,
  serialNumber: SerialNumber,
  // notification: NotificationMember,
  // taskmgr: TaskMgr,
  // taskStartDate: TaskStartDate,
  // taskEndDate: TaskEndDate,
  // taskHolder: TaskHolder,
};

export const ColumnIcon = React.memo(({ dataType, AllDataTypes }) => {
  const t = AllDataTypes?.[dataType] || DataTypes[dataType] || TextType;
  return t.icon({ dataType });
});
