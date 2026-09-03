import { researchQuestionOf, type BrainstormSession } from '../../lib/brainstorm'
import { useI18n } from '../../i18n'

export function CompletedView({
  session,
  status,
  onWriteRq,
  onCopy,
  onReopen,
}: {
  session: BrainstormSession
  status: string
  onWriteRq: () => void
  onCopy: () => void
  onReopen: () => void
}) {
  const { t } = useI18n()
  const rq = researchQuestionOf(session)

  return (
    <div className="bt-done">
      <div className="bt-done-mark">✓</div>
      <h4>{t('trainingComplete')}</h4>
      <p className="bt-done-note">{t('rqDraftLabel')}</p>
      <div className="bt-done-rq">{rq || t('emptyRq')}</div>
      <div className="bt-actions">
        <button type="button" className="btn primary" onClick={onWriteRq} disabled={!rq}>
          {t('writeToStep1')}
        </button>
        <button type="button" className="btn" onClick={onCopy} disabled={!rq}>
          {t('copy')}
        </button>
        <button type="button" className="btn" onClick={onReopen}>
          {t('editAgain')}
        </button>
      </div>
      {status ? <div className="bt-rq-status">{status}</div> : null}
    </div>
  )
}
