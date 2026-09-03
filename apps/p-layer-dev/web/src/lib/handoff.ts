/**
 * 页面间一次性传值。
 *
 * 旧版用全局单例（window.PLayerBrainstormDraft）在页面之间传草稿，
 * 谁都能改、谁都能读，出问题很难追。这里改成显式的「投放—取用」：
 * 写进去的那份会被下一次 take 消费掉，不会留在 localStorage 里发霉。
 */

const SEED_KEY = 'pLayerBrainstormSeed'

export type BrainstormSeed = {
  text: string
  literatureSource?: {
    title?: string
    sourceUrl?: string
    evidence?: string
  } | null
}

function safeParse(raw: string): BrainstormSeed | null {
  try {
    const obj = JSON.parse(raw)
    if (obj && typeof obj === 'object' && typeof obj.text === 'string') {
      return {
        text: obj.text,
        literatureSource: obj.literatureSource ?? null,
      }
    }
    // 兼容旧版纯字符串
    if (typeof raw === 'string') return { text: raw, literatureSource: null }
  } catch {
    // 旧版可能直接存了字符串
    if (raw.trim()) return { text: raw, literatureSource: null }
  }
  return null
}

export function setBrainstormSeed(text: string): void {
  localStorage.setItem(SEED_KEY, JSON.stringify({ text, literatureSource: null }))
}

export function setBrainstormDraft(seed: BrainstormSeed): void {
  localStorage.setItem(SEED_KEY, JSON.stringify(seed))
}

/** 取走草稿并清空；没有就返回 null */
export function takeBrainstormSeed(): BrainstormSeed | null {
  const raw = localStorage.getItem(SEED_KEY)
  if (raw === null) return null
  localStorage.removeItem(SEED_KEY)
  return safeParse(raw)
}
