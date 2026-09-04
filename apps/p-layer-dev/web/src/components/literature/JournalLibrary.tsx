import { useMemo, useState } from 'react'
import { useI18n } from '../../i18n'
import { useProject } from '../../lib/useProject'
import {
  SUBFIELDS,
  journalHasRss,
  type Journal,
  type JournalTier,
  type Subfield,
} from '../../lib/journals'
import {
  parseRadarFeed,
  readLiteratureRadar,
  writeLiteratureRadar,
  type LiteratureRadarState,
} from '../../lib/literature'

/**
 * 跨学科期刊库（用户 09-04 10:1x）
 * 10 个社科子领域，顶级 + 次顶级刊物清单；用户勾选 → 扫描（复用 parseRadarFeed）
 * → 写入 project.notes.literatureRadar.feeds → 在「文献雷达」区显示。
 */
const STORAGE_KEY = 'pLayerJournalSelection'

function readSelection(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as unknown
    if (Array.isArray(raw)) return new Set(raw.filter((v): v is string => typeof v === 'string'))
  } catch {}
  // 默认勾上所有有 RSS 源的刊物（营销 9 个）
  const defaults = new Set<string>()
  for (const s of SUBFIELDS) {
    for (const j of [...s.tier1, ...s.tier2]) {
      if (journalHasRss(j)) defaults.add(j.abbr)
    }
  }
  return defaults
}

