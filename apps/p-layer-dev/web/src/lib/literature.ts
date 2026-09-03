/**
 * 文献管理数据层。
 *
 * 存储位置与旧版 literature-page.js / literature-audit.js / zotero-integration.js
 * 完全一致：当前项目的 notes.zotero 与 notes.literatureAudits。
 */

import { newId, type Project } from './projects'

export type ZoteroCreator = { firstName?: string; lastName?: string; name?: string }

export type ZoteroItem = {
  key: string
  title?: string
  creators?: ZoteroCreator[]
  date?: string
  item_type?: string
  tags?: (string | { tag?: string })[]
  excerpt?: string
  source_url?: string
  doi?: string
  zotero_uri?: string
  local_path?: string
  file_path?: string
  path?: string
}

export type PinnedItem = {
  key: string
  title?: string
  creators?: ZoteroCreator[]
  date?: string
  source_url?: string
  zotero_uri?: string
  tags?: (string | { tag?: string })[]
  excerpt?: string
}

export type ZoteroState = {
  collectionKeys: string[]
  collections: { key?: string; name?: string }[]
  pinned: PinnedItem[]
  itemCount?: number
  lastSync?: string
  [k: string]: unknown
}

export type IssueType = 'theory' | 'design' | 'measurement' | 'statistics' | 'sample' | 'ethics' | 'other'
export type AuditStatus = 'open' | 'checked' | 'resolved'

export type AuditRecord = {
  id: string
  zoteroKey: string
  title: string
  creators?: ZoteroCreator[]
  date?: string
  sourceUrl: string
  zoteroUri: string
  localPath: string
  excerpt: string
  issueType: IssueType
  note: string
  evidence: string
  link: string
  status: AuditStatus
  createdAt: string
  updatedAt: string
}

/** 文献雷达：抓取到的内容先进入收件箱，用户确认后才进入本地文献库。 */
export type RadarStatus = 'inbox' | 'saved' | 'ignored'

export type RadarItem = {
  id: string
  feedId: string
  journal: string
  stage: string
  title: string
  authors: string[]
  abstract: string
  doi: string
  url: string
  publishedAt: string
  sourceUrl: string
  fetchedAt: string
  status: RadarStatus
  notes: string
  linkedIdeaIds: string[]
}

export type LiteratureRadarState = {
  feeds: { id: string; journal: string; stage: string; url: string; enabled: boolean }[]
  items: RadarItem[]
  lastSyncedAt?: string
  lastError?: string
}

export const RADAR_FEEDS: LiteratureRadarState['feeds'] = [
  { id: 'jcr', journal: 'Journal of Consumer Research', stage: 'Advance / Accepted', url: 'https://qinhuanyu.github.io/marketing-journal-rss/jcr.xml', enabled: true },
  { id: 'jams', journal: 'Journal of the Academy of Marketing Science', stage: 'Online First', url: 'https://qinhuanyu.github.io/marketing-journal-rss/jams.xml', enabled: true },
  { id: 'jm', journal: 'Journal of Marketing', stage: 'OnlineFirst / Express', url: 'https://qinhuanyu.github.io/marketing-journal-rss/jm.xml', enabled: true },
  { id: 'jmr', journal: 'Journal of Marketing Research', stage: 'OnlineFirst / Express', url: 'https://qinhuanyu.github.io/marketing-journal-rss/jmr.xml', enabled: true },
  { id: 'jcp', journal: 'Journal of Consumer Psychology', stage: 'Early View', url: 'https://qinhuanyu.github.io/marketing-journal-rss/jcp.xml', enabled: true },
  { id: 'ijrm', journal: 'International Journal of Research in Marketing', stage: 'Articles in Press / Online First', url: 'https://qinhuanyu.github.io/marketing-journal-rss/ijrm.xml', enabled: true },
  { id: 'jr', journal: 'Journal of Retailing', stage: 'Articles in Press / Online First', url: 'https://qinhuanyu.github.io/marketing-journal-rss/jr.xml', enabled: true },
  { id: 'jsr', journal: 'Journal of Service Research', stage: 'OnlineFirst', url: 'https://qinhuanyu.github.io/marketing-journal-rss/jsr.xml', enabled: true },
  { id: 'ms', journal: 'Marketing Science', stage: 'Articles in Advance', url: 'https://qinhuanyu.github.io/marketing-journal-rss/ms.xml', enabled: true },
]

const ZOTERO_KEY = 'zotero'
const AUDIT_KEY = 'literatureAudits'
const RADAR_KEY = 'literatureRadar'

function notesOf(project: Project): Record<string, unknown> {
  return (project.notes ?? {}) as Record<string, unknown>
}

