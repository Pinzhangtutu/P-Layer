import type { ReactNode } from 'react'

/**
 * Pia! 的回答是 Markdown（本地模型很喜欢输出 ### 标题和 - 列表）。
 * 旧版直接 escape 后换行显示，于是 "### 任务解释" 会原样糊在屏幕上。
 * 这里只渲染最常用的几种：标题、无序列表、有序列表、加粗。
 */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(<strong key={`${keyPrefix}-b${m.index}`}>{m[1]}</strong>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export function PiaAnswer({ content }: { content: string }) {
  const blocks: ReactNode[] = []
  let bullets: string[] = []

  const flushBullets = () => {
    if (!bullets.length) return
    const items = [...bullets]
    blocks.push(
      <ul className="bt-md-list" key={`ul-${blocks.length}`}>
        {items.map((item, i) => (
          <li key={i}>{renderInline(item, `ul-${blocks.length}-${i}`)}</li>
        ))}
      </ul>,
    )
    bullets = []
  }

  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (!line) {
      flushBullets()
      continue
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    if (heading) {
      flushBullets()
      blocks.push(
        <p className={`bt-md-h bt-md-h${heading[1].length}`} key={`h-${blocks.length}`}>
          {renderInline(heading[2], `h-${blocks.length}`)}
        </p>,
      )
      continue
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line)
    if (bullet) {
      bullets.push(bullet[1])
      continue
    }

    const numbered = /^(\d+)[.)]\s+(.*)$/.exec(line)
    if (numbered) {
      flushBullets()
      blocks.push(
        <p className="bt-md-num" key={`n-${blocks.length}`}>
          <b>{numbered[1]}.</b> {renderInline(numbered[2], `n-${blocks.length}`)}
        </p>,
      )
      continue
    }

    flushBullets()
    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(line, `p-${blocks.length}`)}</p>)
  }

  flushBullets()
  return <>{blocks}</>
}
