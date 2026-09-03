import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import { useProject } from '../lib/useProject'
import { askAssistant } from '../lib/api'

type Msg = { role: 'user' | 'pia'; text: string }

/**
 * Pia! 全局悬浮对话（P-Layer 个人版）
 *
 * 右下角悬浮按钮 → 打开 Pia! 对话卡。Pia! 是本地科研教练：
 * 只澄清/示范/提供反例，不替用户写结论；对话不自动写入任何正式记录
 * （建议入档前由用户确认，§13）。
 *
 * 注意：Pia! 回答来自本机 Ollama（POST /api/assistant → 127.0.0.1:8766
 * Python 后端），后端未启动时显示「暂时不可用」。
 */
export function PiaFloating() {
  const { lang, t } = useI18n()
  const { active } = useProject()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [msgs, open])

  async function send(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setMsgs((m) => [...m, { role: 'user', text }])
    setInput('')
    setBusy(true)
    try {
      const res = await askAssistant({
        page: 'pia-floating',
        prompt: text,
        project: { id: active?.id || '', name: active?.name || '', milestones: [], steps: [] },
        context: { research_question: '', fields: [] },
        language: lang === 'en' ? 'en' : 'zh-CN',
        ai_config: {},
      })
      setMsgs((m) => [...m, { role: 'pia', text: res.content || '' }])
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err)
      const msg =
        lang === 'en'
          ? `Pia! is not ready yet: ${raw} — open Settings → Pia! Local Model to start Ollama.`
          : `Pia! 暂时不可用：${raw} —— 请到「设置 → Pia! 本地模型」启动 Ollama 后再试。`
      setMsgs((m) => [...m, { role: 'pia', text: msg }])
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="pia-float"
        onClick={() => setOpen(true)}
        title={t('piaCoach')}
        aria-label={t('piaCoach')}
      >
        <span className="pia-float-avatar" aria-hidden="true">🐯</span>
        <span className="pia-float-label">Pia!</span>
      </button>
    )
  }

  return (
    <div className="pia-float-panel" role="dialog" aria-label={t('piaCoach')}>
      <header className="pia-float-head">
        <span className="pia-float-head-avatar" aria-hidden="true">🐯</span>
        <span className="pia-float-head-title">
          <b>Pia!</b>
          <small>{t('piaCoach')}</small>
        </span>
        <button type="button" className="pia-float-close" onClick={() => setOpen(false)} aria-label="×">
          ×
        </button>
      </header>

      <div className="pia-float-msgs" ref={listRef}>
        {msgs.length === 0 ? (
          <p className="pia-float-empty">
            {lang === 'en'
              ? 'Ask me to clarify a concept, a method, or an assumption — I coach, you decide.'
              : '问我澄清概念、方法或假设——我只当教练，判断始终由你保留。'}
          </p>
        ) : null}
        {msgs.map((m, i) => (
          <div key={i} className={`pia-msg is-${m.role}`}>
            <span className="pia-msg-role">{m.role === 'user' ? (lang === 'en' ? 'You' : '我') : 'Pia!'}</span>
            <p>{m.text}</p>
          </div>
        ))}
        {busy ? (
          <div className="pia-msg is-pia">
            <span className="pia-msg-role">Pia!</span>
            <p className="pia-msg-busy">{lang === 'en' ? 'thinking…' : '思考中…'}</p>
          </div>
        ) : null}
      </div>

      <form className="pia-float-form" onSubmit={send}>
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={lang === 'en' ? 'Ask Pia!…' : '向 Pia! 提问…'}
          aria-label={t('v1AskPia')}
        />
        <button type="submit" className="btn primary" disabled={busy || !input.trim()}>
          ↑
        </button>
      </form>
    </div>
  )
}
