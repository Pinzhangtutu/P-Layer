/**
 * 项目 / 看板（application）数据层。
 *
 * 刻意复用旧版 index.html 使用的 localStorage 键（rilProjects / rilActiveProject），
 * 这样 React 新页面和旧版页面读写的是同一份数据，迁移期间不会产生数据割裂。
 *
 * 文档 §12 正式研究项目九步执行结构（研究问题→理论与假设→变量定义→研究设计→预注册伦理→
 * 平台招募→数据冻结→统计分析→回到假设）+ 数据接口预留：
 * v1 不要求真实实验平台/统计引擎/邮箱/协作，但数据结构必须为未来的 Study、数据版本、
 * 分析记录、效应量、置信区间、偏离记录和假设结论预留接口（§16 / §18-7）。
 */

export type ApplicationStatus = 'backlog' | 'planning' | 'progress' | 'review' | 'done'
export type Priority = 'p25' | 'p50' | 'p75' | 'p100'

export type Application = {
  id: string
  name: string
  description?: string
  owner?: string
  deadline?: string
  priority?: Priority
  status: ApplicationStatus
  tags?: string[]
  ideaId?: string | null
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export type Project = {
  id: string
  name: string
  notes?: Record<string, unknown>
  applications?: Application[]
  boardTasks?: unknown[]
  milestones?: { id: string; name: string; deadline: string }[]
  ganttSteps?: { id: string; title: string; milestone: string; start: string; end: string; progress: number }[]
  participants?: number
  progress?: number
  deadline?: string
  isDemo?: boolean
  /**
   * 正式研究项目（§12）。可选字段：项目被用户主动从 RQ 导入正式研究时落盘；
   * v1 仅提供接口与摘要展示，后续研究/统计/数据版本流水线再实现。
   */
  study?: Study
}

/** 九步研究执行阶段（§12；编号 01–09，与 FLOW_STAGES 的九步研究流程等价） */
export type StudyStageKey =
  | 'rq'
  | 'hypothesis'
  | 'variables'
  | 'design'
  | 'preregistration'
  | 'recruitment'
  | 'audit'
  | 'analysis'
  | 'reflection'

export const STUDY_STAGES: { key: StudyStageKey; no: string; zh: string; en: string }[] = [
  { key: 'rq', no: '01', zh: '研究问题', en: 'Research question' },
  { key: 'hypothesis', no: '02', zh: '理论与研究假设', en: 'Theory & hypothesis' },
  { key: 'variables', no: '03', zh: '变量定义与操作化', en: 'Variables & measures' },
  { key: 'design', no: '04', zh: '研究设计与功效分析', en: 'Design & power' },
  { key: 'preregistration', no: '05', zh: '预注册、伦理与数据收集计划', en: 'Preregistration & plan' },
  { key: 'recruitment', no: '06', zh: '平台招募与执行', en: 'Recruitment & execution' },
  { key: 'audit', no: '07', zh: '数据冻结、清理与质量审计', en: 'Freeze & audit' },
  { key: 'analysis', no: '08', zh: '统计分析与结果解释', en: 'Analysis' },
  { key: 'reflection', no: '09', zh: '回到假设', en: 'Back to hypothesis' },
]

/** Study 状态：与 Idea 的「生命周期」不同——Study 状态是执行进度而不是资产生命周期 */
export type StudyStatus = 'draft' | 'active' | 'paused' | 'completed' | 'abandoned'

export type StudyRecord = {
  /** 来源 Idea id（§12：RQ 可来自 Idea；同一个 Idea 可以有多个 RQ/Study） */
  rqIdeaId?: string
  /** 当时导入的 RQ 文本（v1 自由文本快照） */
  rqText?: string
  status: StudyStatus
  /** 各阶段完成标记（key=StudyStageKey，true=用户已确认完成） */
  stagesDone?: Partial<Record<StudyStageKey, boolean>>
  startedAt?: string
  endedAt?: string
}

/** 数据版本（§12：每次数据冻结/清理/审计都产生新版本） */
export type DataVersion = {
  id: string
  label: string
  createdAt: string
  /** 引用 notes 中的 key（v1 reserved；后续研究流水线写实际数据快照） */
  notesRef?: string
  /** 数据冻结时间 */
  sealedAt?: string
}

/** 效应量（§12：估计 + 置信区间） */
export type EffectRecord = {
  id: string
  /** 估计量名（如 'd' / 'r' / 'OR' / 'beta'） */
  estimate?: number
  ciLow?: number
  ciHigh?: number
  unit?: string
  /** 关联到的 analysis id（§12 关联到对应分析记录） */
  analysisId?: string
  note?: string
}

/** 偏离记录（§12：研究执行中与原计划的偏差，必须可回看） */
export type DeviationRecord = {
  id: string
  stage: StudyStageKey
  note: string
  /** 是否已经解决/修正 */
  resolved: boolean
  at: string
}

/** 假设结论（§12 第 9 步回到假设：支持/部分支持/未支持/证据不足） */
export type AssumptionOutcome = 'support' | 'partial' | 'none' | 'insufficient'

export type AssumptionResult = {
  id: string
  outcome: AssumptionOutcome
  summary?: string
  at: string
}

/** 分析记录（§12：脱敏可回看；v1 不执行实际计算，只存接口与占位） */
export type AnalysisRecord = {
  id: string
  /** 分析类型（描述/效应/质性/其它 — v1 reserved） */
  type: 'descriptive' | 'effect' | 'qualitative' | 'other'
  /** 关联到的阶段 */
  stage?: StudyStageKey
  /** 关联到的数据版本 id */
  dataVersionId?: string
  status: 'pending' | 'running' | 'done' | 'failed'
  /** v1 reserved 标志：true 表示数据已写入但实际分析逻辑尚未实现 */
  reserved?: boolean
  createdAt?: string
}

/** 正式研究项目（§12 数据接口预留） */
export type Study = {
  /** 主记录 */
  record: StudyRecord
  /** 数据版本序列（§12 多次冻结） */
  dataVersions?: DataVersion[]
  /** 分析记录序列（§12 §16 v1 reserved 不执行实际分析） */
  analyses?: AnalysisRecord[]
  /** 效应量与置信区间（§12） */
  effects?: EffectRecord[]
  /** 偏离记录（§12） */
  deviations?: DeviationRecord[]
  /** 假设结论（§12 第 9 步） */
  assumptionResults?: AssumptionResult[]
}

/** 把项目暂存研究摘要的「阶段进度」快速读数（0-9） */
export function studyStageCount(study: Study | undefined): number {
  if (!study?.record?.stagesDone) return 0
  return Object.values(study.record.stagesDone).filter(Boolean).length
}

export const PROJECTS_KEY = 'rilProjects'
export const ACTIVE_PROJECT_KEY = 'rilActiveProject'

export const COLUMNS: { key: ApplicationStatus; labelZh: string; labelEn: string }[] = [
  { key: 'backlog', labelZh: '待办', labelEn: 'Backlog' },
  { key: 'planning', labelZh: '规划中', labelEn: 'Planning' },
  { key: 'progress', labelZh: '进行中', labelEn: 'In Progress' },
  { key: 'review', labelZh: '评审', labelEn: 'In Review' },
  { key: 'done', labelZh: '完成', labelEn: 'Done' },
]

export const PRIORITY_OPTIONS: { key: Priority; labelZh: string; labelEn: string; color: string }[] = [
  { key: 'p25', labelZh: 'P25 · 不急', labelEn: 'P25 · Low', color: '#7a8282' },
  { key: 'p50', labelZh: 'P50 · 正常', labelEn: 'P50 · Normal', color: '#a3a3a3' },
  { key: 'p75', labelZh: 'P75 · 优先', labelEn: 'P75 · High', color: '#d97706' },
  { key: 'p100', labelZh: 'P100 · 关键', labelEn: 'P100 · Critical', color: '#dc2626' },
]

export const STATUS_KEYS = COLUMNS.map((c) => c.key)

/** 旧版曾用 draft/preparing/submitted/interview/accepted，这里做一次性迁移 */
const LEGACY_TO_STATUS: Record<string, ApplicationStatus> = {
  draft: 'backlog',
  preparing: 'planning',
  submitted: 'review',
  interview: 'review',
  accepted: 'done',
}

export function readProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY)
    const parsed = raw ? (JSON.parse(raw) as Project[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeProjects(projects: Project[], activeId?: string): void {
  // 与旧版 saveProjects 一致：demo 项目不落盘
  const persistent = projects.filter((p) => p && !p.isDemo)
  const current = activeId ?? localStorage.getItem(ACTIVE_PROJECT_KEY) ?? ''

  // 关键：活跃项目不存在时回落到第一个项目，而不是清空。
  // 否则下一次写入会被当成"新建项目"，导致每加一张卡片就多出一个项目。
  const nextActive = persistent.some((p) => p.id === current)
    ? current
    : persistent[0]?.id ?? ''

  localStorage.setItem(PROJECTS_KEY, JSON.stringify(persistent))
  if (nextActive) localStorage.setItem(ACTIVE_PROJECT_KEY, nextActive)
}

export function readActiveProjectId(): string {
  return localStorage.getItem(ACTIVE_PROJECT_KEY) || ''
}

export function getActiveProject(projects: Project[]): Project {
  const id = readActiveProjectId()
  return (
    projects.find((p) => p.id === id) ?? {
      id: '',
      name: 'Demo',
      notes: {},
      applications: [],
      boardTasks: [],
    }
  )
}

/** 归一化 applications 数组并迁移旧字段，返回新数组（不改原对象） */
export function ensureApplications(project: Project): Application[] {
  const list = Array.isArray(project.applications) ? project.applications : []
  let changed = false

  const migrated = list.map((app) => {
    const next: Application = { ...app }
    // 旧字段 school / program / author -> name / description / owner
    const legacy = app as unknown as Record<string, unknown>
    if (next.name === undefined && typeof legacy.school === 'string') {
      next.name = legacy.school
      next.description = typeof legacy.program === 'string' ? legacy.program : next.description
      next.owner = typeof legacy.author === 'string' ? legacy.author : next.owner
      changed = true
    }
    const mapped = LEGACY_TO_STATUS[next.status]
    if (mapped) {
      next.status = mapped
      changed = true
    }
    if (!STATUS_KEYS.includes(next.status)) {
      next.status = 'backlog'
      changed = true
    }
    return next
  })

  if (changed) project.applications = migrated
  return migrated
}

export function newId(): string {
  return 'app-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7)
}

export function priorityToNumber(p?: Priority | string): number {
  const m = /^p(\d+)$/i.exec(String(p || ''))
  return m ? parseInt(m[1], 10) : 50
}

export function daysUntil(deadline?: string): number | null {
  if (!deadline) return null
  const d = new Date(deadline)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86400000)
}

export function stageCounts(apps: Application[]): Record<ApplicationStatus, number> {
  const counts = Object.fromEntries(STATUS_KEYS.map((k) => [k, 0])) as Record<ApplicationStatus, number>
  for (const app of apps) {
    if (counts[app.status] !== undefined) counts[app.status] += 1
  }
  return counts
}

export type SortKey = 'deadline' | 'priority' | 'name' | 'status'

export function sortApplications(apps: Application[], sort: SortKey): Application[] {
  const copy = [...apps]
  switch (sort) {
    case 'deadline':
      // 无截止日期的排最后
      return copy.sort((a, b) => {
        const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY
        const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY
        return da - db
      })
    case 'priority':
      // 高优先级在前
      return copy.sort((a, b) => priorityToNumber(b.priority) - priorityToNumber(a.priority))
    case 'name':
      return copy.sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-Hans-CN'))
    case 'status':
      return copy.sort((a, b) => STATUS_KEYS.indexOf(a.status) - STATUS_KEYS.indexOf(b.status))
    default:
      return copy
  }
}

export function initials(name: string): string {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + (parts[1][0] || '')).toUpperCase()
}

export function initialsColor(name: string): string {
  const hash = String(name || '')
    .split('')
    .reduce((a, c) => ((a * 31 + c.charCodeAt(0)) & 0xff), 7)
  return `hsl(${hash % 360} 35% 48%)`
}
