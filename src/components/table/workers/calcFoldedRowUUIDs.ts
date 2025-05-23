type TreeNodeValue = {
    level?: number;
    closed?: boolean;
  };
  
  interface Row {
    uuid: string;
    fields: {
      [key: string]: TreeNodeValue;
    };
  }
  
self.onmessage = ({ data: { rows, treeNodeUUID } }) => {
    const foldedUUIDs = new Set<string>();
    const levelStack = new Map<number, { closed: boolean }>();

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const value = row.fields?.[treeNodeUUID];
        const level = value?.level || 0;

        // 清理大于当前层级的缓存
        for (const [key] of levelStack) {
        if (key >= level) levelStack.delete(key);
        }

        // 检查是否有父节点折叠
        for (const [, state] of levelStack) {
        if (state.closed) {
            foldedUUIDs.add(row.uuid);
            break;
        }
        }

        // 更新当前层级状态
        if (value?.closed) {
        levelStack.set(level, { closed: true });
        }
    }

    self.postMessage([...foldedUUIDs]);
};