import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { useNav } from '../nav'
import { ScienceCycle, type NodeKey } from '../components/ScienceCycle'

type ExploreTrack = 'theory' | 'empirical'

const NODE_CONTEXT: Record<NodeKey, {
  eyebrow: string
  title: string
  note: string
}> = {
  T: {
    eyebrow: 'Theory & Concepts',
    title: '发展理论解释',
    note: '把现象连接到概念、理论和文献批判；Idea 与文献在这里形成理论关系。',
  },
  H: {
    eyebrow: 'H · Propositions & Hypotheses',
    title: '发展命题与假设',
    note: '把理论解释推进为逻辑推演、预测、替代解释和可研究的 RQ。',
  },
  O: {
    eyebrow: 'Observation & Evidence',
    title: '设计如何获得证据',
    note: '把问题转化为研究设计、变量、操作化、样本和数据收集计划。',
  },
  E: {
    eyebrow: 'E · Empirical Generalization',
    title: '从证据形成经验概括',
    note: '整理数据分析、结果、经验规律和局限，并回到原来的解释。',
  },
}

/**
 * 科学环页（用户 09-03 方案 3 收敛）：
 * 科学环 = 认知导航（O/E/T/H 轮播）+ 当前节点工作台，不再内嵌整页
 * Brainstorm / Literature —— 头脑风暴与研究库已是一级导航。
 * 节点级 Idea/文献入口由环上工作卡与一级导航承担。
 */
export function ResearchExplore({ initialNode, initialTrack }: { initialNode?: NodeKey; initialTrack?: ExploreTrack }) {
  const { lang } = useI18n()
  const { navigate } = useNav()
  const [activeNode, setActiveNode] = useState<NodeKey | undefined>(initialNode)

  const context = activeNode ? NODE_CONTEXT[activeNode] : null
  const trackLabel = initialTrack === 'theory' ? '理论研究' : initialTrack === 'empirical' ? '实证研究' : null

  /* 环上点节点（App navigate('T'/'H'/'O'/'E')）→ prop 变化 → 同步 activeNode */
  useEffect(() => {
    if (initialNode) {
      setActiveNode(initialNode)
    }
  }, [initialNode])

  return (
    <div className="page research-explore-page">
      {context ? (
        <section className="research-node-context" aria-label={context.eyebrow}>
          <span>{trackLabel ? `${trackLabel} · ${context.eyebrow}` : context.eyebrow}</span>
          <strong>{lang === 'en' ? context.title : context.title}</strong>
          <p>{context.note}</p>
        </section>
      ) : null}

      <ScienceCycle onNavigate={navigate} initialNode={activeNode} compact={Boolean(activeNode)} nodeOnly={Boolean(activeNode)} />
    </div>
  )
}