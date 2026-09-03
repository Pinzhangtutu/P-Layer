/**
 * Wallace 经典科学环示意图（教科书风格 · 横平竖直正交环）
 *
 * 外圈 12 个矩形节点按顺时针网格排布，箭头走横/竖正交线：
 * 理论 → 演绎推论 → 假设 → 假设检验 → 决定接受或拒绝假设 →
 * 解释工具·抽样 → 观察 → 测量 → 样本小结·数值估计 → 经验概括 →
 * 形成概念·建立命题·命题整理 → 回到理论。
 *
 * 环心两个方法论椭圆：逻辑推论（归纳，位于右侧接近假设检验）、
 * 逻辑演绎（演绎，位于左侧），表达 Wallace 1974 的两条方法论路径。
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
        viewBox="0 0 1000 560"
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
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
          </marker>
        </defs>

        {/* ===== 外圈 12 节点（顺时针）===== */}

        {/* 顶部中 · 理论 */}
        <g className="wn-node wn-node-rect">
          <rect x="430" y="24" width="140" height="40" rx="6" />
          <text x="500" y="50">理论</text>
        </g>

        {/* 顶部右 · 演绎推论 */}
        <g className="wn-node wn-node-rect">
          <rect x="830" y="24" width="140" height="40" rx="6" />
          <text x="900" y="50">演绎推论</text>
        </g>

        {/* 右列 · 假设 */}
        <g className="wn-node wn-node-rect">
          <rect x="830" y="150" width="140" height="40" rx="6" />
          <text x="900" y="176">假设</text>
        </g>

        {/* 右列 · 假设检验 */}
        <g className="wn-node wn-node-rect">
          <rect x="830" y="276" width="140" height="40" rx="6" />
          <text x="900" y="302">假设检验</text>
        </g>

        {/* 右列下方 · 决定接受或拒绝假设 */}
        <g className="wn-node wn-node-rect">
          <rect x="660" y="398" width="150" height="56" rx="6" />
          <text x="735" y="421">决定接受</text>
          <text x="735" y="438">或拒绝假设</text>
        </g>

        {/* 底部右 · 解释工具 · 抽样 */}
        <g className="wn-node wn-node-rect">
          <rect x="590" y="478" width="170" height="44" rx="6" />
          <text x="675" y="506">解释工具 · 抽样</text>
        </g>

        {/* 底部左 · 观察 */}
        <g className="wn-node wn-node-rect">
          <rect x="250" y="478" width="140" height="44" rx="6" />
          <text x="320" y="506">观察</text>
        </g>

        {/* 左列下 · 测量 */}
        <g className="wn-node wn-node-rect">
          <rect x="50" y="430" width="150" height="44" rx="6" />
          <text x="125" y="458">测量</text>
        </g>

        {/* 左列 · 样本小结 · 数值估计 */}
        <g className="wn-node wn-node-rect">
          <rect x="50" y="306" width="150" height="44" rx="6" />
          <text x="125" y="334">样本小结 · 数值估计</text>
        </g>

        {/* 左列 · 经验概括 */}
        <g className="wn-node wn-node-rect">
          <rect x="50" y="182" width="150" height="40" rx="6" />
          <text x="125" y="208">经验概括</text>
        </g>

        {/* 顶部左 · 形成概念 · 建立命题 · 命题整理 */}
        <g className="wn-node wn-node-rect">
          <rect x="40" y="24" width="200" height="64" rx="6" />
          <text x="140" y="44">形成概念</text>
          <text x="140" y="60">建立命题</text>
          <text x="140" y="76">命题整理</text>
        </g>

        {/* ===== 环心方法论椭圆 ===== */}
        {/* 逻辑演绎 · 演绎法（上方，连接理论 → 假设） */}
        <g className="wn-node wn-node-ellipse">
          <ellipse cx="555" cy="130" rx="86" ry="30" />
          <text x="555" y="134">逻辑演绎</text>
        </g>

        {/* 逻辑推论 · 归纳法（下方，连接观察 → 经验概括） */}
        <g className="wn-node wn-node-ellipse">
          <ellipse cx="430" cy="380" rx="86" ry="30" />
          <text x="430" y="384">逻辑推论</text>
        </g>

        {/* 右下角标注 */}
        <text x="990" y="550" textAnchor="end" className="wn-caption">
          属于用户
        </text>

        {/* ===== 主循环正交箭头（顺时针）===== */}
        <g className="wn-arrow">
          {/* 理论 → 演绎推论（顶部水平） */}
          <path d="M570 44 H830" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 演绎推论 → 假设（右列向下） */}
          <path d="M900 64 V150" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 假设 → 假设检验（右列向下） */}
          <path d="M900 190 V276" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 假设检验 → 决定（向左，再向下） */}
          <path d="M830 296 H735 V398" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 决定 → 解释工具·抽样（向下偏左） */}
          <path d="M735 454 V470 H675 V478" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 解释工具·抽样 → 观察（底部水平向左） */}
          <path d="M590 500 H390" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 观察 → 测量（先上后左） */}
          <path d="M250 500 V452 H202" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 测量 → 样本小结·数值估计（左列向上） */}
          <path d="M125 430 V350" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 样本小结·数值估计 → 经验概括（左列向上） */}
          <path d="M125 306 V222" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 经验概括 → 形成概念（向上偏右，再进节点底边） */}
          <path d="M125 182 V110 H145 V92" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 形成概念 → 理论（顶部水平向右） */}
          <path d="M250 44 H430" fill="none" markerEnd="url(#wallace-arrow)" />
        </g>

        {/* ===== 方法论连接（蓝色虚线 · 横平竖直）===== */}
        <g className="wn-arrow-aux">
          {/* 逻辑演绎 → 假设（理论→假设的演绎通道） */}
          <path d="M641 130 H830" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 观察 → 逻辑推论（归纳：从观察到经验概括） */}
          <path d="M320 478 V420 H430" fill="none" markerEnd="url(#wallace-arrow)" />
        </g>
      </svg>
      <figcaption className="wallace-overview-caption">
        Adapted from Wallace, W. L. (1971). The Logic of Science in Sociology.
        <span className="wallace-overview-caption-zh">｜按华莱士（1971）科学环改编 · 横平竖直示意图</span>
      </figcaption>
    </figure>
  )
}