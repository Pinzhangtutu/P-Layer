import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n, type Translate } from '../i18n'
import { useProject } from '../lib/useProject'
import { readIdeas } from '../lib/ideas'
import { PageIntro } from '../components/PageIntro'
import {
  TASK_KINDS,
  TASK_STATUSES,
  readBoardTasks,
  seedTask,
  taskKindMeta,
  writeBoardTasks,
  type BoardTask,
  type TaskKind,
  type TaskStatus,
} from '../lib/actions'
import type { Idea } from '../lib/ideas'

/**
 * 看板：我的研究行动（文档 §5.4）。
 * 旧「学术申请看板」已下线：applications 数据保留但不再渲染。
 */
export function Board() {
  const { lang, t } = useI18n()
  const { active, mutate } = useProject()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)

  const tasks = useMemo(() => readBoardTasks(active), [active])
  const ideas = useMemo(() => readIdeas(active), [active])

  const selected = tasks.find((x) => x.id === selectedId) ?? null

  const patchTask = (id: string, patch: Partial<BoardTask>) => {
    mutate((project) => {
      const list = readBoardTasks(project).map((x) =>
        x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x,
      )
      writeBoardTasks(project, list)
    })
  }

  const addTask = () => {
    const task = seedTask({ title: lang === 'en' ? 'Untitled action' : '未命名行动', kind: 'reading', status: 'todo' })
    mutate((project) => writeBoardTasks(project, [...readBoardTasks(project), task]))
    setSelectedId(task.id)
  }

  const removeTask = (id: string) => {
    mutate((project) => writeBoardTasks(project, readBoardTasks(project).filter((x) => x.id !== id)))
    if (selectedId === id) setSelectedId(null)
  }

  const moveTask = (id: string, status: TaskStatus) => {
    const found = tasks.find((x) => x.id === id)
    if (found && found.status !== status) patchTask(id, { status })
  }

  return (
    <div className="page">
      <PageIntro
        eyebrow="Research actions / To do · Doing · Done"
        title={t('board')}
        desc={t('boardSub')}
        cite={lang === 'en' ? 'The board manages actions, not Ideas — it never replaces the idea library, literature network or the cycle.' : '看板只管理行动与任务——不替代 Idea 库、文献网络或科学环。'}
      />

      <div className="board-toolbar card">
        <div className="board-toolbar-left">
          <strong>{active.name}</strong>
          <span className="board-toolbar-count">{t('boardCount', { a: tasks.length })}</span>
        </div>
        <button type="button" className="btn primary" onClick={addTask}>
          ➕ {t('boardAdd')}
        </button>
      </div>

      <div className="board-layout is-actions">
        <div className="board-kanban is-actions">
          {TASK_STATUSES.map((col) => {
            const list = tasks.filter((x) => x.status === col.key)
            return (
              <section
                key={col.key}
                className="board-column act-col"
                data-status={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData('text/plain') || dragId.current
                  dragId.current = null
                  if (id) moveTask(id, col.key)
                }}
              >
                <div className="board-column-head">
                  <span className="board-column-title">
                    <i className="act-col-dot" style={{ background: col.dot }} />
                    {lang === 'en' ? col.en : col.zh}
                  </span>
                  <span className="board-column-count">{list.length}</span>
                </div>
                <div className="board-column-body">
                  {list.map((task) => {
                    const kind = taskKindMeta(task.kind)
                    const linked = task.ideaId ? ideas.find((i: Idea) => i.id === task.ideaId) : null
                    const isSel = task.id === selectedId
                    return (
                      <article
                        key={task.id}
                        className={`board-card act-card${isSel ? ' is-selected' : ''}`}
                        draggable
                        data-task-id={task.id}
                        onDragStart={(e) => {
                          dragId.current = task.id
                          e.dataTransfer.setData('text/plain', task.id)
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onDragEnd={() => {
                          dragId.current = null
                        }}
                        onClick={() => setSelectedId(task.id)}
                      >
                        <div className="board-card-top">
                          <span className="board-avatar act-avatar" style={{ background: kind.color }}>
                            {kind.icon}
                          </span>
                          <div className="board-card-title">
                            <strong>{task.title || (lang === 'en' ? 'Untitled action' : '未命名行动')}</strong>
                            <small>{lang === 'en' ? kind.en : kind.zh}</small>
                          </div>
                        </div>
                        {linked ? (
                          <div className="board-tags">
                            <span className="board-tag act-idea-chip">💡 {compact(linked.text, 40)}</span>
                          </div>
                        ) : null}
                        {task.deadline ? (
                          <div className="board-card-foot">
                            <span className="board-day act-date">{String(task.deadline).slice(0, 10)}</span>
                          </div>
                        ) : null}
                      </article>
                    )
                  })}
                  {!list.length ? (
                    <p className="board-column-empty">{t('boardColEmpty')}</p>
                  ) : null}
                </div>
              </section>
            )
          })}
        </div>

        <TaskInspector
          task={selected}
          ideas={ideas}
          lang={lang}
          t={t}
          onChange={patchTask}
          onDelete={removeTask}
        />
      </div>
    </div>
  )
}

