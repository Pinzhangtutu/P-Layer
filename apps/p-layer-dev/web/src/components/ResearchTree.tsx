import type { NodeKey } from './ScienceCycle'

type ResearchTreeProps = {
  onNavigate?: (route: string) => void
  activeNode?: NodeKey
}

const CYCLE_NODES: { key: NodeKey; zh: string; en: string }[] = [
  { key: 'O', zh: '观察', en: 'Observation' },
  { key: 'E', zh: '概括', en: 'Generalization' },
  { key: 'T', zh: '理论', en: 'Theory' },
  { key: 'H', zh: '假设', en: 'Hypothesis' },
]

/**
 * P-Layer 的最小信息架构图：科学环是认知主干，资源库、项目和看板是
 * 与主干相连的工作对象。它不替代页面，只让用户始终知道自己在系统中的位置。
 */
export function ResearchTree({ onNavigate, activeNode }: ResearchTreeProps) {
  const go = (route: string) => onNavigate?.(route)

  return (
    <section className="research-tree" aria-label="P-Layer 研究系统结构">
      <div className="research-tree-root">
        <span className="research-tree-root-mark">P</span>
        <div>
          <span className="research-tree-kicker">P-Layer / Research System</span>
          <strong>研究工作空间</strong>
        </div>
      </div>

      <div className="research-tree-branches">
        <div className="research-tree-branch cycle-branch">
          <button type="button" className="research-tree-main is-current" onClick={() => go('inspire')}>
            <span className="research-tree-icon">↻</span>
            <span><b>科学环</b><small>认知主干</small></span>
          </button>
          <div className="research-tree-children cycle-children">
            {CYCLE_NODES.map((node) => (
              <button
                key={node.key}
                type="button"
                className={`research-tree-child${activeNode === node.key ? ' active' : ''}`}
                onClick={() => go(node.key)}
              >
                <b>{node.key}</b><span>{node.zh}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="research-tree-branch">
          <button type="button" className="research-tree-main" onClick={() => go('explore')}>
            <span className="research-tree-icon">▦</span>
            <span><b>研究库</b><small>可复用资源</small></span>
          </button>
          <div className="research-tree-children">
            <button type="button" className="research-tree-child" onClick={() => go('explore')}><b>Idea</b><span>想法</span></button>
            <button type="button" className="research-tree-child" onClick={() => go('T')}><b>理论</b><span>概念</span></button>
            <button type="button" className="research-tree-child" onClick={() => go('literature')}><b>文献</b><span>证据来源</span></button>
          </div>
        </div>

        <div className="research-tree-branch compact-branch">
          <button type="button" className="research-tree-main" onClick={() => go('projects')}>
            <span className="research-tree-icon">□</span>
            <span><b>研究项目</b><small>正式执行</small></span>
          </button>
        </div>

        <div className="research-tree-branch compact-branch">
          <button type="button" className="research-tree-main" onClick={() => go('board')}>
            <span className="research-tree-icon">▤</span>
            <span><b>看板</b><small>当前行动</small></span>
          </button>
        </div>
      </div>
    </section>
  )
}
