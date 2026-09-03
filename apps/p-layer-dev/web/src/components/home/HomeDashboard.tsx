import { useMemo } from 'react'
import { useI18n, type Translate } from '../../i18n'
import { useProject } from '../../lib/useProject'
import { readIdeas, type Idea } from '../../lib/ideas'
import {
  normBrainstorm,
  FEEDBACK_TYPES,
  STAGES,
  type BrainstormData,
} from '../../lib/brainstormV1'
import {
  AUDIT_STATUSES,
  creatorLine,
  isBound,
  readAudits,
  readZoteroState,
  type AuditRecord,
} from '../../lib/literature'

/**
 * 主页工作区（P-Layer 统一产品文档 v1.0 §5.1 / §6.1）。
 *
 * 纵向层级固定为：
 *   P Logo + 名言（Home.tsx 的 .home-welcome）
 *   → 三主入口：捕捉 Idea / 管理研究资产 / 继续项目
 *   → 用户真实的最近工作：最近 Idea、最近文献工作、最近反馈、最近 PDF
 *
 * 只展示真实内容；无数据时显示清晰空状态，不填充任何示例数据。
 */

export type HomeIdeaRow = {
  idea: Idea
  brain: BrainstormData
  label: string
  activity: string
  filled: number
}

export type HomePdfRow = {
  ideaId: string
  ideaLabel: string
  fileName: string
  version: number
  createdAt: string
}

export type HomeFeedbackRow = {
  ideaId: string
  ideaLabel: string
  types: string[]
  text: string
  pdfVersion: number | null
  createdAt: string
}

export type HomeLitRow = {
  title: string
  line: string
  when: string | null
  status?: AuditRecord['status']
  key: string
}

/** 该 Idea 最后被碰过的时间：10 步正文 / 版本 / 反馈 / PDF / 科学环研究状态，取最大 */
function brainActivity(b: BrainstormData | null, created: string): string {
  let last = created
  const bump = (s?: string | null) => {
    if (s && s > last) last = s
  }
  if (b) {
    Object.values(b.steps ?? {}).forEach((step) => bump(step?.updatedAt))
    ;(b.versions ?? []).forEach((v) => bump(v.savedAt))
    ;(b.feedbacks ?? []).forEach((f) => bump(f.createdAt))
    ;(b.pdfs ?? []).forEach((p) => bump(p.createdAt))
    bump(b.researchState?.updatedAt)
  }
  return last
}

function filledSteps(b: BrainstormData): number {
  return Object.values(b.steps ?? {}).filter((s) => s?.text?.trim()).length
}

function shortText(text: string, max = 64): string {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  return oneLine.length > max ? oneLine.slice(0, max - 1) + '…' : oneLine
}

