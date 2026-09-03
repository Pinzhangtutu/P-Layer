# P-layer 项目交接说明（给 WorkBuddy）

更新时间：2026-08-27

这份文档用于把 P-layer 交给另一个开发助手继续维护和开发。请先阅读本文件，再检查代码和运行状态；不要仅凭文件名或旧版本说明推断功能已经完成。

## 1. 项目定位

P-layer 是面向早期科研者的本地社会科学研究工作台，目标是降低研究训练、研究设计、资料整理、统计分析和反馈所需的非必要资源门槛。

产品不是论文代写工具，也不是替用户自动决定研究假设的工具。AI 应扩大用户能力，但用户必须保留问题、命题和初步 Research Question 的主导权。系统需要持续区分：已验证证据、合理推断、工作假设和待解决问题。

产品文档中的核心训练路径是：

```text
观察/想法 → 初步命题 → 可能解释 → 预测 → 前提与边界
→ 替代解释 → 证据线索 → 初步 Research Question
```

一次训练的主要产出是用户主导的“初步 RQ 草稿”和可分享的一页研究想法简报，不是最终论文、正式开题报告或成绩单。

## 2. 目录与实际代码位置

当前工作区：

```text
/Users/pinzhangwang/Documents/ChatGPT/P-Layer Development
```

这个目录主要放产品规划文档：

- `00_README.md`：文档入口和当前未决问题
- `01_Product_Definition.md`：使命、用户、价值和边界
- `02_Product_Architecture.md`：信息架构、用户流程、寄语和身份机制
- `03_Roadmap_and_Validation.md`：路线图、指标和验证问题
- `04_Decision_Log.md`：已确认、暂定和待确认决策
- `05_Brainstorm_to_RQ.md`：头脑风暴到初步 RQ 的交互/教学规范
- `06_WORKBUDDY_HANDOFF.md`：本交接说明

实际软件目录是一个符号链接：

```text
/Users/pinzhangwang/Documents/ChatGPT/P-Layer Development/research-p-layer
→ /Users/pinzhangwang/Documents/Codex/2026-08-25/wo/outputs/research-p-layer
```

修改软件时，先确认符号链接目标和当前 Git 状态：

```bash
cd "/Users/pinzhangwang/Documents/ChatGPT/P-Layer Development"
readlink research-p-layer
git -C "$(readlink -f research-p-layer)" status --short
```

不要把符号链接替换成普通目录，也不要把构建产物误当作源代码。

## 3. 当前软件形态

这是一个本地网页应用，后端由 `server.py` 提供。主要文件包括：

- `index.html`：主界面、研究生命周期九步、部分内联逻辑和页面挂载
- `server.py`：本地 HTTP 服务、R 分析接口、Pia/Ollama、RAG、OCR、Zotero 和外部模型代理
- `analysis_engine.R`：统计分析引擎
- `methodology_knowledge.json`：离线社会科学研究方法知识库
- `sample_experiment.csv`：R 统计链路示例数据
- `start.command`：推荐启动入口
- `*.js` / `*.css`：页面模块、交互和样式；修改前应先确认脚本加载顺序
- `vendor/`：随项目放置的 Python 依赖，目前包含 `pypdf` 和 `typing_extensions`
- `dist/`、`build/`：历史/当前构建产物，不要直接从这里修改功能

当前 README 将软件描述为 MVP 0.6；`dist/` 中存在多个历史 DMG 版本。除非实际运行和测试确认，不要把这些版本号当成当前源代码版本或已发布版本。

## 4. 启动与最小验证

推荐方式：

```bash
cd "/Users/pinzhangwang/Documents/ChatGPT/P-Layer Development/research-p-layer"
./start.command
```

然后打开：

```text
http://127.0.0.1:8765/index.html
```

不要使用普通的 `python3 -m http.server` 代替，因为网页虽然可能显示，但 `/api/analyze` 等后端接口不会工作。

启动后至少检查：

```bash
curl -s http://127.0.0.1:8765/api/health
```

重点确认：

1. 页面能打开，首页和研究项目能正常切换；
2. `/api/health` 能返回 JSON；
3. 第八步用 `sample_experiment.csv` 测试 R 链路；
4. 运行一个最小统计分析后，页面能展示结果且不会把示例结果误显示为用户真实结果；
5. 设置页在 R、Zotero、OCR、Ollama 不可用时仍能明确显示状态，而不是静默假装成功。

DMG 不内置 R。需要统计分析时，Mac 上必须安装 R；没有 R 时，项目管理、研究流程和 Pia 的部分本地功能仍应可用。

## 5. 已有主要功能

### 研究工作台

- 研究生命周期九步：研究问题、理论与假设、变量与操作化、研究设计、预注册/伦理、招募与问卷、数据冻结/清理、统计分析、回到假设。
- `Project → Idea → Study → Data version` 四层项目结构。
- 项目、Milestone、deadline、甘特图和完成度。
- 头脑风暴数据库表格：主题、时间、地点、案例、成熟度、研究类型等字段。
- 每个页面底部有 Research Copilot。
- 第八步有交互统计阅读器，可解释 p、F、t、效应量、置信区间、均值、SD 和样本量，并展示误读边界。

### Pia 与 AI

- 优先使用本地、可审计的研究方法知识库。
- 本地自然对话通过 Ollama 使用 `qwen2.5:7b-instruct`。
- 设置页预留 OpenAI、Anthropic、Google Gemini、DeepSeek、OpenRouter 和自定义 OpenAI-compatible API。
- API Key 不应写入项目、导出文件或 `localStorage`；当前设计只在浏览器会话中保存密钥。
- 本地模型不可用时应明确提示，不要用固定模板伪装成自然语言 AI 回答。

