/**
 * 想法数据库（Ideas V2）数据层。
 *
 * 存储位置：当前项目的 notes.ideasV2（旧版 index.html 的 renderBrainstormV2 一致）。
 *
 * 对齐 P-Layer 统一产品文档 v1.0 §9.1「研究资产库 · Idea」：
 * - 进入语境分类（不评价质量）：学术理论 / 文献阅读 / 商业实践 / 生活观察 / 实验与数据；
 *   兼容旧三值（phenomenon/literature/other）→ life/reading/practice。
 * - 成熟度 I0–I6：文字 + 字母 + 颜色共同表达；默认由 10 步训练进度自动推导（deriveMaturity），
 *   用户可手动覆盖/回退（maturity + maturityLog 记录原因），跟随自动 = 删除覆盖字段。
 * - 生命周期（与成熟度分开）：Active 进行中 → Paused 暂停 → Archived 归档 / Abandoned 放弃
 *   → Converted 转为研究项目；归档不是删除。
 */

import type { Project } from './projects'
import { normBrainstorm, stageValue, type StageKey } from './brainstormV1'

/** 进入语境（§9.1 五分类） */
export type IdeaOrigin = 'academic' | 'reading' | 'practice' | 'life' | 'experiment'

export type LiteratureSource = {
  title?: string
  sourceUrl?: string
  evidence?: string
}

/** 成熟度等级（§9.1 I0–I6） */
export type MaturityLevel = 'I0' | 'I1' | 'I2' | 'I3' | 'I4' | 'I5' | 'I6'

export type MaturityMeta = {
  level: MaturityLevel
  zh: string
  en: string
  /** 最小成果（zh 说明） */
  minZh: string
  minEn: string
  /** 主色：用于徽章文字/边框/浅底（hex） */
  color: string
}

export const MATURITY_ORDER: MaturityLevel[] = ['I0', 'I1', 'I2', 'I3', 'I4', 'I5', 'I6']

export const MATURITY: Record<MaturityLevel, MaturityMeta> = {
  I0: { level: 'I0', zh: '种子', en: 'Seed', minZh: '原始 Idea', minEn: 'Raw idea', color: '#8a94a3' },
  I1: { level: 'I1', zh: '澄清', en: 'Clarified', minZh: '现象与个人动机', minEn: 'Phenomenon & personal motive', color: '#5b8def' },
  I2: { level: 'I2', zh: '命题', en: 'Proposition', minZh: '初步命题、前提和边界', minEn: 'Initial proposition, premises & boundaries', color: '#6366f1' },
  I3: { level: 'I3', zh: '可预测', en: 'Testable', minZh: '可检验预测与替代解释', minEn: 'Testable prediction & alternatives', color: '#0ea5a4' },
  I4: { level: 'I4', zh: '有依据', en: 'Evidenced', minZh: '文献、数据或证据线索', minEn: 'Literature, data or evidence leads', color: '#1a9c6c' },
  I5: { level: 'I5', zh: '初步 RQ', en: 'Initial RQ', minZh: '范围清楚的 Research Question', minEn: 'A clearly-scoped research question', color: '#d97706' },
  I6: { level: 'I6', zh: '可立项', en: 'Project-ready', minZh: 'RQ、概念、证据路径和下一步足够清楚', minEn: 'RQ, concepts, evidence path and next step are clear enough', color: '#a16207' },
}

/** 手动覆盖成熟度时的一条变化记录（§9.1：等级可以跨越、下降和回退，系统记录变化原因） */
export type MaturityLogEntry = {
  level: MaturityLevel
  reason: string
  at: string
}

/** 生命周期（§9.1：与成熟度分开；放弃不是失败，归档不是删除，暂停不意味着必须继续） */
export type IdeaLifecycle = 'active' | 'paused' | 'archived' | 'abandoned' | 'converted'

export const LIFECYCLES: { key: IdeaLifecycle; zh: string; en: string; icon: string }[] = [
  { key: 'active', zh: '进行中', en: 'Active', icon: '' },
  { key: 'paused', zh: '已暂停', en: 'Paused', icon: '⏸' },
  { key: 'archived', zh: '已归档', en: 'Archived', icon: '🗄' },
  { key: 'abandoned', zh: '已放弃', en: 'Abandoned', icon: '✕' },
  { key: 'converted', zh: '已转项目', en: 'Converted', icon: '✓' },
]

