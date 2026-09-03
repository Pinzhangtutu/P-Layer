import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { useProject } from '../lib/useProject'
import { Board } from './Board'
import { ResearchNetwork } from '../components/ResearchNetwork'
import {
  clampProgress,
  deriveDeadline,
  deriveProgress,
  ganttPosition,
  hasValidDates,
  readGanttSteps,
  readMilestones,
  seedMilestone,
  seedStep,
  type GanttStep,
  type Milestone,
} from '../lib/planning'

type ProjectView = 'planning' | 'network' | 'board'

export function Projects({ initialView = 'planning' }: { initialView?: ProjectView }) {
  const { lang, t } = useI18n()
  const { projects, active, activeId, mutate, switchTo, createProject } = useProject()

  const milestones = useMemo(() => readMilestones(active), [active, projects])
  const ganttSteps = useMemo(() => readGanttSteps(active), [active, projects])

  const [name, setName] = useState(active.name ?? '')
  const [participants, setParticipants] = useState(String(active.participants ?? 0))
  const [saved, setSaved] = useState(false)
  const [view, setView] = useState<ProjectView>(initialView)

  useEffect(() => {
    setName(active.name ?? '')
    setParticipants(String(active.participants ?? 0))
  }, [active.id, active.name, active.participants])

  useEffect(() => setView(initialView), [initialView])

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 1600)
    return () => clearTimeout(timer)
  }, [saved])

  const writePlanning = (nextMilestones: Milestone[], nextSteps: GanttStep[]) => {
    mutate((project) => {
      project.milestones = nextMilestones
      project.ganttSteps = nextSteps
      project.progress = deriveProgress(nextSteps)
      project.deadline = deriveDeadline(nextMilestones)
    })
  }

  const patchMilestone = (id: string, patch: Partial<Milestone>) => {
    writePlanning(
      milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      ganttSteps,
    )
  }

  const patchStep = (id: string, patch: Partial<GanttStep>) => {
    writePlanning(
      milestones,
      ganttSteps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    )
  }

  const addMilestone = () => {
    const next = [...milestones, seedMilestone(milestones.length, (milestones.length + 1) * 30)]
    writePlanning(next, ganttSteps)
  }

  const removeMilestone = (id: string) => {
    writePlanning(
      milestones.filter((m) => m.id !== id),
      ganttSteps.map((s) => (s.milestone === id ? { ...s, milestone: '' } : s)),
    )
  }

  const addStep = () => {
    const next = [...ganttSteps, seedStep(milestones[0]?.id ?? '')]
    writePlanning(milestones, next)
  }

  const removeStep = (id: string) => {
    writePlanning(
      milestones,
      ganttSteps.filter((s) => s.id !== id),
    )
  }

  const saveHeader = () => {
    mutate((project) => {
      project.name = name.trim() || project.name
      project.participants = Number(participants) || 0
    })
    setSaved(true)
  }

  const overall = deriveProgress(ganttSteps)
  const deadline = deriveDeadline(milestones)
  const showBars = hasValidDates(ganttSteps)

  return (
    <div className="page">
      <div className="page-head">
        <h1>{t('projects')}</h1>
        <p>{t('projectsSub')}</p>
      </div>

      <div className="pm-switcher">
        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`pm-chip${p.id === activeId ? ' is-active' : ''}`}
            onClick={() => switchTo(p.id)}
          >
            {p.name || t('untitledProject')}
          </button>
        ))}
        <button type="button" className="pm-chip pm-chip-new" onClick={() => createProject(t('newProjectName'))}>
          ＋ {t('newProject')}
        </button>
      </div>

      <div className="pm-view-tabs" role="tablist" aria-label={lang === 'en' ? 'Project management views' : '项目管理视图'}>
        <button type="button" role="tab" aria-selected={view === 'planning'} className={view === 'planning' ? 'active' : ''} onClick={() => setView('planning')}>
          {lang === 'en' ? 'Project planning' : '项目规划'}
        </button>
        <button type="button" role="tab" aria-selected={view === 'network'} className={view === 'network' ? 'active' : ''} onClick={() => setView('network')}>
          {lang === 'en' ? 'Research network' : '研究网络'}
        </button>
        <button type="button" role="tab" aria-selected={view === 'board'} className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>
          {lang === 'en' ? 'Board' : '看板'}
        </button>
      </div>

      {view === 'board' ? <Board /> : view === 'network' ? <ResearchNetwork /> : <>
      <section className="card pm-card">
        <div className="head">
          <div>
            <h2>{t('projects')}</h2>
            <h3>{t('pmCardNote')}</h3>
          </div>
          <span className="tag">Gantt planning</span>
        </div>

        <div className="pm-head-grid">
          <label>
            {t('projectName')}
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            {t('participants')}
            <input
              className="input"
              type="number"
              min={0}
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
            />
          </label>
        </div>

        <div className="pm-subhead">
          <b>{t('milestones')}</b>
          <button type="button" className="btn" onClick={addMilestone}>
            ＋ {t('addMilestone')}
          </button>
        </div>

        {milestones.length ? (
          <div className="pm-milestone-grid">
            {milestones.map((m, i) => (
              <div key={m.id} className="pm-milestone">
                <div className="pm-milestone-no">
                  Milestone {i + 1}
                  <button
                    type="button"
                    className="pm-del"
                    onClick={() => removeMilestone(m.id)}
                    aria-label={t('delete')}
                  >
                    ×
                  </button>
                </div>
                <input
                  className="input"
                  value={m.name}
                  placeholder={t('milestoneName')}
                  onChange={(e) => patchMilestone(m.id, { name: e.target.value })}
                />
                <input
                  className="input"
                  type="date"
                  value={m.deadline}
                  onChange={(e) => patchMilestone(m.id, { deadline: e.target.value })}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="pm-empty">{t('noMilestones')}</p>
        )}

        <div className="pm-subhead">
          <b>{t('ganttSteps')}</b>
          <button type="button" className="btn" onClick={addStep}>
            ＋ {t('addGanttStep')}
          </button>
        </div>

        {ganttSteps.length ? (
          <div className="pm-gantt">
            <div className="pm-gantt-head">
              <span>{t('ganttStep')}</span>
              <span>{t('milestone')}</span>
              <span>{t('start')}</span>
              <span>{t('end')}</span>
              <span>{t('progress')}</span>
              <span>{t('timeline')}</span>
              <span />
            </div>
            {ganttSteps.map((step) => {
              const pos = ganttPosition(step, ganttSteps)
              return (
                <div key={step.id} className="pm-gantt-row">
                  <input
                    className="input"
                    value={step.title}
                    placeholder={t('ganttStepTitle')}
                    onChange={(e) => patchStep(step.id, { title: e.target.value })}
                  />
                  <select
                    className="select"
                    value={step.milestone}
                    onChange={(e) => patchStep(step.id, { milestone: e.target.value })}
                  >
                    <option value="">—</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || t('untitledMilestone')}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    type="date"
                    value={step.start}
                    onChange={(e) => patchStep(step.id, { start: e.target.value })}
                  />
                  <input
                    className="input"
                    type="date"
                    value={step.end}
                    onChange={(e) => patchStep(step.id, { end: e.target.value })}
                  />
                  <input
                    className="input pm-gantt-progress"
                    type="number"
                    min={0}
                    max={100}
                    value={step.progress}
                    onChange={(e) => patchStep(step.id, { progress: clampProgress(e.target.value) })}
                  />
                  <div className="pm-gantt-track">
                    {showBars ? (
                      <i
                        className="pm-gantt-bar"
                        style={{ left: `${pos.left}%`, width: `${pos.width}%` }}
                        data-progress={`${step.progress}%`}
                      />
                    ) : (
                      <span className="pm-gantt-na">{t('needDates')}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="pm-del"
                    onClick={() => removeStep(step.id)}
                    aria-label={t('delete')}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="pm-empty">{t('noGanttSteps')}</p>
        )}

        <div className="toolbar">
          <button type="button" className="btn primary" onClick={saveHeader}>
            {t('saveProjectStatus')}
          </button>
          {saved ? <span className="pm-saved">{t('saved')}</span> : null}
        </div>
      </section>

      <section className="card pm-card">
        <div className="head">
          <div>
            <h2>{t('allProjects')}</h2>
            <h3>{t('allProjectsNote')}</h3>
          </div>
        </div>
        <div className="pm-all">
          {projects.map((p) => {
            const steps = Array.isArray(p.ganttSteps) ? p.ganttSteps : []
            const ms = Array.isArray(p.milestones) ? p.milestones : []
            return (
              <button
                key={p.id}
                type="button"
                className={`pm-row${p.id === activeId ? ' is-active' : ''}`}
                onClick={() => switchTo(p.id)}
              >
                <span>
                  <b>{p.name || t('untitledProject')}</b>
                  <small>
                    {steps.length} {t('stepsSuffix')} · {ms.length} {t('milestoneSuffix')}
                  </small>
                </span>
                <span className="pm-pill">{p.progress ?? 0}%</span>
              </button>
            )
          })}
          {!projects.length ? <p className="pm-empty">{t('noProjects')}</p> : null}
        </div>
      </section>

      <section className="card pm-card pm-summary">
        <div className="pm-summary-item">
          <span>{t('overallProgress')}</span>
          <b>{overall}%</b>
          <div className="pm-meter">
            <i style={{ width: `${overall}%` }} />
          </div>
        </div>
        <div className="pm-summary-item">
          <span>{t('participants')}</span>
          <b>{active.participants ?? 0}</b>
        </div>
        <div className="pm-summary-item">
          <span>{t('finalDeadline')}</span>
          <b>{deadline || t('notSet')}</b>
          <small>{lang === 'en' ? 'Latest milestone' : '取最晚的里程碑'}</small>
        </div>
      </section>
      </>}
    </div>
  )
}
