import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { useNav } from '../nav'
import { Brainstorm } from './Brainstorm'
import { Literature } from './Literature'
import { ScienceCycle, type NodeKey } from '../components/ScienceCycle'

type ExploreTab = 'idea' | 'literature'
type ExploreTrack = 'theory' | 'empirical'

const NODE_CONTEXT: Record<NodeKey, {
  eyebrow: string
  title: string
  note: string
  ideaZh: string
  ideaEn: string
  literatureZh: string
  literatureEn: string
  defaultTab: ExploreTab
}> = {
  T: {
    eyebrow: 'Theory & Concepts',
    title: '发展理论解释',
    note: '把现象连接到概念、理论和文献批判；Idea 与文献在这里形成理论关系。',
    ideaZh: '理论命题与概念', ideaEn: 'Concepts & propositions',
    literatureZh: '文献批判与理论依据', literatureEn: 'Literature critique & theory support',
    defaultTab: 'literature',
  },
  H: {
    eyebrow: 'H · Propositions & Hypotheses',
    title: '发展命题与假设',
    note: '把理论解释推进为逻辑推演、预测、替代解释和可研究的 RQ。',
    ideaZh: '命题、假设与 RQ', ideaEn: 'Propositions, hypotheses & RQ',
    literatureZh: '理论依据与相关文献', literatureEn: 'Theory support & related literature',
    defaultTab: 'idea',
  },
  O: {
    eyebrow: 'Observation & Evidence',
    title: '设计如何获得证据',
    note: '把问题转化为研究设计、变量、操作化、样本和数据收集计划。',
    ideaZh: '研究设计与证据计划', ideaEn: 'Design & evidence plan',
    literatureZh: '方法、测量与样本文献', literatureEn: 'Methods, measures & sample literature',
    defaultTab: 'idea',
  },
  E: {
    eyebrow: 'E · Empirical Generalization',
    title: '从证据形成经验概括',
    note: '整理数据分析、结果、经验规律和局限，并回到原来的解释。',
    ideaZh: '结果、结论与经验规律', ideaEn: 'Results, conclusions & patterns',
    literatureZh: '经验结果与文献比较', literatureEn: 'Empirical comparison & literature',
    defaultTab: 'idea',
  },
}

/**
 * 理论/实证页面保留与当前节点相关的文献视图；
 * 完整 Idea—RQ—项目—文献网络统一放在项目管理，不在这里复制。
 */

export function ResearchExplore({ initialTab = 'idea', initialNode, initialTrack }: { initialTab?: ExploreTab; initialNode?: NodeKey; initialTrack?: ExploreTrack }) {
  const { lang } = useI18n()
  const { navigate } = useNav()
  const [activeNode, setActiveNode] = useState<NodeKey | undefined>(initialNode)
  const [tab, setTab] = useState<ExploreTab>(initialTab)
  /* 模糊切换：opacity 1 + 无 blur → opacity 0 + blur 8px（200ms）→ 切 tab → 0/8px → 1/0（200ms）
     避免直接 unmount/mount 造成「生硬截断」感（参考设置面板主题切换的柔和过渡）。 */
  const [contentOpacity, setContentOpacity] = useState(1)
  const switchTimer = useState<number>(0)

  const context = activeNode ? NODE_CONTEXT[activeNode] : null
  const trackLabel = initialTrack === 'theory' ? '理论研究' : initialTrack === 'empirical' ? '实证研究' : null

  useEffect(() => setTab(context?.defaultTab ?? initialTab), [initialTab, context?.defaultTab])

  /* 环上点节点（App navigate('T'/'H'/'O'/'E')）→ prop 变化 → 同步 activeNode */
  useEffect(() => {
    if (initialNode) {
      setActiveNode(initialNode)
    }
  }, [initialNode])

  function switchTab(next: ExploreTab) {
    if (next === tab) return
    window.clearTimeout(switchTimer[0])
    setContentOpacity(0)
    switchTimer[1](window.setTimeout(() => {
      setTab(next)
      /* 让新组件先 mount（opacity 仍 0），下一帧再淡入，避免瞬间闪烁 */
      window.requestAnimationFrame(() => setContentOpacity(1))
    }, 200))
  }

  return (
    <div className="page research-explore-page">
      {context ? (
        <section className="research-node-context" aria-label={context.eyebrow}>
          <span>{trackLabel ? `${trackLabel} · ${context.eyebrow}` : context.eyebrow}</span>
          <strong>{lang === 'en' ? context.title : context.title}</strong>
          <p>{context.note}</p>
        </section>
      ) : null}

      <ScienceCycle onNavigate={navigate} onOpenIdea={() => switchTab('idea')} initialNode={activeNode} compact={Boolean(activeNode)} nodeOnly={Boolean(activeNode)} />

      <div className="research-explore-tabs" role="tablist" aria-label={lang === 'en' ? 'Research Explore' : '研究探索'}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'idea'}
          className={`research-explore-tab${tab === 'idea' ? ' active' : ''}`}
          onClick={() => switchTab('idea')}
        >
          💡 {lang === 'en' ? context?.ideaEn ?? 'Idea workspace' : context?.ideaZh ?? 'Idea 工作台'}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'literature'}
          className={`research-explore-tab${tab === 'literature' ? ' active' : ''}`}
          onClick={() => switchTab('literature')}
        >
          📚 {lang === 'en' ? context?.literatureEn ?? 'Related literature' : context?.literatureZh ?? '相关文献'}
        </button>
      </div>

      <div
        className="research-explore-content"
        style={{
          opacity: contentOpacity,
          filter: contentOpacity < 1 ? 'blur(8px)' : 'blur(0)',
        }}
      >
        {tab === 'idea' ? <Brainstorm /> : <Literature />}
      </div>
    </div>
  )
}
