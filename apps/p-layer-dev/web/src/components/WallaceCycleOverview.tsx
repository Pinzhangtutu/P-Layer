/**
 * Wallace 经典科学环示意图（教科书风格 · 严格十字交叉象限 · 全直角折线）
 *
 * 4 节点严格按"竖直中线分演绎/归纳"+"水平横线分理论/经验"排到 4 个象限：
 *   - 右上：理论、演绎推论、假设（理论‑演绎）
 *   - 右下：假设检验、决定（经验‑演绎）
 *   - 左下：解释工具·抽样、观察、测量、样本小结（经验‑归纳起点）
 *   - 左上：经验概括、形成概念（理论‑归纳）
 *
 * 中央双椭圆方法论：右上"逻辑演绎"（从理论往下推检验），左下"逻辑推论"（从
 * 经验往上提炼理论）。蓝色虚线直角箭头连接椭圆与外圈节点。
 *
 * 主圈 11 步顺时针 + 4 条辅助线 = 15 段直角折线；用户 09-03 22:5x 明确要求
 * "尽量横平竖直"，不画椭圆环/贝塞尔。
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
    <figure className={cls} style={style} aria-label={title ?? 'Wallace 科学环（4 象限 + 两条方法论）'} role="img">
      <svg
        className="wallace-overview-svg"
        viewBox="0 0 1000 640"
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

        {/* ===== 4 象限 + 顶/底/左/右 节点（顺时针：左上 → 右上 → 右中 → 右中下 → 右下 → 底中 → 底左 → 左下 → 左中 → 左中上 → 回到左上）===== */}

        {/* 左上：形成概念·建立命题·命题整理 */}
        <g className="wn-node wn-node-rect">
          <rect x="40" y="20" width="200" height="60" rx="6" />
          <text x="140" y="40">形成概念</text>
          <text x="140" y="55">建立命题</text>
          <text x="140" y="70">命题整理</text>
        </g>

        {/* 右上：理论 */}
        <g className="wn-node wn-node-rect">
          <rect x="760" y="20" width="200" height="60" rx="6" />
          <text x="860" y="55">理论</text>
        </g>

        {/* 右上偏下：演绎推论 */}
        <g className="wn-node wn-node-rect">
          <rect x="760" y="120" width="200" height="60" rx="6" />
          <text x="860" y="155">演绎推论</text>
        </g>

        {/* 右中：假设 */}
        <g className="wn-node wn-node-rect">
          <rect x="760" y="220" width="200" height="60" rx="6" />
          <text x="860" y="255">假设</text>
        </g>

        {/* 右中下：假设检验 */}
        <g className="wn-node wn-node-rect">
          <rect x="760" y="320" width="200" height="60" rx="6" />
          <text x="860" y="355">假设检验</text>
        </g>

        {/* 右下偏左（与"决定"横跨中部）：决定接受/拒绝假设 */}
        <g className="wn-node wn-node-rect">
          <rect x="560" y="420" width="200" height="80" rx="6" />
          <text x="660" y="442">决定接受</text>
          <text x="660" y="460">或拒绝假设</text>
        </g>

        {/* 底中偏左：解释工具·抽样 */}
        <g className="wn-node wn-node-rect">
          <rect x="340" y="540" width="200" height="60" rx="6" />
          <text x="440" y="575">解释工具·抽样</text>
        </g>

        {/* 底左：观察 */}
        <g className="wn-node wn-node-rect">
          <rect x="40" y="540" width="200" height="60" rx="6" />
          <text x="140" y="575">观察</text>
        </g>

        {/* 左下：测量 */}
        <g className="wn-node wn-node-rect">
          <rect x="40" y="420" width="200" height="60" rx="6" />
          <text x="140" y="455">测量</text>
        </g>

        {/* 左中：样本小结·数值估计 */}
        <g className="wn-node wn-node-rect">
          <rect x="40" y="320" width="200" height="80" rx="6" />
          <text x="140" y="342">样本小结</text>
          <text x="140" y="360">数值估计</text>
        </g>

        {/* 左中上：经验概括 */}
        <g className="wn-node wn-node-rect">
          <rect x="40" y="220" width="200" height="60" rx="6" />
          <text x="140" y="255">经验概括</text>
        </g>

        {/* ===== 中央方法论椭圆 ===== */}
        {/* 逻辑演绎 · 右上中央（连接理论/假设检验 → 演绎法检验） */}
        <g className="wn-node wn-node-ellipse">
          <ellipse cx="500" cy="210" rx="80" ry="30" />
          <text x="500" y="214">逻辑演绎</text>
        </g>

        {/* 逻辑推论 · 左下中央（连接解释工具/经验概括 → 归纳法建构） */}
        <g className="wn-node wn-node-ellipse">
          <ellipse cx="300" cy="430" rx="80" ry="30" />
          <text x="300" y="434">逻辑推论</text>
        </g>

        {/* 旁标：右下「属于用户」 */}
        <text x="980" y="620" textAnchor="end" className="wn-caption">
          属于用户
        </text>

        {/* ===== 主圈 11 步箭头（顺时针 · 全部直角折线）===== */}
        <g className="wn-arrow">
          {/* 1 形成概念 → 2 理论（顶行水平） */}
          <path d="M240 50 H760" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 2 理论 → 3 演绎推论（右下竖直） */}
          <path d="M860 80 V120" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 3 演绎推论 → 4 假设（继续下行） */}
          <path d="M860 180 V220" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 4 假设 → 5 假设检验（继续下行） */}
          <path d="M860 280 V320" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 5 假设检验 → 6 决定（左下折角：先左后下） */}
          <path d="M860 380 H660 V420" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 6 决定 → 7 解释工具·抽样（左下折角：先下后左） */}
          <path d="M560 500 V540 H440" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 7 解释工具·抽样 → 8 观察（底行水平左） */}
          <path d="M340 600 H140" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 8 观察 → 9 测量（左列竖直上） */}
          <path d="M140 540 V480" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 9 测量 → 10 样本小结·数值估计（继续上行） */}
          <path d="M140 420 V400" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 10 样本小结 → 11 经验概括（继续上行） */}
          <path d="M140 320 V280" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 11 经验概括 → 1 形成概念（左上竖直上） */}
          <path d="M140 220 V80" fill="none" markerEnd="url(#wallace-arrow)" />
        </g>

        {/* ===== 方法论辅助线（蓝色虚线 · 直角折线）===== */}
        <g className="wn-arrow-aux">
          {/* 理论 → 逻辑演绎（理论 底中 → 椭圆 顶中，先下后左） */}
          <path d="M860 80 V180 H500" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 逻辑演绎 → 假设检验（椭圆 右中 → 假设检验 顶左，先右后下） */}
          <path d="M580 210 H760 V320" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 解释工具·抽样 → 逻辑推论（解释工具 顶中 → 椭圆 底中，先下后左） */}
          <path d="M440 540 V460 H300" fill="none" markerEnd="url(#wallace-arrow)" />
          {/* 经验概括 → 逻辑推论（经验概括 右中 → 椭圆 左中，先右后下） */}
          <path d="M240 250 H220 V430" fill="none" markerEnd="url(#wallace-arrow)" />
        </g>
      </svg>
    </figure>
  )
}