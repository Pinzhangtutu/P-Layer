import { useMemo } from 'react'
import { useI18n } from '../../i18n'
import type { Translate } from '../../i18n'
import { useNav } from '../../nav'
import { useProject } from '../../lib/useProject'
import {
  COLUMNS,
  PRIORITY_OPTIONS,
  type Application,
  type Project,
  daysUntil,
} from '../../lib/projects'
import { FLOW_STAGES, readFlowDone } from '../../lib/flow'
import { readAudits, readZoteroState, type PinnedItem } from '../../lib/literature'

const STATUS_COLORS: Record<string, string> = {
  backlog: '#7a8282',
  planning: '#2563eb',
  progress: '#d97706',
  review: '#7c3aed',
  done: '#16a34a',
}

const STATUS_BG: Record<string, string> = {
  backlog: 'rgba(122, 130, 130, 0.12)',
  planning: 'rgba(37, 99, 235, 0.12)',
  progress: 'rgba(217, 119, 6, 0.12)',
  review: 'rgba(124, 58, 237, 0.12)',
  done: 'rgba(22, 163, 74, 0.12)',
}

function formatDate(date?: string, lang: 'zh' | 'en' = 'zh'): string {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  if (lang === 'zh') {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusLabel(status: string, lang: 'zh' | 'en'): string {
  const col = COLUMNS.find((c) => c.key === status)
  return col ? (lang === 'en' ? col.labelEn : col.labelZh) : status
}

function priorityMeta(priority?: string) {
  const opt = PRIORITY_OPTIONS.find((p) => p.key === priority) ?? PRIORITY_OPTIONS[0]
  return opt
}

function progressFromStatus(status: string): number {
  switch (status) {
    case 'backlog':
      return 0
    case 'planning':
      return 25
    case 'progress':
      return 50
    case 'review':
      return 75
    case 'done':
      return 100
    default:
      return 0
  }
}

function allApplications(projects: Project[]): Application[] {
  return projects.flatMap((p) => Array.isArray(p.applications) ? p.applications : [])
}

function recentApplications(projects: Project[], limit = 5): Application[] {
  const list = allApplications(projects)
  return list
    .filter((a) => a.updatedAt)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, limit)
}

function recentLiterature(active: Project, limit = 5): { title: string; source: string; date?: string }[] {
  const zotero = readZoteroState(active)
  const audits = readAudits(active)
  const pinned: PinnedItem[] = Array.isArray(zotero.pinned) ? zotero.pinned : []
  const fromPinned = pinned.slice(0, limit).map((item) => ({
    title: item.title || 'Untitled',
    source: (item.creators?.[0]?.lastName || item.creators?.[0]?.name) ?
      (item.creators?.[0]?.lastName || item.creators?.[0]?.name || '') : '',
    date: item.date,
  }))
  if (fromPinned.length) return fromPinned
  return audits.slice(0, limit).map((a) => ({
    title: a.title,
    source: a.creators?.[0]?.lastName || a.creators?.[0]?.name || '',
    date: a.date,
  }))
}

function DonutChart({ data }: { data: { label: string; count: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  if (!total) {
    return (
      <div className="home-donut-empty">
        <svg viewBox="0 0 64 64" className="home-donut-svg">
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--line)" strokeWidth="10" />
        </svg>
        <span>0</span>
      </div>
    )
  }

  let acc = 0
  const segments = data.map((d) => {
    const start = acc
    const sweep = (d.count / total) * 360
    acc += sweep
    return { ...d, start, sweep }
  })

  function arc(start: number, sweep: number) {
    const rad = (Math.PI / 180)
    const x1 = 32 + 26 * Math.cos((start - 90) * rad)
    const y1 = 32 + 26 * Math.sin((start - 90) * rad)
    const x2 = 32 + 26 * Math.cos((start + sweep - 90) * rad)
    const y2 = 32 + 26 * Math.sin((start + sweep - 90) * rad)
    const large = sweep > 180 ? 1 : 0
    return `M 32 32 L ${x1} ${y1} A 26 26 0 ${large} 1 ${x2} ${y2} Z`
  }

  return (
    <div className="home-donut">
      <svg viewBox="0 0 64 64" className="home-donut-svg">
        {segments.map((s) => (
          <path key={s.label} d={arc(s.start, s.sweep)} fill={s.color} />
        ))}
        <circle cx="32" cy="32" r="16" fill="var(--card)" />
      </svg>
      <span className="home-donut-total">{total}</span>
    </div>
  )
}

export function HomeDashboard() {
  const { lang, t } = useI18n()
  const { navigate } = useNav()
  const { projects, active } = useProject()

  const apps = useMemo(() => allApplications(projects), [projects])
  const flowDone = useMemo(() => readFlowDone(active), [active])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    COLUMNS.forEach((c) => (counts[c.key] = 0))
    apps.forEach((a) => {
      if (counts[a.status] !== undefined) counts[a.status]++
      else counts.backlog++
    })
    return COLUMNS.map((c) => ({
      key: c.key,
      label: lang === 'en' ? c.labelEn : c.labelZh,
      count: counts[c.key],
      color: STATUS_COLORS[c.key],
    })).filter((d) => d.count > 0)
  }, [apps, lang])

  const priorityApps = useMemo(() => {
    return [...apps]
      .filter((a) => a.deadline)
      .sort((a, b) => {
        const pa = priorityMeta(a.priority).color === '#dc2626' ? 4 : a.priority === 'p75' ? 3 : a.priority === 'p50' ? 2 : 1
        const pb = priorityMeta(b.priority).color === '#dc2626' ? 4 : b.priority === 'p75' ? 3 : b.priority === 'p50' ? 2 : 1
        if (pb !== pa) return pb - pa
        return (daysUntil(a.deadline) ?? Number.POSITIVE_INFINITY) - (daysUntil(b.deadline) ?? Number.POSITIVE_INFINITY)
      })
      .slice(0, 5)
  }, [apps])

  const upcoming = useMemo(() => {
    return [...apps]
      .filter((a) => a.deadline)
      .sort((a, b) => (daysUntil(a.deadline) ?? Number.POSITIVE_INFINITY) - (daysUntil(b.deadline) ?? Number.POSITIVE_INFINITY))
      .slice(0, 5)
  }, [apps])

  const recentApps = useMemo(() => recentApplications(projects, 5), [projects])
  const recentLit = useMemo(() => recentLiterature(active, 5), [active])

  return (
    <section className="home-dashboard">
      {/* 科研项目概览卡片行（去掉"n 个项目"徽章，只留标题） */}
      <div className="home-overview-header">
        <h2>{t('projectOverview')}</h2>
      </div>
      <div className="home-overview-scroll">
        {apps.length === 0 ? (
          <div className="home-overview-empty">{t('noApplications')}</div>
        ) : (
          apps.map((app) => <ProjectCard key={app.id} app={app} lang={lang} t={t} />)
        )}
      </div>

      {/* 下方仪表盘网格 */}
      <div className="home-dashboard-grid">
        <div className="home-dashboard-col">
          <Widget title={t('priorities')}>
            {priorityApps.length === 0 ? (
              <Empty>{t('noMatch')}</Empty>
            ) : (
              <ul className="home-list">
                {priorityApps.map((app) => (
                  <li key={app.id} className="home-list-row">
                    <span className="home-list-dot" style={{ background: STATUS_COLORS[app.status] }} />
                    <span className="home-list-name">{app.name}</span>
                    <span className="home-list-days">{daysText(app.deadline, lang, t)}</span>
                    <span
                      className="home-list-pill"
                      style={{
                        background: priorityMeta(app.priority).color + '1f',
                        color: priorityMeta(app.priority).color,
                      }}
                    >
                      {lang === 'en' ? priorityMeta(app.priority).labelEn : priorityMeta(app.priority).labelZh}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Widget>

          <Widget title={t('statusDistribution')}>
            <div className="home-status-body">
              <DonutChart data={statusCounts} />
              <div className="home-status-legend">
                {statusCounts.length === 0 ? (
                  <span className="home-muted">{t('noMatch')}</span>
                ) : (
                  statusCounts.map((s) => (
                    <div key={s.key} className="home-status-legend-row">
                      <span className="home-status-dot" style={{ background: s.color }} />
                      <span>{s.label}</span>
                      <strong>{s.count}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Widget>
        </div>

        <div className="home-dashboard-col">
          <Widget title={t('taskList')}>
            <ul className="home-checklist">
              {FLOW_STAGES.map((stage, i) => (
                <li key={stage.key} className="home-checklist-row">
                  <span className={flowDone[i] ? 'home-check-circle done' : 'home-check-circle'} />
                  <span className={flowDone[i] ? 'home-check-label done' : 'home-check-label'}>
                    {lang === 'en' ? stage.title.en : stage.title.zh}
                  </span>
                  <span className="home-check-status">
                    {flowDone[i] ? t('done') : t('notStarted')}
                  </span>
                </li>
              ))}
            </ul>
          </Widget>

          <Widget title={t('recentOpened')}>
            {recentApps.length === 0 ? (
              <div className="home-recent-empty">
                <p>{t('noRecentOpened')}</p>
                <button
                  type="button"
                  className="home-recent-button"
                  onClick={() => navigate('board')}
                >
                  {t('openFirstProject')}
                </button>
              </div>
            ) : (
              <ul className="home-list">
                {recentApps.map((app) => (
                  <li key={app.id} className="home-list-row simple">
                    <span className="home-list-name">{app.name}</span>
                    <span className="home-list-meta">{app.owner || '-'}</span>
                  </li>
                ))}
              </ul>
            )}
          </Widget>
        </div>

        <div className="home-dashboard-col">
          <Widget title={t('upcomingDeadlines')}>
            {upcoming.length === 0 ? (
              <Empty>{t('noMatch')}</Empty>
            ) : (
              <ul className="home-list">
                {upcoming.map((app) => (
                  <li key={app.id} className="home-list-row">
                    <span className="home-list-dot" style={{ background: STATUS_COLORS[app.status] }} />
                    <span className="home-list-name">{app.name}</span>
                    <span className="home-list-days">{daysText(app.deadline, lang, t)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Widget>

          <Widget title={t('recentLiterature')}>
            {recentLit.length === 0 ? (
              <Empty>{t('noLiterature')}</Empty>
            ) : (
              <ul className="home-literature-list">
                {recentLit.map((item, i) => (
                  <li key={i} className="home-literature-row">
                    <span className="home-literature-bullet" />
                    <div className="home-literature-info">
                      <span className="home-literature-title">{item.title}</span>
                      <span className="home-literature-source">
                        {item.source}{item.date ? ` · ${item.date}` : ''}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Widget>
        </div>
      </div>
    </section>
  )
}

function ProjectCard({
  app,
  lang,
  t,
}: {
  app: Application
  lang: 'zh' | 'en'
  t: Translate
}) {
  const days = daysUntil(app.deadline)
  const pct = progressFromStatus(app.status)
  const p = priorityMeta(app.priority)

  return (
    <div className="home-overview-card">
      <div className="home-card-header">
        <h3 title={app.name}>{app.name}</h3>
        <span
          className="home-status-pill"
          style={{ background: STATUS_BG[app.status], color: STATUS_COLORS[app.status] }}
        >
          {statusLabel(app.status, lang)}
        </span>
      </div>
      <p className="home-card-desc" title={app.description || ''}>
        {app.description || (lang === 'en' ? 'No description' : '暂无描述')}
      </p>
      <div className="home-card-days">
        {days === null ? '' : days < 0 ? t('daysOverdue', { d: Math.abs(days) }) : t('daysLeft', { d: days })}
      </div>
      <div className="home-card-fields">
        <div>
          <span>{lang === 'en' ? 'Deadline' : '截止日期'}</span>
          <strong>{formatDate(app.deadline, lang)}</strong>
        </div>
        <div>
          <span>{t('supervisor')}</span>
          <strong>{app.owner || '-'}</strong>
        </div>
        <div>
          <span>{lang === 'en' ? 'Region' : '国家 / 地区'}</span>
          <strong>{app.tags?.[0] || '-'}</strong>
        </div>
        <div>
          <span>{t('priorityLabel')}</span>
          <strong style={{ color: p.color }}>
            {lang === 'en' ? p.labelEn : p.labelZh}
          </strong>
        </div>
      </div>
      <div className="home-card-progress">
        <div className="home-card-progress-label">
          <span>{t('progressLabel')}</span>
          <strong>{pct}%</strong>
        </div>
        <div className="home-card-progress-bar">
          <i style={{ width: `${pct}%`, background: STATUS_COLORS[app.status] }} />
        </div>
      </div>
      <div className="home-card-checklist">
        <span>0/0</span>
        <span>{t('todoSuffix', { n: 0 })}</span>
      </div>
    </div>
  )
}

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="home-widget">
      <div className="home-widget-head">
        <h3>{title}</h3>
      </div>
      <div className="home-widget-body">{children}</div>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="home-widget-empty">{children}</div>
}

function daysText(deadline: string | undefined, _lang: 'zh' | 'en', t: Translate) {
  const d = daysUntil(deadline)
  if (d === null) return t('notSet')
  if (d < 0) return t('daysOverdue', { d: Math.abs(d) })
  return t('daysLeft', { d })
}