/** 列表过滤分组：进行中（含已转项目）／已暂停／已结束（归档+放弃） */
export type LifecycleBucket = 'all' | 'open' | 'paused' | 'ended'

export type Idea = {
  id: string
  text: string
  origin: IdeaOrigin
  literatureSource?: LiteratureSource | null
  category: string
  status: 'idea' | 'promoted'
  /** 生命周期（§9.1）；缺省由 normalize 推导（promoted → converted，否则 active） */
  lifecycle?: IdeaLifecycle
  /** 用户手动覆盖的成熟度；缺省表示「跟随自动推导」 */
  maturity?: MaturityLevel
  /** 手动覆盖历史（只追加） */
  maturityLog?: MaturityLogEntry[]
  created: string
  tags: string[]
  time?: string
  location?: string
  case?: string
  /** legacy：旧 4 档粗等级（种子/探索中/可检验/优先推进），不再写入与展示 */
  level?: string
  /** P-Layer 个人版 v1 · 头脑风暴闭环（10 步训练/版本/反馈/PDF），可选字段，旧记录兼容 */
  brainstorm?: import('./brainstormV1').BrainstormData | null
}

const IDEAS_KEY = 'ideasV2'

/** 与旧版 classifyIdea 同一套规则（内容质量维度，区别于 origin 的进入语境） */
export function classifyIdea(text: string): string {
  if (/风险|替代|混淆|内生|偏差/.test(text)) return '风险与替代解释'
  if (/实验|问卷|样本|操纵|随机/.test(text)) return '方法与设计'
  if (/量表|测量|指标|编码|变量/.test(text)) return '测量与变量'
  if (/为什么|机制|中介|理论/.test(text)) return '理论机制'
  if (/是否|影响|差异|关系/.test(text)) return '研究问题'
  return '待整理'
}

export const IDEA_ORIGINS: { key: IdeaOrigin; zh: string; en: string }[] = [
  { key: 'academic', zh: '学术理论 / Academic', en: 'Academic / 学术理论' },
  { key: 'reading', zh: '文献阅读 / Reading', en: 'Reading / 文献阅读' },
  { key: 'practice', zh: '商业实践 / Practice', en: 'Practice / 商业实践' },
  { key: 'life', zh: '生活观察 / Life', en: 'Life / 生活观察' },
  { key: 'experiment', zh: '实验与数据 / Experiment', en: 'Experiment / 实验与数据' },
]

/** 旧三值 → §9.1 五类语境（2026-09 对齐文档时迁移，仅用于读取旧数据） */
const LEGACY_ORIGIN_MAP: Record<string, IdeaOrigin> = {
  phenomenon: 'life',
  literature: 'reading',
  other: 'practice',
}

export const IDEA_CATEGORIES = [
  '研究问题',
  '理论机制',
  '方法与设计',
  '测量与变量',
  '风险与替代解释',
  '待整理',
] as const

function notesOf(project: Project): Record<string, unknown> {
  return (project.notes ?? {}) as Record<string, unknown>
}

const LIFECYCLE_KEYS: IdeaLifecycle[] = ['active', 'paused', 'archived', 'abandoned', 'converted']

export function readIdeas(project: Project): Idea[] {
  const raw = notesOf(project)[IDEAS_KEY]
  if (Array.isArray(raw)) {
    return raw
      .filter((x): x is Record<string, unknown> => x && typeof x === 'object')
      .map((x) => normalizeIdea(x))
  }
  // 从旧版 notes.ideas（纯字符串数组）迁移
  const legacy = notesOf(project)['ideas']
  if (Array.isArray(legacy)) {
    return legacy
      .filter((x): x is string => typeof x === 'string')
      .map((text, i) =>
        normalizeIdea({
          id: 'old' + i,
          text,
          origin: 'life',
          category: classifyIdea(text),
          status: 'idea',
          created: new Date().toISOString(),
          tags: [],
        }),
      )
  }
  return []
}

export function writeIdeas(project: Project, list: Idea[]): void {
  if (!project.notes) project.notes = {}
  ;(project.notes as Record<string, unknown>)[IDEAS_KEY] = list
}

