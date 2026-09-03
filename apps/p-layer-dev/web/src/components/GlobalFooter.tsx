import { useState } from 'react'
import { useI18n } from '../i18n'

/**
 * 全局页脚 —— 出现在所有页面之下。
 * 上方有一道细横线（border-top）作为分隔。
 *
 * - 点击 P-Layer 跳到官网（待开发，先用占位 URL）。
 * - 点击作者跳到个人主页（待开发，先用占位 URL）。
 * - Bug 反馈统一发到 coach.pia@outlook.com。
 * - 赞赏功能筹备中，点击弹出 toast。
 */
export function GlobalFooter() {
  const { lang, t } = useI18n()
  const [tipShown, setTipShown] = useState(false)

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <a
          className="app-footer-brand"
          href="https://p-layer.app"
          target="_blank"
          rel="noreferrer"
          title={lang === 'en' ? 'P-Layer · official site (coming soon)' : 'P-Layer 官网（待开发）'}
        >
          <img src="/p-layer-logo.png" alt="" />
          <span className="app-footer-brand-name">P-Layer</span>
        </a>
        <span className="app-footer-sep" aria-hidden="true" />
        <a
          className="app-footer-item"
          href="https://pinzhang.wang"
          target="_blank"
          rel="noreferrer"
          title={lang === 'en' ? "Author's personal page (coming soon)" : '作者个人主页（待开发）'}
        >
          {t('footerAuthor')}
          <strong>Pinzhang WANG</strong>
        </a>
        <span className="app-footer-sep" aria-hidden="true" />
        <a
          className="app-footer-item app-footer-with-icon"
          href="https://github.com/pinzhang999"
          target="_blank"
          rel="noreferrer"
        >
          <svg viewBox="0 0 24 24" className="app-footer-icon" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
          </svg>
          <span>{t('footerGitHub')} · pinzhang999</span>
        </a>
        <span className="app-footer-sep" aria-hidden="true" />
        <a
          className="app-footer-item app-footer-with-icon"
          href="mailto:coach.pia@outlook.com?subject=P-layer Bug Report"
          title={lang === 'en' ? 'Report a bug to Pia coach' : '向 Pia 教练反馈 Bug'}
        >
          <svg viewBox="0 0 24 24" className="app-footer-icon warning" aria-hidden="true">
            <path d="M12 2 1 21h22L12 2Zm0 3.5 8.3 14.5H3.7L12 5.5ZM11 11v5h2v-5h-2Zm0 7v2h2v-2h-2Z" />
          </svg>
          <span>{t('footerBug')}</span>
        </a>
        <span className="app-footer-sep" aria-hidden="true" />
        <button
          type="button"
          className="app-footer-item app-footer-with-icon app-footer-tip"
          onClick={() => {
            setTipShown(true)
            window.setTimeout(() => setTipShown(false), 2200)
          }}
          title={lang === 'en' ? 'Tip · coming soon' : '赞赏 · 待上线'}
        >
          <svg viewBox="0 0 24 24" className="app-footer-icon heart" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" />
          </svg>
          <span>{t('footerTip')}</span>
        </button>
      </div>
      {tipShown && <div className="app-footer-toast">{t('tipComingSoon')}</div>}
    </footer>
  )
}
