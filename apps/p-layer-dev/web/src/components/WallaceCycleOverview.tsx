/**
 * Wallace 经典科学环示意图 · 田字格 4 宫格版（教科书语义 · 全直角折线）
 *
 * 正方形画布被中心十字虚线切成 4 个宫格（用户 09-03 拍板"田字格 4 宫格"）：
 *
 *   左上「理论·归纳」  右上「理论·演绎」
 *       经验概括        理论 / 逻辑演绎(红)
 *       逻辑推论(红)    演绎推论
 *       形成概念        假设
 *   ─────────────────────────
 *   左下「经验·归纳」  右下「经验·演绎」
 *       样本小结        假设检验
 *       测量            决定接受/拒绝假设(红)
 *       观察            解释工具·抽样
 *
 * 外圈主循环（黑色实线 · 顺时针）：
 * 形成概念 → 理论 → 逻辑演绎 → 演绎推论 → 假设 → 假设检验 → 决定 →
 * 解释工具·抽样 → 观察 → 测量 → 样本小结 → 经验概括 → 逻辑推论 → 形成概念
 *
 * 方法论框（红色）：逻辑演绎、逻辑推论、决定——强调它们是"推理/判断方法"，
 * 与实际研究节点（黑框白底）区别开。全图只走横/竖直角线，四四方方。
 */
import type { CSSProperties } from 'react'

type Props = {
  className?: string
  style?: CSSProperties
  title?: string
}

/* 宫标签（四角小字） */
const QUADRANTS: { x: number; y: number; anchor: 'start' | 'end'; zh: string; en: string }[] = [
  { x: 512, y: 20, anchor: 'start', zh: '理论·演绎', en: 'Theory · Deduction' },
  { x: 512, y: 516, anchor: 'start', zh: '经验·演绎', en: 'Empirical · Deduction' },
  { x: 60, y: 516, anchor: 'start', zh: '经验·归纳', en: 'Empirical · Induction' },
  { x: 60, y: 20, anchor: 'start', zh: '理论·归纳', en: 'Theory · Induction' },
]

export function WallaceCycleOverview({ className, style, title }: Props) {
  const cls = ['wallace-overview', className].filter(Boolean).join(' ')
  return (
    <figure className={cls} style={style} aria-label={title ?? 'Wallace 科学环（田字格 4 宫格）'} role="img">
      <svg
        className="wallace-overview-svg"
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <marker
            id="wallace-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#17202a" />
          </marker>
        </defs>

        {/* ===== 中心十字虚线（田字格分隔）===== */}
        <g className="wn-crosshair" aria-hidden="true">
          <line x1="500" y1="34" x2="500" y2="966" />
          <line x1="130" y1="500" x2="870" y2="500" />
        </g>

        {/* ===== 四宫标签 ===== */}
        {QUADRANTS.map((q) => (
          <text key={q.zh} x={q.x} y={q.y} textAnchor={q.anchor} className="wn-quad-label">
            {q.zh}
          </text>
        ))}

        {/* ===== 节点 ===== */}
        {/* ---- 右上宫（理论·演绎）x 中心 740 ---- */}
        <g className="wn-node wn-node-rect">
          <rect x="635" y="62" width="210" height="56" rx="2" />
          <text x="740" y="97">理论</text>
        </g>
        <g className="wn-node wn-node-rect wn-node-emphasis">
          <rect x="635" y="172" width="210" height="56" rx="2" />
          <text x="740" y="207">逻辑演绎</text>
        </g>
        <g className="wn-node wn-node-rect">
          <rect x="635" y="282" width="210" height="56" rx="2" />
          <text x="740" y="317">演绎推论</text>
        </g>
        <g className="wn-node wn-node-rect">
          <rect x="635" y="392" width="210" height="56" rx="2" />
          <text x="740" y="427">假设</text>
        </g>

        {/* ---- 右下宫（经验·演绎）x 中心 740 ---- */}
        <g className="wn-node wn-node-rect">
          <rect x="635" y="562" width="210" height="56" rx="2" />
          <text x="740" y="597">假设检验</text>
        </g>
        <g className="wn-node wn-node-rect wn-node-emphasis">
          <rect x="635" y="702" width="210" height="76" rx="2" />
          <text x="740" y="728">决定接受</text>
          <text x="740" y="748">或拒绝假设</text>
        </g>
        <g className="wn-node wn-node-rect">
          <rect x="635" y="852" width="210" height="56" rx="2" />
          <text x="740" y="887">解释工具 · 抽样</text>
        </g>

        {/* ---- 左下宫（经验·归纳）x 中心 260 ---- */}
        <g className="wn-node wn-node-rect">
          <rect x="155" y="562" width="210" height="56" rx="2" />
          <text x="260" y="597">样本小结 · 数值估计</text>
        </g>
        <g className="wn-node wn-node-rect">
          <rect x="155" y="672" width="210" height="56" rx="2" />
          <text x="260" y="707">测量</text>
        </g>
        <g className="wn-node wn-node-rect">
          <rect x="155" y="784" width="210" height="56" rx="2" />
          <text x="260" y="819">观察</text>
        </g>

        {/* ---- 左上宫（理论·归纳）x 中心 260 ---- */}
        <g className="wn-node wn-node-rect">
          <rect x="155" y="292" width="210" height="56" rx="2" />
          <text x="260" y="327">经验概括</text>
        </g>
        <g className="wn-node wn-node-rect wn-node-emphasis">
          <rect x="155" y="182" width="210" height="56" rx="2" />
          <text x="260" y="217">逻辑推论</text>
        </g>
        <g className="wn-node wn-node-rect">
          <rect x="155" y="40" width="210" height="100" rx="2" />
          <text x="260" y="64">形成概念</text>
          <text x="260" y="82">建立命题</text>
          <text x="260" y="100">命题整理</text>
        </g>

        {/* 旁标：右下「属于用户」 */}
        <text x="985" y="985" textAnchor="end" className="wn-caption">
          属于用户
        </text>

        {/* ===== 主圈箭头（黑色实线 · 顺时针 · 全直角）===== */}
        <g className="wn-arrow">
          {/* 形成概念 → 理论（顶行水平 · 跨宫） */}
          <path d="M365 90 H635" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 理论 → 逻辑演绎（右上宫下行） */}
          <path d="M740 118 V172" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 逻辑演绎 → 演绎推论 */}
          <path d="M740 228 V282" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 演绎推论 → 假设 */}
          <path d="M740 338 V392" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 假设 → 假设检验（跨横中线） */}
          <path d="M740 448 V562" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 假设检验 → 决定 */}
          <path d="M740 618 V702" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 决定 → 解释工具·抽样 */}
          <path d="M740 778 V852" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 解释工具 → 观察（底行水平 · 跨宫） */}
          <path d="M635 880 H365" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 观察 → 测量（左下宫上行） */}
          <path d="M260 784 V728" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 测量 → 样本小结 */}
          <path d="M260 672 V618" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 样本小结 → 经验概括（跨横中线） */}
          <path d="M260 562 V348" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 经验概括 → 逻辑推论 */}
          <path d="M260 292 V238" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 逻辑推论 → 形成概念 */}
          <path d="M260 182 V140" fill="none" markerEnd="url(#wallace-arrow)" />
        </g>
      </svg>
    </figure>
  )
}