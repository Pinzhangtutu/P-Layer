/**
 * 头脑风暴「8 步训练」数据层。
 *
 * 存储位置与旧版 brainstorm-training.js 完全一致：当前项目的
 * notes.brainstormSessions 数组。这样 React 新页面和旧版页面读写同一份数据，
 * 迁移期间来回切换不会丢东西。
 *
 * 流程：观察 → 命题 → 解释 → 预测 → 边界 → 替代解释 → 证据 → 初步 RQ。
 * 用户主导命题与 RQ；Pia! 只在用户点「请 Pia 解释」时介入；被放弃的解释只记录不删除。
 */

import { type Project } from './projects'

export type StageKey =
  | 'observation'
  | 'proposition'
  | 'explanation'
  | 'prediction'
  | 'boundaries'
  | 'alternative'
  | 'evidence'
  | 'rq'

export type Bilingual = { zh: string; en: string }

export type StageDef = {
  key: StageKey
  title: Bilingual
  guide: Bilingual
  hint: Bilingual
}

export const STAGES: StageDef[] = [
  {
    key: 'observation',
    title: { zh: '观察 / 原始想法', en: 'Observation / raw idea' },
    guide: { zh: '我看到了什么？', en: 'What did I observe?' },
    hint: {
      zh: '现象、疑问、直觉、反常、文献批判、实验异常，尽量具体：谁、什么情境、什么让你意外。',
      en: 'A phenomenon, a doubt, an intuition, an anomaly, a critique of the literature, a surprising result. Be concrete: who, in what setting, what surprised you.',
    },
  },
  {
    key: 'proposition',
    title: { zh: '初步命题', en: 'Tentative proposition' },
    guide: { zh: '我愿意提出什么判断？', en: 'What claim am I willing to make?' },
    hint: {
      zh: '写一句判断句，而不是疑问句。例如："风浪越大，鱼越贵。"',
      en: 'Write a statement, not a question. For example: "The rougher the sea, the pricier the fish."',
    },
  },
  {
    key: 'explanation',
    title: { zh: '可能解释', en: 'Possible explanations' },
    guide: { zh: '我认为为什么会这样？', en: 'Why do I think this happens?' },
    hint: { zh: '给出 1-2 个候选机制，即使还模糊。', en: 'Offer one or two candidate mechanisms, even if they are still vague.' },
  },
  {
    key: 'prediction',
    title: { zh: '预测', en: 'Prediction' },
    guide: { zh: '如果我对，现实中应该出现什么？', en: 'If I am right, what should show up in the world?' },
    hint: { zh: '一个可观察、可检验的推论。', en: 'One observable, testable implication.' },
  },
  {
    key: 'boundaries',
    title: { zh: '前提与边界', en: 'Assumptions and boundaries' },
    guide: { zh: '什么时候成立，什么时候可能不成立？', en: 'When does it hold, and when might it fail?' },
    hint: { zh: '列出前提条件和可能失效的情境。', en: 'List the preconditions and the situations where it could break down.' },
  },
  {
    key: 'alternative',
    title: { zh: '替代解释', en: 'Alternative explanations' },
    guide: { zh: '还有什么原因也能解释它？', en: 'What else could explain it?' },
    hint: {
      zh: '至少想一个竞争解释，并记下你暂时放弃的解释。',
      en: 'Think of at least one competing explanation, and keep a note of the ones you set aside.',
    },
  },
  {
    key: 'evidence',
    title: { zh: '证据线索', en: 'Evidence leads' },
    guide: { zh: '我需要观察或收集什么？', en: 'What do I need to observe or collect?' },
    hint: { zh: '什么样的数据或文献能区分这些解释。', en: 'What data or literature would tell these explanations apart.' },
  },
  {
    key: 'rq',
    title: { zh: '初步 Research Question', en: 'Draft research question' },
    guide: { zh: '我真正想研究什么？', en: 'What do I actually want to study?' },
    hint: {
      zh: '把前面整理成一句可以进入研究流程的问题。它不需要完美，但要比原始想法更清楚。',
      en: 'Shape everything above into one question that can enter the research flow. It need not be perfect, only clearer than where you started.',
    },
  },
]

/** 第 6 步（替代解释）额外带一个「被放弃的解释」记录区 */
export const ABANDONED_STAGE_INDEX = 5

export type BrainstormStep = { text: string; savedAt: string | null }
export type AbandonedNote = { text: string; at: string }

export type BrainstormSession = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  status: 'in_progress' | 'completed'
  current: number
  steps: BrainstormStep[]
  abandoned: AbandonedNote[]
  errors?: string[]
}

