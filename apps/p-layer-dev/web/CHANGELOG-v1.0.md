# CHANGELOG — v1.0（对齐统一产品文档）

> 入口：`apps/p-layer-dev/web`（Vite 6 + React 19 + TypeScript strict，正式 React 源码入口）
> 基准：《P-Layer 统一产品文档 v1.0》 `requirements/13_P-Layer_Unified_Product_Document_v1.md`
> 状态：**v1.0 对齐完成（2026-09-03）**——文档 §5–§18 全部规格项已落地并通过走查

---

## 1.0.0（2026-09-03）

本版本把 React 正式入口从「研究推理空间 + 旧 Applications 看板」收敛为文档 v1.0 的产品形态：
科学环水平轮播（O→E→T→H）、研究资产库（Idea/理论/文献 + I0–I6 成熟度）、研究行动看板、
正式研究项目数据接口（§12 九步 Study）、Pia! 教练边界（§13）、五入口导航（§5）。

### 规格对照（§18-7 报告）

| 规格 | 内容 | commit | 验证 |
|---|---|---|---|
| N1–N4 | 导航五入口 · 移除 nav-map/ResearchTree · 主页工作版 · 研究行动看板（旧申请下线） | `7e7db23` `408cf1e` | ✓ |
| S1–S5 | 科学环 O/E/T/H 水平轮播 · 两阶段交互 · 双轨纪律 · 环不改数据 | `7e7db23` 起系列 | ✓ |
| A1–A3 | 资产库在科学环内 · 成熟度 I0–I6 · **文献↔Idea 多对多连接层（9 关系类型 × user/pia/system × why）** | `d5d0827` `4a8155d` | ✓ 11/11 |
| R1–R3 | Idea-N/Vn/RQ-M 分层编号 · 反馈类型 6 类 · PDF 5 类 | `68e415a` | ✓ |
| H1–H3 | 三主入口 + 真实最近工作 + 空状态 · 名言防伪 · Logo 抖动 | `7e7db23` | ✓ |
| P1 | Pia! 教练边界审计（不代笔 / 不主动 / 不落库 / 不删历史） | `83f79dd` | ✓ |
| P2 | §12 Study/数据版本/分析/效应量/偏离/假设结论接口预留 | `993c314` | ✓ 9/9 |
| §17 | 十二条用户路径走查 | — | ✓ 19/19 |

### 变更明细

#### `f7e8080` chore: init P-Layer repo（requirements + web React entry）
初始化仓库：requirements/ 全套产品文档 + React 正式入口。此后 vanilla archive 仅留档，
不再作为改动目标。

#### `3891bfb` chore: scope repo to web entry + requirements
仓库范围收敛：只保留 web 正式入口与文档，archive（research-p-layer / p-layer-v2）留在本地
不入库。**R3 数据兼容**：复用 `rilProjects` / `rilActiveProject` / `notes.*` 结构，与旧版同构，
迁移期两版切换不丢数据。

#### `0ee33e7` chore: exclude legacy p-layer-v2 demo
从版本控制中排除 p-layer-v2 视觉原型（文档 §18 明确不扩大 v2 原型）。

#### `7e7db23` feat(home): rebuild home per spec v1.0 §5.1 / §6.1
- 主页重建：三主入口等宽（捕捉 Idea / 管理研究资产 / 继续项目）+ 真实最近工作
  （最近 Idea / 反馈 / PDF，数据驱动，无示例内容填充）
- 名言首屏 + 点击 Logo 轻微抖动短暂模糊换名言（无单独刷新按钮）
- 空状态清晰（无演示数据）

#### `d5d0827` feat(brainstorm): research asset library per spec v1.0 §9
- IdeaDatabase 成熟度模型 **I0–I6**（文字 + 字母 + 颜色；自动推导 + 手动覆盖 + 变化原因记录）
- 生命周期 active/paused/archived/abandoned/converted（放弃不是失败，归档不是删除）
- TheoryLibrary 理论库最小实体；ResearchNetwork 节点成熟度徽章
- 验收：6 STAGE 全过 + tsc 0（教训：正文在 `<input.idea-text>` 的 value，textContent 找不到）

#### `68e415a` feat(brainstorm): align versions/PDF types/feedback types per §10–§11
- 反馈类型规范 6 类（clarity/logic/theory/literature/value/other），旧 key 读取归一，存储不动
- PDF 5 类（idea-brief / theory-proposal / empirical-proposal / comprehensive-proposal / rq-brief），
  出口面板改为类型选择条
- 版本编号 Idea-<id后4>/V<n>，VersionModal 头部统一；反馈绑定 PDF V1 提示
- 踩坑：TDZ（zh 引用顺序）；React 受控 textarea 赋值须走原型 setter + dispatch input

