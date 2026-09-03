import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../i18n'
import {
  IDEA_CATEGORIES,
  IDEA_ORIGINS,
  classifyIdea,
  newIdeaId,
  readIdeas,
  writeIdeas,
  type Idea,
  type LiteratureSource,
} from '../../lib/ideas'
import { useProject } from '../../lib/useProject'

type Props = {
  literatureSource?: LiteratureSource | null
  onLiteratureConsumed?: () => void
}

export function IdeaForm({ literatureSource, onLiteratureConsumed }: Props) {
  const { lang, t } = useI18n()
  const { active, mutate, projects } = useProject()
  const ideas = useMemo(() => readIdeas(active), [active, projects])

  const [text, setText] = useState('')
  const [tags, setTags] = useState('')
  const [time, setTime] = useState(() => new Date().toISOString().slice(0, 16))
  const [location, setLocation] = useState('')
  const [origin, setOrigin] = useState<string>(
    literatureSource ? 'reading' : 'life',
  )
  const [caseText, setCaseText] = useState('')
  const [category, setCategory] = useState('auto')
  const [toast, setToast] = useState('')

  // 如果是文献联想带来的，预先填入文献标题作为占位提示
  useEffect(() => {
    if (literatureSource?.title && !text) {
      setText('')
    }
    if (literatureSource) {
      setOrigin('reading')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [literatureSource?.title])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 1600)
    return () => clearTimeout(timer)
  }, [toast])

  const tagSuggestions = useMemo(() => {
    const set = new Set<string>()
    ideas.forEach((idea) => idea.tags.forEach((tag) => tag && set.add(tag)))
    return Array.from(set)
  }, [ideas])

  const reset = () => {
    setText('')
    setTags('')
    setTime(new Date().toISOString().slice(0, 16))
    setLocation('')
    setOrigin('life')
    setCaseText('')
    setCategory('auto')
  }

  const save = () => {
    const value = text.trim()
    if (!value) {
      setToast(lang === 'en' ? 'Write an idea first' : '先写一个想法')
      return
    }
    const tagList = tags
      .split(/[,，]/)
      .map((v) => v.trim())
      .filter(Boolean)
    const resolvedCategory = category === 'auto' ? classifyIdea(value) : category
    const newIdea: Idea = {
      id: newIdeaId(),
      text: value,
      origin: (origin as Idea['origin']) || 'life',
      literatureSource: literatureSource ?? null,
      category: resolvedCategory,
      status: 'idea',
      lifecycle: 'active',
      created: new Date().toISOString(),
      tags: tagList,
      time,
      location,
      case: caseText,
    }
    mutate((project) => {
      const list = [newIdea, ...readIdeas(project)]
      writeIdeas(project, list)
    })
    setToast(t('ideaSave') + ' ✓')
    reset()
    onLiteratureConsumed?.()
  }

  const classifyAll = () => {
    mutate((project) => {
      const list = readIdeas(project).map((idea) => ({
        ...idea,
        category: classifyIdea(idea.text),
      }))
      writeIdeas(project, list)
    })
  }

  return (
    <div className="idea-form">
      <div className="idea-process">
        <div className="idea-step">
          <b>{t('ideaStepCapture')}</b>
          <small>{t('ideaStepCaptureHint')}</small>
        </div>
        <div className="idea-step">
          <b>{t('ideaStepTag')}</b>
          <small>{t('ideaStepTagHint')}</small>
        </div>
        <div className="idea-step">
          <b>{t('ideaStepClassify')}</b>
          <small>{t('ideaStepClassifyHint')}</small>
        </div>
        <div className="idea-step">
          <b>{t('ideaStepPromote')}</b>
          <small>{t('ideaStepPromoteHint')}</small>
        </div>
      </div>

      <div className="field">
        <label>{t('ideaTextLabel')}</label>
        <textarea
          className="textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            literatureSource?.title
              ? `${t('ideaTextPlaceholder')} — ${literatureSource.title}`
              : t('ideaTextPlaceholder')
          }
        />
      </div>

      {literatureSource && (
        <div className="literature-draft-context" role="note">
          <b>{t('ideaZoteroContext')}</b>
          <span>{literatureSource.title || t('ideaZoteroContext')}</span>
          {literatureSource.evidence && (
            <small>
              {t('ideaZoteroEvidence')}
              {literatureSource.evidence}
            </small>
          )}
          <em>{t('ideaZoteroNote')}</em>
        </div>
      )}

      <div className="idea-capture-grid">
        <div className="field">
          <label>{t('ideaTagsLabel')}</label>
          <input
            className="input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            list="idea-tag-suggestions"
            placeholder={t('ideaTagsPlaceholder')}
          />
          <datalist id="idea-tag-suggestions">
            {tagSuggestions.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
          <small className="field-help">{t('ideaTagsHint')}</small>
        </div>
        <div className="field">
          <label>{t('ideaTimeLabel')}</label>
          <input
            className="input"
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div className="field">
          <label>{t('ideaLocationLabel')}</label>
          <input
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('ideaLocationPlaceholder')}
          />
        </div>
        <div className="field idea-origin-field">
          <label>{t('ideaOriginLabel')}</label>
          <select
            className="select"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          >
            {IDEA_ORIGINS.map((o) => (
              <option key={o.key} value={o.key}>
                {lang === 'en' ? o.en : o.zh}
              </option>
            ))}
          </select>
          <small className="field-help">{t('ideaOriginHint')}</small>
        </div>
      </div>

      <div className="field">
        <label>{t('ideaCaseLabel')}</label>
        <input
          className="input"
          value={caseText}
          onChange={(e) => setCaseText(e.target.value)}
          placeholder={t('ideaCasePlaceholder')}
        />
      </div>

      <div className="idea-toolbar">
        <select
          className="select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="auto">{t('ideaCategoryAuto')}</option>
          {IDEA_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="button" className="btn primary" onClick={save}>
          {t('ideaSave')}
        </button>
        <button type="button" className="btn" onClick={classifyAll}>
          {t('ideaClassifyAll')}
        </button>
      </div>

      {toast && <div className="idea-toast">{toast}</div>}
    </div>
  )
}
