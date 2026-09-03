/**
 * 研究流程 9 步的数据层。
 *
 * 9 个步骤沿用旧版 index.html 里的 stageZh / stageEn 顺序。
 * 每步的数据分成两类：
 *   1) 旧版已有专属字段的，直接复用同一份 notes 键，保证新旧页面互通
 *      - 第 1 步 研究问题   -> notes.rqDraft（头脑风暴完成时会写这里）
 *      - 第 3 步 变量操作化 -> notes.coreVariables / notes.optionalVariables
 *      - 第 5 步 预注册伦理 -> notes.prereg / notes.ethics
 *      - 第 8 步 统计分析   -> notes.analysisHistory（R 分析自动归档，只读）
 *   2) 其余步骤的自由记录 -> notes.flowNotes[stepIndex]（新增，旧版没有统一存）
 * 完成状态记在 notes.flowDone[stepIndex]。
 */

import type { Project } from './projects'

export type FlowStage = {
  key: string
  title: Bilingual
  question: Bilingual
  hint: Bilingual
}

type Bilingual = { zh: string; en: string }

/** 与旧版 stageZh / stageEn 一一对应 */
export const FLOW_STAGES: FlowStage[] = [
  {
    key: 'rq',
    title: { zh: '研究问题', en: 'Research Question' },
    question: { zh: '我到底想回答什么？', en: 'What am I actually trying to answer?' },
    hint: {
      zh: '一句能被数据回答的问题。写清对象、变量和关系，避免把话题当问题。',
      en: 'One question data can answer. Name the units, the variables, and the relation — a topic is not a question.',
    },
  },
  {
    key: 'theory',
    title: { zh: '理论与假设', en: 'Theory & Hypotheses' },
    question: { zh: '为什么预期会这样？', en: 'Why should this happen?' },
    hint: {
      zh: '写下机制链条，并给出可证伪的方向性预测。想不出推翻它的条件，就不是假设。',
      en: 'Write the mechanism, then a falsifiable directional prediction. If you cannot imagine disconfirming it, it is not a hypothesis.',
    },
  },
  {
    key: 'variables',
    title: { zh: '变量操作化', en: 'Variables' },
    question: { zh: '这些概念怎么变成可测的东西？', en: 'How do the concepts become measurable?' },
    hint: {
      zh: '逐个写清 IV、DV、中介与调节的操作化定义。协变量只加预注册里说好的。',
      en: 'Spell out the operational definitions of IV, DV, mediator and moderator. Add covariates only if preregistered.',
    },
  },
  {
    key: 'design',
    title: { zh: '设计与功效', en: 'Design & Power' },
    question: { zh: '这个设计真的能回答问题吗？', en: 'Can this design actually answer the question?' },
    hint: {
      zh: '说明设计类型、随机/分配方式、样本量依据（效应量、α、power）。',
      en: 'State the design, how units are assigned, and the sample-size rationale (effect size, alpha, power).',
    },
  },
  {
    key: 'prereg',
    title: { zh: '预注册与伦理', en: 'Preregistration & Ethics' },
    question: { zh: '在没有看到结果之前，我答应怎么做？', en: 'Before seeing results, what do I commit to?' },
    hint: {
      zh: '锁定主要分析与排除规则；偏离必须记录。伦理材料同样先写好。',
      en: 'Lock in the primary analysis and exclusion rules; log every deviation. Write the ethics material up front too.',
    },
  },
  {
    key: 'collection',
    title: { zh: '平台与收集', en: 'Data Collection' },
    question: { zh: '数据从哪来，怎么保证质量？', en: 'Where does the data come from, and how is quality assured?' },
    hint: {
      zh: '记录平台、招募、报酬、时间窗、注意力检查和数据保存方式。',
      en: 'Record platform, recruitment, compensation, collection window, attention checks, and storage.',
    },
  },
  {
    key: 'audit',
    title: { zh: '数据冻结与审计', en: 'Data Audit' },
    question: { zh: '分析之前，数据动过哪里？', en: 'Before analysis, what was touched?' },
    hint: {
      zh: '冻结一份原始数据，逐条记录清洗、排除与编码决定，可追溯。',
      en: 'Freeze a raw copy and log every cleaning, exclusion, and coding decision so it can be traced.',
    },
  },
  {
    key: 'analysis',
    title: { zh: '统计分析与解释', en: 'Analysis & Interpretation' },
    question: { zh: '结果在说什么，没在说什么？', en: 'What do the results say — and not say?' },
    hint: {
      zh: '报告效应量与区间，别只报 p 值；把探索性结果和验证性结果分开。',
      en: 'Report effect sizes and intervals, not just p values. Keep exploratory findings separate from confirmatory ones.',
    },
  },
  {
    key: 'review',
    title: { zh: '回到假设', en: 'Hypothesis Review' },
    question: { zh: '回到第 2 步，假设还站得住吗？', en: 'Back to step 2 — does the hypothesis still hold?' },
    hint: {
      zh: '明确写下支持、部分支持还是不支持，以及理论需要怎么改。',
      en: 'State plainly: supported, partially supported, or not — and how the theory should change.',
    },
  },
]