### 项目资料库 / RAG

- 支持 PDF、DOCX、TXT、Markdown、CSV、JSON、HTML。
- 按项目提取、分段和检索；不同项目资料不可混用。
- Pia 回答可显示 `R1`、`R2` 等实际检索来源。
- 普通本地模式不上传文件或检索片段；连接外部模型时只发送本次检索出的少量片段。
- 删除项目资料时，同时删除 P-layer 的本地检索片段，但不删除 Zotero 原文件。

### Zotero

- 通过 Zotero Local API 只读连接本机 Zotero。
- 默认索引元数据、摘要、标签和笔记；PDF 全文索引需要用户主动选择。
- 每个 P-layer 项目绑定自己的 Collection，不跨项目混用。
- 当前版本不向 Zotero 写入标签、Collection 或笔记。

### R 统计

已有能力包括 CSV、Excel、SPSS、描述统计、缺失概览、Cronbach's alpha、Welch t 检验、Hedges' g、单因素 ANOVA、操纵检查、线性回归、2×2 ANOVA、简单中介 bootstrap、调节回归、配对 t 检验和重复测量分析。

边界包括：复杂协变量中介、多分类 X 中介、调节中介、混合效应模型、缺失数据插补、稳健标准误、贝叶斯分析和多重比较校正尚未加入。正式研究中仍需研究者检查模型假设、数据结构、预注册和研究设计。

## 6. P Note / 寄语模块的硬约定

寄语是人文入口或辅助模块，不应被当作 P-layer 的核心科研价值。

- Demo 标题固定使用：`给 PINZHANG 的一句话 / A NOTE FOR PINZHANG`。
- 注册/登录后，标题和署名应使用当前用户昵称和身份，不要把 PINZHANG 永久写死在登录后逻辑中。
- 内容主题覆盖学术人物、公共/政治人物、商业/创造者、品格和困难时刻。
- 无法确认逐字出处时，必须标记为 `思想启发/转述`，不能使用确定性引号冒充原文。
- 同一浏览周期内不得重复；换周期重新随机，并避免新周期第一条等于上一周期最后一条。
- 寄语字段建议包含：`id`、`text`、`author`、`source_status`、`source_url`、`topic`、`language`、`editorial_note`、`active`。

## 7. 继续开发时的优先级

优先完成“研究想法 → 初步 RQ → 可分享简报”的真实闭环，而不是继续堆叠表面功能。

建议顺序：

1. 先复现当前启动和最小功能，记录真实报错，不要立即重构；
2. 检查头脑风暴每一步是否有可回看的持久化成果；
3. 确保 Pia 是按需介入：默认用户自主探索，用户主动求助、卡住或出现严重逻辑错误时再介入；
4. 实现/验证错误记录：概念、逻辑、测量、范围、证据错误及后续修正；
5. 实现一页研究想法简报导出，分享版隐藏不必要的私人学习细节；
6. 再做真实用户验证，暂时不要把“多年 RA”或“没有 RA 机会”中的一类强行确定为唯一首发人群；
7. 之后再决定 P-layer 与 i-layer 是否共用账户、记忆、时间线和推荐系统。

## 8. 不要擅自改变的原则

- 不要把相关关系写成因果关系。
- 不要把理论当成对用户观点的证明。
- 不要把生活观察直接伪装成成熟 RQ。
- 不要让 AI 替用户决定命题或最终研究问题。
- 不要静默删除未完成步骤、错误、被放弃的解释或未解决问题。
- 不要把本地可选服务（R、Ollama、Zotero、OCR）不可用误报为系统成功。
- 不要把历史 DMG、旧 README、构建目录或测试数据当成当前真实运行状态。
- 不要在未确认的情况下修改 Zotero 原库、用户研究文件或本地持久化数据。

## 9. 开始工作前请先给出这份检查报告

WorkBuddy 开始修改前，请先报告：

```text
1. 当前实际代码路径和符号链接目标
2. Git status 和最近一次提交（如果存在）
3. 当前启动方式和端口
4. /api/health 的实际返回结果
5. R、Ollama、Zotero、OCR 是否可用
6. 你准备修改的具体文件
7. 修改会影响哪些用户流程
8. 如何验证修改没有破坏现有功能
```

每次修改后必须说明：改了哪些文件、为什么改、运行了什么验证、哪些功能仍未验证。若出现错误，先保留完整错误信息和复现步骤，再修复；不要用大范围重写掩盖问题。

## 10. 可直接发送给 WorkBuddy 的首条指令

> 请接手 `/Users/pinzhangwang/Documents/ChatGPT/P-Layer Development` 下的 P-layer 项目。先完整阅读 `06_WORKBUDDY_HANDOFF.md`、`00_README.md`、`01_Product_Definition.md`、`04_Decision_Log.md` 和 `05_Brainstorm_to_RQ.md`，再解析 `research-p-layer` 符号链接并检查实际代码目录。不要先改代码。请先完成交接检查报告：实际代码路径、Git 状态、启动方式、`/api/health`、R/Ollama/Zotero/OCR 状态、当前可复现功能、已知风险和建议下一步。确认后再按“研究想法 → 初步 RQ → 一页可分享简报”的闭环继续开发。所有修改都要小步进行，并在修改后运行相关验证；不要删除或覆盖用户现有研究数据、Zotero 数据或未完成的研究记录。

