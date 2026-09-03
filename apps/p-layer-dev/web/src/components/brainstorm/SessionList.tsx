import { doneCount, type BrainstormSession } from '../../lib/brainstorm'
import { useI18n } from '../../i18n'

export function SessionList({
  sessions,
  onOpen,
  onDelete,
}: {
  sessions: BrainstormSession[]
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { t } = useI18n()
  if (!sessions.length) {
    return <p className="bt-empty">{t('noSessions')}</p>
  }

  return (
    <div className="bt-list">
      {sessions.map((s) => (
        <div key={s.id} className="bt-list-item">
          <button type="button" className="bt-list-main" onClick={() => onOpen(s.id)}>
            <b>{s.title}</b>
            <small>
              {t('stepsDone', { a: doneCount(s), b: 8 })} ·{' '}
              {s.status === 'completed' ? t('trainingCompleted') : t('trainingInProgress')}
            </small>
          </button>
          <div className="bt-list-actions">
            <button type="button" className="btn" onClick={() => onOpen(s.id)}>
              {s.status === 'completed' ? t('reviewTraining') : t('continueTraining')}
            </button>
            <button type="button" className="btn bt-list-del" onClick={() => onDelete(s.id)} title={t('delete')}>
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
