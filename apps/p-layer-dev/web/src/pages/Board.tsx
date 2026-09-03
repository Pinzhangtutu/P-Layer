import { useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import {
  COLUMNS,
  ensureApplications,
  newId,
  sortApplications,
  type Application,
  type ApplicationStatus,
  type SortKey,
} from '../lib/projects'
import { useProject } from '../lib/useProject'
import { BoardSidebar } from '../components/board/BoardSidebar'
import { BoardColumn } from '../components/board/BoardColumn'
import { BoardInspector } from '../components/board/BoardInspector'

export function Board() {
  const { lang, t } = useI18n()
  const { projects, active, mutate } = useProject()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('deadline')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // 拖拽中的卡片 id 用 ref 保存：drop 时需要同步读取，React state 更新太慢
  const dragIdRef = useRef<string | null>(null)

  const all = useMemo(() => ensureApplications(active), [active, projects])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? all.filter((a) =>
          [a.name, a.owner, ...(a.tags ?? [])].some((v) => String(v ?? '').toLowerCase().includes(q)),
        )
      : all
    return sortApplications(filtered, sort)
  }, [all, query, sort])

  const moveApp = (id: string, status: ApplicationStatus) => {
    mutate((project) => {
      const target = (project.applications ?? []).find((a) => a.id === id)
      if (target && target.status !== status) {
        target.status = status
        target.updatedAt = new Date().toISOString()
      }
    })
  }

  const updateApp = (id: string, patch: Partial<Application>) => {
    mutate((project) => {
      const target = (project.applications ?? []).find((a) => a.id === id)
      if (target) Object.assign(target, patch)
    })
  }

  const removeApp = (id: string) => {
    mutate((project) => {
      project.applications = (project.applications ?? []).filter((a) => a.id !== id)
    })
    if (selectedId === id) setSelectedId(null)
  }

  const addApp = () => {
    const now = new Date().toISOString()
    const app: Application = {
      id: newId(),
      name: lang === 'en' ? 'Untitled item' : '未命名项目',
      description: '',
      owner: '',
      deadline: '',
      priority: 'p50',
      status: 'backlog',
      tags: [],
      notes: '',
      createdAt: now,
      updatedAt: now,
    }
    mutate((project) => {
      project.applications = [...(project.applications ?? []), app]
    })
    setSelectedId(app.id)
  }

  const selected = all.find((a) => a.id === selectedId) ?? null

  return (
    <div className="page">
      <div className="page-head">
        <h1>{t('board')}</h1>
        <p>{t('boardSub')}</p>
      </div>

      <div className="board-toolbar card">
        <div className="board-toolbar-left">
          <strong>{active.name}</strong>
          <span className="board-toolbar-count">{t('filteredCount', { a: visible.length, b: all.length })}</span>
        </div>
        <button className="btn primary" onClick={addApp}>
          {t('newApplication')}
        </button>
      </div>

      <div className="board-layout">
        <BoardSidebar
          apps={visible}
          total={all.length}
          query={query}
          onQuery={setQuery}
          sort={sort}
          onSort={setSort}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <div className="board-kanban">
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.key}
              column={col}
              apps={visible.filter((a) => a.status === col.key)}
              lang={lang}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDropCard={(status, transferId) => {
                const id = transferId || dragIdRef.current
                if (id) moveApp(id, status)
                dragIdRef.current = null
              }}
              onDragStart={(id) => {
                dragIdRef.current = id
              }}
              onDragEnd={() => {
                dragIdRef.current = null
              }}
            />
          ))}
        </div>

        <BoardInspector app={selected} onChange={updateApp} onDelete={removeApp} />
      </div>
    </div>
  )
}
