import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'

/**
 * 浮动滚动指示牌 —— 页面主内容（.workspace-main）还有没展示完的部分时才出现。
 * 主内容（卡片/区块）已全部进入视口就隐藏，不被全局页脚撑高文档高度误触发。
 * force=true 时忽略判断，常驻显示（用于首页 hero 占满首屏需要明确指示的场景）；
 *   滚到页脚可见时仍然隐藏，避免盖页脚。
 */
export function ScrollHint({ force = false }: { force?: boolean }) {
  const { t } = useI18n()
  const [visible, setVisible] = useState(force)

  useEffect(() => {
    if (force) {
      setVisible(true)
      // 监听页脚可见性，滚到底时自动隐藏避免盖页脚
      const footer = document.querySelector('.app-footer') || document.querySelector('.global-footer')
      if (footer) {
        const io = new IntersectionObserver(
          (entries) => setVisible(!entries[0].isIntersecting),
          { threshold: 0.05 },
        )
        io.observe(footer)
        return () => io.disconnect()
      }
      return
    }
    function check() {
      const main = document.querySelector('.workspace-main') as HTMLElement | null
      if (!main) {
        setVisible(false)
        return
      }
      const mainBottom = main.getBoundingClientRect().bottom
      const viewportH = window.innerHeight
      setVisible(mainBottom > viewportH + 24)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [force])

  function handleClick() {
    window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      type="button"
      className="scroll-hint"
      onClick={handleClick}
      title={t('scrollDown')}
    >
      <span>{t('scrollDown')}</span>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 5v14M5 12l7 7 7-7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
