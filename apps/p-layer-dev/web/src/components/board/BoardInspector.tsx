import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import {
  COLUMNS,
  PRIORITY_OPTIONS,
  type Application,
  type ApplicationStatus,
  type Priority,
} from '../../lib/projects'

type Props = {
  app: Application | null
  onChange: (id: string, patch: Partial<Application>) => void
  onDelete: (id: string) => void
}

type Draft = {
  name: string
  description: string
  owner: string
  deadline: string
  priority: Priority
  status: ApplicationStatus
  tags: string
  notes: string
}

function toDraft(app: Application): Draft {
  return {
    name: app.name ?? '',
    description: app.description ?? '',
    owner: app.owner ?? '',
    deadline: app.deadline ?? '',
    priority: app.priority ?? 'p50',
    status: app.status,
    tags: (app.tags ?? []).join(', '),
    notes: app.notes ?? '',
  }
}

export function BoardInspector({ app, onChange, onDelete }: Props) {
  const { lang, t } = useI18n()
  const [draft, setDraft] = useState<Draft | null>(app ? toDraft(app) : null)

  // 切换选中项时重建表单
  useEffect(() => {
    setDraft(app ? toDraft(app) : null)
  }, [app?.id])

  if (!app || !draft) {
    return (
      <aside className="board-inspector">
        <h2 className="board-inspector-title">{t('inspector')}</h2>
        <p className="board-inspector-empty">{t('selectHint')}</p>
      </aside>
    )
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const save = () => {
    onChange(app.id, {
      name: draft.name.trim() || app.name,
      description: draft.description,
      owner: draft.owner,
      deadline: draft.deadline,
      priority: draft.priority,
      status: draft.status,
      tags: draft.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      notes: draft.notes,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <aside className="board-inspector">
      <h2 className="board-inspector-title">{t('inspector')}</h2>

      <label className="board-field">
        <span>{t('fieldName')}</span>
        <input value={draft.name} onChange={(e) => set('name', e.target.value)} />
      </label>

      <label className="board-field">
        <span>{t('fieldDescription')}</span>
        <textarea rows={3} value={draft.description} onChange={(e) => set('description', e.target.value)} />
      </label>

      <label className="board-field">
        <span>{t('fieldOwner')}</span>
        <input value={draft.owner} onChange={(e) => set('owner', e.target.value)} />
      </label>

      <label className="board-field">
        <span>{t('fieldDeadline')}</span>
        <input type="date" value={draft.deadline} onChange={(e) => set('deadline', e.target.value)} />
      </label>

      <label className="board-field">
        <span>{t('fieldStatus')}</span>
        <select value={draft.status} onChange={(e) => set('status', e.target.value as ApplicationStatus)}>
          {COLUMNS.map((c) => (
            <option key={c.key} value={c.key}>
              {lang === 'en' ? c.labelEn : c.labelZh}
            </option>
          ))}
        </select>
      </label>

      <label className="board-field">
        <span>{t('fieldPriority')}</span>
        <select value={draft.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p.key} value={p.key}>
              {lang === 'en' ? p.labelEn : p.labelZh}
            </option>
          ))}
        </select>
      </label>

      <label className="board-field">
        <span>{t('fieldTags')}</span>
        <input value={draft.tags} onChange={(e) => set('tags', e.target.value)} />
      </label>

      <label className="board-field">
        <span>{t('fieldNotes')}</span>
        <textarea rows={4} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
      </label>

      <div className="board-inspector-actions">
        <button className="btn primary" onClick={save}>
          {t('save')}
        </button>
        <button className="btn" onClick={() => onDelete(app.id)}>
          {t('delete')}
        </button>
      </div>
    </aside>
  )
}
