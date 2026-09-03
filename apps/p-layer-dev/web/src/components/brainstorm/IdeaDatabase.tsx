import { useMemo, useState } from 'react'
import { useI18n } from '../../i18n'
import {
  IDEA_CATEGORIES,
  IDEA_LEVELS,
  IDEA_ORIGINS,
  readIdeas,
  writeIdeas,
  type Idea,
  type IdeaOrigin,
} from '../../lib/ideas'
import { useProject } from '../../lib/useProject'
import { normBrainstorm } from '../../lib/brainstormV1'

export function IdeaDatabase({ onTrain }: { onTrain?: (idea: Idea) => void }) {
  const { lang, t } = useI18n()
  const { active, mutate, projects } = useProject()
  const ideas = useMemo(() => readIdeas(active), [active, projects])
  const [filter, setFilter] = useState<'all' | IdeaOrigin>('all')

  const visible = useMemo(
    () => (filter === 'all' ? ideas : ideas.filter((idea) => idea.origin === filter)),
    [ideas, filter],
  )

  const updateIdea = (id: string, patch: Partial<Idea>) => {
    mutate((project) => {
      const list = readIdeas(project).map((idea) =>
        idea.id === id ? { ...idea, ...patch } : idea,
      )
      writeIdeas(project, list)
    })
  }

  const deleteIdea = (id: string) => {
    mutate((project) => {
      const list = readIdeas(project).filter((idea) => idea.id !== id)
      writeIdeas(project, list)
    })
  }

  const promote = (idea: Idea) => {
    mutate((project) => {
      if (!project.notes) project.notes = {}
      const notes = project.notes as Record<string, unknown>
      notes.rqDraft = idea.text
      notes.rqDraftMeta = { fromIdea: idea.id, updatedAt: new Date().toISOString() }
      const list = readIdeas(project).map((row) =>
        row.id === idea.id ? { ...row, status: 'promoted' as const } : row,
      )
      writeIdeas(project, list)
    })
  }

  const renderOrigin = (origin: IdeaOrigin) => {
    const found = IDEA_ORIGINS.find((o) => o.key === origin)
    return found ? (lang === 'en' ? found.en : found.zh) : origin
  }

  return (
    <div className="idea-database">
      <div className="idea-db-tools">
        <select
          className="select idea-origin-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | IdeaOrigin)}
        >
          <option value="all">{t('ideaFilterAll')}</option>
          {IDEA_ORIGINS.map((o) => (
            <option key={o.key} value={o.key}>
              {lang === 'en' ? o.en : o.zh}
            </option>
          ))}
        </select>
        <span className="tag">
          {visible.length} {lang === 'en' ? 'ideas' : '条 idea'}
        </span>
      </div>

      <div className="idea-db-shell">
        <table className="idea-db">
          <thead>
            <tr>
              <th>{lang === 'en' ? 'Idea' : '想法'}</th>
              <th>{lang === 'en' ? 'Source' : '灵感来源'}</th>
              <th>{lang === 'en' ? 'Tags' : '理论 / 主题标签'}</th>
              <th>{lang === 'en' ? 'Time' : '时间'}</th>
              <th>{lang === 'en' ? 'Location' : '地点'}</th>
              <th>{lang === 'en' ? 'Case' : '案例'}</th>
              <th>{lang === 'en' ? 'Level' : '等级'}</th>
              <th>{lang === 'en' ? 'Type' : '研究类型'}</th>
              <th>{lang === 'en' ? 'Action' : '操作'}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td className="idea-empty-row" colSpan={9}>
                  {t('ideaEmpty')}
                </td>
              </tr>
            ) : (
              visible.map((idea) => (
                <tr key={idea.id} data-idea-id={idea.id}>
                  <td>
                    <span
                      className={`idea-status ${idea.status === 'promoted' ? 'is-promoted' : ''}`}
                      title={idea.status === 'promoted' ? t('ideaPromoted') : ''}
                    >
                      {idea.status === 'promoted' ? '✓' : '·'}
                    </span>
                    <input
                      className="idea-cell idea-text"
                      value={idea.text}
                      onChange={(e) => updateIdea(idea.id, { text: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      className="idea-cell idea-meta"
                      data-field="origin"
                      value={idea.origin}
                      onChange={(e) =>
                        updateIdea(idea.id, { origin: e.target.value as IdeaOrigin })
                      }
                      title={renderOrigin(idea.origin)}
                    >
                      {IDEA_ORIGINS.map((o) => (
                        <option key={o.key} value={o.key}>
                          {lang === 'en' ? o.en : o.zh}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="idea-cell idea-meta"
                      data-field="tags"
                      value={idea.tags.join(', ')}
                      onChange={(e) =>
                        updateIdea(idea.id, {
                          tags: e.target.value
                            .split(/[,，]/)
                            .map((v) => v.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="tag1, tag2"
                    />
                  </td>
                  <td>
                    <input
                      className="idea-cell idea-meta"
                      data-field="time"
                      type="datetime-local"
                      value={idea.time ?? ''}
                      onChange={(e) => updateIdea(idea.id, { time: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="idea-cell idea-meta"
                      data-field="location"
                      value={idea.location ?? ''}
                      onChange={(e) => updateIdea(idea.id, { location: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="idea-cell idea-meta"
                      data-field="case"
                      value={idea.case ?? ''}
                      onChange={(e) => updateIdea(idea.id, { case: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      className="idea-cell idea-meta"
                      data-field="level"
                      value={idea.level}
                      onChange={(e) => updateIdea(idea.id, { level: e.target.value })}
                    >
                      {IDEA_LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="idea-cell idea-meta"
                      data-field="category"
                      value={idea.category}
                      onChange={(e) => updateIdea(idea.id, { category: e.target.value })}
                    >
                      {IDEA_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="idea-actions">
                      {onTrain ? (
                        <button type="button" className="btn small loop-entry" onClick={() => onTrain(idea)}>
                          {normBrainstorm(idea.brainstorm).status !== '未开始' ? t('v1Continue') : t('v1StartTrain')}
                        </button>
                      ) : null}
                      {idea.status !== 'promoted' && (
                        <button
                          type="button"
                          className="btn small promote-idea"
                          onClick={() => promote(idea)}
                        >
                          {t('ideaPromote')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn small ghost delete-idea"
                        onClick={() => deleteIdea(idea.id)}
                      >
                        {t('ideaDelete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="idea-db-note">{t('ideaDbNote')}</div>
    </div>
  )
}
