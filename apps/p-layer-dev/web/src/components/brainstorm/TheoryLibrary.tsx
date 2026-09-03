import { useMemo, useState } from 'react'
import { useI18n } from '../../i18n'
import { useProject } from '../../lib/useProject'
import { readIdeas } from '../../lib/ideas'
import {
  THEORY_KINDS,
  readTheories,
  seedTheory,
  writeTheories,
  type TheoryAsset,
  type TheoryKind,
} from '../../lib/theories'

/**
 * §9.2 理论资产库：保存用户已经知道、正在理解或希望重新使用的
 * 概念 / 理论机制 / 命题 / 适用边界 / 整体理论，以及它如何改变某个 Idea。
 * 编辑即时落库（mutate 统一写盘）；行展开编辑，点「收起」关闭。
 */
export function TheoryLibrary() {
  const { lang, t } = useI18n()
  const { active, mutate, projects } = useProject()
  const theories = useMemo(() => readTheories(active), [active, projects])
  const ideas = useMemo(() => readIdeas(active), [active, projects])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const update = (id: string, patch: Partial<TheoryAsset>) => {
    mutate((project) => {
      const list = readTheories(project).map((row) =>
        row.id === id
          ? { ...row, ...patch, updated: new Date().toISOString() }
          : row,
      )
      writeTheories(project, list)
    })
  }

  const remove = (id: string) => {
    mutate((project) => {
      const list = readTheories(project).filter((row) => row.id !== id)
      writeTheories(project, list)
    })
    if (expandedId === id) setExpandedId(null)
  }

  const create = () => {
    const fresh = seedTheory()
    mutate((project) => {
      const list = [fresh, ...readTheories(project)]
      writeTheories(project, list)
    })
    setExpandedId(fresh.id)
  }

  const collapseIfEmpty = (row: TheoryAsset) => {
    if (!row.name.trim() && !row.content.trim() && !row.notes.trim() && row.ideaIds.length === 0 && row.litRefs.length === 0) {
      remove(row.id)
    } else {
      setExpandedId(null)
    }
  }

  const kindLabel = (kind: TheoryKind) => {
    const found = THEORY_KINDS.find((k) => k.key === kind)
    return found ? (lang === 'en' ? found.en : found.zh) : kind
  }

  const compact = (v: string, max = 70) => {
    const text = v.replace(/\s+/g, ' ').trim()
    return text.length > max ? `${text.slice(0, max)}…` : text
  }

  const ideaNameOf = (ideaId: string) => {
    const found = ideas.find((i) => i.id === ideaId)
    return found ? compact(found.text, 24) : ideaId
  }

  return (
    <section className="card theory-card">
      <div className="head">
        <div>
          <h2>{t('theoryTitle')}</h2>
          <h3>{t('theorySub')}</h3>
        </div>
        <span className="tag">
          {theories.length} {lang === 'en' ? 'theories' : '条理论'}
        </span>
      </div>

      {theories.length === 0 ? (
        <div className="theory-empty">
          <p>{t('theoryEmpty')}</p>
          <button type="button" className="btn primary" onClick={create}>
            ＋ {t('theoryNew')}
          </button>
        </div>
      ) : (
        <div className="theory-list">
          {theories.map((row) => {
            const expanded = expandedId === row.id
            return (
              <article key={row.id} className={`theory-row${expanded ? ' is-expanded' : ''}`} data-theory-id={row.id}>
                {expanded ? (
                  <div className="theory-editor">
                    <div className="theory-editor-grid">
                      <label>
                        {t('theoryName')}
                        <input
                          className="input"
                          value={row.name}
                          placeholder={lang === 'en' ? 'e.g. Dominance vs. Prestige (Henrich & Gil-White 2001)' : '例如：Dominance vs. Prestige（Henrich & Gil-White 2001）'}
                          onChange={(e) => update(row.id, { name: e.target.value })}
                        />
                      </label>
                      <label>
                        {t('theoryKind')}
                        <select
                          className="select"
                          value={row.kind}
                          onChange={(e) => update(row.id, { kind: e.target.value as TheoryKind })}
                        >
                          {THEORY_KINDS.map((k) => (
                            <option key={k.key} value={k.key}>
                              {lang === 'en' ? k.en : k.zh}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      {t('theoryContent')}
                      <textarea
                        className="textarea"
                        rows={3}
                        value={row.content}
                        placeholder={
                          lang === 'en'
                            ? 'Definition, mechanism, proposition or boundary condition…'
                            : '概念定义、机制说明、命题表述或边界条件…'
                        }
                        onChange={(e) => update(row.id, { content: e.target.value })}
                      />
                    </label>
                    <label>
                      {t('theoryNotes')}
                      <textarea
                        className="textarea"
                        rows={2}
                        value={row.notes}
                        placeholder={
                          lang === 'en'
                            ? 'My take, or how this theory changed an Idea…'
                            : '我的理解，或它如何改变某个 Idea…'
                        }
                        onChange={(e) => update(row.id, { notes: e.target.value })}
                      />
                    </label>
                    <div className="theory-editor-grid">
                      <label>
                        {t('theoryLinkIdeas')}
                        <select
                          className="select"
                          multiple
                          size={Math.min(5, Math.max(2, ideas.length))}
                          value={row.ideaIds}
                          onChange={(e) =>
                            update(row.id, {
                              ideaIds: Array.from(e.target.selectedOptions).map((o) => o.value),
                            })
                          }
                        >
                          {ideas.map((idea) => (
                            <option key={idea.id} value={idea.id}>
                              {compact(idea.text, 48)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        {t('theoryLitRefs')}
                        <input
                          className="input"
                          value={row.litRefs.join(', ')}
                          placeholder={lang === 'en' ? 'Henrich & Gil-White 2001, …' : 'Henrich & Gil-White 2001, …'}
                          onChange={(e) =>
                            update(row.id, {
                              litRefs: e.target.value
                                .split(/[,，]/)
                                .map((v) => v.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </label>
                    </div>
                    <div className="theory-actions">
                      {row.ideaIds.length ? (
                        <span className="theory-linked-tags">
                          {row.ideaIds.map((ideaId) => (
                            <i key={ideaId}>💡 {ideaNameOf(ideaId)}</i>
                          ))}
                        </span>
                      ) : null}
                      <span className="spacer" />
                      <button type="button" className="btn small ghost" onClick={() => remove(row.id)}>
                        {t('delete')}
                      </button>
                      <button type="button" className="btn small primary" onClick={() => collapseIfEmpty(row)}>
                        {t('theoryDone')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="theory-line">
                    <button type="button" className="theory-line-main" onClick={() => setExpandedId(row.id)}>
                      <span className={`theory-kind theory-kind-${row.kind}`}>{kindLabel(row.kind)}</span>
                      <b>{row.name || (lang === 'en' ? 'Untitled theory' : '未命名理论')}</b>
                      {row.content ? <p>{compact(row.content, 90)}</p> : null}
                      {row.notes ? <small>✎ {compact(row.notes, 60)}</small> : null}
                      <span className="theory-line-meta">
                        {row.ideaIds.length ? `💡 ${row.ideaIds.length}` : null}
                        {row.litRefs.length ? ` 📚 ${row.litRefs.length}` : null}
                      </span>
                    </button>
                    <button type="button" className="btn small ghost" onClick={() => setExpandedId(row.id)}>
                      {t('edit')}
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {theories.length ? (
        <div className="theory-toolbar">
          <button type="button" className="btn" onClick={create}>
            ＋ {t('theoryNew')}
          </button>
        </div>
      ) : null}
    </section>
  )
}
