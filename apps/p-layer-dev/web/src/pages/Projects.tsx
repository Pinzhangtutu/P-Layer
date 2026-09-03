import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { useProject } from '../lib/useProject'
import { Board } from './Board'
import { ResearchNetwork } from '../components/ResearchNetwork'
import { normBrainstorm, rqOf } from '../lib/brainstormV1'
import { readIdeas, type Idea } from '../lib/ideas'
import { PageIntro } from '../components/PageIntro'
import {
  studyStageCount,
  STUDY_STAGES,
  type Study,
  type StudyRecord,
  type StudyStageKey,
  type StudyStatus,
} from '../lib/projects'

type ProjectView = 'planning' | 'network' | 'board'

/**
 * 研究项目（方案 3 + §5.3/§12 收敛，2026-09-03）
 *
 * 本页只管理「用户主动成立的正式 Research Project」，不再展示旧 Gantt 项目管理：
 * - 规划视图 = 正式研究项目：RQ 导入 → 九步执行结构（研究问题→理论假设→变量→
 *   设计→预注册→招募→冻结审计→分析→回到假设）+ §12 预留接口摘要
 * - 旧 milestones/ganttSteps/participants 字段数据保留（不删），旧 UI 下线
 *
 * v1 不自动把 RQ 升级为项目——由用户在此主动导入。
 */
export function Projects({ initialView = 'planning' }: { initialView?: ProjectView }) {
  const { lang, t } = useI18n()
  const { projects, active, activeId, mutate, switchTo, createProject } = useProject()
  const [view, setView] = useState<ProjectView>(initialView)

  useEffect(() => setView(initialView), [initialView])

  const ideas = useMemo(() => (active ? readIdeas(active) : []), [active, projects])

  /* 候选 RQ：优先 promoted Idea 的 rq 文本（头脑风暴推进后写入），
     再回落 project.notes.rqDraft。 */
  const candidateRq = useMemo(() => {
    if (!active) return null
    const promoted = ideas.find((i) => i.status === 'promoted')
    if (promoted) {
      const rq = rqOf(normBrainstorm(promoted.brainstorm))
      if (rq.trim()) return { ideaId: promoted.id, ideaText: promoted.text, rqText: rq }
    }
    const notes = (active.notes ?? {}) as Record<string, unknown>
    const draft = typeof notes.rqDraft === 'string' && notes.rqDraft.trim() ? notes.rqDraft : ''
    if (draft) return { ideaId: null, ideaText: '', rqText: draft }
    return null
  }, [active, ideas])

  /** 用户主动导入 RQ 为正式研究项目（§12：不自动升级） */
  const importRq = () => {
    if (!candidateRq || !active) return
    const now = new Date().toISOString()
    mutate((p) => {
      const record: StudyRecord = {
        rqIdeaId: candidateRq.ideaId ?? undefined,
        rqText: candidateRq.rqText,
        status: 'active',
        stagesDone: { rq: true },
        startedAt: now,
      }
      p.study = {
        record,
        dataVersions: [],
        analyses: [],
        effects: [],
        deviations: [],
        assumptionResults: [],
      }
    })
  }

  /** 勾选/取消某一步完成（用户主动标记，数据只追加） */
  const toggleStage = (key: StudyStageKey) => {
    if (!active?.study) return
    mutate((p) => {
      if (!p.study) return
      const done = !!p.study.record.stagesDone?.[key]
      p.study = {
        ...p.study,
        record: {
          ...p.study.record,
          stagesDone: { ...(p.study.record.stagesDone ?? {}), [key]: !done },
        },
      }
    })
  }

  /** 更改 Study 状态 */
  const setStudyStatus = (status: StudyStatus) => {
    if (!active?.study) return
    mutate((p) => {
      if (!p.study) return
      p.study = { ...p.study, record: { ...p.study.record, status } }
    })
  }

  /** 结束正式研究项目（归档式下线，不删数据） */
  const closeStudy = () => {
    if (!active?.study) return
    mutate((p) => {
      if (!p.study) return
      p.study = {
        ...p.study,
        record: { ...p.study.record, status: 'completed', endedAt: new Date().toISOString() },
      }
    })
  }

  return (
    <div className="page">
      <PageIntro
        eyebrow="Formal research / 9-step execution"
        title={t('projects')}
        desc={
          lang === 'en'
            ? 'Research projects are formal studies you decide to start — imported from a research question you have formed. Each project follows a nine-step execution structure: research question, theory & hypothesis, variables, design, preregistration, recruitment, audit, analysis, and back to hypothesis.'
            : '研究项目是你自己决定成立的正式研究：从已形成的研究问题导入，沿九步执行结构推进——研究问题、理论假设、变量、设计、预注册、招募、审计、分析、回到假设。v1 不自动把 RQ 升级为项目，由你主动导入。'
        }
        cite={lang === 'en' ? 'v1 never auto-promotes an RQ — you decide when it becomes a project.' : 'v1 不自动把 RQ 升级为项目——由你决定何时正式立项。'}
      />

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

      <div className="pm-view-tabs" role="tablist" aria-label={lang === 'en' ? 'Research project views' : '研究项目视图'}>
        <button type="button" role="tab" aria-selected={view === 'planning'} className={view === 'planning' ? 'active' : ''} onClick={() => setView('planning')}>
          {lang === 'en' ? 'Formal research' : '正式研究'}
        </button>
        <button type="button" role="tab" aria-selected={view === 'network'} className={view === 'network' ? 'active' : ''} onClick={() => setView('network')}>
          {lang === 'en' ? 'Research network' : '研究网络'}
        </button>
        <button type="button" role="tab" aria-selected={view === 'board'} className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>
          {lang === 'en' ? 'Board' : '看板'}
        </button>
      </div>

      {view === 'board' ? (
        <Board />
      ) : view === 'network' ? (
        <ResearchNetwork />
      ) : (
        <FormalResearch
          study={active?.study}
          candidateRq={candidateRq}
          activeName={active?.name ?? ''}
          lang={lang}
          t={t}
          onImportRq={importRq}
          onToggleStage={toggleStage}
          onSetStatus={setStudyStatus}
          onClose={closeStudy}
        />
      )}
    </div>
  )
}

