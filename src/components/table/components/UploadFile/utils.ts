// @ts-nocheck
const typeChild = {
  0: 'view', // 功能视图
  1: 'view', // 逻辑视图
  2: 'view', // 物理视图
  3: 'reqset', // 需求集
  4: 'file', // 自定义文件夹下的文件
};

export function getFilepathByFile(file) {
  const { fatherLevel = [] } = file || {};

  let filePath = '';

  // eslint-disable-next-line no-plusplus, no-const-assign
  for (let i = 0; i < fatherLevel.length; i++) {
    filePath += (fatherLevel[i]?.name || '');
    filePath += '/';
  }

  filePath += file.name;

  return filePath;
}

// eslint-disable-next-line default-param-last
function buildProFolder(folderList = [], fileList = [], type = 4, fatherLevel = [], parentPath) {
  // fileList 需求集  folderList  需求文件夹
  const treeData = [];

  for (const item of folderList) {
    const { files = [], folder_list: folders = [], ...others } = item;

    const currentFolderPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    const id = type === 4 ? currentFolderPath : item.id;

    treeData.push({
      ...others,
      id,
      children: buildProFolder(folders, files, type, [...fatherLevel, {
        id, name: item.name, nodeType: 'folder', type, resourcePath: currentFolderPath,
      }], currentFolderPath),
      nodeType: 'folder',
      type,
      fatherLevel,
      resourcePath: currentFolderPath,
    });
  }

  for (const item of fileList) {
    // 模型库中，从store获取的模型不展示
    if (!(type === 5 && item.origin !== 0)) {
      const currentFolderPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      const file = {
        ...item,
        nodeType: typeChild[type],
        type,
        fatherLevel,
        resourcePath: currentFolderPath,
        id: type === 4 ? currentFolderPath : item.id,
      };
      if (file.nodeType === 'file') {
        file.filePath = getFilepathByFile(file);
      }
      treeData.push(file);
    }
  }

  return treeData;
}

export function buildResource(data = {}) {
  const resourceTree = [];
  const { folder_list: folderList = [], file_list: fileList = [] } = data;

  for (const item of folderList) {
    const {
      type, name, files, folder_list: folders, id,
    } = item;

    if (type === 4) { // 自定义
      const key = name;
      const params = {
        name,
        nodeType: 'folder',
        type,
        id: key,
        resourcePath: name,
        children: buildProFolder(folders, files, type, [{
          id: type === 4 ? key : id,
          type,
          name,
          nodeType: 'folder',
          resourcePath: name,
        }], name),
      };
      resourceTree.push({ ...params });
    }
  }

  for (const item of fileList) {
    resourceTree.push({
      ...item,
      type: 4,
      nodeType: 'file',
      id: item.name,
      resourcePath: item.name,
    });
  }

  return resourceTree;
}

// 找到指定节点及其所有父节点的数据
export function findNodeAndAncestors(data, targetId = 'root', targetType = 4) {
  const stack = [{
    node: data,
    ancestors: [{
      id: 'root',
      name: '项目资源',
    }],
  }];

  if (targetId === 'root') {
    return stack?.[0].ancestors;
  }

  let newncestors = []; // 初始化祖先节点数组

  while (stack.length > 0) {
    const { node, ancestors } = stack.pop();
    newncestors = [...ancestors];

    for (const n of node) {
      if (`${n.id}` === `${targetId}` && n.nodeType === 'folder' && targetType === n.type) {
        return [...ancestors, n];
      }
      if (n.children && n.children.length > 0) {
        stack.push({
          node: n.children,
          ancestors: [...ancestors, n],
        });
      }
    }
  }

  return newncestors;
}
