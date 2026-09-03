/**
 * 项目管理数据层：里程碑 + 甘特图步骤。
 *
 * 字段与旧版 index.html 的 savePlanning() 完全一致：
 *   project.name / participants / progress / deadline
 *   project.milestones = [{ id, name, deadline }]
 *   project.ganttSteps = [{ id, title, milestone, start, end, progress }]
 * 项目整体进度 = 各步骤进度的平均；最终 deadline = 最晚的里程碑日期。
 */

import type { Project } from './projects'

export type Milestone = { id: string; name: string; deadline: string }
export type GanttStep = {
  id: string
  title: string
  milestone: string
  start: string
  end: string
  progress: number
}

export function newMilestoneId(): string {
  return 'ms' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

export function newStepId(): string {
  return 'gs' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

export function readMilestones(project: Project): Milestone[] {
  const list = Array.isArray(project.milestones) ? project.milestones : []
  return list.map((m) => ({
    id: String(m.id ?? ''),
    name: String(m.name ?? ''),
    deadline: String(m.deadline ?? ''),
  }))
}

export function readGanttSteps(project: Project): GanttStep[] {
  const list = Array.isArray(project.ganttSteps) ? project.ganttSteps : []
  return list.map((s) => ({
    id: String(s.id ?? ''),
    title: String(s.title ?? ''),
    milestone: String(s.milestone ?? ''),
    start: String(s.start ?? ''),
    end: String(s.end ?? ''),
    progress: clampProgress(s.progress),
  }))
}

export function clampProgress(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, Math.round(n)))
}

/** 与旧版 savePlanning() 一致的两个派生字段 */
export function deriveProgress(steps: GanttStep[]): number {
  if (!steps.length) return 0
  return Math.round(steps.reduce((sum, s) => sum + s.progress, 0) / steps.length)
}

export function deriveDeadline(milestones: Milestone[]): string {
  const dates = milestones.map((m) => m.deadline).filter(Boolean).sort()
  return dates.at(-1) ?? ''
}

/** 甘特图条形位置。与旧版 ganttPosition() 同一套算法。 */
export function ganttPosition(step: GanttStep, steps: GanttStep[]): { left: number; width: number } {
  const dates = steps
    .flatMap((s) => [new Date(s.start).getTime(), new Date(s.end).getTime()])
    .filter(Number.isFinite)

  if (!dates.length) return { left: 0, width: 10 }

  const min = Math.min(...dates)
  const max = Math.max(...dates)
  const span = Math.max(86400000, max - min)
  const start = new Date(step.start).getTime()
  const end = new Date(step.end).getTime()

  if (!Number.isFinite(start) || !Number.isFinite(end)) return { left: 0, width: 10 }

  return {
    left: Math.max(0, ((start - min) / span) * 100),
    width: Math.max(4, ((end - start) / span) * 100),
  }
}

export function hasValidDates(steps: GanttStep[]): boolean {
  return steps.some((s) => Number.isFinite(new Date(s.start).getTime()) && Number.isFinite(new Date(s.end).getTime()))
}

/** 默认里程碑：给新项目一个能直接改的起点 */
export function seedMilestone(index: number, startOffsetDays: number): Milestone {
  const date = new Date()
  date.setDate(date.getDate() + startOffsetDays)
  return {
    id: newMilestoneId(),
    name: `Milestone ${index + 1}`,
    deadline: date.toISOString().slice(0, 10),
  }
}

export function seedStep(milestoneId: string): GanttStep {
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + 14)
  return {
    id: newStepId(),
    title: '',
    milestone: milestoneId,
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    progress: 0,
  }
}