function ensureNotes(project: Project): Record<string, unknown> {
  if (!project.notes) project.notes = {}
  return project.notes as Record<string, unknown>
}

// ---------- Zotero 绑定状态 ----------

export function readZoteroState(project: Project): ZoteroState {
  const raw = notesOf(project)[ZOTERO_KEY]
  const s = (raw && typeof raw === 'object' ? raw : {}) as Partial<ZoteroState>
  return {
    ...s,
    collectionKeys: Array.isArray(s.collectionKeys) ? s.collectionKeys : [],
    collections: Array.isArray(s.collections) ? s.collections : [],
    pinned: Array.isArray(s.pinned) ? [...s.pinned] : [],
  }
}

export function writeZoteroState(project: Project, state: ZoteroState): void {
  ensureNotes(project)[ZOTERO_KEY] = state
}

export function isBound(state: ZoteroState): boolean {
  return state.collectionKeys.length > 0
}

export function pinItem(state: ZoteroState, item: ZoteroItem): ZoteroState {
  if (state.pinned.some((row) => row.key === item.key)) return state
  const pinned: PinnedItem[] = [
    {
      key: item.key,
      title: item.title,
      creators: item.creators,
      date: item.date,
      source_url: item.source_url,
      zotero_uri: item.zotero_uri,
      tags: item.tags,
      excerpt: item.excerpt,
    },
    ...state.pinned,
  ].slice(0, 30)
  return { ...state, pinned }
}

export function unpinItem(state: ZoteroState, key: string): ZoteroState {
  return { ...state, pinned: state.pinned.filter((row) => row.key !== key) }
}

// ---------- 文献审计记录 ----------

export function readAudits(project: Project): AuditRecord[] {
  const raw = notesOf(project)[AUDIT_KEY]
  if (!Array.isArray(raw)) return []
  return raw.filter((r): r is AuditRecord => !!r && typeof r === 'object')
}

export function writeAudits(project: Project, records: AuditRecord[]): void {
  ensureNotes(project)[AUDIT_KEY] = records
}

export function readLiteratureRadar(project: Project): LiteratureRadarState {
  const raw = notesOf(project)[RADAR_KEY]
  const value = (raw && typeof raw === 'object' ? raw : {}) as Partial<LiteratureRadarState>
  return {
    feeds: Array.isArray(value.feeds) && value.feeds.length ? value.feeds : RADAR_FEEDS,
    items: Array.isArray(value.items) ? value.items.filter((item): item is RadarItem => !!item && typeof item === 'object') : [],
    lastSyncedAt: typeof value.lastSyncedAt === 'string' ? value.lastSyncedAt : undefined,
    lastError: typeof value.lastError === 'string' ? value.lastError : undefined,
  }
}

export function writeLiteratureRadar(project: Project, state: LiteratureRadarState): void {
  ensureNotes(project)[RADAR_KEY] = state
}

export function radarItemId(feedId: string, doi: string, guid: string, title: string): string {
  const raw = (doi || guid || title || `${feedId}-${Date.now()}`).toLowerCase().trim()
  return `${feedId}:${raw.replace(/[^a-z0-9]+/g, '-').slice(0, 100)}`
}

function xmlText(node: Element | null): string {
  return node?.textContent?.replace(/\\s+/g, ' ').trim() ?? ''
}

function cleanAbstract(value: string): string {
  const holder = document.createElement('div')
  holder.innerHTML = value
  return (holder.textContent || holder.innerText || '').replace(/\s+/g, ' ').trim()
}

function firstByLocalName(item: Element, name: string): Element | null {
  return Array.from(item.children).find((child) => child.localName === name || child.tagName === name) ?? null
}

export function parseRadarFeed(xml: string, feed: LiteratureRadarState['feeds'][number], fetchedAt = new Date().toISOString()): RadarItem[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error(`无法解析 ${feed.journal} 的 RSS`)
  return Array.from(doc.querySelectorAll('item')).map((item) => {
    const link = xmlText(firstByLocalName(item, 'link'))
    const guid = xmlText(firstByLocalName(item, 'guid'))
    const doi = (guid.match(/10\.\d{4,9}\/[-._;()/:a-z0-9]+/i)?.[0] || link.match(/10\.\d{4,9}\/[-._;()/:a-z0-9]+/i)?.[0] || '').replace(/[).,;]+$/, '')
    const authorNodes = Array.from(item.children).filter((child) => child.localName === 'creator' || child.tagName === 'author')
    const authors = authorNodes.map((node) => xmlText(node)).filter(Boolean)
    const title = xmlText(firstByLocalName(item, 'title'))
    return {
      id: radarItemId(feed.id, doi, guid, title),
      feedId: feed.id,
      journal: feed.journal,
      stage: xmlText(firstByLocalName(item, 'category')) || feed.stage,
      title,
      authors,
      abstract: cleanAbstract(xmlText(firstByLocalName(item, 'description'))),
      doi,
      url: link || (doi ? `https://doi.org/${doi}` : ''),
      publishedAt: xmlText(firstByLocalName(item, 'pubDate')),
      sourceUrl: feed.url,
      fetchedAt,
      status: 'inbox' as const,
      notes: '',
      linkedIdeaIds: [],
    }
  }).filter((item) => item.title)
}

