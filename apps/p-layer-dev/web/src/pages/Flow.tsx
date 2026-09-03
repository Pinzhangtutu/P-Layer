import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { useProject } from '../lib/useProject'
import {
  ETHICS_TEMPLATE,
  PREREG_TEMPLATE,
} from '../lib/literature'
import {
  FLOW_STAGES,
  VARIABLE_TYPES,
  flowProgress,
  newVariableId,
  readAnalysisHistory,
  readCoreVariables,
  readEthics,
  readFlowDone,
  readFlowNotes,
  readOptionalVariables,
  readPrereg,
  readRqDraft,
  writeCoreVariables,
  writeEthics,
  writeFlowDone,
  writeFlowNotes,
  writeOptionalVariables,
  writePrereg,
  writeRqDraft,
  type CoreVariables,
  type OptionalVariable,
} from '../lib/flow'

export function Flow() {
  const { lang, t } = useI18n()
  const { projects, active, mutate } = useProject()

  const notes = useMemo(() => readFlowNotes(active), [active, projects])
  const done = useMemo(() => readFlowDone(active), [active, projects])
  const rqDraft = useMemo(() => readRqDraft(active), [active, projects])
  const core = useMemo(() => readCoreVariables(active), [active, projects])
  const optional = useMemo(() => readOptionalVariables(active), [active, projects])
  const prereg = useMemo(() => readPrereg(active), [active, projects])
  const ethics = useMemo(() => readEthics(active), [active, projects])
  const history = useMemo(() => readAnalysisHistory(active), [active, projects])

  const [step, setStep] = useState(0)
  // 左侧步骤子导航的毛玻璃焦点：点中后该步高亮放大，其他 8 步瞬间模糊，560ms 后恢复
  const [stepFocus, setStepFocus] = useState<string | null>(null)
  const stepFocusTimer = useRef<number>(0)

  useEffect(() => {
    if (stepFocus) document.body.classList.add('flow-glass-focus')
    else document.body.classList.remove('flow-glass-focus')
    return () => document.body.classList.remove('flow-glass-focus')
  }, [stepFocus])
  const [draft, setDraft] = useState('')
  const [rqText, setRqText] = useState('')
  const [preregText, setPreregText] = useState('')
  const [ethicsText, setEthicsText] = useState('')
  const [coreDraft, setCoreDraft] = useState<CoreVariables>(core)
  const [saved, setSaved] = useState(false)

  // 切步骤 / 切项目时同步各输入区
  useEffect(() => {
    setDraft(notes[step] ?? '')
  }, [step, notes])

  useEffect(() => {
    setRqText(rqDraft)
  }, [rqDraft])

  useEffect(() => {
    setPreregText(prereg)
    setEthicsText(ethics)
  }, [prereg, ethics])

  useEffect(() => {
    setCoreDraft(core)
  }, [core])

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 1600)
    return () => clearTimeout(timer)
  }, [saved])

  // 边打字边存，不阻塞输入
  useEffect(() => {
    if (draft === (notes[step] ?? '')) return
    const timer = setTimeout(() => persistNotes(draft), 600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, step])

  function persistNotes(text: string) {
    mutate((project) => {
      const list = [...readFlowNotes(project)]
      list[step] = text
      writeFlowNotes(project, list)
    })
  }

  const flush = () => persistNotes(draft)

  const goto = (index: number) => {
    flush()
    const clamped = Math.max(0, Math.min(FLOW_STAGES.length - 1, index))
    setStep(clamped)
    // 触发左侧子导航的毛玻璃焦点
    const key = FLOW_STAGES[clamped].key
    setStepFocus(key)
    window.clearTimeout(stepFocusTimer.current)
    stepFocusTimer.current = window.setTimeout(() => setStepFocus(null), 560)
  }

  const toggleDone = () => {
    mutate((project) => {
      const list = [...readFlowDone(project)]
      list[step] = !list[step]
      writeFlowDone(project, list)
    })
  }

  const stage = FLOW_STAGES[step]
  const progress = flowProgress(done)
  const isDone = done[step] === true

  const saveRq = () => {
    mutate((project) => writeRqDraft(project, rqText))
    setSaved(true)
  }

  const saveCore = () => {
    mutate((project) => writeCoreVariables(project, coreDraft))
    setSaved(true)
  }

  const addOptional = () => {
    const item: OptionalVariable = {
      id: newVariableId(),
      type: 'C',
      name: '',
      definition: '',
      timing: '处理前',
      plan: '',
    }
    mutate((project) => writeOptionalVariables(project, [...readOptionalVariables(project), item]))
  }

  const patchOptional = (id: string, patch: Partial<OptionalVariable>) => {
    mutate((project) => {
      const list = readOptionalVariables(project).map((v) => (v.id === id ? { ...v, ...patch } : v))
      writeOptionalVariables(project, list)
    })
  }

  const removeOptional = (id: string) => {
    mutate((project) => {
      writeOptionalVariables(
        project,
        readOptionalVariables(project).filter((v) => v.id !== id),
      )
    })
  }

  const saveTemplates = () => {
    mutate((project) => {
      writePrereg(project, preregText)
      writeEthics(project, ethicsText)
    })
    setSaved(true)
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>{t('flow')}</h1>
        <p>{t('flowSub')}</p>
      </div>

      <div className="flow-layout">
        <aside className="flow-steps">
          <div className="flow-progress">
            <div className="flow-progress-bar">
              <i style={{ width: `${progress}%` }} />
            </div>
            <small>
              {done.filter(Boolean).length} / {FLOW_STAGES.length} · {progress}%
            </small>
          </div>
          {FLOW_STAGES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`flow-step${i === step ? ' is-current' : ''}${stepFocus === s.key ? ' flow-focus-target' : ''}${done[i] ? ' is-done' : ''}`}
              onClick={() => goto(i)}
            >
              <span className="flow-step-no">{String(i + 1).padStart(2, '0')}</span>
              <span className="flow-step-title">{lang === 'en' ? s.title.en : s.title.zh}</span>
              {done[i] ? <span className="flow-step-check">✓</span> : null}
            </button>
          ))}
        </aside>

        <section className="card flow-card">
          <div className="head">
            <div>
              <h2>
                {String(step + 1).padStart(2, '0')} {lang === 'en' ? stage.title.en : stage.title.zh}
              </h2>
              <h3>{lang === 'en' ? stage.question.en : stage.question.zh}</h3>
            </div>
            <span className="tag">
              {step + 1} / {FLOW_STAGES.length}
            </span>
          </div>

          <p className="flow-hint">{lang === 'en' ? stage.hint.en : stage.hint.zh}</p>

          {/* 第 1 步：研究问题（头脑风暴也会写这份 rqDraft） */}
          {stage.key === 'rq' ? (
            <div className="flow-block">
              <label className="flow-label">{t('rqField')}</label>
              <textarea
                className="textarea"
                rows={3}
                value={rqText}
                placeholder={t('rqPlaceholder')}
                onChange={(e) => setRqText(e.target.value)}
              />
              <div className="flow-block-actions">
                <button className="btn" onClick={() => saveRq()} disabled={rqText === rqDraft}>
                  {t('save')}
                </button>
                {rqText.trim() && rqText !== rqDraft ? (
                  <button
                    className="btn"
                    onClick={() => {
                      setDraft((prev) => (prev ? prev : rqText))
                      saveRq()
                    }}
                  >
                    {t('fillFromRq')}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* 第 3 步：变量操作化 */}
          {stage.key === 'variables' ? (
            <div className="flow-block">
              <label className="flow-label">{t('coreVariables')}</label>
              <div className="flow-var-grid">
                {(['IV', 'DV', 'M', 'W'] as const).map((key) => (
                  <label key={key}>
                    <b>{key}</b>
                    <input
                      className="input"
                      value={coreDraft[key]}
                      placeholder={t(`var_${key}` as 'var_IV')}
                      onChange={(e) => setCoreDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>
              <button className="btn" onClick={saveCore}>
                {t('save')}
              </button>

              <div className="flow-subhead">
                <b>{t('optionalVariables')}</b>
                <button className="btn" onClick={addOptional}>
                  ＋ {t('addVariable')}
                </button>
              </div>
              {optional.length ? (
                optional.map((v) => (
                  <div key={v.id} className="flow-optional-row">
                    <select
                      className="select"
                      value={v.type}
                      onChange={(e) => patchOptional(v.id, { type: e.target.value })}
                    >
                      {VARIABLE_TYPES.map((type) => (
                        <option key={type.key} value={type.key}>
                          {lang === 'en' ? type.en : type.zh}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input"
                      value={v.name}
                      placeholder={t('varName')}
                      onChange={(e) => patchOptional(v.id, { name: e.target.value })}
                    />
                    <input
                      className="input"
                      value={v.definition}
                      placeholder={t('varDefinition')}
                      onChange={(e) => patchOptional(v.id, { definition: e.target.value })}
                    />
                    <button className="btn flow-optional-del" onClick={() => removeOptional(v.id)}>
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <p className="flow-empty">{t('noOptionalVariables')}</p>
              )}
              <p className="flow-note">{t('covariateNote')}</p>
            </div>
          ) : null}

          {/* 第 5 步：预注册 / 伦理 */}
          {stage.key === 'prereg' ? (
            <div className="flow-block">
              <label className="flow-label">{t('preregTemplate')}</label>
              <textarea
                className="textarea"
                rows={7}
                value={preregText}
                placeholder={PREREG_TEMPLATE}
                onChange={(e) => setPreregText(e.target.value)}
              />
              <label className="flow-label">{t('ethicsTemplate')}</label>
              <textarea
                className="textarea"
                rows={7}
                value={ethicsText}
                placeholder={ETHICS_TEMPLATE}
                onChange={(e) => setEthicsText(e.target.value)}
              />
              <div className="flow-block-actions">
                <button className="btn primary" onClick={saveTemplates}>
                  {t('saveStepRecord')}
                </button>
                {!preregText ? (
                  <button className="btn" onClick={() => setPreregText(PREREG_TEMPLATE)}>
                    {t('useTemplate')}
                  </button>
                ) : null}
                {!ethicsText ? (
                  <button className="btn" onClick={() => setEthicsText(ETHICS_TEMPLATE)}>
                    {t('useEthicsTemplate')}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* 第 8 步：分析归档（只读，由 R 分析写入） */}
          {stage.key === 'analysis' ? (
            <div className="flow-block">
              <div className="flow-archive">
                <b>{t('archivedRuns', { n: history.length })}</b>
                <span>{t('archiveNote')}</span>
              </div>
              {history.length ? (
                <div className="flow-archive-list">
                  {history.slice(0, 8).map((run, i) => (
                    <div key={i} className="flow-archive-row">
                      <b>{run.analysis_type || t('analysis')}</b>
                      <small>{run.source || ''}</small>
                      <small>{run.time ? new Date(run.time).toLocaleString() : ''}</small>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* 每一步都有的自由记录 */}
          <div className="flow-block">
            <label className="flow-label">{t('stepNotes')}</label>
            <textarea
              className="textarea flow-notes"
              rows={6}
              value={draft}
              placeholder={t('stepNotesPlaceholder')}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={flush}
            />
          </div>

          <div className="flow-actions">
            <button className="btn" onClick={() => goto(step - 1)} disabled={step === 0}>
              {t('prevStep')}
            </button>
            <button className={`btn${isDone ? '' : ' primary'}`} onClick={toggleDone}>
              {isDone ? t('markUndone') : t('markDone')}
            </button>
            <button className="btn" onClick={() => goto(step + 1)} disabled={step === FLOW_STAGES.length - 1}>
              {t('nextStep')}
            </button>
            {saved ? <span className="flow-saved">{t('saved')}</span> : null}
          </div>
        </section>
      </div>
    </div>
  )
}
