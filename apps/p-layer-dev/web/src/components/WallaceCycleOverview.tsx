/**
 * Wallace 科学环 · 极简田字格 4 象限（用户 09-03：四宫各写一个内容就够）
 *
 * 正方形被中心十字虚线切成 4 宫，每宫一个核心内容：
 *   左上 理论·归纳 —— 从概括上升为理论
 *   右上 理论·演绎 —— 从理论推出假设
 *   右下 经验·演绎 —— 收集数据检验假设
 *   左下 经验·归纳 —— 整理观察做经验概括
 *
 * 四宫是 Wallace 完整科学环的两条正交分割（演绎/归纳 × 理论/经验），
 * 具体节点细节由环内 O/E/T/H 轮播承载，这里只保留认知骨架。
 */
import type { CSSProperties } from 'react'

type Props = {
  className?: string
  style?: CSSProperties
  title?: string
}

type Quad = {
  cx: number
  cy: number
  bigZh: string
  bigEn: string
  subZh: string
  subEn: string
}

const QUADS: Quad[] = [
  {
    cx: 750, cy: 250,
    bigZh: '理论 · 演绎', bigEn: 'Theory · Deduction',
    subZh: '从理论推出假设', subEn: 'Theory to hypothesis',
  },
  {
    cx: 750, cy: 750,
    bigZh: '经验 · 演绎', bigEn: 'Empirical · Deduction',
    subZh: '收集数据检验假设', subEn: 'Collect & test',
  },
  {
    cx: 250, cy: 750,
    bigZh: '经验 · 归纳', bigEn: 'Empirical · Induction',
    subZh: '整理观察做经验概括', subEn: 'Observe to generalize',
  },
  {
    cx: 250, cy: 250,
    bigZh: '理论 · 归纳', bigEn: 'Theory · Induction',
    subZh: '从概括上升为理论', subEn: 'Generalize to theory',
  },
]

export function WallaceCycleOverview({ className, style, title }: Props) {
  const cls = ['wallace-overview', className].filter(Boolean).join(' ')
  return (
    <figure className={cls} style={style} aria-label={title ?? 'Wallace 科学环（极简田字格）'} role="img">
      <svg
        className="wallace-overview-svg"
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* 中心十字虚线 */}
        <g className="wn-crosshair" aria-hidden="true">
          <line x1="500" y1="40" x2="500" y2="960" />
          <line x1="40" y1="500" x2="960" y2="500" />
        </g>

        {/* 四宫内容（每宫一个核心内容） */}
        {QUADS.map((q) => (
          <g key={q.bigZh} className="wn-quad">
            <text className="wn-quad-big" x={q.cx} y={q.cy - 22} textAnchor="middle">
              {q.bigZh}
            </text>
            <text className="wn-quad-big-en" x={q.cx} y={q.cy + 6} textAnchor="middle">
              {q.bigEn}
            </text>
            <text className="wn-quad-sub" x={q.cx} y={q.cy + 44} textAnchor="middle">
              {q.subZh}
            </text>
            <text className="wn-quad-sub-en" x={q.cx} y={q.cy + 62} textAnchor="middle">
              {q.subEn}
            </text>
          </g>
        ))}

        {/* 右下角旁标 */}
        <text x="985" y="985" textAnchor="end" className="wn-caption">
          属于用户
        </text>
      </svg>
    </figure>
  )
}