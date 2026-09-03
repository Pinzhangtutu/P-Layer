import { useState, type DragEvent } from 'react'
import type { ApplicationStatus } from '../../lib/projects'
import type { Application } from '../../lib/projects'
import type { Lang } from '../../i18n'
import { ApplicationCard } from './ApplicationCard'

type ColumnDef = { key: ApplicationStatus; labelZh: string; labelEn: string }

type Props = {
  column: ColumnDef
  apps: Application[]
  lang: Lang
  selectedId: string | null
  onSelect: (id: string) => void
  onDropCard: (status: ApplicationStatus, id: string | null) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
}

export function BoardColumn({
  column,
  apps,
  lang,
  selectedId,
  onSelect,
  onDropCard,
  onDragStart,
  onDragEnd,
}: Props) {
  const [isOver, setIsOver] = useState(false)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsOver(true)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsOver(false)
    // 优先用 dataTransfer 里的 id；拿不到时回落到 Board 用 ref 记录的 id
    onDropCard(column.key, e.dataTransfer.getData('text/plain') || null)
  }

  return (
    <div
      className={`board-column${isOver ? ' is-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
    >
      <header className="board-column-head">
        <span className="board-column-title">{lang === 'en' ? column.labelEn : column.labelZh}</span>
        <span className="board-column-count">{apps.length}</span>
      </header>

      <div className="board-column-body">
        {apps.length === 0 ? (
          <p className="board-column-empty">{lang === 'en' ? 'Drop here' : '拖到此处'}</p>
        ) : (
          apps.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              selected={app.id === selectedId}
              onSelect={() => onSelect(app.id)}
              onDragStart={(e) => {
                // 把 id 放进 dataTransfer：drop 时能同步读到，不依赖 React state 更新
                e.dataTransfer.setData('text/plain', app.id)
                e.dataTransfer.effectAllowed = 'move'
                onDragStart(app.id)
              }}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </div>
  )
}
