import { daysUntil, initials, initialsColor, PRIORITY_OPTIONS, type Application } from '../../lib/projects'

type Props = {
  app: Application
  selected: boolean
  onSelect: () => void
  /** 通过 dataTransfer 传递 id，避免依赖 React state 的异步更新 */
  onDragStart: (e: React.DragEvent<HTMLElement>) => void
  onDragEnd: () => void
}

export function ApplicationCard({ app, selected, onSelect, onDragStart, onDragEnd }: Props) {
  const days = daysUntil(app.deadline)
  const priority = PRIORITY_OPTIONS.find((p) => p.key === app.priority) ?? PRIORITY_OPTIONS[1]

  const dayClass =
    days === null ? '' : days < 0 ? ' is-overdue' : days <= 14 ? ' is-urgent' : days <= 30 ? ' is-soon' : ''

  return (
    <article
      className={`board-card${selected ? ' is-selected' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
    >
      <div className="board-card-top">
        <span className="board-avatar" style={{ background: initialsColor(app.name) }}>
          {initials(app.name)}
        </span>
        <div className="board-card-title">
          <strong>{app.name}</strong>
          {app.owner ? <small>{app.owner}</small> : null}
        </div>
        <span className="board-pri" style={{ background: priority.color }}>
          {priority.key.toUpperCase()}
        </span>
      </div>

      {app.description ? <p className="board-card-desc">{app.description}</p> : null}

      {app.tags && app.tags.length > 0 ? (
        <div className="board-tags">
          {app.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="board-tag">
              {tag}
            </span>
          ))}
          {app.tags.length > 4 ? <span className="board-tag-more">+{app.tags.length - 4}</span> : null}
        </div>
      ) : null}

      {days !== null ? (
        <div className="board-card-foot">
          <span className={`board-day${dayClass}`}>
            <i className="board-day-dot" />
            {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
          </span>
        </div>
      ) : null}
    </article>
  )
}
