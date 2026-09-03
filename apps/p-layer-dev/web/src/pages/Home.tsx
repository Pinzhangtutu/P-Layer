import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { useNav } from '../nav'
import { HomeDashboard } from '../components/home/HomeDashboard'
import { QUOTES, type Quote } from '../lib/quotes'

const QUOTE_KEY = 'pLayerQuote'
const HOME_SCROLL_KEY = 'pLayerHomeScroll'

type StoredQuote = { date: string; index: number }

/** 一天一句，同一天刷新页面不换 */
function pickDailyQuote(): Quote {
  const today = new Date().toISOString().slice(0, 10)
  let index = 0
  try {
    const raw = localStorage.getItem(QUOTE_KEY)
    const saved = raw ? (JSON.parse(raw) as StoredQuote) : null
    if (saved && saved.date === today && saved.index >= 0 && saved.index < QUOTES.length) {
      index = saved.index
    } else {
      index = Math.floor(Math.random() * QUOTES.length)
      localStorage.setItem(QUOTE_KEY, JSON.stringify({ date: today, index }))
    }
  } catch {
    index = Math.floor(Math.random() * QUOTES.length)
  }
  return QUOTES[index]
}

/**
 * 点击主页 P logo：强制刷新软件 + 换一句名言，但不退出登录。
 * 登录态存在 localStorage / sessionStorage 的 pLayerDemoSignedIn，整页 reload 会保留；
 * pLayerQuote 是「同一天锁定」，这里先清掉让它重新随机抽一句。
 */
function refreshHomeWithNewQuote() {
  try {
    localStorage.removeItem(QUOTE_KEY)
    sessionStorage.setItem(HOME_SCROLL_KEY, String(window.scrollY))
  } catch {
    /* ignore */
  }
  window.location.reload()
}

export function Home({ onOpenIdea }: { onOpenIdea?: (ideaId: string) => void }) {
  const { lang } = useI18n()
  const { navigate } = useNav()
  const [mounted, setMounted] = useState(false)
  const [wobble, setWobble] = useState(false)
  const [softening, setSoftening] = useState(false)

  useEffect(() => {
    try {
      const saved = Number(sessionStorage.getItem(HOME_SCROLL_KEY) || 0)
      if (saved > 0) window.requestAnimationFrame(() => window.scrollTo({ top: saved, behavior: 'auto' }))
      sessionStorage.removeItem(HOME_SCROLL_KEY)
    } catch {
      /* ignore unavailable session storage */
    }
  }, [])

  // localStorage 只能在浏览器里读，首屏先渲染占位，挂载后再取当日名言
  useEffect(() => setMounted(true), [])
  const quote = useMemo(() => (mounted ? pickDailyQuote() : QUOTES[0]), [mounted])

  function handleLogoClick() {
    setWobble(true)
    setSoftening(true)
    // 1) P 摇摆 320ms；2) 名言区先模糊淡出；3) 再刷新换新名言
    window.setTimeout(refreshHomeWithNewQuote, 320)
  }

  return (
    <div className="page">
      <section className={`home-welcome${softening ? ' is-softening' : ''}`}>
        <img
          className={`home-logo${wobble ? ' home-logo-wobble' : ''}`}
          src="/p-layer-logo.png"
          alt="P-layer"
          role="button"
          tabIndex={0}
          title={lang === 'en' ? 'Click to refresh & new quote' : '点击刷新并换一句名言'}
          onClick={handleLogoClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleLogoClick()
            }
          }}
        />
        <div className="home-welcome-inner">
          <h1 className={lang === 'en' ? 'home-quote-en' : 'home-quote-zh'}>
            “{lang === 'en' ? quote.en : quote.zh}”
          </h1>
          <div className="home-quote-author">
            {quote.paraphrase
              ? lang === 'en'
                ? `— Inspired by ${quote.author}`
                : `— 受${quote.authorZh}思想启发`
              : `— ${lang === 'en' ? quote.author : quote.authorZh}`}
          </div>
        </div>
      </section>

      {/* 三主入口 + 真实最近工作（v1.0 §5.1）：捕捉 Idea / 管理研究资产 / 继续项目 */}
      <HomeDashboard
        onGo={(route) => navigate(route)}
        onOpenIdea={(ideaId) => (onOpenIdea ? onOpenIdea(ideaId) : navigate('inspire'))}
      />
    </div>
  )
}
