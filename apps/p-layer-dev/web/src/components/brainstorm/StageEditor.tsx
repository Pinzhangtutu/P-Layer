import { useState } from 'react'
import { STAGES, ABANDONED_STAGE_INDEX, type BrainstormSession } from '../../lib/brainstorm'
import { useI18n } from '../../i18n'
import { PiaAnswer } from './PiaAnswer'

export type PiaState =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'done'; title: string; content: string }
  | { state: 'error'; message: string }

export function StageEditor({
  session,
  draft,
  onDraft,
  onPrev,
  onNext,
  onAskPia,
  onAddAbandoned,
  pia,
}: {
  session: BrainstormSession
  draft: string
  onDraft: (text: string) => void
  onPrev: () => void
  onNext: () => void
  onAskPia: () => void
  onAddAbandoned: (text: string) => void
  pia: PiaState
}) {
  const { lang, t } = useI18n()
  const [abandonedDraft, setAbandonedDraft] = useState('')
  const i = session.current
  const stage = STAGES[i]
  const isLast = i === STAGES.length - 1

  return (
    <div className="bt-editor">
      <div className="bt-stage-head">
        <span className="bt-stage-no">
          {String(i + 1).padStart(2, '0')} / {String(STAGES.length).padStart(2, '0')}
        </span>
        <h4>{lang === 'en' ? stage.title.en : stage.title.zh}</h4>
      </div>

      <p className="bt-guide">{lang === 'en' ? stage.guide.en : stage.guide.zh}</p>
      <p className="bt-hint">{lang === 'en' ? stage.hint.en : stage.hint.zh}</p>

      <textarea
        className="textarea bt-step-input"
        rows={4}
        value={draft}
        placeholder={t('stepPlaceholder')}
        onChange={(e) => onDraft(e.target.value)}
      />

      {i === ABANDONED_STAGE_INDEX ? (
        <div className="bt-abandoned">
          <label>{t('abandonedLabel')}</label>
          {session.abandoned.length ? (
            <div className="bt-abandoned-list">
              {session.abandoned.map((a, idx) => (
                <div key={idx} className="bt-abandoned-item">
                  <span>{a.text}</span>
                  <small>{a.at}</small>
                </div>
              ))}
            </div>
          ) : null}
          <div className="bt-abandoned-add">
            <input
              className="input bt-abandoned-input"
              value={abandonedDraft}
              placeholder={t('abandonedPlaceholder')}
              onChange={(e) => setAbandonedDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && abandonedDraft.trim()) {
                  onAddAbandoned(abandonedDraft)
                  setAbandonedDraft('')
                }
              }}
            />
            <button
              type="button"
              className="btn"
              disabled={!abandonedDraft.trim()}
              onClick={() => {
                onAddAbandoned(abandonedDraft)
                setAbandonedDraft('')
              }}
            >
              {t('keepRecord')}
            </button>
          </div>
        </div>
      ) : null}

      <div className="bt-actions">
        <button type="button" className="btn" onClick={onPrev} disabled={i === 0}>
          {t('prevStep')}
        </button>
        <button type="button" className="btn bt-help" onClick={onAskPia} disabled={pia.state === 'loading'}>
          {pia.state === 'loading' ? t('piaThinking') : t('askPia')}
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={onNext}
          disabled={!draft.trim()}
          title={draft.trim() ? undefined : t('needText')}
        >
          {isLast ? t('draftRq') : t('saveAndNext')}
        </button>
      </div>

      {pia.state === 'loading' ? (
        <div className="bt-pia-output">
          <div className="r-loading">
            <span className="r-spinner" />
            {t('piaThinking')}
          </div>
          <small className="bt-pia-note">{t('piaLocalNote')}</small>
        </div>
      ) : null}
      {pia.state === 'done' ? (
        <div className="bt-pia-output">
          <div className="ai-output-title">{pia.title}</div>
          <PiaAnswer content={pia.content} />
        </div>
      ) : null}
      {pia.state === 'error' ? (
        <div className="bt-pia-output">
          <div className="result warn">{pia.message}</div>
        </div>
      ) : null}
    </div>
  )
}