function writeSelection(set: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export function JournalLibrary() {
  const { lang } = useI18n()
  const { active, mutate } = useProject()
  const [open, setOpen] = useState<Set<string>>(new Set([SUBFIELDS[0].key, SUBFIELDS[1].key]))
  const [selected, setSelected] = useState<Set<string>>(() => readSelection())
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [scanError, setScanError] = useState('')

  const flatSelected = useMemo(() => {
    const out: { journal: Journal; subfield: Subfield; tier: JournalTier }[] = []
    for (const s of SUBFIELDS) {
      for (const t of ['tier1', 'tier2'] as const) {
        for (const j of s[t]) {
          if (selected.has(j.abbr)) out.push({ journal: j, subfield: s, tier: t })
        }
      }
    }
    return out
  }, [selected])

  function toggleSubfield(key: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleJournal(abbr: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(abbr)) next.delete(abbr)
      else next.add(abbr)
      writeSelection(next)
      return next
    })
  }

  function selectTier(sub: Subfield, tier: JournalTier, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const j of sub[tier]) {
        if (on) next.add(j.abbr)
        else next.delete(j.abbr)
      }
      writeSelection(next)
      return next
    })
  }

  async function runScan() {
    if (!active || scanning) return
    const targets = flatSelected
      .map((row) => row.journal)
      .filter((j) => journalHasRss(j))
    if (targets.length === 0) {
      setScanError(lang === 'en' ? 'No selected journal has an RSS feed yet. Pick ones marked ✓' : '当前没有可选 RSS 源的刊物；选带 ✓ 的即可。')
      return
    }
    setScanning(true)
    setScanError('')
    setProgress({ done: 0, total: targets.length })

    const current = readLiteratureRadar(active)
    const now = new Date().toISOString()
    const newFeeds = targets.map((j) => ({ id: j.abbr, journal: j.name, stage: j.stage, url: j.rssUrl, enabled: true }))
    const mergedFeeds = mergeFeeds(current.feeds, newFeeds)
    const allItems: LiteratureRadarState['items'] = [...current.items]

    for (let i = 0; i < targets.length; i++) {
      const j = targets[i]
      try {
        const res = await fetch(j.rssUrl, { mode: 'cors' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const xml = await res.text()
        const newItems = parseRadarFeed(xml, { id: j.abbr, journal: j.name, stage: j.stage, url: j.rssUrl, enabled: true }, now)
        // merge by id, dedupe
        for (const it of newItems) {
          if (!allItems.some((x) => x.id === it.id)) allItems.unshift(it)
        }
      } catch (err) {
        setScanError(`RSS 抓取失败：${j.abbr} (${err instanceof Error ? err.message : String(err)})`)
      }
      setProgress({ done: i + 1, total: targets.length })
    }

    // cap to 200 items
    const capped = allItems.slice(0, 200)
    mutate((p) => {
      writeLiteratureRadar(p, { feeds: mergedFeeds, items: capped, lastSyncedAt: now })
    })
    setScanning(false)
  }

  const withRss = flatSelected.filter((r) => journalHasRss(r.journal)).length
  const total = flatSelected.length

  return (
    <section className="card journal-library">
      <div className="head">
        <div>
          <h2>📚 {lang === 'en' ? 'Journal Library' : '期刊库'}</h2>
          <h3>
            {lang === 'en'
              ? '10 social-science subfields · tier-1 (top) & tier-2 (next). Pick the journals to scan into your radar.'
              : '10 个社科子领域 · 顶级（tier-1）与次顶级（tier-2）刊物。勾选后扫描，进入「文献雷达」收件箱。'}
          </h3>
        </div>
        <div className="journal-library-actions">
          <span className="journal-library-count">
            {lang === 'en' ? 'Selected' : '已选'}: {total}（{lang === 'en' ? 'with RSS' : '含 RSS'} {withRss}）
          </span>
          <button
            type="button"
            className="btn primary"
            onClick={runScan}
            disabled={scanning || total === 0}
            title={lang === 'en' ? 'Fetch RSS and write to radar inbox' : '抓取 RSS 并写入雷达收件箱'}
          >
            {scanning
              ? `${lang === 'en' ? 'Scanning' : '扫描中'}… ${progress.done}/${progress.total}`
              : `📡 ${lang === 'en' ? 'Scan selected' : '扫描所选'}`}
          </button>
        </div>
      </div>
      {scanError ? <p className="journal-library-err">⚠️ {scanError}</p> : null}

      <div className="journal-subfields">
        {SUBFIELDS.map((s) => {
          const isOpen = open.has(s.key)
          const t1Selected = s.tier1.filter((j) => selected.has(j.abbr)).length
          const t2Selected = s.tier2.filter((j) => selected.has(j.abbr)).length
          return (
            <div key={s.key} className={`journal-subfield${isOpen ? ' is-open' : ''}`}>
              <button type="button" className="journal-subfield-head" onClick={() => toggleSubfield(s.key)}>
                <span className="journal-subfield-name">
                  <b>{lang === 'en' ? s.en : s.zh}</b>
                  <small>· {s.tier1.length + s.tier2.length} {lang === 'en' ? 'journals' : '个刊物'}</small>
                </span>
                <span className="journal-subfield-meta">
                  {t1Selected}/{s.tier1.length} tier1 · {t2Selected}/{s.tier2.length} tier2
                </span>
                <span className="journal-subfield-arrow">{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen ? (
                <div className="journal-subfield-body">
                  <p className="journal-subfield-desc">{lang === 'en' ? s.descEn : s.descZh}</p>
                  <div className="journal-tier">
                    <div className="journal-tier-head">
                      <span className="journal-tier-tag is-t1">Tier 1</span>
                      <small>{lang === 'en' ? 'Top flagship journals' : '旗舰 / 顶级刊物'}</small>
                      <button
                        type="button"
                        className="btn small journal-tier-all"
                        onClick={() => selectTier(s, 'tier1', t1Selected !== s.tier1.length)}
                      >
                        {t1Selected === s.tier1.length ? '−' : '+'} {lang === 'en' ? 'all' : '全部'}
                      </button>
                    </div>
                    <ul>
                      {s.tier1.map((j) => (
                        <JournalRow
                          key={j.abbr}
                          journal={j}
                          checked={selected.has(j.abbr)}
                          onToggle={() => toggleJournal(j.abbr)}
                          lang={lang}
                        />
                      ))}
                    </ul>
                  </div>
                  <div className="journal-tier">
                    <div className="journal-tier-head">
                      <span className="journal-tier-tag is-t2">Tier 2</span>
                      <small>{lang === 'en' ? 'Next-tier / field journals' : '次顶 / 重要刊物'}</small>
                      <button
                        type="button"
                        className="btn small journal-tier-all"
                        onClick={() => selectTier(s, 'tier2', t2Selected !== s.tier2.length)}
                      >
                        {t2Selected === s.tier2.length ? '−' : '+'} {lang === 'en' ? 'all' : '全部'}
                      </button>
                    </div>
                    <ul>
                      {s.tier2.map((j) => (
                        <JournalRow
                          key={j.abbr}
                          journal={j}
                          checked={selected.has(j.abbr)}
                          onToggle={() => toggleJournal(j.abbr)}
                          lang={lang}
                        />
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function JournalRow({
  journal,
  checked,
  onToggle,
  lang,
}: {
  journal: Journal
  checked: boolean
  onToggle: () => void
  lang: 'zh' | 'en'
}) {
  const hasRss = journalHasRss(journal)
  return (
    <li className={`journal-row${checked ? ' is-checked' : ''}`}>
      <label className="journal-row-toggle">
        <input type="checkbox" checked={checked} onChange={onToggle} />
        <span className="journal-row-abbr">{journal.abbr}</span>
        <span className="journal-row-body">
          <b>{journal.name}</b>
          <small>
            {journal.publisher} · {journal.stage}
            {hasRss ? <span className="journal-rss-mark" title="RSS available">✓ RSS</span> : <span className="journal-rss-mark is-na" title="Use Zotero integration">Zotero 同步</span>}
          </small>
        </span>
        <a className="journal-row-web" href={journal.webUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
          ↗
        </a>
      </label>
    </li>
  )
}

function mergeFeeds(
  prev: LiteratureRadarState['feeds'],
  next: LiteratureRadarState['feeds'],
): LiteratureRadarState['feeds'] {
  const map = new Map<string, LiteratureRadarState['feeds'][number]>()
  for (const f of prev) map.set(f.id, f)
  for (const f of next) map.set(f.id, f) // 覆盖同名 feed
  return Array.from(map.values())
}
