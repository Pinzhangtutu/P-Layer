import { useI18n } from '../i18n'

/**
 * PageIntro · 一级页面顶部"居中介绍"组件
 * 结构：eyebrow + 居中 h1 + 居中描述段 + 引用行（可选 Source 链接）
 * 复用 .science-cycle-intro 排版：max-width 820px 居中，h1 30-46px clamp，p 760px 居中
 */
export function PageIntro({
  eyebrow,
  title,
  desc,
  cite,
  citeHref,
  citeHrefTitle,
}: {
  eyebrow: string
  title: string
  desc: string
  cite?: string
  citeHref?: string
  citeHrefTitle?: string
}) {
  const { lang } = useI18n()
  return (
    <div className="page-intro">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{desc}</p>
        {cite ? (
          <p className="page-intro-citation">
            {cite}
            {citeHref ? (
              <>
                {' '}
                <a
                  href={citeHref}
                  target="_blank"
                  rel="noreferrer"
                  title={citeHrefTitle ?? (lang === 'en' ? 'Reference' : '参考链接')}
                >
                  Source
                </a>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  )
}
