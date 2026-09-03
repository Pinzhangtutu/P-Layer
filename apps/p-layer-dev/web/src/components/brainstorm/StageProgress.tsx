import { STAGES, doneCount, type BrainstormSession } from '../../lib/brainstorm'
import type { Lang } from '../../i18n'

/**
 * 8 步进度条。每格显示序号，已填的用实心点。
 * 已完成的步骤可点击回看 —— 原则是不删除用户写过的东西，所以允许跳回任意一步。
 */
export function StageProgress({
  session,
  lang,
  onJump,
}: {
  session: BrainstormSession
  lang: Lang
  onJump: (index: number) => void
}) {
  return (
    <div className="bt-progress">
      {STAGES.map((stage, i) => {
        const filled = session.steps[i]?.text.trim().length > 0
        const cur = i === session.current && session.status !== 'completed'
        const done = i < session.current || (i === session.current && session.status === 'completed')
        const cls = ['bt-prog', done ? 'done' : '', cur ? 'cur' : ''].filter(Boolean).join(' ')
        return (
          <button
            key={stage.key}
            type="button"
            className={cls}
            title={lang === 'en' ? stage.title.en : stage.title.zh}
            onClick={() => onJump(i)}
          >
            <span className="bt-prog-dot">{filled ? '●' : '○'}</span>
            <small>{i + 1}</small>
          </button>
        )
      })}
      <span className="bt-progress-count">{doneCount(session)}/8</span>
    </div>
  )
}
