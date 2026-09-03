import { useEffect, useMemo, useRef, useState } from 'react'
import { Brainstorm } from './pages/Brainstorm'
import { Flow } from './pages/Flow'
import { Home } from './pages/Home'
import { Literature } from './pages/Literature'
import { ResearchExplore } from './pages/ResearchExplore'
import { Projects } from './pages/Projects'
import { Board } from './pages/Board'
import { Settings } from './pages/Settings'
import { useI18n } from './i18n'
import { NavProvider } from './nav'
import { ProjectProvider, useCreateProjectStore } from './lib/useProject'
import { GlobalFooter } from './components/GlobalFooter'
import { ScrollHint } from './components/ScrollHint'
import type { NodeKey } from './components/ScienceCycle'

/** 主导航七入口（用户 09-03 决策，覆盖文档 v1.0 §5 的五入口）：
 *  主页｜头脑风暴｜科学环｜研究库｜研究项目｜看板｜设置。
 *  头脑风暴是「第一步」（捕捉/澄清/发展 Idea，无需先理解科学环）；
 *  科学环负责 O→E→T→H 之间的移动与再定位；
 *  研究库管理已有 Idea/理论/文献。brainstorm/literature 仍可从科学环、
 *  主页与文献内部进入。 */
const NAV = [
  { id: 'home', zh: '🏠 主页', en: '🏠 Home' },
  { id: 'brainstorm', zh: '🧠 头脑风暴', en: '🧠 Brainstorm' },
  { id: 'inspire', zh: '🔄 科学环', en: '🔄 Science Cycle' },
  { id: 'literature', zh: '📚 研究库', en: '📚 Research Library' },
  { id: 'projects', zh: '📁 研究项目', en: '📁 Research Projects' },
  { id: 'board', zh: '📊 看板', en: '📊 Board' },
  { id: 'settings', zh: '⚙️ 设置', en: '⚙️ Settings' },
] as const

/** 已迁到 React 的页面（science 为 v1 新增；brainstorm/flow/literature 从科学环进入） */
const MIGRATED: string[] = ['home', 'inspire', 'explore', 'projects', 'projects-network', 'board', 'settings', 'brainstorm', 'flow', 'literature']

/** 毛玻璃焦点模式：点击导航入口时，其他入口瞬间模糊，点中的那个保持清晰并轻微放大，560ms 后恢复 */
const NAV_FOCUS_KEY = 'pLayerNavGlassFocusV2'
const NAV_FOCUS_MS = 560

