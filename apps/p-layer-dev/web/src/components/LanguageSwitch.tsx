import { useI18n } from '../i18n'

/**
 * 语言滑动开关。
 *
 * 旧版这个组件被 5 个脚本同时改写（line5 handler / line386 IIFE /
 * applyLanguage / settings() / navigation-architecture.js languageControl），
 * 导致"有时是滑动钮、有时变普通按钮"。React 版只有一个数据来源：useI18n()。
 */
export function LanguageSwitch() {
  const { lang, setLang } = useI18n()
  const isEnglish = lang === 'en'

  return (
    <button
      type="button"
      className={`language-switch${isEnglish ? ' is-english' : ''}`}
      role="switch"
      aria-checked={isEnglish}
      aria-label={isEnglish ? 'Switch to 中文' : '切换到 English'}
      onClick={() => setLang(isEnglish ? 'zh' : 'en')}
    >
      <span data-language-option="zh" className={isEnglish ? undefined : 'selected'}>
        中文
      </span>
      <span data-language-option="en" className={isEnglish ? 'selected' : undefined}>
        EN
      </span>
      <i aria-hidden="true" />
    </button>
  )
}
