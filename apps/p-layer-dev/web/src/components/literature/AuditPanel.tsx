import { useI18n } from '../../i18n'
import {
  AUDIT_STATUSES,
  ISSUE_TYPES,
  creatorLine,
  tagLabels,
  type AuditRecord,
  type AuditStatus,
  type IssueType,
} from '../../lib/literature'

export function AuditForm({
  record,
  onSave,
  onCancel,
}: {
  record: AuditRecord
  onSave: (record: AuditRecord) => void
  onCancel: () => void
}) {
  const { lang, t } = useI18n()

  return (
    <form
      className="lit-audit-form"
      onSubmit={(e) => {
        e.preventDefault()
        const form = e.currentTarget
        const data = new FormData(form)
        onSave({
          ...record,
          title: String(data.get('title') ?? ''),
          zoteroKey: String(data.get('zoteroKey') ?? ''),
          sourceUrl: String(data.get('sourceUrl') ?? ''),
          localPath: String(data.get('localPath') ?? ''),
          issueType: String(data.get('issueType') ?? 'theory') as IssueType,
          status: String(data.get('status') ?? 'open') as AuditStatus,
          note: String(data.get('note') ?? ''),
          evidence: String(data.get('evidence') ?? ''),
          link: String(data.get('link') ?? ''),
          updatedAt: new Date().toISOString(),
        })
      }}
    >
      <div className="lit-audit-form-head">
        <div>
          <b>{t('newAudit')}</b>
          <p>{t('auditHint')}</p>
        </div>
        <button type="button" className="lit-audit-close" onClick={onCancel} aria-label={t('close')}>
          ×
        </button>
      </div>

      <div className="lit-audit-linked">
        <b>{t('linkedSource')}</b>
        <span>{record.title || t('noSourceYet')}</span>
        {record.zoteroKey ? <small>Zotero key: {record.zoteroKey}</small> : null}
      </div>

      <div className="lit-audit-grid">
        <label>
          {t('paperTitle')}
          <input name="title" defaultValue={record.title} placeholder={t('paperTitlePlaceholder')} />
        </label>
        <label>
          Zotero key
          <input name="zoteroKey" defaultValue={record.zoteroKey} placeholder="ABCD1234" />
        </label>
      </div>

      <div className="lit-audit-grid">
        <label>
          DOI / URL
          <input name="sourceUrl" defaultValue={record.sourceUrl} placeholder="https://doi.org/…" />
        </label>
        <label>
          {t('localPath')}
          <input name="localPath" defaultValue={record.localPath} placeholder="/Users/…/paper.pdf" />
        </label>
      </div>

      <div className="lit-audit-grid">
        <label>
          {t('issueType')}
          <select name="issueType" defaultValue={record.issueType}>
            {ISSUE_TYPES.map((row) => (
              <option key={row.key} value={row.key}>
                {lang === 'en' ? row.en : row.zh}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('auditStatus')}
          <select name="status" defaultValue={record.status}>
            {AUDIT_STATUSES.map((row) => (
              <option key={row.key} value={row.key}>
                {lang === 'en' ? row.en : row.zh}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        {t('whatToCheck')}
        <textarea name="note" rows={4} required defaultValue={record.note} placeholder={t('whatToCheckPlaceholder')} />
      </label>

      <div className="lit-audit-grid">
        <label>
          {t('evidence')}
          <input name="evidence" defaultValue={record.evidence} placeholder={t('evidencePlaceholder')} />
        </label>
        <label>
          {t('extraLink')}
          <input name="link" defaultValue={record.link} placeholder={t('extraLinkPlaceholder')} />
        </label>
      </div>

      <div className="lit-audit-form-actions">
        <button type="submit" className="btn primary">
          {t('saveAudit')}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          {t('cancel')}
        </button>
      </div>
    </form>
  )
}

export function AuditList({
  records,
  onEdit,
  onDelete,
  onToBrainstorm,
  onCopy,
}: {
  records: AuditRecord[]
  onEdit: (record: AuditRecord) => void
  onDelete: (id: string) => void
  onToBrainstorm: (record: AuditRecord) => void
  onCopy: (value: string) => void
}) {
  const { lang, t } = useI18n()

  if (!records.length) {
    return <div className="lit-audit-empty">{t('noAudits')}</div>
  }

  return (
    <div className="lit-audit-list">
      {records.map((record) => {
        const status = AUDIT_STATUSES.find((r) => r.key === record.status) ?? AUDIT_STATUSES[0]
        const type = ISSUE_TYPES.find((r) => r.key === record.issueType) ?? ISSUE_TYPES[6]
        return (
          <article key={record.id} className="lit-audit-record">
            <div className="lit-audit-top">
              <div>
                <span className="lit-audit-type">{lang === 'en' ? type.en : type.zh}</span>
                <h4>{record.title || t('untitledSource')}</h4>
              </div>
              <span className={`lit-audit-status is-${record.status}`}>
                {lang === 'en' ? status.en : status.zh}
              </span>
            </div>

            <p className="lit-audit-note">{record.note}</p>
            {record.evidence ? (
              <p className="lit-audit-evidence">
                {t('evidence')}: <b>{record.evidence}</b>
              </p>
            ) : null}

            <div className="lit-audit-source">
              {record.zoteroUri ? (
                <a className="lit-source-link" href={record.zoteroUri}>
                  Zotero ↗
                </a>
              ) : null}
              {record.sourceUrl && record.sourceUrl !== record.zoteroUri && /^https?:\/\//i.test(record.sourceUrl) ? (
                <a className="lit-source-link" href={record.sourceUrl} target="_blank" rel="noopener">
                  DOI / web ↗
                </a>
              ) : null}
              {record.localPath ? (
                <button type="button" className="lit-copy-path" onClick={() => onCopy(record.localPath)}>
                  {t('copyLocalPath')}
                </button>
              ) : null}
              {record.link ? (
                /^(https?:\/\/|zotero:\/\/)/i.test(record.link) ? (
                  <a className="lit-source-link" href={record.link} target="_blank" rel="noopener">
                    {t('extraLink')} ↗
                  </a>
                ) : (
                  <button type="button" className="lit-copy-path" onClick={() => onCopy(record.link)}>
                    {t('copyExtraPath')}
                  </button>
                )
              ) : null}
              {!record.zoteroUri && !record.sourceUrl && !record.localPath && !record.link ? (
                <span className="lit-no-link">{t('noSourceLink')}</span>
              ) : null}
            </div>

            <div className="lit-audit-actions">
              <button type="button" className="btn" onClick={() => onEdit(record)}>
                {t('continueWork')}
              </button>
              <button type="button" className="btn" onClick={() => onToBrainstorm(record)}>
                {t('toBrainstorm')}
              </button>
              <button type="button" className="btn lit-audit-delete" onClick={() => onDelete(record.id)}>
                {t('deleteRecord')}
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export { creatorLine, tagLabels }
