import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ensureApplications,
  newId,
  readActiveProjectId,
  readProjects,
  writeProjects,
  type Project,
} from './projects'

const FALLBACK: Project = { id: '', name: 'Demo', notes: {}, applications: [] }

export type ProjectStore = {
  projects: Project[]
  active: Project
  activeId: string
  mutate: (fn: (project: Project) => void) => void
  switchTo: (id: string) => void
  createProject: (name: string) => Project
}

const ProjectContext = createContext<ProjectStore | null>(null)
export const ProjectProvider = ProjectContext.Provider

/**
 * 共享项目数据 store。旧版是多个脚本各自调 activeProject() → 改字段 → 各自 saveProjects()，
 * 于是同一个 DOM 节点被几处代码反复覆盖。这里用 React Context 收敛成一条路径：
 * mutate(fn) 拿到一份可改的副本，改完统一落盘。
 *
 * 注意：fn 里不要调用 newId() 之类的非确定性函数 —— React 在开发模式下会
 * 重复执行 updater，两次结果不一致会让界面闪一下。需要新 id 时在外面生成。
 *
 * StrictMode 防护：React 18 dev 模式下 setState 的 updater 会被**连续调用两次**
 * （同一 prev 传入），如果 fn 里有 push/追加等非幂等操作（如保存版本、追加反馈），
 * 会被执行两次导致重复写入。这里用 seq 缓存第一次的结果，第二次直接返回缓存，
 * fn 只真正执行一次。
 */
/* 模块级序号：每个 mutate 调用一个 seq，updater 双调用共享同一 seq */
let mutateSeq = 0
const mutateCache = new Map<number, Project[]>()

export function useProject(): ProjectStore {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used inside ProjectProvider')
  return ctx
}

function useProjectStoreInternal(): ProjectStore {
  const [projects, setProjects] = useState<Project[]>(() => readProjects())
  const [activeId, setActiveId] = useState<string>(() => readActiveProjectId())

  const active = useMemo(() => {
    if (activeId) {
      const found = projects.find((p) => p.id === activeId)
      if (found) return found
    }
    return projects[0] ?? FALLBACK
  }, [projects, activeId])

  const activeIdRef = useRef(activeId)
  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  const mutate = useCallback((fn: (project: Project) => void) => {
    const seq = ++mutateSeq
    setProjects((prev) => {
      // StrictMode 双调用：第二次直接返回第一次的结果，fn 不再执行
      const cached = mutateCache.get(seq)
      if (cached) return cached

      const currentId = activeIdRef.current
      const exists = prev.some((p) => p.id === currentId && currentId !== '')

      const found = exists
        ? prev.find((p) => p.id === currentId)!
        : prev.find((p) => p.id === 'default') ?? { ...FALLBACK, id: 'default' }

      const base: Project = {
        ...found,
        notes: { ...(found.notes ?? {}) },
        applications: [...ensureApplications(found)],
      }

      fn(base)

      const next = prev.some((p) => p.id === base.id)
        ? prev.map((p) => (p.id === base.id ? base : p))
        : [...prev, base]

      writeProjects(next, base.id)
      if (base.id !== currentId) activeIdRef.current = base.id
      mutateCache.set(seq, next)
      /* 缓存只保留最近的 64 次，避免长期运行内存增长 */
      if (mutateCache.size > 64) {
        const oldest = mutateCache.keys().next().value
        if (oldest !== undefined) mutateCache.delete(oldest)
      }
      return next
    })
  }, [])

  const switchTo = useCallback((id: string) => {
    setProjects((prev) => {
      if (!prev.some((p) => p.id === id)) return prev
      activeIdRef.current = id
      writeProjects(prev, id)
      return prev
    })
    setActiveId(id)
  }, [])

  const createProject = useCallback((name: string): Project => {
    const project: Project = {
      id: newId(),
      name: name.trim() || 'Untitled project',
      notes: {},
      applications: [],
      milestones: [],
      ganttSteps: [],
      boardTasks: [],
      participants: 0,
      progress: 0,
      deadline: '',
    }
    setProjects((prev) => {
      const next = [...prev, project]
      activeIdRef.current = project.id
      writeProjects(next, project.id)
      return next
    })
    setActiveId(project.id)
    return project
  }, [])

  return { projects, active, activeId, mutate, switchTo, createProject }
}

/** 在 App 顶层调用一次，把 store 注入 Context */
export function useCreateProjectStore(): ProjectStore {
  return useProjectStoreInternal()
}
