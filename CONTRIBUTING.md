# 贡献指南

欢迎为 WDS-Table 贡献代码！

## 开发步骤

### 1. Fork 并克隆
```bash
git clone https://github.com/your-username/wds-table.git
cd wds-table
```

### 2. 安装依赖
```bash
# 安装 Node.js（使用 nvm）
nvm use

# 安装依赖
pnpm install
```

### 3. 开发
```bash
pnpm tauri:dev
```

### 4. 提交变更
```bash
git checkout -b feature/your-feature
# 修改代码后
git commit -m "feat: 你的功能描述"
git push origin feature/your-feature
```

### 5. 创建 PR
在 GitHub 上提交 Pull Request。

## 代码规范

- 使用 TypeScript
- 添加中文注释
- 使用 2 空格缩进
- 使用 async/await

## 提交格式

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档
- `refactor:` 重构

感谢您的贡献！🙏