function compact(value: string, max = 66) {
  const text = String(value || '').trim().replace(/\s+/g, ' ')
  return text.length > max ? `${text.slice(0, max)}…` : text
}

type Draft = {
  title: string
  kind: TaskKind
  status: TaskStatus
  deadline: string
  ideaId: string
  notes: string
}

function toDraft(task: BoardTask): Draft {
  return {
    title: task.title ?? '',
    kind: task.kind,
    status: task.status,
    deadline: task.deadline ?? '',
    ideaId: task.ideaId ?? '',
    notes: task.notes ?? '',
  }
}

function TaskInspector({
  task,
  ideas,
  lang,
  t,
  onChange,
  onDelete,
}: {
  task: BoardTask | null
  ideas: Idea[]
  lang: 'zh' | 'en'
  t: Translate
  onChange: (id: string, patch: Partial<BoardTask>) => void
  onDelete: (id: string) => void
}) {
  const [draft, setDraft] = useState<Draft | null>(task ? toDraft(task) : null)

  useEffect(() => {
    setDraft(task ? toDraft(task) : null)
  }, [task?.id, task?.updatedAt])

  if (!task || !draft) {
    return (
      <aside className="board-inspector">
        <h2 className="board-inspector-title">{t('inspector')}</h2>
        <p className="board-inspector-empty">{t('boardPick')}</p>
      </aside>
    )
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))

  const save = () =>
    onChange(task.id, {
      title: draft.title.trim(),
      kind: draft.kind,
      status: draft.status,
      deadline: draft.deadline,
      ideaId: draft.ideaId || null,
      notes: draft.notes,
    })

  return (
    <aside className="board-inspector">
      <h2 className="board-inspector-title">{t('inspector')}</h2>

      <label className="board-field">
        <span>{t('fieldName')}</span>
        <input value={draft.title} onChange={(e) => set('title', e.target.value)} />
      </label>

      <label className="board-field">
        <span>{t('actKind')}</span>
        <select value={draft.kind} onChange={(e) => set('kind', e.target.value as TaskKind)}>
          {TASK_KINDS.map((k) => (
            <option key={k.key} value={k.key}>
              {k.icon} {lang === 'en' ? k.en : k.zh}
            </option>
          ))}
        </select>
      </label>

      <label className="board-field">
        <span>{t('fieldStatus')}</span>
        <select value={draft.status} onChange={(e) => set('status', e.target.value as TaskStatus)}>
          {TASK_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {lang === 'en' ? s.en : s.zh}
            </option>
          ))}
        </select>
      </label>

      <label className="board-field">
        <span>{t('actIdea')}</span>
        <select value={draft.ideaId} onChange={(e) => set('ideaId', e.target.value)}>
          <option value="">{t('actNone')}</option>
          {ideas.map((i) => (
            <option key={i.id} value={i.id}>
              {compact(i.text, 44)}
            </option>
          ))}
        </select>
      </label>

      <label className="board-field">
        <span>{t('fieldDeadline')}</span>
        <input type="date" value={draft.deadline} onChange={(e) => set('deadline', e.target.value)} />
      </label>

      <label className="board-field">
        <span>{t('fieldNotes')}</span>
        <textarea rows={4} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
      </label>

      <div className="board-inspector-actions">
        <button type="button" className="btn primary" onClick={save}>
          {t('save')}
        </button>
        <button type="button" className="btn" onClick={() => onDelete(task.id)}>
          {t('delete')}
        </button>
      </div>
    </aside>
  )
}
