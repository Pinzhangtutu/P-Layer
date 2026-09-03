/**
 * 想法数据库（Ideas V2）数据层。
 *
 * 存储位置：当前项目的 notes.ideasV2（旧版 index.html 的 renderBrainstormV2 一致）。
 * 每条 idea 是一行：原始文本 + 来源 + 标签 + 时间 + 地点 + 案例 + 等级 + 自动/手动归类。
 */

import type { Project } from './projects'

export type IdeaOrigin = 'phenomenon' | 'literature' | 'other'

export type LiteratureSource = {
  title?: string
  sourceUrl?: string
  evidence?: string
}

export type Idea = {
  id: string
  text: string
  origin: IdeaOrigin
  literatureSource?: LiteratureSource | null
  category: string
  status: 'idea' | 'promoted'
  created: string
  tags: string[]
  time?: string
  location?: string
  case?: string
  level: string
  /** P-Layer 个人版 v1 · 头脑风暴闭环（10 步训练/版本/反馈/PDF），可选字段，旧记录兼容 */
  brainstorm?: import('./brainstormV1').BrainstormData | null
}

const IDEAS_KEY = 'ideasV2'

/** 与旧版 classifyIdea 同一套规则 */
export function classifyIdea(text: string): string {
  if (/风险|替代|混淆|内生|偏差/.test(text)) return '风险与替代解释'
  if (/实验|问卷|样本|操纵|随机/.test(text)) return '方法与设计'
  if (/量表|测量|指标|编码|变量/.test(text)) return '测量与变量'
  if (/为什么|机制|中介|理论/.test(text)) return '理论机制'
  if (/是否|影响|差异|关系/.test(text)) return '研究问题'
  return '待整理'
}

export const IDEA_LEVELS = ['种子', '探索中', '可检验', '优先推进'] as const
export type IdeaLevel = (typeof IDEA_LEVELS)[number]

export const IDEA_ORIGINS: { key: IdeaOrigin; zh: string; en: string }[] = [
  { key: 'phenomenon', zh: '现象灵感 / Phenomenon', en: 'Phenomenon / 现象灵感' },
  { key: 'literature', zh: '文献灵感 / Literature', en: 'Literature / 文献灵感' },
  { key: 'other', zh: '其他灵感 / Other', en: 'Other / 其他灵感' },
]

export const IDEA_CATEGORIES = [
  '研究问题',
  '理论机制',
  '方法与设计',
  '测量与变量',
  '风险与替代解释',
  '待整理',
] as const

function notesOf(project: Project): Record<string, unknown> {
  return (project.notes ?? {}) as Record<string, unknown>
}

export function readIdeas(project: Project): Idea[] {
  const raw = notesOf(project)[IDEAS_KEY]
  if (Array.isArray(raw)) {
    return raw
      .filter((x): x is Record<string, unknown> => x && typeof x === 'object')
      .map((x) => normalizeIdea(x))
  }
  // 从旧版 notes.ideas（纯字符串数组）迁移
  const legacy = notesOf(project)['ideas']
  if (Array.isArray(legacy)) {
    return legacy
      .filter((x): x is string => typeof x === 'string')
      .map((text, i) =>
        normalizeIdea({
          id: 'old' + i,
          text,
          origin: 'phenomenon',
          category: classifyIdea(text),
          status: 'idea',
          created: new Date().toISOString(),
          tags: [],
          level: '种子',
        }),
      )
  }
  return []
}

export function writeIdeas(project: Project, list: Idea[]): void {
  if (!project.notes) project.notes = {}
  ;(project.notes as Record<string, unknown>)[IDEAS_KEY] = list
}

export function newIdeaId(): string {
  return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

function normalizeIdea(raw: Record<string, unknown>): Idea {
  const id = typeof raw.id === 'string' ? raw.id : newIdeaId()
  const text = typeof raw.text === 'string' ? raw.text : ''
  const originRaw = typeof raw.origin === 'string' ? raw.origin : 'phenomenon'
  const origin: IdeaOrigin = originRaw === 'literature' || originRaw === 'other' ? originRaw : 'phenomenon'
  const statusRaw = typeof raw.status === 'string' ? raw.status : 'idea'
  const status: Idea['status'] = statusRaw === 'promoted' ? 'promoted' : 'idea'
  return {
    id,
    text,
    origin,
    literatureSource: (raw.literatureSource as LiteratureSource | null) ?? null,
    category: typeof raw.category === 'string' ? raw.category : classifyIdea(text),
    status,
    created: typeof raw.created === 'string' ? raw.created : new Date().toISOString(),
    tags: Array.isArray(raw.tags) ? raw.tags.filter((x): x is string => typeof x === 'string') : [],
    time: typeof raw.time === 'string' ? raw.time : '',
    location: typeof raw.location === 'string' ? raw.location : '',
    case: typeof raw.case === 'string' ? raw.case : '',
    level: typeof raw.level === 'string' && raw.level ? raw.level : '种子',
    brainstorm: raw.brainstorm && typeof raw.brainstorm === 'object' ? (raw.brainstorm as Idea['brainstorm']) : null,
  }
}
