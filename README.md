# P-Layer

P-Layer 的集中开发目录。

## 目录

- `requirements/`：产品定义、架构、路线图、决策记录、验收脚本和 WorkBuddy 交接文档。
- `apps/p-layer-dev/`：WorkBuddy 开发目录的源码归档，其中 `web/` 是 React/Vite 前端开发版本。
- `apps/research-p-layer/`：Python 本地服务版本，保留旧版本地服务、R 分析、Zotero/Ollama 联动和桌面端源码。

## 当前开发入口

优先使用 `apps/p-layer-dev/web/`：

```bash
cd /Users/pinzhangwang/P-Layer/apps/p-layer-dev/web
npm install
npm run dev
```

Python 本地服务版本：

```bash
cd /Users/pinzhangwang/P-Layer/apps/research-p-layer
./start.command
```

## 说明

本次汇总保留了源代码、需求、文档、资源、依赖清单和运行脚本；未复制 `node_modules`、虚拟环境、`dist`、`build` 等可重新生成的缓存或构建产物。

原始目录仍然保留，未删除或覆盖。

## 迁移后校验

- 两份源码与原始目录通过校验比对。
- Python 本地服务脚本通过语法检查。
- 前端依赖已在本目录安装。
- 当前前端构建仍有原始代码中的 TypeScript 错误，主要涉及未使用变量，以及 `BrainstormData.researchState` 类型缺失；本次迁移没有擅自修改这些代码。
