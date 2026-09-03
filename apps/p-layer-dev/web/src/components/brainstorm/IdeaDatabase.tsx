import { Fragment, useMemo, useState } from 'react'
import { useI18n } from '../../i18n'
import {
  IDEA_CATEGORIES,
  IDEA_ORIGINS,
  LIFECYCLES,
  MATURITY,
  MATURITY_ORDER,
  clearMaturity,
  deriveMaturity,
  maturityOf,
  readIdeas,
  recordMaturity,
  writeIdeas,
  type Idea,
  type IdeaOrigin,
  type IdeaLifecycle,
  type LifecycleBucket,
  type MaturityLevel,
} from '../../lib/ideas'
import { useProject } from '../../lib/useProject'
import { normBrainstorm } from '../../lib/brainstormV1'
import { MaturityBadge } from './MaturityBadge'

const LIFECYCLE_SELECT: IdeaLifecycle[] = ['active', 'paused', 'archived', 'abandoned', 'converted']

export function IdeaDatabase({ onTrain }: { onTrain?: (idea: Idea) => void }) {
  const { lang, t } = useI18n()
  const { active, mutate, projects } = useProject()
  const ideas = useMemo(() => readIdeas(active), [active, projects])
  const [originFilter, setOriginFilter] = useState<'all' | IdeaOrigin>('all')
  const [bucket, setBucket] = useState<LifecycleBucket>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  /* 成熟度手动覆盖草稿：行 id → { level?, reason }（不即时落库，点「应用」才写） */
  const [maturityDraft, setMaturityDraft] = useState<Record<string, { mode: 'auto' | 'manual'; level: MaturityLevel; reason: string }>>({})

  const bucketOf = (i: Idea): LifecycleBucket => {
    const lc = i.lifecycle ?? (i.status === 'promoted' ? 'converted' : 'active')
    if (lc === 'paused') return 'paused'
    if (lc === 'archived' || lc === 'abandoned') return 'ended'
    return 'open'
  }

  const counts = useMemo(() => {
    const c: Record<LifecycleBucket, number> = { all: ideas.length, open: 0, paused: 0, ended: 0 }
    ideas.forEach((i) => {
      c[bucketOf(i)] += 1
    })
    return c
  }, [ideas])

  const visible = useMemo(() => {
    return ideas.filter(
      (idea) =>
        (originFilter === 'all' || idea.origin === originFilter) && (bucket === 'all' || bucketOf(idea) === bucket),
    )
  }, [ideas, originFilter, bucket])

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
    if (expandedId === id) setExpandedId(null)
  }

  /** 推进到研究问题（≈ §9.1 Converted：转为正式研究项目入口） */
  const promote = (idea: Idea) => {
    mutate((project) => {
      if (!project.notes) project.notes = {}
      const notes = project.notes as Record<string, unknown>
      notes.rqDraft = idea.text
      notes.rqDraftMeta = { fromIdea: idea.id, updatedAt: new Date().toISOString() }
      const list = readIdeas(project).map((row) =>
        row.id === idea.id ? { ...row, status: 'promoted' as const, lifecycle: 'converted' as const } : row,
      )
      writeIdeas(project, list)
    })
  }

  const lifecycleOf = (i: Idea): IdeaLifecycle => i.lifecycle ?? (i.status === 'promoted' ? 'converted' : 'active')

  const renderOrigin = (origin: IdeaOrigin) => {
    const found = IDEA_ORIGINS.find((o) => o.key === origin)
    return found ? (lang === 'en' ? found.en : found.zh) : origin
  }

  const applyMaturity = (idea: Idea) => {
    const draft = maturityDraft[idea.id]
    if (!draft) return
    mutate((project) => {
      const list = readIdeas(project)
      const found = list.find((row) => row.id === idea.id)
      if (!found) return
      if (draft.mode === 'auto') clearMaturity(found)
      else recordMaturity(found, draft.level, draft.reason)
      writeIdeas(project, list)
    })
    setExpandedId(null)
    const next = { ...maturityDraft }
    delete next[idea.id]
    setMaturityDraft(next)
  }

  const openDraftFor = (idea: Idea) => {
    const mv = maturityOf(idea)
    setExpandedId(idea.id)
    setMaturityDraft((prev) => ({
      ...prev,
      [idea.id]: { mode: mv.source, level: mv.level, reason: '' },
    }))
  }

  const tableCols = 7

  return (
    <div className="idea-database">
      <div className="idea-db-tools">
        <select
          className="select idea-origin-filter"
          value={originFilter}
          onChange={(e) => setOriginFilter(e.target.value as 'all' | IdeaOrigin)}
        >
          <option value="all">{t('ideaFilterAll')}</option>
          {IDEA_ORIGINS.map((o) => (
            <option key={o.key} value={o.key}>
              {lang === 'en' ? o.en : o.zh}
            </option>
          ))}
        </select>
        <span className="tag">
          {visible.length} / {ideas.length} {lang === 'en' ? 'ideas' : '条 idea'}
        </span>
      </div>

      <div className="idea-lifecycle-tabs" role="tablist" aria-label={lang === 'en' ? 'Idea lifecycle' : 'Idea 生命周期'}>
        {(
          [
            ['all', t('ideaBucketAll')],
            ['open', t('ideaBucketOpen')],
            ['paused', t('ideaBucketPaused')],
            ['ended', t('ideaBucketEnded')],
          ] as [LifecycleBucket, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={bucket === key}
            className={`idea-lifecycle-tab${bucket === key ? ' active' : ''}`}
            onClick={() => setBucket(key)}
          >
            {label}
            <i>{counts[key]}</i>
          </button>
        ))}
      </div>

      <div className="idea-db-shell">
        <table className="idea-db">
          <thead>
            <tr>
              <th>{lang === 'en' ? 'Idea' : '想法'}</th>
              <th>{lang === 'en' ? 'Context' : '进入语境'}</th>
              <th>{lang === 'en' ? 'Maturity' : '成熟度'}</th>
              <th>{lang === 'en' ? 'Type' : '研究类型'}</th>
              <th>{lang === 'en' ? 'Lifecycle' : '生命周期'}</th>
              <th>{lang === 'en' ? 'Action' : '操作'}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td className="idea-empty-row" colSpan={tableCols}>
                  {t('ideaEmpty')}
                </td>
              </tr>
            ) : (
              visible.map((idea) => {
                const lc = lifecycleOf(idea)
                const rowClass = `idea-main-row${lc === 'paused' ? ' is-paused' : ''}${lc === 'archived' || lc === 'abandoned' ? ' is-ended' : ''}${lc === 'converted' ? ' is-converted' : ''}`
                const mv = maturityOf(idea)
                const expanded = expandedId === idea.id
                const draft = maturityDraft[idea.id]
                return (
                  <Fragment key={idea.id}>
                    <tr className={rowClass} data-idea-id={idea.id}>
                      <td>
                        <button
                          type="button"
                          className="idea-expand"
                          title={expanded ? (lang === 'en' ? 'Collapse details' : '收起详情') : (lang === 'en' ? 'Details, time & maturity override' : '详情 / 时间地点 / 手动成熟度')}
                          onClick={() => (expanded ? setExpandedId(null) : openDraftFor(idea))}
                        >
                          {expanded ? '▾' : '▸'}
                        </button>
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
                        <MaturityBadge view={mv} />
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
                        <select
                          className="idea-cell idea-meta idea-lifecycle-select"
                          data-field="lifecycle"
                          value={lc}
                          onChange={(e) => updateIdea(idea.id, { lifecycle: e.target.value as IdeaLifecycle })}
                          title={lang === 'en' ? 'Pause / archive / abandon or resume. Archiving never deletes.' : '暂停 / 归档 / 放弃或恢复。归档不等于删除。'}
                        >
                          {LIFECYCLE_SELECT.map((k) => {
                            const lcMeta = LIFECYCLES.find((x) => x.key === k)!
                            return (
                              <option key={k} value={k}>
                                {lcMeta.icon} {lang === 'en' ? lcMeta.en : lcMeta.zh}
                              </option>
                            )
                          })}
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
                    {expanded ? (
                      <tr className="idea-detail-row">
                        <td colSpan={tableCols}>
                          <div className="idea-detail-grid">
                            <label>
                              {t('ideaTimeLabel')}
                              <input
                                className="input"
                                type="datetime-local"
                                value={idea.time ?? ''}
                                onChange={(e) => updateIdea(idea.id, { time: e.target.value })}
                              />
                            </label>
                            <label>
                              {t('ideaLocationLabel')}
                              <input
                                className="input"
                                value={idea.location ?? ''}
                                onChange={(e) => updateIdea(idea.id, { location: e.target.value })}
                              />
                            </label>
                            <label>
                              {t('ideaCaseLabel')}
                              <input
                                className="input"
                                value={idea.case ?? ''}
                                onChange={(e) => updateIdea(idea.id, { case: e.target.value })}
                              />
                            </label>
                            <div className="idea-detail-maturity">
                              <b>{t('maturityOverrideTitle')}</b>
                              <div className="idea-maturity-controls">
                                <select
                                  className="select"
                                  value={draft?.mode ?? 'auto'}
                                  onChange={(e) =>
                                    setMaturityDraft((prev) => ({
                                      ...prev,
                                      [idea.id]: { mode: e.target.value as 'auto' | 'manual', level: draft?.level ?? mv.level, reason: draft?.reason ?? '' },
                                    }))
                                  }
                                >
                                  <option value="auto">{t('maturityFollowAuto')}</option>
                                  {MATURITY_ORDER.map((lvl) => (
                                    <option key={lvl} value={lvl}>
                                      {lvl} {lang === 'en' ? MATURITY[lvl].en : MATURITY[lvl].zh} · {lang === 'en' ? MATURITY[lvl].minEn : MATURITY[lvl].minZh}
                                    </option>
                                  ))}
                                </select>
                                {draft?.mode === 'manual' ? (
                                  <input
                                    className="input idea-maturity-reason"
                                    value={draft?.reason ?? ''}
                                    placeholder={t('maturityReasonPlaceholder')}
                                    onChange={(e) =>
                                      setMaturityDraft((prev) => ({
                                        ...prev,
                                        [idea.id]: { mode: 'manual', level: prev[idea.id]?.level ?? mv.level, reason: e.target.value },
                                      }))
                                    }
                                  />
                                ) : null}
                                <button type="button" className="btn small primary" onClick={() => applyMaturity(idea)}>
                                  {t('maturityApply')}
                                </button>
                              </div>
                              <small className="idea-maturity-note">
                                {t('maturityAutoHint')}：<MaturityBadge view={{ level: deriveAuto(idea), source: 'auto' }} />
                              </small>
                              {idea.maturityLog && idea.maturityLog.length ? (
                                <div className="idea-maturity-log">
                                  <b>{t('maturityLogTitle')}</b>
                                  <ul>
                                    {idea.maturityLog
                                      .slice()
                                      .reverse()
                                      .map((entry, idx) => (
                                        <li key={idx}>
                                          <span className="idea-maturity-log-level">{entry.level}</span> {entry.reason} ·{' '}
                                          {(entry.at || '').slice(0, 10)}
                                        </li>
                                      ))}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="idea-db-note">{t('ideaDbNote')}</div>
    </div>
  )
}

/** 细节展开区提示用：始终显示纯自动推导值（区别于可能被手动覆盖的生效值） */
function deriveAuto(idea: Idea) {
  return deriveMaturity(idea)
}
