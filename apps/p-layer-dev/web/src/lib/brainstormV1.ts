/**
 * P-Layer 个人版 v1 · 头脑风暴闭环数据层（React 版）。
 *
 * 与 vanilla 生产版 brainstorm-loop.js 的存储格式完全同构：
 *   notes.ideasV2[].brainstorm = { status, currentStep, steps, versions[], feedbacks[], pdfs[], name }
 * 这样新旧版之间数据可互读（如需切换）。
 *
 * 本模块只提供纯函数与类型：操作传入的 idea 对象（由 useProject().mutate 提供副本），
 * 不负责持久化——持久化由 mutate 统一落盘。
 */

export type StageKey =
  | 'idea'
  | 'observe'
  | 'proposition'
  | 'explanations'
  | 'prediction'
  | 'boundary'
  | 'alternatives'
  | 'evidence'
  | 'rq'
  | 'recheck'

export type Bilingual = { zh: string; en: string }

export type StageDef = {
  key: StageKey
  no: string
  title: Bilingual
  guide: Bilingual
  placeholder: Bilingual
  output: Bilingual
}

export const STAGES: StageDef[] = [
  { key: 'idea', no: '01', title: { zh: '原始疑问', en: 'Original Question' }, guide: { zh: '把最初那个模糊的想法原样写下来，不判断好坏。', en: 'Write the raw idea exactly as it came to you. No judgment.' }, placeholder: { zh: '例如：为什么风浪越大鱼越贵？是不是因为卖鱼的人少了？', en: 'e.g. Why do fish get more expensive in rough seas? Fewer fishermen?' }, output: { zh: '原始 Idea（可修改）', en: 'Original idea (editable)' } },
  { key: 'observe', no: '02', title: { zh: '观察现象', en: 'Observed Phenomenon' }, guide: { zh: '说明你实际观察到什么：对象是谁、在什么情境下、有什么变化。区分观察与猜测。', en: 'Describe what you actually observed: who, in what situation, what changed. Separate observation from guesswork.' }, placeholder: { zh: '我观察到…（对象 / 情境 / 变化）', en: 'I observed… (subject / context / change)' }, output: { zh: '现象描述', en: 'Phenomenon description' } },
  { key: 'proposition', no: '03', title: { zh: '初步命题', en: 'Initial Proposition' }, guide: { zh: '表达你对这个现象的初步判断——你认为发生了什么、为什么。', en: 'State your initial claim about the phenomenon — what you think is happening and why.' }, placeholder: { zh: '我的初步判断是…', en: 'My initial claim is…' }, output: { zh: '初步命题', en: 'Initial proposition' } },
  { key: 'explanations', no: '04', title: { zh: '可能解释', en: 'Possible Explanations' }, guide: { zh: '列出可能的原因，允许并存，不把一个猜测伪装成确定答案。一行一个。', en: 'List possible reasons. They may coexist. Do not dress one guess up as certainty. One per line.' }, placeholder: { zh: '解释 1：…\n解释 2：…', en: 'Explanation 1: …\nExplanation 2: …' }, output: { zh: '可能解释列表', en: 'Possible explanations' } },
  { key: 'prediction', no: '05', title: { zh: '预测', en: 'Prediction' }, guide: { zh: '如果某个解释成立，你应该看到什么？把直觉变成可被证据支持或反驳的预测。', en: 'If an explanation holds, what should you observe? Turn intuition into a testable prediction.' }, placeholder: { zh: '如果这个解释成立，我应该看到…', en: 'If this explanation holds, I should see…' }, output: { zh: '可检验预测', en: 'Testable prediction' } },
  { key: 'boundary', no: '06', title: { zh: '前提与边界', en: 'Premises & Boundaries' }, guide: { zh: '这个判断在什么条件下成立？边界和例外是什么？不要把局部观察扩大成普遍规律。', en: 'Under what conditions does this claim hold? What are the boundaries and exceptions?' }, placeholder: { zh: '这个判断成立的前提是…；不适用的情况有…', en: 'This holds only when…; it does not apply when…' }, output: { zh: '前提、边界与例外', en: 'Premises, boundaries & exceptions' } },
  { key: 'alternatives', no: '07', title: { zh: '替代解释', en: 'Alternative Explanations' }, guide: { zh: '还有什么别的解释可能成立？至少意识到不止一种解释。', en: 'What else could explain this? At least recognize more than one possibility.' }, placeholder: { zh: '另一种解释：…', en: 'An alternative: …' }, output: { zh: '替代解释', en: 'Alternative explanations' } },
  { key: 'evidence', no: '08', title: { zh: '证据方向', en: 'Evidence Direction' }, guide: { zh: '下一步需要观察、比较或查找什么？不同证据能回答什么问题？', en: 'What would you observe, compare, or look up next? What can each piece of evidence tell you?' }, placeholder: { zh: '可以看…（观察 / 比较 / 文献）', en: 'I could check… (observe / compare / literature)' }, output: { zh: '证据线索', en: 'Evidence leads' } },
  { key: 'rq', no: '09', title: { zh: '初步 RQ', en: 'Initial Research Question' }, guide: { zh: '用研究问题重新表达你的疑问。检查：对象和现象清楚吗？核心概念能定义吗？', en: 'Restate your question as a research question. Check: is the subject clear? Can core concepts be defined?' }, placeholder: { zh: '我的初步研究问题是…', en: 'My initial research question is…' }, output: { zh: '初步 RQ（达到可研究最低门槛）', en: 'Initial RQ (minimum research bar)' } },
  { key: 'recheck', no: '10', title: { zh: '重新检查假设', en: 'Re-check Assumptions' }, guide: { zh: '回看命题、预测与 RQ：逻辑是否成立、前提是否清楚、文献依据、证据方向。确认、修正或保留。', en: 'Review proposition, prediction and RQ: logic, premises, literature support, evidence direction. Confirm, revise, or keep.' }, placeholder: { zh: '重检记录：发现了什么需要修正的地方？', en: 'Re-check notes: what needs revision?' }, output: { zh: '确认、修正或保留的版本', en: 'Confirmed, revised, or kept version' } },
]

