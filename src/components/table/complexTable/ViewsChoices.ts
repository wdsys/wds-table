// @ts-nocheck
export const TagValues = {
  功能: 1,
  逻辑: 2,
  物理: 3,
};

export function sortTags(tags) {
  const sortedTags = [...tags];

  sortedTags.sort((a, b) => {
    const av = TagValues[a] || 0;
    const bv = TagValues[b] || 0;
    return av - bv;
  });

  return sortedTags;
}

export const ViewsChoices = [
  {
    uuid: '6bf97b26-2454-4e97-ae18-c9e4000c9d74',
    name: '功能',
    color: {
      code: '浅棕',
      nameCN: '浅棕',
      color: 'rgba(163, 67, 31, 0.2)',
    },
  },
  {
    uuid: 'c6c5f480-b180-462b-bac6-4b4350cd400d',
    name: '逻辑',
    color: {
      code: '轻紫',
      nameCN: '轻紫',
      color: 'rgba(136, 49, 204, 0.2)',
    },
  },
  {
    uuid: 'e9f941d2-bf17-4a25-953c-ef1c5292246d',
    name: '物理',
    color: {
      code: '浅绿',
      nameCN: '浅绿',
      color: 'rgba(3, 135, 102, 0.2)',
    },
  },
];
