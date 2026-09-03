import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { normBrainstorm, rqOf } from '../lib/brainstormV1'
import { readIdeas } from '../lib/ideas'
import { readAudits, readLiteratureRadar, readZoteroState } from '../lib/literature'
import { useProject } from '../lib/useProject'

type LiteratureNode = {
  id: string
  title: string
  source: string
  ideaIds: string[]
}

function compact(value: string, max = 66) {
  const text = value.trim().replace(/\s+/g, ' ')
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function sourceKey(title: string, fallback: string) {
  return title.trim().toLowerCase().replace(/\s+/g, ' ') || fallback
}

/**
 * 项目级统一研究网络：Idea / RQ / 项目与文献共享一张关系图。
 * 文献库只提供另一个观察入口，不建立第二份网络数据。
 */
export function ResearchNetwork() {
  const { lang } = useI18n()
  const { active, projects } = useProject()
  const ideas = useMemo(() => readIdeas(active), [active, projects])

  const literature = useMemo(() => {
    const rows = new Map<string, { id: string; title: string; source: string; ideaIds: Set<string> }>()
    const add = (id: string, title: string, source: string, ideaIds: string[] = []) => {
      if (!title.trim()) return
      const key = sourceKey(title, id)
      const existing = rows.get(key)
      if (existing) {
        ideaIds.forEach((ideaId) => existing.ideaIds.add(ideaId))
        return
      }
      rows.set(key, { id, title: title.trim(), source, ideaIds: new Set(ideaIds) })
    }

    readZoteroState(active).pinned.forEach((item) =>
      add(`zotero:${item.key}`, item.title || item.key, 'Zotero'),
    )
    readAudits(active).forEach((item) =>
      add(`audit:${item.id}`, item.title, lang === 'en' ? 'Literature audit' : '文献审计'),
    )
    readLiteratureRadar(active).items
      .filter((item) => item.status === 'saved')
      .forEach((item) => add(`radar:${item.id}`, item.title, item.journal, item.linkedIdeaIds))
    ideas.forEach((idea) => {
      const source = idea.literatureSource
      if (source?.title) add(`idea-source:${idea.id}`, source.title, lang === 'en' ? 'Idea source' : 'Idea 来源', [idea.id])
    })

    return [...rows.values()].map((row): LiteratureNode => ({
      ...row,
      ideaIds: [...row.ideaIds],
    }))
  }, [active, projects, ideas, lang])

  const relations = useMemo(
    () => literature.flatMap((paper) => paper.ideaIds.map((ideaId) => ({ ideaId, paper }))),
    [literature],
  )

  return (
    <section className="card research-network-card">
      <div className="head">
        <div>
          <h2>{lang === 'en' ? 'Research network' : '研究网络'}</h2>
          <h3>
            {lang === 'en'
              ? 'One graph for Ideas, RQs, projects and literature; different pages only change the point of view.'
              : 'Idea、RQ、项目与文献共用一张网络；不同页面只改变观察中心。'}
          </h3>
        </div>
        <span className="tag">{ideas.length} Idea · {literature.length} {lang === 'en' ? 'sources' : '篇文献'}</span>
      </div>

      <div className="research-network-map">
        <div className="research-network-column is-idea">
          <div className="research-network-column-head">
            <b>💡 Idea / RQ</b>
            <small>{lang === 'en' ? 'Project-specific thinking' : '当前项目的研究思考'}</small>
          </div>
          <div className="research-network-node-list">
            {ideas.map((idea) => {
              const brainstorm = normBrainstorm(idea.brainstorm)
              const rq = rqOf(brainstorm)
              const application = (active.applications || []).find((item) => item.ideaId === idea.id)
              return (
                <article key={idea.id} className="research-network-node idea-node">
                  <span>{idea.id}</span>
                  <b>{compact(idea.text)}</b>
                  {rq ? <p>RQ · {compact(rq, 80)}</p> : <p>{lang === 'en' ? 'No RQ yet' : '尚未形成 RQ'}</p>}
                  <small>{application ? `${lang === 'en' ? 'Project' : '项目'} · ${application.name}` : idea.level}</small>
                </article>
              )
            })}
            {!ideas.length ? <div className="research-network-empty">{lang === 'en' ? 'No Ideas yet.' : '当前项目还没有 Idea。'}</div> : null}
          </div>
        </div>

        <div className="research-network-links" aria-label={lang === 'en' ? 'Idea-literature relations' : 'Idea—文献关系'}>
          <b>{lang === 'en' ? 'Relations' : '关系'}</b>
          {relations.map(({ ideaId, paper }) => (
            <div key={`${ideaId}:${paper.id}`} className="research-network-link-row">
              <span>{ideaId}</span><i>↔</i><span>{compact(paper.title, 34)}</span>
            </div>
          ))}
          {!relations.length ? (
            <div className="research-network-empty relation-empty">
              {lang === 'en'
                ? 'Link a paper to an Idea to make the first relationship visible.'
                : '把一篇文献连接到 Idea 后，第一条关系会显示在这里。'}
            </div>
          ) : null}
        </div>

        <div className="research-network-column is-literature">
          <div className="research-network-column-head">
            <b>📚 {lang === 'en' ? 'Literature' : '文献'}</b>
            <small>{lang === 'en' ? 'Shared literature assets' : '统一文献资产'}</small>
          </div>
          <div className="research-network-node-list">
            {literature.map((paper) => (
              <article key={paper.id} className="research-network-node literature-node">
                <span>{paper.source}</span>
                <b>{compact(paper.title)}</b>
                <small>
                  {paper.ideaIds.length
                    ? `${lang === 'en' ? 'Linked Ideas' : '已连接 Idea'} · ${paper.ideaIds.length}`
                    : lang === 'en' ? 'Not linked yet' : '尚未连接 Idea'}
                </small>
              </article>
            ))}
            {!literature.length ? <div className="research-network-empty">{lang === 'en' ? 'No saved literature yet.' : '文献库中还没有保存的文献。'}</div> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
