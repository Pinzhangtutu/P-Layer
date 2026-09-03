import { useI18n } from '../../i18n'
import { MATURITY, type MaturityView } from '../../lib/ideas'

/** §9.1 成熟度徽章：文字 + 字母 + 颜色共同表达，不使用单一分数 */
export function MaturityBadge({ view }: { view: MaturityView }) {
  const { lang } = useI18n()
  const meta = MATURITY[view.level]
  const label = `${meta.level} ${lang === 'en' ? meta.en : meta.zh}`
  const manual = view.source === 'manual'
  const title =
    lang === 'en'
      ? `${label} · Min: ${meta.minEn}${manual ? ' · manually set (auto-derivation overridden)' : ' · derived from training progress'}`
      : `${label} · 最小成果：${meta.minZh}${manual ? ' · 手动设定（已覆盖自动推导）' : ' · 由训练进度自动推导'}`
  return (
    <span
      className={`idea-maturity-badge${manual ? ' is-manual' : ''}`}
      style={{ color: meta.color, borderColor: `${meta.color}55`, background: `${meta.color}1a` }}
      title={title}
    >
      {label}
    </span>
  )
}