export function newAuditId(): string {
  return 'audit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6)
}

function sourceOf(item: Partial<ZoteroItem> | Partial<AuditRecord>) {
  const raw = item as Record<string, unknown>
  return {
    zoteroKey: String(raw.key ?? raw.zoteroKey ?? ''),
    title: String(raw.title ?? ''),
    sourceUrl: String(raw.source_url ?? raw.sourceUrl ?? ''),
    zoteroUri: String(raw.zotero_uri ?? raw.zoteroUri ?? ''),
    localPath: String(raw.local_path ?? raw.file_path ?? raw.path ?? raw.localPath ?? ''),
    excerpt: String(raw.excerpt ?? ''),
  }
}

export function auditFromItem(item: ZoteroItem): AuditRecord {
  const src = sourceOf(item)
  const now = new Date().toISOString()
  return {
    id: newAuditId(),
    ...src,
    creators: item.creators ?? [],
    date: item.date ?? '',
    issueType: 'theory',
    note: '',
    evidence: '',
    link: '',
    status: 'open',
    createdAt: now,
    updatedAt: now,
  }
}

// ---------- 展示辅助 ----------

export function creatorLine(item: { creators?: ZoteroCreator[] }): string {
  const creators = item.creators ?? []
  if (!creators.length) return ''
  const names = creators
    .slice(0, 3)
    .map((c) => {
      if (c.name) return c.name
      return [c.firstName, c.lastName].filter(Boolean).join(' ')
    })
    .filter(Boolean)
  return names.join(', ') + (creators.length > 3 ? ' et al.' : '')
}

export function tagLabels(tags?: (string | { tag?: string })[]): string[] {
  if (!tags) return []
  return tags
    .map((tag) => (typeof tag === 'string' ? tag : tag?.tag ?? ''))
    .filter(Boolean)
    .slice(0, 6)
}

export function itemUrl(item: { source_url?: string; doi?: string }): string {
  return item.source_url || (item.doi ? 'https://doi.org/' + item.doi : '')
}

/** 检索 Zotero 本地库。端点与旧版 PLayerZotero.search 一致。 */
export async function searchZotero(query: string, collectionKeys: string[]): Promise<ZoteroItem[]> {
  const res = await fetch('/api/zotero/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, collection_keys: collectionKeys, limit: 8 }),
  })
  const data = (await res.json().catch(() => ({}))) as { results?: ZoteroItem[]; error?: string }
  if (!res.ok) throw new Error(data.error || 'Zotero search failed')
  return data.results ?? []
}

export const ISSUE_TYPES: { key: IssueType; zh: string; en: string }[] = [
  { key: 'theory', zh: '理论 / 逻辑', en: 'Theory / logic' },
  { key: 'design', zh: '方法 / 设计', en: 'Method / design' },
  { key: 'measurement', zh: '测量', en: 'Measurement' },
  { key: 'statistics', zh: '统计 / 分析', en: 'Statistics / analysis' },
  { key: 'sample', zh: '样本 / 外推', en: 'Sample / generalization' },
  { key: 'ethics', zh: '伦理 / 透明性', en: 'Ethics / transparency' },
  { key: 'other', zh: '其他', en: 'Other' },
]

export const AUDIT_STATUSES: { key: AuditStatus; zh: string; en: string }[] = [
  { key: 'open', zh: '待核对', en: 'To check' },
  { key: 'checked', zh: '已核对', en: 'Checked' },
  { key: 'resolved', zh: '已处理', en: 'Resolved' },
]

export const PREREG_TEMPLATE = `研究问题：
主要假设：
主要因变量与操作化定义：
样本量与 power 依据：
排除规则：
主要分析：
探索性分析：`

export const ETHICS_TEMPLATE = `研究目的：
参与时长：
潜在风险或不适：
自愿参加与退出：
数据保密与保存：
报酬：
联系方式：`

export { newId }
