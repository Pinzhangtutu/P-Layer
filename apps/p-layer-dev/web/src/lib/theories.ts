/**
 * 理论资产库（P-Layer 统一产品文档 v1.0 §9.2「理论」）。
 *
 * 理论库保存用户已经知道、正在理解或希望重新使用的资产：
 * 概念、理论机制、命题、理论适用边界，以及它如何改变某个 Idea。
 * 存储位置：当前项目的 notes.theories（与 ideasV2 平级，互不影响）。
 *
 * 本模块只提供类型与读写纯函数；持久化由 useProject().mutate 统一落盘。
 */

import type { Project } from './projects'

export type TheoryKind = 'concept' | 'mechanism' | 'proposition' | 'boundary' | 'theory'

export const THEORY_KINDS: { key: TheoryKind; zh: string; en: string }[] = [
  { key: 'concept', zh: '概念', en: 'Concept' },
  { key: 'mechanism', zh: '理论机制', en: 'Mechanism' },
  { key: 'proposition', zh: '命题', en: 'Proposition' },
  { key: 'boundary', zh: '适用边界', en: 'Boundary' },
  { key: 'theory', zh: '整体理论', en: 'Theory' },
]

export type TheoryAsset = {
  id: string
  /** 名称，例如「Dominance vs. Prestige 双路径（Henrich & Gil-White 2001）」 */
  name: string
  kind: TheoryKind
  /** 内容：定义 / 机制说明 / 命题表述 / 边界条件 */
  content: string
  /** 备注：我的理解，或它如何改变某个 Idea（§9.2 最后一栏） */
  notes: string
  /** 关联 Idea（多选） */
  ideaIds: string[]
  /** 支持或质疑该理论的文献（自由文本引用，如「Henrich & Gil-White 2001」） */
  litRefs: string[]
  created: string
  updated: string
}

const THEORIES_KEY = 'theories'

export function newTheoryId(): string {
  return 'th' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

export function seedTheory(): TheoryAsset {
  const now = new Date().toISOString()
  return { id: newTheoryId(), name: '', kind: 'concept', content: '', notes: '', ideaIds: [], litRefs: [], created: now, updated: now }
}

export function normalizeTheory(raw: Record<string, unknown>): TheoryAsset {
  const kindRaw = typeof raw.kind === 'string' ? raw.kind : 'concept'
  return {
    id: typeof raw.id === 'string' ? raw.id : newTheoryId(),
    name: typeof raw.name === 'string' ? raw.name : '',
    kind: THEORY_KINDS.some((k) => k.key === kindRaw) ? (kindRaw as TheoryKind) : 'concept',
    content: typeof raw.content === 'string' ? raw.content : '',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    ideaIds: Array.isArray(raw.ideaIds) ? raw.ideaIds.filter((x): x is string => typeof x === 'string') : [],
    litRefs: Array.isArray(raw.litRefs) ? raw.litRefs.filter((x): x is string => typeof x === 'string') : [],
    created: typeof raw.created === 'string' ? raw.created : new Date().toISOString(),
    updated: typeof raw.updated === 'string' ? raw.updated : new Date().toISOString(),
  }
}

function notesOf(project: Project): Record<string, unknown> {
  return (project.notes ?? {}) as Record<string, unknown>
}

export function readTheories(project: Project): TheoryAsset[] {
  const raw = notesOf(project)[THEORIES_KEY]
  if (Array.isArray(raw)) {
    return raw
      .filter((x): x is Record<string, unknown> => x && typeof x === 'object')
      .map((x) => normalizeTheory(x))
  }
  return []
}

export function writeTheories(project: Project, list: TheoryAsset[]): void {
  if (!project.notes) project.notes = {}
  ;(project.notes as Record<string, unknown>)[THEORIES_KEY] = list
}
