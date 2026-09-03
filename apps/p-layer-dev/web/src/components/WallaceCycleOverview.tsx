/**
 * Wallace 经典科学环示意图（教科书风格 · 垂直循环）
 *
 * 与下方水平轮播（X 轴 O/E/T/H 四节点视图）相互补：
 *   - 下方交互：当前节点工作焦点（点击进入工作区）
 *   - 本图：完整 Wallace 1974 科学环模型示意（方法学总览，不交互）
 *
 * 图节点（按 Wallace 经典教科书布局）：
 *   - 矩形：理论 / 演绎推论 / 假设 / 假设检验 / 决定接受或拒绝假设 /
 *           解释工具·抽样 / 观察 / 测量 / 样本小结·数值估计 /
 *           经验概括 / 形成概念·建立命题·命题整理
 *   - 椭圆：逻辑推论（归纳方向）/ 逻辑演绎（演绎方向）—— 中央方法论双椭圆
 *   - 旁标："属于用户"
 */
import type { CSSProperties } from 'react'

type Props = {
  className?: string
  style?: CSSProperties
  title?: string
}

export function WallaceCycleOverview({ className, style, title }: Props) {
  const cls = ['wallace-overview', className].filter(Boolean).join(' ')
  return (
    <figure className={cls} style={style} aria-label={title ?? 'Wallace 科学环（完整）'} role="img">
      <svg
        className="wallace-overview-svg"
        viewBox="0 0 760 560"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <marker
            id="wallace-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
          </marker>
        </defs>

        {/* 外圈循环 12 个矩形节点（顺时针自顶向下：理论 → … → 形成概念 → 理论） */}
        {/* 顶部 · 理论 */}
        <g className="wn-node wn-node-rect">
          <rect x="320" y="14" width="120" height="40" rx="8" />
          <text x="380" y="40" textAnchor="middle">理论</text>
        </g>

        {/* 右上 · 演绎推论（带「逻辑演绎」箭头出） */}
        <g className="wn-node wn-node-rect">
          <rect x="592" y="84" width="140" height="40" rx="8" />
          <text x="662" y="110" textAnchor="middle">演绎推论</text>
        </g>

        {/* 右侧 · 假设 */}
        <g className="wn-node wn-node-rect">
          <rect x="592" y="164" width="140" height="40" rx="8" />
          <text x="662" y="190" textAnchor="middle">假设</text>
        </g>

        {/* 右下 · 假设检验 */}
        <g className="wn-node wn-node-rect">
          <rect x="592" y="244" width="140" height="40" rx="8" />
          <text x="662" y="270" textAnchor="middle">假设检验</text>
        </g>

        {/* 中右下 · 决定接受或拒绝假设 */}
        <g className="wn-node wn-node-rect">
          <rect x="396" y="336" width="184" height="42" rx="8" />
          <text x="488" y="354" textAnchor="middle">决定接受</text>
          <text x="488" y="370" textAnchor="middle">或拒绝假设</text>
        </g>

        {/* 右下 · 解释工具 · 抽样 */}
        <g className="wn-node wn-node-rect">
          <rect x="568" y="436" width="168" height="40" rx="8" />
          <text x="652" y="460" textAnchor="middle">解释工具·抽样</text>
        </g>

        {/* 中央两个椭圆节点（逻辑推论 + 逻辑演绎）*/}
        <g className="wn-node wn-node-ellipse">
          <ellipse cx="380" cy="200" rx="76" ry="30" />
          <text x="380" y="204" textAnchor="middle">逻辑推论</text>
        </g>
        <g className="wn-node wn-node-ellipse">
          <ellipse cx="380" cy="312" rx="76" ry="30" />
          <text x="380" y="316" textAnchor="middle">逻辑演绎</text>
        </g>

        {/* 底部 · 观察 */}
        <g className="wn-node wn-node-rect">
          <rect x="320" y="510" width="120" height="40" rx="8" />
          <text x="380" y="536" textAnchor="middle">观察</text>
        </g>

        {/* 左下 · 测量 */}
        <g className="wn-node wn-node-rect">
          <rect x="26" y="436" width="180" height="40" rx="8" />
          <text x="116" y="460" textAnchor="middle">测量</text>
        </g>

        {/* 左侧 · 样本小结·数值估计 */}
        <g className="wn-node wn-node-rect">
          <rect x="26" y="354" width="180" height="42" rx="8" />
          <text x="116" y="372" textAnchor="middle">样本小结</text>
          <text x="116" y="388" textAnchor="middle">数值估计</text>
        </g>

        {/* 左中 · 经验概括 */}
        <g className="wn-node wn-node-rect">
          <rect x="26" y="244" width="180" height="40" rx="8" />
          <text x="116" y="270" textAnchor="middle">经验概括</text>
        </g>

        {/* 左上 · 形成概念·建立命题·命题整理 */}
        <g className="wn-node wn-node-rect">
          <rect x="26" y="84" width="180" height="62" rx="8" />
          <text x="116" y="104" textAnchor="middle">形成概念</text>
          <text x="116" y="120" textAnchor="middle">建立命题</text>
          <text x="116" y="136" textAnchor="middle">命题整理</text>
        </g>

        {/* 旁标：右下「属于用户」 */}
        <text x="752" y="556" textAnchor="end" className="wn-caption">
          属于用户
        </text>

        {/* 主循环外圈箭头（顺时针）：理论 → 演绎推论 → 假设 → 假设检验 → 决定 →
            解释工具 → 观察 → 测量 → 样本小结 → 经验概括 → 形成概念 → 回到理论 */}
        <g className="wn-arrow">
          {/* 理论 → 演绎推论 */}
          <path d="M440 34 Q 530 34 588 100" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 演绎推论 → 假设 */}
          <path d="M662 124 L 662 160" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 假设 → 假设检验 */}
          <path d="M662 204 L 662 240" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 假设检验 → 决定 */}
          <path d="M588 264 Q 530 320 580 340" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 决定 → 解释工具 */}
          <path d="M580 378 L 564 432" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 解释工具 → 观察 */}
          <path d="M568 458 Q 460 480 440 510" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 观察 → 测量 */}
          <path d="M320 510 Q 290 480 210 458" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 测量 → 样本小结 */}
          <path d="M116 436 L 116 396" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 样本小结 → 经验概括 */}
          <path d="M116 354 L 116 284" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 经验概括 → 形成概念 */}
          <path d="M116 244 Q 116 200 116 146" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 形成概念 → 理论 */}
          <path d="M206 84 Q 320 60 320 56" fill="none" markerEnd="url(#wallace-arrow)" />
        </g>

        {/* 中央方法论箭头：逻辑推论（演绎路径）+ 逻辑演绎（归纳路径）*/}
        <g className="wn-arrow-aux">
          {/* 假设 → 逻辑推论 */}
          <path d="M592 184 L 460 196" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 逻辑推论 → 假设检验（归纳验证） */}
          <path d="M452 220 Q 500 240 588 264" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 理论 → 逻辑演绎 */}
          <path d="M380 56 L 380 280" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 逻辑演绎 → 决定（验证→判断） */}
          <path d="M460 312 Q 410 320 380 380" fill="none" markerEnd="url(#wallace-arrow)" />
        </g>
      </svg>
    </figure>
  )
}