function FormalResearch({
  study,
  candidateRq,
  activeName,
  lang,
  t,
  onImportRq,
  onToggleStage,
  onSetStatus,
  onClose,
}: {
  study?: Study
  candidateRq: { ideaId: string | null; ideaText: string; rqText: string } | null
  activeName: string
  lang: 'zh' | 'en'
  t: (k: string, p?: Record<string, unknown>) => string
  onImportRq: () => void
  onToggleStage: (k: StudyStageKey) => void
  onSetStatus: (s: StudyStatus) => void
  onClose: () => void
}) {
  if (!study) {
    return (
      <section className="card pm-study-card">
        <div className="head">
          <div>
            <h2>📋 {lang === 'en' ? 'No formal research project yet' : '还没有正式研究项目'}</h2>
            <h3>
              {lang === 'en'
                ? '"Formal research" only manages projects you decide to start. v1 does not auto-promote an RQ.'
                : '「正式研究」只管理你自己决定成立的研究项目——v1 不会自动把 RQ 升级为项目。'}
            </h3>
          </div>
          <span className="tag">{lang === 'en' ? 'Awaiting import' : '待导入'}</span>
        </div>

        {candidateRq ? (
          <div className="pm-study-import">
            <div className="pm-study-import-rq">
              <b>{lang === 'en' ? 'Ready to import' : '可导入的研究问题'}</b>
              <p>“{candidateRq.rqText}”</p>
              <small>
                {candidateRq.ideaId
                  ? lang === 'en'
                    ? `From promoted Idea · ${candidateRq.ideaText.slice(0, 60)}`
                    : `来自已推进的 Idea · ${candidateRq.ideaText.slice(0, 60)}`
                  : lang === 'en'
                    ? 'From your latest RQ draft'
                    : '来自最近的 RQ 草稿'}
              </small>
            </div>
            <button type="button" className="btn primary" onClick={onImportRq}>
              🎯 {lang === 'en' ? 'Import as formal research project' : '导入为正式研究项目'}
            </button>
          </div>
        ) : (
          <div className="pm-study-empty">
            <p>
              {lang === 'en'
                ? 'No RQ draft yet — go to Brainstorm, form an RQ, then return here to import it.'
                : '还没有可导入的 RQ——先去「头脑风暴」形成研究问题，再回到这里主动导入。'}
            </p>
            <small>
              {lang === 'en'
                ? 'The 9-step structure (question → theory → variables → design → preregistration → recruitment → audit → analysis → back to hypothesis) is the contract for future data, analysis and effect records.'
                : '导入后将启用 研究问题→理论→变量→设计→预注册→招募→审计→分析→回到假设 九步执行结构。'}
            </small>
          </div>
        )}
      </section>
    )
  }

  const stagesDone = study.record.stagesDone ?? {}
  const analyses = study.analyses ?? []
  const versions = study.dataVersions ?? []
  const effects = study.effects ?? []
  const outcomes = study.assumptionResults ?? []

  return (
    <>
      <section className="card pm-study-card">
        <div className="head">
          <div>
            <h2>📋 {activeName || (lang === 'en' ? 'Formal research project' : '正式研究项目')}</h2>
            <h3>
              {lang === 'en'
                ? '9-step execution · the study contract for future data versions, analyses, effects, CIs and deviations (§12).'
                : '九步执行结构 · 未来数据版本 / 分析 / 效应量 / 置信区间 / 偏离记录 的契约（§12）。'}
            </h3>
          </div>
          <span className="tag">{studyStageCount(study)}/{STUDY_STAGES.length}</span>
        </div>

        <div className="pm-study-body">
          {/* 状态 + RQ */}
          <div className="pm-study-status">
            <span className="pm-study-status-label">{lang === 'en' ? 'Status' : '状态'}</span>
            <select
              className="select pm-study-status-select"
              value={study.record.status}
              onChange={(e) => onSetStatus(e.target.value as StudyStatus)}
            >
              {(['active', 'paused', 'completed', 'abandoned', 'draft'] as StudyStatus[]).map((s) => (
                <option key={s} value={s}>
                  {studyStatusLabel(s, lang)}
                </option>
              ))}
            </select>
            <small className="pm-study-rq">RQ · {study.record.rqText || (lang === 'en' ? '(empty)' : '（空）')}</small>
            <small className="pm-study-started">
              {study.record.startedAt ? (lang === 'en' ? 'Started ' : '开始 ') + study.record.startedAt.slice(0, 10) : ''}
              {study.record.endedAt ? ' · ' + (lang === 'en' ? 'Ended ' : '结束 ') + study.record.endedAt.slice(0, 10) : ''}
            </small>
          </div>

          {/* 九步执行（可勾选 · 只追加不覆盖） */}
          <div>
            <div className="pm-study-step-hint">
              {lang === 'en' ? 'Mark a step when you finish it — data is appended, nothing is overwritten.' : '完成一步就勾选一步——只追加记录，不覆盖旧成果。'}
            </div>
            <ul className="pm-study-stages">
              {STUDY_STAGES.map((s) => {
                const done = !!stagesDone[s.key]
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      className={`pm-study-stage${done ? ' is-done' : ''}`}
                      onClick={() => onToggleStage(s.key)}
                    >
                      <span className="pm-study-stage-no">{s.no}</span>
                      <span className="pm-study-stage-name">{lang === 'en' ? s.en : s.zh}</span>
                      <em className="pm-study-stage-mark">{done ? '✓' : '○'}</em>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* §12 预留接口摘要 */}
        <div className="pm-study-interfaces">
          <small className="pm-study-interfaces-title">{lang === 'en' ? '§12 reserved interfaces' : '§12 预留接口'}</small>
          <div className="pm-study-interfaces-grid">
            <span className="pm-study-interface"><b>DataVersion</b> · {versions.length}</span>
            <span className="pm-study-interface"><b>Analysis</b> · {analyses.length}</span>
            <span className="pm-study-interface"><b>Effect / CI</b> · {effects.length}</span>
            <span className="pm-study-interface"><b>Deviation</b> · {(study.deviations ?? []).length}</span>
            <span className="pm-study-interface"><b>AssumptionOutcome</b> · {outcomes.length}</span>
          </div>
          {analyses.length ? (
            <ul className="pm-study-analyses">
              {analyses.map((a) => (
                <li key={a.id} className={`pm-study-analysis status-${a.status}${a.reserved ? ' is-reserved' : ''}`}>
                  <em>{a.type}</em>
                  {a.stage ? <small> · {a.stage}</small> : null}
                  <span className="pm-study-analysis-status">{a.status}</span>
                  {a.reserved ? <small className="pm-study-analysis-note"> (v1 reserved)</small> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="toolbar pm-study-actions">
          {study.record.status !== 'completed' ? (
            <button type="button" className="btn" onClick={onClose}>
              {lang === 'en' ? '✔ Complete project' : '✔ 标记完成'}
            </button>
          ) : null}
        </div>
      </section>
    </>
  )
}

function studyStatusLabel(status: StudyStatus, lang: 'zh' | 'en'): string {
  const map: Record<StudyStatus, { zh: string; en: string }> = {
    draft: { zh: '草稿', en: 'Draft' },
    active: { zh: '执行中', en: 'Active' },
    paused: { zh: '已暂停', en: 'Paused' },
    completed: { zh: '已完成', en: 'Completed' },
    abandoned: { zh: '已放弃', en: 'Abandoned' },
  }
  return map[status]?.[lang] ?? status
}
