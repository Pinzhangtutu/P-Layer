import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { useNav } from '../nav'
import {
  auditFromItem,
  creatorLine,
  isBound,
  itemUrl,
  pinItem,
  readAudits,
  readLiteratureRadar,
  readZoteroState,
  parseRadarFeed,
  writeLiteratureRadar,
  searchZotero,
  tagLabels,
  unpinItem,
  writeAudits,
  writeZoteroState,
  type AuditRecord,
  type ZoteroItem,
  type LiteratureRadarState,
  type RadarItem,
} from '../lib/literature'
import { setBrainstormDraft } from '../lib/handoff'
import { useProject } from '../lib/useProject'
import { AuditForm, AuditList } from '../components/literature/AuditPanel'

export function Literature() {
  const { t, lang } = useI18n()
  const { projects, active, mutate } = useProject()
  const { navigate } = useNav()

  const zotero = useMemo(() => readZoteroState(active), [active, projects])
  const audits = useMemo(() => readAudits(active), [active, projects])
  const bound = isBound(zotero)
  const radar = useMemo(() => readLiteratureRadar(active), [active, projects])

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ZoteroItem[]>([])
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'error' | 'empty'>('idle')
  const [searchError, setSearchError] = useState('')
  const [editing, setEditing] = useState<AuditRecord | null>(null)
  const [toast, setToast] = useState('')
  const [radarState, setRadarState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [radarError, setRadarError] = useState('')
  const [radarFilter, setRadarFilter] = useState('all')

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 1600)
    return () => clearTimeout(timer)
  }, [toast])

  const runSearch = async () => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setSearchState('idle')
      return
    }
    setSearchState('loading')
    setSearchError('')
    try {
      const found = await searchZotero(q, zotero.collectionKeys)
      setResults(found)
      setSearchState(found.length ? 'idle' : 'empty')
    } catch (err) {
      setResults([])
      setSearchError(err instanceof Error ? err.message : String(err))
      setSearchState('error')
    }
  }

  const persistPinned = (fn: (state: typeof zotero) => typeof zotero) => {
    mutate((project) => {
      writeZoteroState(project, fn(readZoteroState(project)))
    })
  }

  const persistAudits = (fn: (list: AuditRecord[]) => void) => {
    mutate((project) => {
      const list = [...readAudits(project)]
      fn(list)
      writeAudits(project, list)
    })
  }

  const persistRadar = (fn: (state: LiteratureRadarState) => void) => {
    mutate((project) => {
      const state = readLiteratureRadar(project)
      fn(state)
      writeLiteratureRadar(project, state)
    })
  }

  const refreshRadar = async () => {
    setRadarState('loading')
    setRadarError('')
    const fetchedAt = new Date().toISOString()
    const current = readLiteratureRadar(active)
    const allItems = [...current.items]
    const errors: string[] = []
    for (const feed of current.feeds.filter((item) => item.enabled)) {
      try {
        const response = await fetch(feed.url)
        if (!response.ok) throw new Error(`${response.status}`)
        const incoming = parseRadarFeed(await response.text(), feed, fetchedAt)
        for (const item of incoming) {
          const index = allItems.findIndex((old) => old.id === item.id)
          if (index >= 0) allItems[index] = { ...item, ...allItems[index], abstract: item.abstract || allItems[index].abstract }
          else allItems.push(item)
        }
      } catch (error) {
        errors.push(feed.journal)
      }
    }
    persistRadar((state) => {
      state.items = allItems.sort((a, b) => String(b.publishedAt || b.fetchedAt).localeCompare(String(a.publishedAt || a.fetchedAt)))
      state.lastSyncedAt = fetchedAt
      state.lastError = errors.length ? `无法访问：${errors.join('、')}` : ''
    })
    if (errors.length && allItems.length === current.items.length) {
      setRadarState('error')
      setRadarError(`RSS 暂时无法访问。可能是网络或浏览器跨域限制；已有收件箱内容仍然保留。`)
    } else setRadarState('idle')
  }

  const updateRadarItem = (id: string, update: Partial<RadarItem>) => {
    persistRadar((state) => {
      const item = state.items.find((row) => row.id === id)
      if (item) Object.assign(item, update)
    })
  }

  const radarItems = radar.items.filter((item) => radarFilter === 'all' || item.feedId === radarFilter)

  // RSS 源本身每 6 小时更新；应用打开时检查一次，随后在保持页面打开期间定时刷新。
  useEffect(() => {
    const last = radar.lastSyncedAt ? Date.parse(radar.lastSyncedAt) : 0
    if (!last || Date.now() - last > 6 * 60 * 60 * 1000) void refreshRadar()
    const timer = window.setInterval(() => void refreshRadar(), 6 * 60 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [active.id])

  const saveAudit = (record: AuditRecord) => {
    persistAudits((list) => {
      const index = list.findIndex((row) => row.id === record.id)
      if (index >= 0) list[index] = record
      else list.unshift(record)
    })
    setEditing(null)
  }

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setToast(t('copied'))
    } catch {
      window.prompt(t('copyThisPath'), value)
    }
  }

  const toBrainstorm = (record: AuditRecord) => {
    setBrainstormDraft({
      text: record.note || record.title || '',
      literatureSource: {
        title: record.title,
        sourceUrl: record.sourceUrl,
        evidence: record.excerpt,
      },
    })
    navigate('brainstorm')
  }

  return (
    <div className="page">
      <div className="page-head literature-page-head">
        <div>
          <h1>{t('literature')}</h1>
          <p>{t('literatureSub')}</p>
        </div>
        <button type="button" className="btn" onClick={() => navigate('projects-network')}>
          {lang === 'en' ? 'View in research network' : '在研究网络中查看'} →
        </button>
      </div>

      <section className="card lit-card radar-card">
        <div className="head">
          <div>
            <h2>📡 文献雷达</h2>
            <h3>追踪营销顶级期刊的新发表内容；先进入收件箱，由你决定是否保存。</h3>
          </div>
          <button type="button" className="btn primary" onClick={refreshRadar} disabled={radarState === 'loading'}>
            {radarState === 'loading' ? '正在扫描…' : '刷新雷达'}
          </button>
        </div>
        <div className="radar-meta">
          <span>{radar.lastSyncedAt ? `上次扫描：${new Date(radar.lastSyncedAt).toLocaleString()}` : '尚未扫描'}</span>
          <a href="https://github.com/qinhuanyu/marketing-journal-rss" target="_blank" rel="noopener">RSS 来源与说明 ↗</a>
        </div>
        <div className="radar-toolbar">
          <select className="input" value={radarFilter} onChange={(event) => setRadarFilter(event.target.value)}>
            <option value="all">全部期刊（{radar.items.length}）</option>
            {radar.feeds.map((feed) => <option key={feed.id} value={feed.id}>{feed.journal}</option>)}
          </select>
          <span className="radar-rule">新文章只进入收件箱；点击保存后才进入你的文献库。</span>
        </div>
        {radarState === 'error' ? <div className="lit-notice"><b>扫描没有完成</b><span>{radarError}</span></div> : null}
        {radarItems.length ? (
          <div className="radar-list">
            {radarItems.map((item) => (
              <article key={item.id} className={`radar-item${item.status === 'saved' ? ' saved' : item.status === 'ignored' ? ' ignored' : ''}`}>
                <div className="radar-item-head">
                  <div><span className="radar-journal">{item.journal} · {item.stage}</span><h4>{item.title}</h4></div>
                  <span className={`radar-status ${item.status}`}>{item.status === 'saved' ? '已保存' : item.status === 'ignored' ? '已忽略' : '待确认'}</span>
                </div>
                <p className="radar-authors">{item.authors.join(', ') || '作者信息未提供'}{item.publishedAt ? ` · ${item.publishedAt}` : ''}</p>
                <details><summary>查看摘要（保留原文）</summary><p className="radar-abstract">{item.abstract || '此条 RSS 未提供摘要。'}</p></details>
                <div className="lit-result-actions">
                  {item.url ? <a className="btn" href={item.url} target="_blank" rel="noopener">打开原文 ↗</a> : null}
                  {item.status !== 'saved' ? <button type="button" className="btn primary" onClick={() => updateRadarItem(item.id, { status: 'saved' })}>保存到文献库</button> : null}
                  {item.status === 'inbox' ? <button type="button" className="btn" onClick={() => updateRadarItem(item.id, { status: 'ignored' })}>忽略</button> : null}
                  {item.status !== 'inbox' ? <button type="button" className="btn" onClick={() => updateRadarItem(item.id, { status: 'inbox' })}>放回收件箱</button> : null}
                </div>
              </article>
            ))}
          </div>
        ) : <div className="lit-empty">点击“刷新雷达”，扫描最新文献。</div>}
      </section>

      <section className="card lit-card">
        <div className="head">
          <div>
            <h2>📚 {t('literature')}</h2>
            <h3>{t('literatureCardNote')}</h3>
          </div>
          <span className="tag">Zotero · Local</span>
        </div>

        {bound ? (
          <>
            <div className="lit-search">
              <input
                className="input"
                value={query}
                placeholder={t('litSearchPlaceholder')}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runSearch()
                }}
              />
              <button className="btn primary" onClick={runSearch} disabled={searchState === 'loading'}>
                {searchState === 'loading' ? t('litSearching') : t('searchLiterature')}
              </button>
            </div>

            <div className="lit-collections">
              {zotero.collections.map((c, i) => (
                <span key={c.key ?? i}>{c.name}</span>
              ))}
            </div>

            <div className="lit-results">
              {searchState === 'loading' ? (
                <div className="lit-empty">{t('litSearching')}</div>
              ) : searchState === 'error' ? (
                <div className="lit-empty">{searchError}</div>
              ) : results.length ? (
                results.map((item) => (
                  <article key={item.key} className="lit-result">
                    <div className="lit-result-top">
                      <div>
                        <h4>{item.title || t('untitledSource')}</h4>
                        <p>{creatorLine(item)}</p>
                      </div>
                      <span className="lit-item-type">{item.item_type || 'item'}</span>
                    </div>

                    {tagLabels(item.tags).length ? (
                      <div className="lit-result-tags">
                        {tagLabels(item.tags).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    ) : null}

                    <p className="lit-excerpt">{item.excerpt || t('noExcerpt')}</p>

                    <div className="lit-result-actions">
                      {itemUrl(item) ? (
                        <a className="btn" href={itemUrl(item)} target="_blank" rel="noopener">
                          {t('openSource')} ↗
                        </a>
                      ) : null}
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setEditing(auditFromItem(item))}
                      >
                        {t('recordConcern')}
                      </button>
                      <button type="button" className="btn" onClick={() => persistPinned((s) => pinItem(s, item))}>
                        {t('addToIdeaRefs')}
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="lit-empty">{t('litStartSearch')}</div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="lit-notice">
              <b>{t('zoteroNotConnected')}</b>
              <span>{t('zoteroNotConnectedNote')}</span>
            </div>
            <div className="toolbar">
              <button className="btn primary" onClick={() => navigate('settings')}>
                {t('openSettings')}
              </button>
            </div>
          </>
        )}
      </section>

      {bound && zotero.pinned.length ? (
        <section className="card lit-card">
          <div className="head">
            <div>
              <h2>{t('ideaReferences')}</h2>
              <h3>{t('ideaReferencesNote')}</h3>
            </div>
            <span className="tag">{zotero.pinned.length}</span>
          </div>
          <div className="lit-pinned">
            {zotero.pinned.map((item) => (
              <div key={item.key} className="lit-pinned-item">
                <div>
                  <b>{item.title}</b>
                  <small>{creatorLine(item)}</small>
                </div>
                <button type="button" className="btn" onClick={() => persistPinned((s) => unpinItem(s, item.key))}>
                  {t('remove')}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card lit-card">
        <div className="head">
          <div>
            <h2>{t('auditRecords')}</h2>
            <h3>{t('auditRecordsNote')}</h3>
          </div>
          <button type="button" className="btn primary" onClick={() => setEditing(auditFromItem({ key: '' }))}>
            ＋ {t('newAudit')}
          </button>
        </div>

        {editing ? (
          <AuditForm record={editing} onSave={saveAudit} onCancel={() => setEditing(null)} />
        ) : null}

        <AuditList
          records={audits}
          onEdit={setEditing}
          onDelete={(id) => {
            if (window.confirm(t('confirmDeleteAudit'))) {
              persistAudits((list) => {
                const index = list.findIndex((row) => row.id === id)
                if (index >= 0) list.splice(index, 1)
              })
            }
          }}
          onToBrainstorm={toBrainstorm}
          onCopy={copyText}
        />
      </section>

      {toast ? <div className="lit-toast">{toast}</div> : null}
    </div>
  )
}