export type CoreVariables = { IV: string; DV: string; M: string; W: string }

export type OptionalVariable = {
  id: string
  type: string
  name: string
  definition: string
  timing: string
  plan: string
}

export type VariableType = { key: string; zh: string; en: string; note: Bilingual }

export const VARIABLE_TYPES: VariableType[] = [
  { key: 'C', zh: '协变量', en: 'Covariate', note: { zh: '处理前测量，用于降低残差变异', en: 'Measured before treatment; reduces residual variance' } },
  { key: 'M', zh: '中介', en: 'Mediator', note: { zh: '解释为什么会发生', en: 'Explains why the effect occurs' } },
  { key: 'W', zh: '调节', en: 'Moderator', note: { zh: '说明对谁、何时更强', en: 'For whom or when the effect is stronger' } },
]

const NOTES_KEY = 'flowNotes'
const DONE_KEY = 'flowDone'

function notesOf(project: Project): Record<string, unknown> {
  return (project.notes ?? {}) as Record<string, unknown>
}

function ensureNotes(project: Project): Record<string, unknown> {
  if (!project.notes) project.notes = {}
  return project.notes as Record<string, unknown>
}

// ---------- 每步自由记录 ----------

export function readFlowNotes(project: Project): string[] {
  const raw = notesOf(project)[NOTES_KEY]
  const list = Array.isArray(raw) ? raw : []
  return FLOW_STAGES.map((_, i) => (typeof list[i] === 'string' ? list[i] : ''))
}

export function writeFlowNotes(project: Project, notes: string[]): void {
  ensureNotes(project)[NOTES_KEY] = notes
}

export function readFlowDone(project: Project): boolean[] {
  const raw = notesOf(project)[DONE_KEY]
  const list = Array.isArray(raw) ? raw : []
  return FLOW_STAGES.map((_, i) => list[i] === true)
}

export function writeFlowDone(project: Project, done: boolean[]): void {
  ensureNotes(project)[DONE_KEY] = done
}

export function flowProgress(done: boolean[]): number {
  if (!done.length) return 0
  return Math.round((done.filter(Boolean).length / done.length) * 100)
}

// ---------- 第 1 步：研究问题 ----------

export function readRqDraft(project: Project): string {
  const value = notesOf(project).rqDraft
  return typeof value === 'string' ? value : ''
}

export function writeRqDraft(project: Project, value: string): void {
  ensureNotes(project).rqDraft = value
}

// ---------- 第 3 步：变量 ----------

export function readCoreVariables(project: Project): CoreVariables {
  const raw = notesOf(project).coreVariables
  const v = (raw && typeof raw === 'object' ? raw : {}) as Partial<CoreVariables>
  return { IV: v.IV ?? '', DV: v.DV ?? '', M: v.M ?? '', W: v.W ?? '' }
}

export function writeCoreVariables(project: Project, value: CoreVariables): void {
  ensureNotes(project).coreVariables = value
}

export function readOptionalVariables(project: Project): OptionalVariable[] {
  const raw = notesOf(project).optionalVariables
  if (!Array.isArray(raw)) return []
  return raw.filter((v): v is OptionalVariable => !!v && typeof v === 'object')
}

export function writeOptionalVariables(project: Project, list: OptionalVariable[]): void {
  ensureNotes(project).optionalVariables = list
}

export function newVariableId(): string {
  return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

// ---------- 第 5 步：预注册 / 伦理 ----------

export function readPrereg(project: Project): string {
  const value = notesOf(project).prereg
  return typeof value === 'string' ? value : ''
}

export function writePrereg(project: Project, value: string): void {
  ensureNotes(project).prereg = value
}

export function readEthics(project: Project): string {
  const value = notesOf(project).ethics
  return typeof value === 'string' ? value : ''
}

export function writeEthics(project: Project, value: string): void {
  ensureNotes(project).ethics = value
}

// ---------- 第 8 步：分析归档（只读）----------

export type AnalysisRun = {
  time?: string
  source?: string
  analysis_type?: string
  engine?: string
  [k: string]: unknown
}

export function readAnalysisHistory(project: Project): AnalysisRun[] {
  const raw = notesOf(project).analysisHistory
  if (!Array.isArray(raw)) return []
  return raw.filter((r): r is AnalysisRun => !!r && typeof r === 'object')
}