function relativeTime(iso: string, t: Translate): string {
  const diff = Date.now() - Date.parse(iso)
  if (!Number.isFinite(diff) || diff < 0) return ''
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('homeJustNow')
  if (mins < 60) return t('homeMinsAgo', { n: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('homeHoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  if (days < 7) return t('homeDaysAgo', { n: days })
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const BRAIN_STATUS_COLOR: Record<string, string> = {
  未开始: '#7a8282',
  探索中: '#2457e6',
  已重检: '#189664',
}

const AUDIT_STATUS_COLOR: Record<string, string> = {
  open: '#d97706',
  checked: '#2457e6',
  resolved: '#189664',
}

export function HomeDashboard({
  onGo,
  onOpenIdea,
}: {
  onGo: (route: string) => void
  onOpenIdea: (ideaId: string) => void
}) {
  const { lang, t } = useI18n()
  const { active } = useProject()

  const ideas = useMemo(() => (active ? readIdeas(active) : []), [active])

  const ideaRows = useMemo<HomeIdeaRow[]>(() => {
    return ideas
      .map((idea) => {
        const brain = normBrainstorm(idea.brainstorm)
        return {
          idea,
          brain,
          label: shortText(brain.name || idea.text, 60) || '(untitled)',
          activity: brainActivity(brain, idea.created),
          filled: filledSteps(brain),
        }
      })
      .sort((a, b) => String(b.activity).localeCompare(String(a.activity)))
      .slice(0, 5)
  }, [ideas])

  const pdfRows = useMemo<HomePdfRow[]>(() => {
    const all: HomePdfRow[] = []
    ideas.forEach((idea) => {
      const brain = normBrainstorm(idea.brainstorm)
      const label = shortText(brain.name || idea.text, 40)
      ;(brain.pdfs ?? []).forEach((pdf) =>
        all.push({
          ideaId: idea.id,
          ideaLabel: label,
          fileName: pdf.fileName || `Idea 简报 V${pdf.version}.pdf`,
          version: pdf.version,
          createdAt: pdf.createdAt,
        }),
      )
    })
    return all.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 3)
  }, [ideas])

  const feedbackRows = useMemo<HomeFeedbackRow[]>(() => {
    const all: HomeFeedbackRow[] = []
    ideas.forEach((idea) => {
      const brain = normBrainstorm(idea.brainstorm)
      const label = shortText(brain.name || idea.text, 40)
      ;(brain.feedbacks ?? []).forEach((fb) =>
        all.push({
          ideaId: idea.id,
          ideaLabel: label,
          types: Array.isArray(fb.types) ? fb.types : [],
          text: shortText(fb.text, 72),
          pdfVersion: fb.pdfVersion ?? null,
          createdAt: fb.createdAt,
        }),
      )
    })
    return all.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 3)
  }, [ideas])

  const lit = useMemo(() => {
    const audits = active ? readAudits(active) : []
    const zotero = active ? readZoteroState(active) : null
    const bound = zotero ? isBound(zotero) : false
    const openCount = audits.filter((a) => a.status === 'open').length

    let rows: HomeLitRow[] = audits
      .slice()
      .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
      .slice(0, 4)
      .map((a) => ({
        key: a.id,
        title: shortText(a.title, 56) || '(untitled)',
        line: creatorLine(a) || a.date || '',
        when: a.updatedAt || a.createdAt,
        status: a.status,
      }))

    // 只有 Zotero 收藏（未做审计）时，退回展示收藏条目
    if (!rows.length && bound && zotero && Array.isArray(zotero.pinned)) {
      rows = zotero.pinned.slice(0, 4).map((item) => ({
        key: item.key,
        title: shortText(item.title || '', 56) || '(untitled)',
        line: creatorLine(item) || item.date || '',
        when: null,
      }))
    }
    return { rows, bound, openCount }
  }, [active])

  const feedbackTypeLabel = (key: string): string => {
    const pair = FEEDBACK_TYPES.find(([k]) => k === key)
    if (!pair) return key
    return lang === 'en' ? pair[1].en : pair[1].zh
  }

  const auditStatusLabel = (status?: AuditRecord['status']): string => {
    if (!status) return ''
    const meta = AUDIT_STATUSES.find((s) => s.key === status)
    if (!meta) return status
    return lang === 'en' ? meta.en : meta.zh
  }

  return (
    <div className="homev2">
      {/* ===== 三主入口：捕捉 Idea / 管理研究资产 / 继续项目 ===== */}
      <section className="homev2-entries" aria-label={lang === 'en' ? 'Start here' : '从这里开始'}>
        <button type="button" className="homev2-entry" onClick={() => onGo('inspire')}>
          <span className="homev2-entry-ic" aria-hidden="true">🧠</span>
          <span className="homev2-entry-body">
            <b>{lang === 'en' ? 'Capture an Idea' : '捕捉 Idea'}</b>
            <small>
              {lang === 'en'
                ? 'Turn an observation, doubt or concept into the start of a study.'
                : '把观察、疑问或概念，变成研究的起点。'}
            </small>
          </span>
        </button>
        <button type="button" className="homev2-entry" onClick={() => onGo('inspire')}>
          <span className="homev2-entry-ic" aria-hidden="true">🗂️</span>
          <span className="homev2-entry-body">
            <b>{lang === 'en' ? 'Manage research assets' : '管理研究资产'}</b>
            <small>
              {lang === 'en'
                ? 'Return to existing ideas, theory and literature.'
                : '回到已有 Idea、理论与文献，继续发展。'}
            </small>
          </span>
        </button>
        <button type="button" className="homev2-entry" onClick={() => onGo('projects')}>
          <span className="homev2-entry-ic" aria-hidden="true">📁</span>
          <span className="homev2-entry-body">
            <b>{lang === 'en' ? 'Continue a project' : '继续项目'}</b>
            <small>
              {lang === 'en'
                ? 'Open your formal research projects.'
                : '进入正在进行的正式研究项目。'}
            </small>
          </span>
        </button>
      </section>

      {/* ===== 真实最近工作 ===== */}
      <section className="homev2-recent-head">
        <h2>{t('homeRecentTitle')}</h2>
        <p>{t('homeRecentSub')}</p>
      </section>

      <section className="homev2-recent">
        {/* 最近 Idea（主列） */}
        <div className="homev2-card homev2-card-ideas">
          <div className="homev2-card-head">
            <h3>{t('homeRecentIdeas')}</h3>
            {ideaRows.length ? <span className="homev2-pill">{ideaRows.length}</span> : null}
          </div>
          {ideaRows.length ? (
            <ul className="homev2-list">
              {ideaRows.map((row) => {
                const status = row.brain.status || '未开始'
                const color = BRAIN_STATUS_COLOR[status] ?? '#7a8282'
                const total = STAGES.length
                return (
                  <li key={row.idea.id}>
                    <button
                      type="button"
                      className="homev2-row homev2-idea-row"
                      onClick={() => onOpenIdea(row.idea.id)}
                    >
                      <span className="homev2-row-dot" style={{ background: color }} />
                      <span className="homev2-row-main">
                        <b>{row.label}</b>
                        <small>
                          <em className="homev2-chip" style={{ color, background: color + '1a' }}>{status}</em>
                          <span className="homev2-steps">{t('homeStepsCount', { filled: row.filled, total })}</span>
                          <span className="homev2-when">{relativeTime(row.activity, t)}</span>
                        </small>
                      </span>
                      <span className="homev2-go">{lang === 'en' ? 'Continue' : '继续'} →</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="homev2-empty">
              <p>{t('homeRecentIdeasEmpty')}</p>
              <button type="button" className="btn primary small" onClick={() => onGo('inspire')}>
                {t('homeCaptureCta')}
              </button>
            </div>
          )}
        </div>

        {/* 侧列：文献 / 反馈 / PDF */}
        <div className="homev2-side">
          {/* 最近文献工作 */}
          <div className="homev2-card">
            <div className="homev2-card-head">
              <h3>{t('homeRecentLit')}</h3>
              {lit.openCount ? (
                <span className="homev2-pill warn">{t('homeLitOpen', { n: lit.openCount })}</span>
              ) : lit.rows.length ? (
                <span className="homev2-pill">{lit.rows.length}</span>
              ) : null}
            </div>
            {lit.rows.length ? (
              <ul className="homev2-list">
                {lit.rows.map((row) => (
                  <li key={row.key}>
                    <button type="button" className="homev2-row" onClick={() => onGo('literature')}>
                      <span
                        className="homev2-row-dot"
                        style={{
                          background: row.status ? (AUDIT_STATUS_COLOR[row.status] ?? '#7a8282') : '#7a8282',
                        }}
                      />
                      <span className="homev2-row-main">
                        <b>{row.title}</b>
                        <small>
                          {row.line ? <span className="homev2-lit-line">{row.line}</span> : null}
                          {row.status ? (
                            <em
                              className="homev2-chip"
                              style={{
                                color: AUDIT_STATUS_COLOR[row.status],
                                background: (AUDIT_STATUS_COLOR[row.status] ?? '#7a8282') + '1a',
                              }}
                            >
                              {auditStatusLabel(row.status)}
                            </em>
                          ) : null}
                          {row.when ? <span className="homev2-when">{relativeTime(row.when, t)}</span> : null}
                        </small>
                      </span>
                      <span className="homev2-go">→</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="homev2-empty">
                <p>{t('homeRecentLitEmpty')}</p>
                {!lit.bound ? (
                  <button type="button" className="btn small" onClick={() => onGo('settings')}>
                    {t('homeRecentLitConnect')}
                  </button>
                ) : (
                  <button type="button" className="btn small" onClick={() => onGo('literature')}>
                    {t('homeLitOpenCta')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 最近反馈 */}
          <div className="homev2-card">
            <div className="homev2-card-head">
              <h3>{t('homeRecentFb')}</h3>
              {feedbackRows.length ? <span className="homev2-pill">{feedbackRows.length}</span> : null}
            </div>
            {feedbackRows.length ? (
              <ul className="homev2-list">
                {feedbackRows.map((row, i) => (
                  <li key={row.createdAt + i}>
                    <button
                      type="button"
                      className="homev2-row homev2-fb-row"
                      onClick={() => onOpenIdea(row.ideaId)}
                    >
                      <span className="homev2-row-main">
                        <b>
                          {row.types.slice(0, 2).map((typeKey) => (
                            <em key={typeKey} className="homev2-chip fb">{feedbackTypeLabel(typeKey)}</em>
                          ))}
                        </b>
                        <small>
                          <span className="homev2-fb-text">{row.text}</span>
                          <span className="homev2-fb-meta">
                            {row.ideaLabel}
                            {row.pdfVersion != null
                              ? ` · ${lang === 'en' ? 'bound to PDF V' : '绑定 PDF V'}${row.pdfVersion}`
                              : ''}
                            {row.createdAt ? ` · ${relativeTime(row.createdAt, t)}` : ''}
                          </span>
                        </small>
                      </span>
                      <span className="homev2-go">→</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="homev2-empty">
                <p>{t('homeRecentFbEmpty')}</p>
              </div>
            )}
          </div>

          {/* 最近 PDF */}
          <div className="homev2-card">
            <div className="homev2-card-head">
              <h3>{t('homeRecentPdf')}</h3>
              {pdfRows.length ? <span className="homev2-pill">{pdfRows.length}</span> : null}
            </div>
            {pdfRows.length ? (
              <ul className="homev2-list">
                {pdfRows.map((row) => (
                  <li key={row.createdAt + row.fileName}>
                    <button type="button" className="homev2-row" onClick={() => onOpenIdea(row.ideaId)}>
                      <span className="homev2-row-main">
                        <b>
                          <span className="homev2-file">📄 {row.fileName}</span>
                        </b>
                        <small>
                          <span className="homev2-lit-line">
                            {row.ideaLabel} · {lang === 'en' ? 'V' : '版本 '}
                            {row.version}
                          </span>
                          <span className="homev2-when">{relativeTime(row.createdAt, t)}</span>
                        </small>
                      </span>
                      <span className="homev2-go">→</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="homev2-empty">
                <p>{t('homeRecentPdfEmpty')}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