export function newIdeaId(): string {
  return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

function normalizeIdea(raw: Record<string, unknown>): Idea {
  const id = typeof raw.id === 'string' ? raw.id : newIdeaId()
  const text = typeof raw.text === 'string' ? raw.text : ''
  const originRaw = typeof raw.origin === 'string' ? raw.origin : ''
  const origin: IdeaOrigin = (['academic', 'reading', 'practice', 'life', 'experiment'] as string[]).includes(originRaw)
    ? (originRaw as IdeaOrigin)
    : LEGACY_ORIGIN_MAP[originRaw] ?? 'life'
  const statusRaw = typeof raw.status === 'string' ? raw.status : 'idea'
  const status: Idea['status'] = statusRaw === 'promoted' ? 'promoted' : 'idea'
  const lifecycleRaw = typeof raw.lifecycle === 'string' ? raw.lifecycle : ''
  const lifecycle: IdeaLifecycle = LIFECYCLE_KEYS.includes(lifecycleRaw as IdeaLifecycle)
    ? (lifecycleRaw as IdeaLifecycle)
    : status === 'promoted'
      ? 'converted'
      : 'active'
  const maturityRaw = typeof raw.maturity === 'string' ? raw.maturity : ''
  return {
    id,
    text,
    origin,
    literatureSource: (raw.literatureSource as LiteratureSource | null) ?? null,
    category: typeof raw.category === 'string' ? raw.category : classifyIdea(text),
    status,
    lifecycle,
    maturity: MATURITY_ORDER.includes(maturityRaw as MaturityLevel) ? (maturityRaw as MaturityLevel) : undefined,
    maturityLog: Array.isArray(raw.maturityLog)
      ? raw.maturityLog.filter(
          (x): x is MaturityLogEntry =>
            !!x && typeof x === 'object' && typeof (x as MaturityLogEntry).reason === 'string' && MATURITY_ORDER.includes((x as MaturityLogEntry).level),
        )
      : [],
    created: typeof raw.created === 'string' ? raw.created : new Date().toISOString(),
    tags: Array.isArray(raw.tags) ? raw.tags.filter((x): x is string => typeof x === 'string') : [],
    time: typeof raw.time === 'string' ? raw.time : '',
    location: typeof raw.location === 'string' ? raw.location : '',
    case: typeof raw.case === 'string' ? raw.case : '',
    level: typeof raw.level === 'string' && raw.level ? raw.level : '种子',
    brainstorm: raw.brainstorm && typeof raw.brainstorm === 'object' ? (raw.brainstorm as Idea['brainstorm']) : null,
  }
}

/* ================= 成熟度 I0–I6 ================= */

/** 由 10 步训练进度自动推导成熟度（不写库，只读快照实时计算） */
export function deriveMaturity(idea: Idea): MaturityLevel {
  const b = normBrainstorm(idea.brainstorm)
  const has = (k: StageKey) => !!stageValue(b, k).trim()
  const rqReady = has('rq')
  const recheckDone = b.status === '已重检' || has('recheck')
  const versioned = (b.versions?.length ?? 0) > 0
  if (rqReady && (recheckDone || versioned)) return 'I6'
  if (rqReady) return 'I5'
  if (has('evidence') || !!idea.literatureSource?.title) return 'I4'
  if (has('prediction') && has('alternatives')) return 'I3'
  if (has('proposition') && has('boundary')) return 'I2'
  if (has('observe') || has('idea')) return 'I1'
  return 'I0'
}

export type MaturityView = { level: MaturityLevel; source: 'auto' | 'manual' }

/** 生效成熟度：手动覆盖优先，否则自动推导 */
export function maturityOf(idea: Idea): MaturityView {
  return idea.maturity ? { level: idea.maturity, source: 'manual' } : { level: deriveMaturity(idea), source: 'auto' }
}

/** 手动覆盖（就地修改 idea 对象，调用方在 mutate 副本内使用；覆盖历史只追加） */
export function recordMaturity(idea: Idea, level: MaturityLevel, reason: string): void {
  idea.maturityLog = Array.isArray(idea.maturityLog) ? idea.maturityLog.slice() : []
  idea.maturityLog.push({ level, reason: reason.trim() || '手动调整', at: new Date().toISOString() })
  idea.maturity = level
}

/** 回到自动推导（清除覆盖字段；历史保留） */
export function clearMaturity(idea: Idea): void {
  idea.maturityLog = Array.isArray(idea.maturityLog) ? idea.maturityLog.slice() : []
  idea.maturityLog.push({ level: deriveMaturity(idea), reason: '恢复为自动推导', at: new Date().toISOString() })
  delete idea.maturity
}
