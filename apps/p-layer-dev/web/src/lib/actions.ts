/**
 * 研究行动看板数据层（文档 §5.4「看板：我的研究行动」）。
 *
 * 看板只管理行动与任务：阅读、访谈、实验准备、数据准备、分析、反馈处理、复盘。
 * 看板不替代 Idea 库、文献网络或科学环；任务可选择性关联一个 Idea（ideaId），
 * 但关联只是上下文，不把看板变成第二个 Idea 库。
 *
 * 存储：project.boardTasks（与旧版 vanilla 共用同一键；旧记录在读取时归一化）。
 * 旧「学术申请看板」applications 数组保留在数据里不再渲染（数据不删，兼容旧浏览器数据）。
 */
import type { Project } from './projects'

export type TaskStatus = 'todo' | 'doing' | 'done'

export type TaskKind =
  | 'reading'
  | 'interview'
  | 'experiment'
  | 'data'
  | 'analysis'
  | 'feedback'
  | 'review'

export type BoardTask = {
  id: string
  title: string
  kind: TaskKind
  status: TaskStatus
  /** 关联的 Idea id（可选，仅作为上下文） */
  ideaId?: string | null
  deadline?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

/** 列（§5.4：行动从计划到完成） */
export const TASK_STATUSES: { key: TaskStatus; zh: string; en: string; dot: string }[] = [
  { key: 'todo', zh: '待办', en: 'To do', dot: '#9aa3ad' },
  { key: 'doing', zh: '进行中', en: 'In progress', dot: '#d97706' },
  { key: 'done', zh: '已完成', en: 'Done', dot: '#2f9e6e' },
]

/** 行动类别（§5.4 原文列举的七类行动） */
export const TASK_KINDS: { key: TaskKind; icon: string; zh: string; en: string; color: string }[] = [
  { key: 'reading', icon: '📖', zh: '阅读', en: 'Reading', color: '#4e79a7' },
  { key: 'interview', icon: '🗣', zh: '访谈', en: 'Interview', color: '#8e5bb7' },
  { key: 'experiment', icon: '🧪', zh: '实验准备', en: 'Experiment prep', color: '#2f9e6e' },
  { key: 'data', icon: '📊', zh: '数据准备', en: 'Data prep', color: '#d97706' },
  { key: 'analysis', icon: '🔬', zh: '分析', en: 'Analysis', color: '#2c8a9e' },
  { key: 'feedback', icon: '💬', zh: '反馈处理', en: 'Feedback', color: '#d6457f' },
  { key: 'review', icon: '🔁', zh: '复盘', en: 'Review', color: '#7a8282' },
]

export function taskKindMeta(key: string): (typeof TASK_KINDS)[number] {
  return TASK_KINDS.find((k) => k.key === key) ?? TASK_KINDS[0]
}

export function taskStatusMeta(key: string): (typeof TASK_STATUSES)[number] {
  return TASK_STATUSES.find((s) => s.key === key) ?? TASK_STATUSES[0]
}

export function newTaskId(): string {
  return 'act-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7)
}

/** 归一化单条（旧记录/异常值兜底，不改原对象） */
export function ensureTask(raw: Partial<BoardTask>): BoardTask {
  const kindValid = TASK_KINDS.some((k) => k.key === raw.kind)
  const statusValid = TASK_STATUSES.some((s) => s.key === raw.status)
  return {
    id: raw.id || newTaskId(),
    title: typeof raw.title === 'string' ? raw.title : '',
    kind: kindValid ? (raw.kind as TaskKind) : 'reading',
    status: statusValid ? (raw.status as TaskStatus) : 'todo',
    ideaId: raw.ideaId || null,
    deadline: raw.deadline || '',
    notes: raw.notes || '',
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  }
}

export function readBoardTasks(project: Project | null | undefined): BoardTask[] {
  const list = Array.isArray(project?.boardTasks) ? (project.boardTasks as Partial<BoardTask>[]) : []
  return list.map(ensureTask)
}

/** 在 mutate 副本内写回（调用方持有 project 副本） */
export function writeBoardTasks(project: Project, list: BoardTask[]): void {
  project.boardTasks = list.map((t) => ({ ...t }))
}

export function seedTask(over: Partial<BoardTask> = {}): BoardTask {
  return ensureTask({ id: newTaskId(), kind: 'reading', status: 'todo', ...over })
}

/** 供 ResearchNetwork 等只读消费：Idea id → 关联行动数 */
export function boardTaskCounts(project: Project | null | undefined): Map<string, number> {
  const m = new Map<string, number>()
  readBoardTasks(project).forEach((t) => {
    if (t.ideaId) m.set(t.ideaId, (m.get(t.ideaId) || 0) + 1)
  })
  return m
}