export default function App() {
  const { lang, t } = useI18n()
  const [route, setRoute] = useState<string>('home')
  const [navFocus, setNavFocus] = useState<string | null>(null)
  /** 头脑风暴由顶部导航直入（区别于 Home「继续 Idea」/科学环 recheck 跳入）：
     直入时不显示「← 返回科学环」条——头脑风暴是第一步，无需先理解科学环 */
  const [brainFromNav, setBrainFromNav] = useState(false)
  /** 科学环「重新检查假设」→ 跳转头脑风暴并自动打开对应 Idea 的训练（到 recheck 步） */
  const [v1Target, setV1Target] = useState<{ ideaId?: string; step?: string } | null>(null)
  const [exploreNode, setExploreNode] = useState<NodeKey | undefined>(undefined)
  const [exploreTrack, setExploreTrack] = useState<'theory' | 'empirical' | undefined>(undefined)
  const current = NAV.find((item) => item.id === route)
  const store = useCreateProjectStore()
  const navFocusTimer = useRef<number>(0)

  const nav = useMemo(() => ({
    route,
    navigate: (nextRoute: string) => {
      if (['T', 'H', 'O', 'E'].includes(nextRoute)) {
        setExploreTrack(undefined)
        setExploreNode(nextRoute as NodeKey)
        setRoute('explore')
      } else {
        setRoute(nextRoute)
      }
    },
  }), [route])

  useEffect(() => {
    if (navFocus) {
      document.body.classList.add('nav-glass-focus')
    } else {
      document.body.classList.remove('nav-glass-focus')
    }
    return () => document.body.classList.remove('nav-glass-focus')
  }, [navFocus])

  // 卡片级聚焦：点击任意卡片/面板时，只模糊同页的其他卡片，导航保持清晰，500ms 后恢复
  useEffect(() => {
    let timer = 0
    const CARD_FOCUS_MS = 500
    const clearCardFocus = () => {
      document.body.classList.remove('card-glass-focus')
      document
        .querySelectorAll('.workspace-main .card.card-focus-target')
        .forEach((n) => n.classList.remove('card-focus-target'))
    }
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const card = target.closest('.card') as HTMLElement | null
      if (!card) return
      const main = document.querySelector('.workspace-main')
      if (!main || !main.contains(card)) return
      window.clearTimeout(timer)
      clearCardFocus()
      card.classList.add('card-focus-target')
      document.body.classList.add('card-glass-focus')
      timer = window.setTimeout(clearCardFocus, CARD_FOCUS_MS)
    }
    document.addEventListener('click', handler)
    return () => {
      document.removeEventListener('click', handler)
      window.clearTimeout(timer)
      clearCardFocus()
    }
  }, [])

  const pulseNavFocus = (id: string) => {
    let enabled = true
    try {
      enabled = localStorage.getItem(NAV_FOCUS_KEY) !== 'false'
    } catch {
      /* ignore */
    }
    if (!enabled) return
    window.clearTimeout(navFocusTimer.current)
    setNavFocus(id)
    navFocusTimer.current = window.setTimeout(() => setNavFocus(null), NAV_FOCUS_MS)
  }

  /** 主页「继续最近 Idea / 反馈 / PDF」→ 打开头脑风暴并自动定位到对应 Idea */
  const openHomeIdea = (ideaId: string) => {
    setBrainFromNav(false)
    setV1Target({ ideaId })
    setRoute('brainstorm')
  }

  return (
    <ProjectProvider value={store}>
      <NavProvider value={nav}>
      <div className="app-shell">
        <nav className="workspace-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
                className={`${route === item.id || (route === 'projects-network' && item.id === 'projects') || (route === 'explore' && item.id === 'inspire') ? 'active' : ''}${
                navFocus === item.id ? ' nav-focus-target' : ''
              }`}
              onClick={() => {
                pulseNavFocus(item.id)
                if (item.id === 'brainstorm') {
                  setV1Target(null)
                  setBrainFromNav(true)
                  setRoute('brainstorm')
                } else if (item.id === 'inspire') {
                  setExploreTrack(undefined)
                  setExploreNode(undefined)
                  setRoute('inspire')
                } else {
                  setRoute(item.id)
                }
              }}
            >
              {lang === 'en' ? item.en : item.zh}
            </button>
          ))}
        </nav>

        <main className="workspace-main">
          {(route === 'flow' || (route === 'brainstorm' && !brainFromNav)) ? (
            <div className="science-return-bar">
              <button type="button" className="btn small" onClick={() => setRoute('explore')}>← {t('v1BackToScience')}</button>
            </div>
          ) : null}
          {route === 'home' ? <Home onOpenIdea={openHomeIdea} /> : null}
          {route === 'explore' || route === 'inspire' ? <ResearchExplore initialNode={exploreNode} initialTrack={exploreTrack} /> : null}
          {route === 'projects' || route === 'projects-network' ? <Projects initialView={route === 'projects-network' ? 'network' : 'planning'} /> : null}
          {route === 'board' ? <Board /> : null}
          {route === 'flow' ? <Flow /> : null}
          {route === 'brainstorm' ? (
            <Brainstorm v1Target={v1Target} onV1TargetConsumed={() => setV1Target(null)} />
          ) : null}
          {route === 'literature' ? <Literature /> : null}
          {route === 'settings' ? <Settings /> : null}
          {!MIGRATED.includes(route) ? (
            <section className="card">
              <p>{current ? (lang === 'en' ? current.en : current.zh) : route}</p>
            </section>
          ) : null}
        </main>

        <GlobalFooter />
      </div>
      <ScrollHint force={false} />
      </NavProvider>
    </ProjectProvider>
  )
}
