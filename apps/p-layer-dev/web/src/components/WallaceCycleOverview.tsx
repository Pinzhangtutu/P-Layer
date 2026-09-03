/**
 * Wallace 经典科学环示意图（教科书风格 · 近似椭圆环）
 *
 * 节点按角度分布在椭圆轨迹上，顺时针：理论 → 演绎推论 → 假设 → 假设检验 →
 * 决定接受/拒绝假设 → 解释工具·抽样 → 观察 → 测量 → 样本小结·数值估计 →
 * 经验概括 → 形成概念·建立命题·命题整理 → 理论。
 *
 * 中间两个椭圆：逻辑推论（归纳）靠右，逻辑演绎靠左下，对应 Wallace 1974
 * 原图的「两条方法论路径」位置关系。蓝色虚线箭头连接方法论与外圈节点。
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

        {/* 外圈主循环 · 12 节点（顺时针自顶部）*/}
        {/* 顶 · 理论 */}
        <g className="wn-node wn-node-rect">
          <rect x="320" y="20" width="120" height="40" rx="8" />
          <text x="380" y="46" textAnchor="middle">理论</text>
        </g>

        {/* 右上 · 演绎推论 */}
        <g className="wn-node wn-node-rect">
          <rect x="572" y="76" width="140" height="40" rx="8" />
          <text x="642" y="102" textAnchor="middle">演绎推论</text>
        </g>

        {/* 右上偏下 · 假设 */}
        <g className="wn-node wn-node-rect">
          <rect x="600" y="184" width="140" height="40" rx="8" />
          <text x="670" y="210" textAnchor="middle">假设</text>
        </g>

        {/* 右下 · 假设检验 */}
        <g className="wn-node wn-node-rect">
          <rect x="600" y="304" width="140" height="40" rx="8" />
          <text x="670" y="330" textAnchor="middle">假设检验</text>
        </g>

        {/* 下 · 决定接受/拒绝假设 */}
        <g className="wn-node wn-node-rect">
          <rect x="408" y="408" width="184" height="42" rx="8" />
          <text x="500" y="426" textAnchor="middle">决定接受</text>
          <text x="500" y="442" textAnchor="middle">或拒绝假设</text>
        </g>

        {/* 右下偏下 · 解释工具·抽样 */}
        <g className="wn-node wn-node-rect">
          <rect x="540" y="476" width="200" height="40" rx="8" />
          <text x="640" y="502" textAnchor="middle">解释工具·抽样</text>
        </g>

        {/* 底 · 观察 */}
        <g className="wn-node wn-node-rect">
          <rect x="320" y="520" width="120" height="40" rx="8" />
          <text x="380" y="546" textAnchor="middle">观察</text>
        </g>

        {/* 左下 · 测量 */}
        <g className="wn-node wn-node-rect">
          <rect x="20" y="476" width="180" height="40" rx="8" />
          <text x="110" y="502" textAnchor="middle">测量</text>
        </g>

        {/* 左侧偏下 · 样本小结·数值估计 */}
        <g className="wn-node wn-node-rect">
          <rect x="20" y="380" width="180" height="42" rx="8" />
          <text x="110" y="398" textAnchor="middle">样本小结</text>
          <text x="110" y="414" textAnchor="middle">数值估计</text>
        </g>

        {/* 左中 · 经验概括 */}
        <g className="wn-node wn-node-rect">
          <rect x="20" y="266" width="180" height="40" rx="8" />
          <text x="110" y="292" textAnchor="middle">经验概括</text>
        </g>

        {/* 左上 · 形成概念·建立命题·命题整理 */}
        <g className="wn-node wn-node-rect">
          <rect x="20" y="76" width="180" height="62" rx="8" />
          <text x="110" y="96" textAnchor="middle">形成概念</text>
          <text x="110" y="112" textAnchor="middle">建立命题</text>
          <text x="110" y="128" textAnchor="middle">命题整理</text>
        </g>

        {/* 中央方法论椭圆：逻辑推论（偏右、靠近假设 · 归纳）*/}
        <g className="wn-node wn-node-ellipse">
          <ellipse cx="438" cy="252" rx="76" ry="30" />
          <text x="438" y="256" textAnchor="middle">逻辑推论</text>
        </g>

        {/* 中央方法论椭圆：逻辑演绎（偏左下、靠近决定 · 演绎）*/}
        <g className="wn-node wn-node-ellipse">
          <ellipse cx="304" cy="340" rx="76" ry="30" />
          <text x="304" y="344" textAnchor="middle">逻辑演绎</text>
        </g>

        {/* 旁标：右下「属于用户」 */}
        <text x="752" y="556" textAnchor="end" className="wn-caption">
          属于用户
        </text>

        {/* 主循环外圈箭头（顺时针，沿椭圆切线）*/}
        <g className="wn-arrow">
          {/* 理论 → 演绎推论 */}
          <path d="M440 36 C 510 36 540 60 572 90" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 演绎推论 → 假设 */}
          <path d="M642 116 C 642 140 660 160 660 184" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 假设 → 假设检验 */}
          <path d="M670 224 C 670 256 670 276 670 304" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 假设检验 → 决定 */}
          <path d="M600 324 C 580 360 540 396 514 408" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 决定 → 解释工具·抽样 */}
          <path d="M540 450 C 580 460 620 470 620 476" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 解释工具·抽样 → 观察 */}
          <path d="M540 506 C 460 520 420 530 440 540" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 观察 → 测量 */}
          <path d="M320 540 C 260 530 220 520 200 506" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 测量 → 样本小结·数值估计 */}
          <path d="M110 476 C 110 460 110 442 110 422" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 样本小结·数值估计 → 经验概括 */}
          <path d="M110 380 C 110 360 110 322 110 306" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 经验概括 → 形成概念·建立命题·命题整理 */}
          <path d="M110 266 C 110 240 110 158 110 138" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 形成概念·建立命题·命题整理 → 理论 */}
          <path d="M200 76 C 260 60 280 50 320 40" fill="none" markerEnd="url(#wallace-arrow)" />
        </g>

        {/* 中央方法论箭头：逻辑推论（归纳方向：假设 ⇄ 假设检验）+ 逻辑演绎（演绎方向：理论 → 决定）*/}
        <g className="wn-arrow-aux">
          {/* 假设 → 逻辑推论（归纳） */}
          <path d="M600 204 C 540 218 500 232 514 244" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 逻辑推论 → 假设检验（验证） */}
          <path d="M512 254 C 560 274 600 290 612 304" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 理论 → 逻辑演绎（演绎来源） */}
          <path d="M380 60 C 360 110 320 240 304 310" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 逻辑演绎 → 决定（验证→判断） */}
          <path d="M358 362 C 380 380 420 396 408 408" fill="none" markerEnd="url(#wallace-arrow)" />
        </g>
      </svg>
    </figure>
  )
}