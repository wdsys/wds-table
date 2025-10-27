# WDS-Table

<div align="center">

![WDS-Table](wds.logo.svg)

跨平台桌面表格编辑器

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-1.70-orange.svg)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131.svg)](https://tauri.app/)

</div>

## 📖 简介

WDS-Table 是一个基于 Tauri、React 和 TypeScript 构建的现代化跨平台桌面表格编辑器。它提供了直观的用户界面、强大的数据处理能力和出色的性能。

## ✨ 特性

- 🎨 现代化的用户界面设计
- 📊 强大的表格编辑功能
- 💾 支持自定义 `.table` 格式文件
- 🌍 多语言支持（中文/英文）
- 📁 最近文件快速访问
- 🚀 跨平台支持（Windows、macOS、Linux）
- ⚡ 基于 Rust 的高性能
- 🔒 本地数据存储，保护隐私

## 🖥️ 技术栈

### 前端
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全
- **Ant Design 4** - UI 组件库
- **Vite** - 构建工具
- **pnpm** - 包管理器

### 后端
- **Rust** - 系统级编程语言
- **Tauri 2.x** - 跨平台桌面应用框架

## 🚀 快速开始

### 前置要求

- **Node.js** 16 或更高版本
- **pnpm** 包管理器
- **Rust** 1.70 或更高版本（Tauri 需要）
- **WebView2**（Windows 用户，通常已内置）

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-org/wds-table.git
   cd wds-table
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **开发模式运行**
   ```bash
   pnpm tauri:dev
   ```

4. **构建生产版本**
   ```bash
   pnpm tauri:build
   ```

构建产物将位于 `src-tauri/target/release/` 目录。

### 安装包管理器

**安装 pnpm：**
```bash
# macOS / Linux
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Windows
npm install -g pnpm
```

**安装 Rust：**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## 📁 项目结构

```
wds-table/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   │   ├── table/         # 表格相关组件
│   │   └── ...
│   ├── pages/             # 页面组件
│   │   ├── home/          # 主页
│   │   ├── recent/        # 最近文件
│   │   ├── table/         # 表格页面
│   │   └── settings/      # 设置页面
│   ├── locale/            # 国际化文件
│   ├── utils/             # 工具函数
│   ├── App.tsx            # 根组件
│   └── main.tsx           # 入口文件
├── src-tauri/             # Tauri 后端
│   ├── src/               # Rust 代码
│   │   ├── main.rs        # 入口点
│   │   ├── lib.rs         # 库文件
│   │   └── utils.rs       # 工具模块
│   ├── Cargo.toml         # Rust 依赖
│   └── tauri.conf.json    # Tauri 配置
├── public/                # 静态资源
├── .github/               # GitHub 配置
└── dist/                  # 构建输出
```

## 📝 可用脚本

在项目根目录运行以下命令：

```bash
# 开发模式
pnpm tauri:dev       # 启动开发服务器（前端 + Tauri）

# 构建
pnpm build           # 仅构建前端
pnpm tauri:build     # 构建完整桌面应用

# 代码检查
pnpm type-check      # TypeScript 类型检查
pnpm lint            # 代码风格检查

# 清理
pnpm clean           # 清理构建产物
pnpm clean:all       # 完全清理（包含 node_modules）
```

## 🛠️ 开发指南

### 环境设置

1. 安装 Rust
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. 安装 pnpm
   ```bash
   npm install -g pnpm
   ```

3. 克隆项目并安装依赖
   ```bash
   git clone https://github.com/your-org/wds-table.git
   cd wds-table
   pnpm install
   ```

### 开发流程

1. 创建功能分支
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. 开始开发
   ```bash
   pnpm tauri:dev
   ```

3. 提交更改
   ```bash
   git add .
   git commit -m "feat: 描述你的更改"
   git push origin feature/your-feature-name
   ```

### 代码规范

- 使用 TypeScript 编写所有新代码
- 遵循严格的 ESLint 规则
- 添加有意义的注释（中文）
- 使用 async/await 而不是回调
- 编写完善的错误处理

更多信息请查看 [贡献指南](./CONTRIBUTING.md)

## 🤝 贡献

我们欢迎所有形式的贡献！

- 🐛 报告 Bug
- 💡 提出功能建议
- 📝 改进文档
- 🔧 提交 Pull Request

阅读 [贡献指南](./CONTRIBUTING.md) 了解详情。

## 📄 许可证

本项目采用 [MIT 许可证](./LICENSE)。

## 🙏 致谢

- [Tauri](https://tauri.app/) - 强大的跨平台桌面框架
- [React](https://reactjs.org/) - 优秀的 UI 库
- [Ant Design](https://ant.design/) - 企业级 UI 设计语言
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript
- [Rust](https://www.rust-lang.org/) - 系统级编程语言

## 📧 联系方式

如有问题或建议，请：
- 创建 [Issue](https://github.com/your-org/wds-table/issues)
- 提交 [Pull Request](https://github.com/your-org/wds-table/pulls)

---

<div align="center">

Made with ❤️ by WDS-Table Contributors

⭐ Star this repository if you find it helpful

</div>