#### `408cf1e` feat(board): §5.4 research-action board + retire old applications UI
- Board.tsx 重写为**研究行动看板**（阅读/访谈/实验准备/数据准备/分析/反馈处理/复盘，
  3 列 todo/doing/done，可拖拽，行动↔Idea 仅作上下文）
- `lib/actions.ts` 数据层独立于旧 applications；旧「学术申请看板」UI 直接下线（applications 字段
  保留不删不覆盖，仅不再渲染）
- ResearchNetwork 节点显示「✓ 已转项目」+ 行动数 chips
- brainstorm `finishSession` → `completeTraining`（训练完成不再写旧申请卡）
- 删除 4 个孤儿组件（ApplicationCard / BoardColumn / BoardInspector / BoardSidebar）
- 验收：puppeteer 20/20 + console 0

#### `1d70f4e` feat(flow): §17.5 add research-flow entry from Home + v1 exit grid
- 修复「研究流程（Flow）无 UI 入口」：主页新增 `.homev2-flow-row` 常驻入口；
  v1 训练面板退出卡新增「📋 进入研究流程」（退出卡 6→7 张）
- `.loop-exit-grid` 改 `repeat(auto-fill, minmax(150px,1fr))`
- 验收：puppeteer 6/6（主页入口 → 直达 Flow 九步 → 第 1 步预填 rqDraft → reload 仍在 → 退出卡）

#### `83f79dd` fix(pia): §13 coach boundary audit
- 审计全部 askAssistant 调用点：3 处均用户按钮触发、回答不写 brainstorm.* 历史
- legacy 8 步 prompt 补齐「不要替我写结论」子句（zh/en），与 TrainingPanelV1 / ScienceCycle 一致
- PDF 不含 Pia!/AI 痕迹（briefPdf.ts）；`clearMaturity` 删覆盖但保留 maturityLog

#### `4a8155d` feat(ideas): §9.3 literature-link layer
- `Idea.literatureLinks: LiteratureLink[]`：Idea ↔ 文献**多对多**
- 关系 9 类（支持/质疑/启发/反驳/提供理论/提供测量/提供方法/限定边界/改变我的想法）
- 来源三分 **user / pia / system**（UI 只产 user；pia/system 预留给未来建议/推断流）
- 每条带 why「为什么有关」；连接只陈述关系，不自动宣称因果
- IdeaDatabase 行详情「文献与研究连接」编辑器（列表 + 行内新增表单 + 移除）
- ResearchNetwork 关系列升级（类型 chip + 来源标记 + why），旧 literatureSource 兜底兼容
- 验收：puppeteer 11/11 + console 0

#### `993c314` feat(projects): §12 9-step Study data interfaces reserved
- `Project.study?: Study`：九步执行结构（研究问题→理论与假设→变量→设计→预注册→招募→
  数据冻结→分析→回到假设）对应 `STUDY_STAGES`（9）
- 预留接口：`DataVersion`（冻结快照）、`AnalysisRecord`（v1 reserved 标记）、`EffectRecord`
  （estimate + CI）、`DeviationRecord`（偏离记录）、`AssumptionResult`（支持/部分/未支持/证据不足）
- Projects 规划视图「📋 正式研究项目 · 九步执行接口」卡：状态色编码 + 9 阶段格 +
  预留接口计数 + v1 reserved 占位行；空态注明「v1 不会自动把 RQ 升级为项目」
- 验收：puppeteer 9/9 + console 0

### 验收汇总

| 项 | 结果 |
|---|---|
| `tsc --noEmit` | exit 0 |
| console / pageerror | 0 |
| §17 十二条用户路径（v1.1 报告） | 19/19 PASS（12 已实现 / 0 未验证 / 0 未实现 / 0 冲突） |
| §9.3 文献连接层走查 | 11/11 PASS |
| §12 Study 接口走查 | 9/9 PASS |
| 看板行动流走查 | 20/20 PASS |
| Flow 入口走查 | 6/6 PASS |

### 运行

```bash
cd apps/p-layer-dev/web
npm run dev        # http://localhost:5173
npm run typecheck  # tsc --noEmit
npm run build      # tsc -b && vite build
```

---

## v1.1 候选（当前为数据接口预留，未启用执行逻辑）

- **Study 流水线**：DataVersion 冻结 / Analysis 实际计算（效应量 + CI）/ 偏离记录 UI——
  v1 仅接口（AnalysisRecord.reserved），后续工程启用真实统计
- **pia / system 来源连接**：UI 仅产生 user 确认连接；Pia! 建议 / 系统推断来源待建议流接入
- **ResearchNetwork 文献列**：typed-link 标题自动并入文献资产列（当前仅显示于关系列）
- **测试基础设施**：把 `/tmp/p-layer-*.cjs` 走查脚本迁入仓库（Vitest + Playwright），建立回归基线
