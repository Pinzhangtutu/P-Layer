import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { normBrainstorm, rqOf } from '../lib/brainstormV1'
import {
  literatureRelationMeta,
  linkOriginMeta,
  maturityOf,
  readIdeas,
  type LinkOrigin,
  type LiteratureRelationKey,
} from '../lib/ideas'
import { boardTaskCounts } from '../lib/actions'
import { readAudits, readLiteratureRadar, readZoteroState } from '../lib/literature'
import { useProject } from '../lib/useProject'
import { MaturityBadge } from './brainstorm/MaturityBadge'

type LiteratureNode = {
  id: string
  title: string
  source: string
  ideaIds: string[]
}

/** 一条关系（§9.3：带类型 / 来源 / why） */
type RelationRow = {
  key: string
  ideaId: string
  paperId: string
  paperTitle: string
  relation?: LiteratureRelationKey
  origin?: LinkOrigin
  why?: string
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

  /** Idea id → 看板关联行动数（§5.4 行动只挂上下文，不进网络中心） */
  const taskCounts = useMemo(() => boardTaskCounts(active), [active, projects])

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

  const relations = useMemo<RelationRow[]>(() => {
    const rows: RelationRow[] = []
    ideas.forEach((idea) => {
      /* 多对多带类型连接（§9.3）优先 */
      ;(idea.literatureLinks ?? []).forEach((link) => {
        rows.push({
          key: `${idea.id}:${link.id}`,
          ideaId: idea.id,
          paperId: `link:${link.id}`,
          paperTitle: link.title,
          relation: link.relation,
          origin: link.origin,
          why: link.why,
        })
      })
      /* 旧版单条 literatureSource 兜底：无 literatureLinks 时按「启发（用户确认）」展示 */
      if (!(idea.literatureLinks && idea.literatureLinks.length) && idea.literatureSource?.title) {
        rows.push({
          key: `${idea.id}:legacy-source`,
          ideaId: idea.id,
          paperId: `idea-source:${idea.id}`,
          paperTitle: idea.literatureSource.title,
          relation: 'inspire',
          origin: 'user',
        })
      }
    })
    /* 未带类型的雷达/审计级联（linkedIdeaIds） */
    literature.forEach((paper) =>
      paper.ideaIds.forEach((ideaId) => {
        if (rows.some((r) => r.ideaId === ideaId && r.paperTitle === paper.title)) return
        rows.push({ key: `${ideaId}:${paper.id}`, ideaId, paperId: paper.id, paperTitle: paper.title })
      }),
    )
    return rows
  }, [ideas, literature])

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
              const actN = taskCounts.get(idea.id) || 0
              const promoted = idea.status === 'promoted'
              return (
                <article key={idea.id} className="research-network-node idea-node">
                  <span>{idea.id}</span>
                  <b>{compact(idea.text)}</b>
                  {rq ? <p>RQ · {compact(rq, 80)}</p> : <p>{lang === 'en' ? 'No RQ yet' : '尚未形成 RQ'}</p>}
                  <small>
                    {promoted ? (
                      <span className="rn-chip is-proj">{lang === 'en' ? '✓ In project' : '✓ 已转项目'}</span>
                    ) : null}
                    {actN ? (
                      <span className="rn-chip">
                        🛠 {actN} {lang === 'en' ? (actN > 1 ? 'actions' : 'action') : '个行动'}
                      </span>
                    ) : null}
                    <MaturityBadge view={maturityOf(idea)} />
                  </small>
                </article>
              )
            })}
            {!ideas.length ? <div className="research-network-empty">{lang === 'en' ? 'No Ideas yet.' : '当前项目还没有 Idea。'}</div> : null}
          </div>
        </div>

        <div className="research-network-links" aria-label={lang === 'en' ? 'Idea-literature relations' : 'Idea—文献关系'}>
          <b>{lang === 'en' ? 'Relations' : '关系'}</b>
          {relations.map((row) => {
            const rel = row.relation ? literatureRelationMeta(row.relation) : null
            const origin = row.origin ? linkOriginMeta(row.origin) : null
            return (
              <div key={row.key} className="research-network-link-row">
                <span>{row.ideaId}</span>
                <i>↔</i>
                <span className="rn-link-paper">
                  {compact(row.paperTitle, 26)}
                  {rel ? (
                    <em className="rn-link-rel" title={lang === 'en' ? rel.en : rel.zh}>
                      {lang === 'en' ? rel.en : rel.zh}
                    </em>
                  ) : null}
                  {origin && origin.key !== 'user' ? (
                    <em className="rn-link-origin">{lang === 'en' ? origin.en : origin.zh}</em>
                  ) : null}
                  {row.why ? <small className="rn-link-why">{compact(row.why, 48)}</small> : null}
                </span>
              </div>
            )
          })}
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
