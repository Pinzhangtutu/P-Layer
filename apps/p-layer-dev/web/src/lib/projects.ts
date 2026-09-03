/**
 * 项目 / 看板（application）数据层。
 *
 * 刻意复用旧版 index.html 使用的 localStorage 键（rilProjects / rilActiveProject），
 * 这样 React 新页面和旧版页面读写的是同一份数据，迁移期间不会产生数据割裂。
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
