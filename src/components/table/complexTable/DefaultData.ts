import { v4 as uuidv4 } from 'uuid';

export const DefaultData = {
  options: {
    lockTableHead: false,
    lockFullTable: false,
    lineWrap: true,
    rowIndex: false,
  },
  columns: [
    {
      name: '树节点',
      dataType: 'treeNode',
      width: 150,
    },
    // {
    //   name: "名字",
    //   dataType: 'text',
    //   width: 150,
    // },
    // {
    //   name: "年龄",
    //   dataType: 'number',
    //   width: 100,
    // },
    // {
    //   name: "性别",
    //   dataType: 'select',
    //   choices: [
    //     {
    //       name: '男',
    //     },
    //     {
    //       name: '女',
    //     },
    //   ],
    //   width: 80,
    // },
    // {
    //   name: "用户标签",
    //   dataType: 'multiSelect',
    //   choices: [
    //     {
    //       name: '咸鱼',
    //     },
    //     {
    //       name: '肝帝',
    //     },
    //     {
    //       name: '氪佬',
    //     },
    //     {
    //       name: 'KOL',
    //     },
    //     {
    //       name: '网红',
    //     },
    //     {
    //       name: '代练',
    //     },
    //     {
    //       name: '危险分子',
    //     },
    //   ],
    //   width: 150,
    // },
    // {
    //   name: "禁言",
    //   dataType: 'checkbox',
    //   width: 80,
    // },
    // {
    //   name: "出生日期",
    //   dataType: 'date',
    //   width: 120,
    // },
    // {
    //   name: "最近访问时间",
    //   dataType: 'time',
    //   width: 150,
    // },
    // {
    //   name: "相关人员",
    //   dataType: 'people',
    //   width: 120,
    // },
    // {
    //   name: "附件",
    //   dataType: 'file',
    //   width: 120,
    // },
    // {
    //   name: "主页",
    //   dataType: 'hyperlink',
    //   width: 120,
    // },
    // {
    //   name: "电子邮箱",
    //   dataType: 'email',
    //   width: 120,
    // },
    // {
    //   name: "电话",
    //   dataType: 'phone',
    //   width: 120,
    // },
  ],
  rows: [
    // {
    //   '名字': 'John Smith; John Smith; John Smith; John Smith;',
    //   '年龄': '20',
    //   '性别': '男',
    //   '用户标签': ['咸鱼', '氪佬'],
    //   '禁言': false,
    //   '出生日期': '2000-01-01',
    // },
    // {
    //   '名字': '张三',
    //   '年龄': '18',
    //   '性别': '男',
    //   '用户标签': ['咸鱼', '肝帝'],
    //   '禁言': false,
    //   '出生日期': '2010-02-21',
    // },
    // {
    //   '名字': '李四',
    //   '年龄': '17',
    //   '性别': '女',
    //   '用户标签': ['咸鱼', '肝帝', '氪佬'],
    //   '禁言': false,
    //   '出生日期': '2020-03-31',
    // },
    // {
    //   '名字': '王五',
    //   '年龄': '17',
    //   '性别': '男',
    //   '用户标签': ['肝帝', 'KOL'],
    //   '禁言': false,
    //   '出生日期': '2030-04-01',
    // },
    // {
    //   '名字': '赵六',
    //   '年龄': '17',
    //   '性别': '女',
    //   '用户标签': ['氪佬', '网红'],
    //   '禁言': false,
    //   '出生日期': '2040-05-15',
    // },
    // {
    //   '名字': 'Alice',
    //   '年龄': '17',
    //   '性别': '女',
    //   '用户标签': ['咸鱼', '氪佬', '网红'],
    //   '禁言': false,
    //   '出生日期': '2050-06-16',
    // },
    // {
    //   '名字': 'Bob',
    //   '年龄': '17',
    //   '性别': '男',
    //   '用户标签': ['咸鱼', '危险分子'],
    //   '禁言': true,
    //   '出生日期': '1950-08-31',
    // },
    // {
    //   '名字': 'Catherine',
    //   '年龄': '17',
    //   '性别': '女',
    //   '用户标签': ['KOL', '氪佬', '网红'],
    //   '禁言': false,
    //   '出生日期': '2100-11-02',
    // },
  ],
};

export const requirementStatus = {
  dataType: 'requirementStatus',
  name: '需求状态',
  uuid: uuidv4(),
  width: 120,
  choices: [
    {
      uuid: uuidv4(),
      name: '未协调',
      color: {
        code: '淡黄',
        nameCN: '淡黄',
        color: 'rgba(240, 200, 0, 0.2)',
      },
      key: 0,
    },
    {
      uuid: uuidv4(),
      name: '协调中',
      color: {
        code: '鲜橘',
        nameCN: '鲜橘',
        color: 'rgba(240, 107, 5, 0.2)',
      },
      key: 1,
    },
    {
      uuid: uuidv4(),
      name: '已协调',
      color: {
        code: '天蓝',
        nameCN: '天蓝',
        color: 'rgba(5, 117, 197, 0.2)',
      },
      key: 2,
    },
    {
      uuid: uuidv4(),
      name: '确定',
      color: {
        code: '白灰',
        nameCN: '白灰',
        color: 'rgba(140, 140, 140, 0.12)',
      },
      key: 3,
    },
    {
      uuid: uuidv4(),
      name: '冻结',
      color: {
        code: '暗银',
        nameCN: '暗银',
        color: 'rgba(92, 92, 92, 0.2)',
      },
      key: 4,
    },
  ],
};
export const currentCoorOrder = {
  dataType: 'currentCoorOrder',
  name: '当前协调单',
  uuid: uuidv4(),
  width: 130,
};

export default {
  DefaultData,
  requirementStatus,
  currentCoorOrder,
};