export type BrainstormStep = { text: string; updatedAt: string }
export type StepsMap = Partial<Record<StageKey, BrainstormStep>>

export type Version = {
  v: number
  label: string
  savedAt: string
  steps: Record<string, string>
  rq: string
}

export type Feedback = {
  id: string
  pdfVersion: number | null
  types: string[]
  text: string
  createdAt: string
}

export type PdfMeta = {
  version: number
  fileName: string
  createdAt: string
}

/* ===== Research Reasoning Space · 研究推理空间状态（P-Layer 顶层） ===== */

/** 理论发展空间（开放 conceptual workspace，非 checklist） */
export type TheorizingState = {
  literature: string
  puzzle: string
  constructs: string
  mechanisms: string
  integration: string
  propositions: string
  theory: string
}

/** 理论—证据循环空间（Wallace 风格闭环） */
export type CycleState = {
  theory: string
  hypothesis: string
  observation: string
  generalization: string
}

/** 一次迭代的历史快照（只追加，不覆盖） */
export type Iteration = {
  v: number
  theory: string
  hypotheses: string[]
  evidence: string[]
  generalization: string
  createdAt: string
}

/** 每个 Idea 独立的研究推理状态 */
export type ResearchState = {
  mode: "explore" | "theorizing" | "cycle"
  explore: { direction: "theorizing" | "cycle" | "undecided" }
  theorizing: TheorizingState
  cycle: CycleState
  iterations: Iteration[]
  updatedAt: string
}

export function emptyResearchState(): ResearchState {
  const now = new Date().toISOString()
  return {
    mode: "explore",
    explore: { direction: "undecided" },
    theorizing: { literature: "", puzzle: "", constructs: "", mechanisms: "", integration: "", propositions: "", theory: "" },
    cycle: { theory: "", hypothesis: "", observation: "", generalization: "" },
    iterations: [],
    updatedAt: now,
  }
}

/** 读取时 normalize（旧记录兼容） */
export function normResearchState(s: Partial<ResearchState> | null | undefined): ResearchState {
  const base = emptyResearchState()
  return {
    mode: s?.mode ?? base.mode,
    explore: { direction: s?.explore?.direction ?? "undecided" },
    theorizing: { ...base.theorizing, ...(s?.theorizing ?? {}) },
    cycle: { ...base.cycle, ...(s?.cycle ?? {}) },
    iterations: Array.isArray(s?.iterations) ? s!.iterations : [],
    updatedAt: s?.updatedAt ?? base.updatedAt,
  }
}

export type BrainstormData = {
  status: string
  currentStep: StageKey
  steps: StepsMap
  versions: Version[]
  feedbacks: Feedback[]
  pdfs: PdfMeta[]
  name: string
  /** Idea 在理论发展与科学环中的可恢复研究状态。 */
  researchState?: ResearchState
  /** Wallace 科学环入口与未来团队权限的扩展接口；不影响旧版 10 步数据。 */
  scienceCycle?: {
    mini?: Record<string, string>
    enteredTracks?: ('theory' | 'empirical')[]
    currentNode?: 'E' | 'T' | 'H' | 'O' | null
    completedNodes?: ('E' | 'T' | 'H' | 'O')[]
    nodeNotes?: Partial<Record<'E' | 'T' | 'H' | 'O', string>>
    permissions?: Record<string, string[]>
  }
}