const SESSIONS_KEY = 'brainstormSessions'

function notesOf(project: Project): Record<string, unknown> {
  return (project.notes ?? {}) as Record<string, unknown>
}

/** 旧数据可能缺字段（比如只有 3 步），补齐成完整 8 步再渲染 */
function normalize(raw: unknown): BrainstormSession | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Partial<BrainstormSession>
  const steps: BrainstormStep[] = STAGES.map((_, i) => {
    const step = Array.isArray(s.steps) ? s.steps[i] : undefined
    return {
      text: typeof step?.text === 'string' ? step.text : '',
      savedAt: typeof step?.savedAt === 'string' ? step.savedAt : null,
    }
  })
  const current = Number.isFinite(s.current) ? Math.min(STAGES.length - 1, Math.max(0, Number(s.current))) : 0
  return {
    id: typeof s.id === 'string' && s.id ? s.id : 'bt' + Date.now(),
    title: typeof s.title === 'string' ? s.title : '',
    createdAt: typeof s.createdAt === 'string' ? s.createdAt : new Date().toISOString(),
    updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : new Date().toISOString(),
    completedAt: typeof s.completedAt === 'string' ? s.completedAt : undefined,
    status: s.status === 'completed' ? 'completed' : 'in_progress',
    current,
    steps,
    // 数组必须浅拷贝：normalize 出来的对象会直接被 mutate 修改，
    // 沿用原引用的话，React 开发模式下重复执行 updater 会往同一个数组里 push 两次。
    abandoned: Array.isArray(s.abandoned) ? [...s.abandoned] : [],
    errors: Array.isArray(s.errors) ? [...s.errors] : [],
  }
}

export function readSessions(project: Project): BrainstormSession[] {
  const raw = notesOf(project)[SESSIONS_KEY]
  if (!Array.isArray(raw)) return []
  return raw.map(normalize).filter((s): s is BrainstormSession => s !== null)
}

export function writeSessions(project: Project, sessions: BrainstormSession[]): void {
  if (!project.notes) project.notes = {}
  ;(project.notes as Record<string, unknown>)[SESSIONS_KEY] = sessions
}

export function createSession(seedText: string, lang: 'zh' | 'en'): BrainstormSession {
  const now = new Date().toISOString()
  const trimmed = seedText.trim()
  return {
    id: 'bt' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: trimmed.slice(0, 42) || (lang === 'en' ? '(Untitled training)' : '（未命名训练）'),
    createdAt: now,
    updatedAt: now,
    status: 'in_progress',
    current: 0,
    steps: STAGES.map((_, i) => ({
      text: i === 0 ? trimmed : '',
      savedAt: i === 0 && trimmed ? now : null,
    })),
    abandoned: [],
    errors: [],
  }
}

export function doneCount(session: BrainstormSession): number {
  return session.steps.filter((s) => s.text.trim()).length
}

/** 从 8 步正文里捞标签：按逗号/分号/换行切，取 2-18 字，最多 6 个 */
export function extractTags(session: BrainstormSession): string[] {
  const tags: string[] = []
  const seen = new Set<string>()
  for (const step of session.steps) {
    if (!step?.text) continue
    for (const piece of step.text.split(/[,，;；\n]/)) {
      const key = piece.trim()
      if (key.length >= 2 && key.length <= 18 && !seen.has(key)) {
        seen.add(key)
        tags.push(key)
      }
      if (tags.length >= 6) return tags
    }
  }
  return tags
}

export function researchQuestionOf(session: BrainstormSession): string {
  return (session.steps[STAGES.length - 1]?.text ?? '').trim()
}

/**
 * 完成训练：把第 8 步的 RQ 写进 notes.rqDraft（研究流程第 1 步会读它），
 * 并把会话标记为已完成。
 *
 * 旧「学术申请看板」已下线（§5.4）：这里不再创建 application 卡片。
 * 想正式推进想法时，到研究库（IdeaDatabase）把 Idea 标记为「已推进」，
 * 或直接在行动看板里新建一条关联该 Idea 的行动。
 */
export function completeTraining(project: Project, session: BrainstormSession): void {
  const rq = researchQuestionOf(session)
  const now = new Date().toISOString()

  session.status = 'completed'
  session.completedAt = now
  session.updatedAt = now

  if (rq) {
    if (!project.notes) project.notes = {}
    const notes = project.notes as Record<string, unknown>
    notes.rqDraft = rq
    notes.rqDraftMeta = { fromTraining: session.id, updatedAt: now }
  }
}
