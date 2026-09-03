import { useI18n } from '../../i18n'
import { initials, initialsColor, type Application } from '../../lib/projects'
import type { SortKey } from '../../lib/projects'

type Props = {
  apps: Application[]
  total: number
  query: string
  onQuery: (value: string) => void
  sort: SortKey
  onSort: (value: SortKey) => void
  selectedId: string | null
  onSelect: (id: string) => void
}

export function BoardSidebar({
  apps,
  total,
  query,
  onQuery,
  sort,
  onSort,
  selectedId,
  onSelect,
}: Props) {
  const { lang, t } = useI18n()

  return (
    <aside className="board-side">
      <input
        className="board-search"
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder={t('searchPlaceholder')}
        aria-label={t('searchPlaceholder')}
      />

      <div className="board-side-row">
        <label className="board-sort">
          {t('sortBy')}
          <select value={sort} onChange={(e) => onSort(e.target.value as SortKey)}>
            <option value="deadline">{t('sortDeadline')}</option>
            <option value="priority">{t('sortPriority')}</option>
            <option value="name">{t('sortName')}</option>
            <option value="status">{t('sortStatus')}</option>
          </select>
        </label>
      </div>

      <div className="board-side-meta">{t('filteredCount', { a: apps.length, b: total })}</div>

      <ul className="board-side-list">
        {apps.length === 0 ? (
          <li className="board-side-empty">{total === 0 ? t('noApplications') : t('noMatch')}</li>
        ) : (
          apps.map((app) => (
            <li key={app.id}>
              <button
                className={`board-side-item${app.id === selectedId ? ' is-selected' : ''}`}
                onClick={() => onSelect(app.id)}
              >
                <span className="board-side-avatar" style={{ background: initialsColor(app.name) }}>
                  {initials(app.name)}
                </span>
                <span className="board-side-text">
                  <strong>{app.name}</strong>
                  <small>{app.owner || (lang === 'en' ? 'No owner' : '未指定负责人')}</small>
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  )
}