export const FEEDBACK_TYPES: [string, Bilingual][] = [
  ['logic', { zh: '逻辑问题', en: 'Logic' }],
  ['premise', { zh: '前提假设', en: 'Premises' }],
  ['literature', { zh: '文献依据', en: 'Literature support' }],
  ['evidence', { zh: '证据方向', en: 'Evidence direction' }],
  ['clarity', { zh: '表述清晰度', en: 'Clarity' }],
  ['other', { zh: '其他', en: 'Other' }],
]

export const RECHECK_ITEMS: [string, Bilingual, Bilingual][] = [
  ['logic', { zh: '逻辑', en: 'Logic' }, { zh: '命题与预测之间逻辑一致，不把相关当因果。', en: 'Proposition and prediction are logically consistent; correlation is not treated as causation.' }],
  ['premise', { zh: '前提', en: 'Premises' }, { zh: '前提清楚，边界与例外已说明，没有把局部观察当普遍规律。', en: 'Premises are explicit, boundaries and exceptions are stated, local observations are not universalized.' }],
  ['literature', { zh: '文献依据', en: 'Literature' }, { zh: '已有文献或资料路径可支撑，知道该查什么。', en: 'Existing literature or material path supports it; you know what to look up.' }],
  ['evidence', { zh: '证据方向', en: 'Evidence' }, { zh: '有可支持或反驳的预测，或明确的探索路径。', en: 'There is a testable prediction or a clear exploration path.' }],
]

/** 读取时 normalize：旧记录/未开始训练的对象补齐默认字段 */
export function normBrainstorm(data: Partial<BrainstormData> | null | undefined): BrainstormData {
  const b: BrainstormData = {
    status: data?.status || '未开始',
    currentStep: data?.currentStep || 'idea',
    steps: data?.steps || {},
    versions: Array.isArray(data?.versions) ? data!.versions : [],
    feedbacks: Array.isArray(data?.feedbacks) ? data!.feedbacks : [],
    pdfs: Array.isArray(data?.pdfs) ? data!.pdfs : [],
    name: data?.name || '',
    researchState: data?.researchState,
    scienceCycle: data?.scienceCycle,
  }
  return b
}

export function stageValue(b: BrainstormData, key: StageKey): string {
  const s = b.steps[key]
  return (s && s.text) || ''
}

export function rqOf(b: BrainstormData): string {
  return stageValue(b, 'rq')
}

export function nextVersion(b: BrainstormData): number {
  return b.versions.reduce((m, v) => Math.max(m, v.v || 0), 0) + 1
}

/** 保存某一步的文字（调用方在 mutate 副本内调用） */
export function saveStageV1(b: BrainstormData, key: StageKey, text: string): void {
  b.steps[key] = { text, updatedAt: new Date().toISOString() }
  if (b.status === '未开始') b.status = '探索中'
}

export function ideaLabel(text: string, b: BrainstormData): string {
  return b.name || text || ''
}

function stageSnapshot(b: BrainstormData): Record<string, string> {
  const out: Record<string, string> = {}
  STAGES.forEach((s) => {
    if (s.key === 'recheck') return
    out[s.key] = stageValue(b, s.key)
  })
  return out
}

/** 生成新版本（不设上限，只追加不覆盖） */
export function saveVersionV1(b: BrainstormData, label: string, markRechecked = false): number {
  const v = nextVersion(b)
  b.versions.push({
    v,
    label: label || `V${v}`,
    savedAt: new Date().toISOString(),
    steps: stageSnapshot(b),
    rq: rqOf(b),
  })
  if (markRechecked) b.status = '已重检'
  else if (b.status === '未开始') b.status = '探索中'
  return v
}

export function addFeedback(b: BrainstormData, types: string[], text: string, pdfVersion: number | null): void {
  b.feedbacks = b.feedbacks || []
  b.feedbacks.push({
    id: 'fb' + Date.now().toString(36),
    pdfVersion: pdfVersion ?? null,
    types: types.slice(),
    text: text.trim(),
    createdAt: new Date().toISOString(),
  })
}

export function addPdf(b: BrainstormData, version: number, fileName: string): void {
  b.pdfs = b.pdfs || []
  b.pdfs.push({ version, fileName, createdAt: new Date().toISOString() })
}

export function restoreVersion(b: BrainstormData, v: number): void {
  const snap = b.versions.find((x) => x.v === v)
  if (!snap) return
  STAGES.forEach((s) => {
    if (s.key === 'recheck') return
    const val = snap.steps[s.key]
    if (val) b.steps[s.key] = { text: val, updatedAt: new Date().toISOString() }
  })
  b.status = b.status === '已重检' ? '已重检' : '探索中'
}
