import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { useProject } from '../../lib/useProject'
import { askAssistant } from '../../lib/api'
import { generateBriefPdf, PDF_TYPES, pdfTypeLabel, defaultPdfType, type PdfTypeKey } from '../../lib/briefPdf'
import { readIdeas, maturityOf } from '../../lib/ideas'
import { MaturityBadge } from './MaturityBadge'
import {
  STAGES,
  FEEDBACK_TYPES,
  RECHECK_ITEMS,
  normBrainstorm,
  saveStageV1,
  saveVersionV1,
  addFeedback,
  addPdf,
  restoreVersion,
  stageValue,
  ideaLabel,
  versionToken,
  type StageKey,
  type BrainstormData,
} from '../../lib/brainstormV1'
import type { Translate } from '../../i18n'
import type { Idea } from '../../lib/ideas'

type ModalState =
  | { kind: 'version'; v: number }
  | { kind: 'compare' }
  | { kind: 'feedback' }
  | null

export function TrainingPanelV1({
  idea,
  initialStep,
  onClose,
  onNavigate,
}: {
  idea: Idea
  initialStep?: string
  onClose: () => void
  onNavigate: (route: string) => void
}) {
  const { t, lang } = useI18n()
  const { active, mutate } = useProject()
  /* 从 store 实时读 idea（mutate 后 active 更新 → 这里跟着更新），
     避免 useState 旧引用导致 rq 出口面板等条件渲染不刷新 */
  const liveIdea = useMemo(() => {
    const list = active ? readIdeas(active) : []
    return list.find((i) => i.id === idea.id) || idea
  }, [active, idea])
  const b = useMemo(() => normBrainstorm(liveIdea.brainstorm), [liveIdea])
  const [step, setStep] = useState<StageKey>(() => {
    const init = initialStep && STAGES.some((s) => s.key === initialStep) ? (initialStep as StageKey) : null
    return init || b.currentStep || 'idea'
  })
  const [modal, setModal] = useState<ModalState>(null)
  const [pdfPick, setPdfPick] = useState(false)
  const [toast, setToast] = useState('')
  const [piaBusy, setPiaBusy] = useState(false)
  const [piaAnswer, setPiaAnswer] = useState('')
  const toastTimer = useRef<number>(0)

  useEffect(() => {
    return () => window.clearTimeout(toastTimer.current)
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 1800)
  }

  function saveStage(key: StageKey, text: string) {
    mutate((p) => {
      const list = (p.notes as Record<string, unknown>)['ideasV2']
      if (!Array.isArray(list)) return
      const found = list.find((x): x is Idea => x && typeof x === 'object' && (x as Idea).id === idea.id)
      if (!found) return
      const bb = normBrainstorm(found.brainstorm)
      saveStageV1(bb, key, text)
      found.brainstorm = bb
    })
  }

  function goto(key: StageKey) {
    setStep(key)
    mutate((p) => {
      const list = (p.notes as Record<string, unknown>)['ideasV2']
      if (!Array.isArray(list)) return
      const found = list.find((x): x is Idea => x && typeof x === 'object' && (x as Idea).id === idea.id)
      if (!found) return
      const bb = normBrainstorm(found.brainstorm)
      bb.currentStep = key
      found.brainstorm = bb
    })
  }

  function withBrainstorm(fn: (bb: BrainstormData) => void, after?: () => void) {
    mutate((p) => {
      const list = (p.notes as Record<string, unknown>)['ideasV2']
      if (!Array.isArray(list)) return
      const found = list.find((x): x is Idea => x && typeof x === 'object' && (x as Idea).id === idea.id)
      if (!found) return
      const bb = normBrainstorm(found.brainstorm)
      fn(bb)
      found.brainstorm = bb
    })
    if (after) after()
  }

  const current = STAGES.find((s) => s.key === step) || STAGES[0]
  const isRqStep = step === 'rq'
  const rqText = stageValue(b, 'rq')
  const filledCount = STAGES.filter((s) => s.key !== 'recheck' && stageValue(b, s.key).trim()).length

  /* ---------- PDF ---------- */
  async function doPdf(version?: { v: number; label: string; savedAt: string; steps: Record<string, string>; rq: string }, type?: PdfTypeKey) {
    try {
      const typeKey = type || defaultPdfType(version ? version.rq : rqText)
      const fileName = await generateBriefPdf(idea.text, idea.id, b, version as never, { name: b.name, lang, type: typeKey })
      withBrainstorm((bb) => addPdf(bb, version ? version.v : (bb.versions[bb.versions.length - 1]?.v || 0), fileName, typeKey))
      showToast(t('v1PdfGenerated') + ': ' + fileName)
    } catch (err) {
      showToast(t('v1PdfFailed') + ': ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  /* ---------- Pia! 帮助（可选，不落库） ---------- */
  async function askPia() {
    setPiaBusy(true)
    setPiaAnswer('')
    try {
      const prompt = `用户正在做头脑风暴第 ${current.no} 步「${lang === 'en' ? current.title.en : current.title.zh}」。\n步骤说明：${lang === 'en' ? current.guide.en : current.guide.zh}\n用户已写：${stageValue(b, step) || '（还没写）'}\n请只解释这一步怎么做、给一个例子，不要替用户写结论。`
      const res = await askAssistant({
        page: 'brainstorm',
        prompt,
        project: { id: active?.id || '', name: active?.name || '', milestones: [], steps: [] },
        context: { research_question: rqText, fields: [] },
        language: lang === 'en' ? 'en' : 'zh-CN',
        ai_config: {},
      })
      setPiaAnswer(res.content || '')
    } catch (err) {
      setPiaAnswer(t('v1PiaError') + (err instanceof Error ? err.message : String(err)))
    } finally {
      setPiaBusy(false)
    }
  }

  /* ---------- 反馈 ---------- */
  function openFeedback() {
    setModal({ kind: 'feedback' })
  }
  function saveFeedback(types: string[], text: string) {
    if (!text.trim()) {
      showToast(t('v1FbEmpty'))
      return
    }
    const pdfV = b.pdfs.length ? b.pdfs[b.pdfs.length - 1].version : null
    withBrainstorm((bb) => addFeedback(bb, types, text, pdfV))
    setModal(null)
    showToast(t('v1FbSaved'))
  }

  /* ---------- promote：写入正式研究项目入口 ---------- */
  function promote() {
    if (!rqText.trim()) {
      showToast(t('v1PromoteNeedRq'))
      return
    }
    mutate((p) => {
      p.notes = p.notes || {}
      ;(p.notes as Record<string, unknown>)['rqDraft'] = rqText
      ;(p.notes as Record<string, unknown>)['rqDraftMeta'] = { fromIdea: idea.id, updatedAt: new Date().toISOString() }
      const list = (p.notes as Record<string, unknown>)['ideasV2']
      if (Array.isArray(list)) {
        const found = list.find((x): x is Idea => x && typeof x === 'object' && (x as Idea).id === idea.id)
        if (found) {
          found.status = 'promoted'
          found.lifecycle = 'converted'
        }
      }
    })
    onClose()
    onNavigate('flow')
  }

  /* 暂停：训练状态置「已暂停」，同时把 Idea 资产生命周期置 paused（§9.1） */
  function pauseIdea() {
    mutate((p) => {
      const list = (p.notes as Record<string, unknown>)['ideasV2']
      if (!Array.isArray(list)) return
      const found = list.find((x): x is Idea => x && typeof x === 'object' && (x as Idea).id === idea.id)
      if (!found) return
      const bb = normBrainstorm(found.brainstorm)
      bb.status = '已暂停'
      found.brainstorm = bb
      if (found.lifecycle === undefined || found.lifecycle === 'active') found.lifecycle = 'paused'
    })
    onClose()
  }

  /* ---------- 渲染 ---------- */
  const rail = (
    <nav className="loop-rail">
      {STAGES.map((s) => {
        const done = !!stageValue(b, s.key).trim()
        const cur = s.key === step
        return (
          <button
            key={s.key}
            type="button"
            className={`loop-stage${cur ? ' is-current' : ''}${done ? ' is-done' : ''}`}
            data-stage={s.key}
            onClick={() => goto(s.key)}
          >
            <span className="loop-stage-no">{s.no}</span>
            <span className="loop-stage-name">{lang === 'en' ? s.title.en : s.title.zh}</span>
            {done ? <span className="loop-stage-check">✓</span> : null}
          </button>
        )
      })}
    </nav>
  )

  const exitPanel =
    isRqStep && rqText.trim() ? (
      <div className="loop-exit">
        <h3>{t('v1ExitTitle')}</h3>
        <p className="loop-exit-sub">{t('v1ExitSub')}</p>
        <div className="loop-exit-grid">
          <button type="button" className={`loop-exit-card${pdfPick ? ' is-active' : ''}`} onClick={() => setPdfPick((p) => !p)}>📄 {t('v1ExitPdf')}</button>
          <button type="button" className="loop-exit-card" onClick={() => { onClose(); onNavigate('flow') }}>📋 {t('v1ExitFlow')}</button>
          <button type="button" className="loop-exit-card" onClick={() => { onClose(); onNavigate('literature') }}>📚 {t('v1ExitLit')}</button>
          <button type="button" className="loop-exit-card" onClick={openFeedback}>💬 {t('v1ExitFb')}</button>
          <button type="button" className="loop-exit-card" onClick={() => goto('recheck')}>🔍 {t('v1ExitRecheck')}</button>
          <button type="button" className="loop-exit-card" onClick={promote}>🚀 {t('v1ExitPromote')}</button>
          <button type="button" className="loop-exit-card" onClick={pauseIdea}>⏸ {t('v1ExitPause')}</button>
        </div>
        {pdfPick ? (
          <div className="loop-pdf-pick">
            <b>{t('v1PdfPickType')}</b>
            <div className="loop-pdf-pick-chips">
              {PDF_TYPES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className="loop-pdf-pick-chip"
                  onClick={() => { setPdfPick(false); doPdf(undefined, p.key as PdfTypeKey) }}
                >
                  {lang === 'en' ? p.en : p.zh}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {b.pdfs.length ? (
          <div className="loop-pdf-history">
            <b>{t('v1PdfHistory')}</b>
            {b.pdfs.slice().reverse().map((p, i) => (
              <span key={i}>V{p.version} · {p.fileName} · {pdfTypeLabel(p.type || 'rq-brief', lang)} · {t('v1On')} {(p.createdAt || '').slice(0, 10)}</span>
            ))}
          </div>
        ) : null}
      </div>
    ) : null

  const editor =
    step === 'recheck' ? (
      <RecheckView
        b={b}
        ideaText={idea.text}
        onSaveRecheck={(text) => saveStage('recheck', text)}
        onConfirm={(text, mode) => {
          saveStage('recheck', text)
          withBrainstorm((bb) => saveVersionV1(bb, mode === 'revise' ? t('v1ReviseLabel') : t('v1ConfirmLabel'), true))
          showToast(mode === 'revise' ? t('v1ReviseDone') : t('v1ConfirmDone'))
        }}
        onView={(v) => setModal({ kind: 'version', v })}
        onCompare={() => setModal({ kind: 'compare' })}
        onRestore={(v) => {
          withBrainstorm((bb) => restoreVersion(bb, v))
          showToast(t('v1Restored') + ' V' + v)
        }}
        onPdf={(v) => doPdf(v)}
        lang={lang}
      />
    ) : (
      <div className="loop-editor-inner">
        <header className="loop-step-head">
          <h2><span className="loop-step-no">{current.no}</span> {lang === 'en' ? current.title.en : current.title.zh}</h2>
          <p className="loop-guide">{lang === 'en' ? current.guide.en : current.guide.zh}</p>
        </header>
        <label className="loop-field">
          <span className="loop-output-label">{lang === 'en' ? current.output.en : current.output.zh}</span>
          <textarea
            className="textarea loop-textarea"
            data-step={current.key}
            key={step}
            defaultValue={stageValue(b, step)}
            placeholder={lang === 'en' ? current.placeholder.en : current.placeholder.zh}
            onBlur={(e) => saveStage(step, e.target.value)}
          />
        </label>
        <div className="loop-saved-hint">{t('v1AutoSave')}</div>
        <div className="loop-toolbar">
          <button type="button" className="btn" disabled={STAGES.findIndex((s) => s.key === step) === 0} onClick={() => goto(STAGES[Math.max(0, STAGES.findIndex((s) => s.key === step) - 1)].key)}>← {t('v1Back')}</button>
          <button type="button" className="btn" onClick={askPia} disabled={piaBusy}>{piaBusy ? t('v1PiaBusy') : t('v1AskPia')}</button>
          <button type="button" className="btn primary" onClick={() => goto(STAGES[Math.min(STAGES.length - 1, STAGES.findIndex((s) => s.key === step) + 1)].key)}>{t('v1Next')} →</button>
        </div>
        {piaAnswer ? (
          <div className="loop-pia" data-pia>
            <div className="loop-pia-card"><b>Pia!</b><p>{piaAnswer}</p></div>
          </div>
        ) : null}
        {exitPanel}
      </div>
    )

  return (
    <div className="loop-overlay" id="loopTraining">
      <div className="loop-shell">
        <div className="loop-head">
          <button type="button" className="btn loop-back" onClick={onClose}>← {t('v1BackToList')}</button>
          <div className="loop-head-title">
            <b>{ideaLabel(idea.text, b)}</b>
            <span className="loop-head-badges">
              <MaturityBadge view={maturityOf(liveIdea)} />
              <span className={`loop-status loop-status-${b.status}`}>{b.status}</span>
            </span>
          </div>
          <button type="button" className="btn" onClick={() => {
            const ta = document.querySelector<HTMLTextAreaElement>('#loopTraining .loop-textarea')
            if (ta && ta.dataset.step) saveStage(ta.dataset.step as StageKey, ta.value)
            withBrainstorm((bb) => saveVersionV1(bb, t('v1ManualSave')))
            showToast(t('v1VersionSaved') + ' V' + (b.versions.length + 1))
          }}>{t('v1SaveVersion')}</button>
        </div>
        <div className="loop-progress"><i style={{ width: `${Math.round((STAGES.findIndex((s) => s.key === step) / (STAGES.length - 1)) * 100)}%` }} /></div>
        <div className="loop-main">
          {rail}
          <div className="loop-editor">{editor}</div>
        </div>
        <div className="loop-meta-line">{t('v1Filled')}: {filledCount}/9</div>
      </div>
      {toast ? <div className="loop-toast">{toast}</div> : null}
      {modal?.kind === 'version' ? <VersionModal b={b} v={modal.v} ideaId={idea.id} t={t} lang={lang} onClose={() => setModal(null)} /> : null}
      {modal?.kind === 'compare' ? <CompareModal b={b} t={t} lang={lang} onClose={() => setModal(null)} /> : null}
      {modal?.kind === 'feedback' ? <FeedbackModal b={b} t={t} lang={lang} onSave={saveFeedback} onClose={() => setModal(null)} /> : null}
    </div>
  )
}

/* ================= Recheck 视图 ================= */
function RecheckView({
  b, ideaText, onSaveRecheck, onConfirm, onView, onCompare, onRestore, onPdf, lang,
}: {
  b: BrainstormData
  ideaText: string
  onSaveRecheck: (text: string) => void
  onConfirm: (text: string, mode: 'confirm' | 'revise') => void
  onView: (v: number) => void
  onCompare: () => void
  onRestore: (v: number) => void
  onPdf: (v: { v: number; label: string; savedAt: string; steps: Record<string, string>; rq: string }) => void
  lang: string
}) {
  const [text, setText] = useState(stageValue(b, 'recheck'))
  return (
    <div>
      <header className="loop-step-head">
        <h2><span className="loop-step-no">10</span> {lang === 'en' ? 'Re-check Assumptions' : '重新检查假设'}</h2>
        <p className="loop-guide">{lang === 'en' ? 'Review all 9 stages and check logic, premises, literature support and evidence direction. Pia! only offers optional reflection; the decision is yours.' : '回看 9 步成果，逐项检查逻辑、前提、文献依据与证据方向。Pia! 只提供可选反思，不替你决定。'}</p>
      </header>

      <div className="loop-recheck-summary">
        <b>{lang === 'en' ? 'Idea' : '原始 Idea'}: {ideaText}</b>
        {STAGES.filter((s) => s.key !== 'recheck').map((s) => (
          <div key={s.key} className="loop-recheck-row">
            <b>{s.no} {lang === 'en' ? s.title.en : s.title.zh}</b>
            <p>{stageValue(b, s.key) || (lang === 'en' ? '（empty）' : '（空）')}</p>
          </div>
        ))}
      </div>

      <label className="loop-field">
        <span className="loop-output-label">{lang === 'en' ? 'Re-check notes' : '重检记录'}</span>
        <textarea className="textarea loop-textarea" data-step="recheck" value={text} onChange={(e) => setText(e.target.value)} onBlur={() => onSaveRecheck(text)} placeholder={lang === 'en' ? 'Re-check notes: what needs revision?' : '重检记录：发现了什么需要修正的地方？'} />
      </label>

      <div className="loop-recheck-items">
        {RECHECK_ITEMS.map(([key, name, desc]) => (
          <div key={key} className="loop-recheck-item"><b>✓ {lang === 'en' ? name.en : name.zh}</b><p>{lang === 'en' ? desc.en : desc.zh}</p></div>
        ))}
      </div>

      <div className="loop-toolbar">
        <button type="button" className="btn" onClick={() => onConfirm(text, 'confirm')}>✅ {lang === 'en' ? 'Confirm & save version' : '确认并保存版本'}</button>
        <button type="button" className="btn" onClick={() => onConfirm(text, 'revise')}>✏️ {lang === 'en' ? 'Revise & new version' : '修正并生成新版本'}</button>
      </div>

      <div className="loop-version-history">
        <b>{lang === 'en' ? 'Version history' : '版本历史'}</b>
        {b.versions.length === 0 ? <p className="loop-version-empty">{lang === 'en' ? 'No versions yet — save one above.' : '还没有版本——在上面保存一个。'}</p> : null}
        {b.versions.slice().reverse().map((v) => (
          <div key={v.v} className="loop-version">
            <span className="loop-version-tag">V{v.v} · {v.label}</span>
            <span className="loop-version-date">{(v.savedAt || '').slice(0, 10)}</span>
            <div className="loop-version-actions">
              <button type="button" className="btn small" onClick={() => onView(v.v)}>{lang === 'en' ? 'View' : '查看'}</button>
              <button type="button" className="btn small" onClick={() => onRestore(v.v)}>{lang === 'en' ? 'Restore' : '恢复'}</button>
              <button type="button" className="btn small" onClick={() => onPdf(v)}>PDF</button>
            </div>
          </div>
        ))}
        {b.versions.length >= 2 ? (
          <button type="button" className="btn small" onClick={onCompare}>⇄ {lang === 'en' ? 'Compare versions' : '比较版本'}</button>
        ) : null}
      </div>
    </div>
  )
}

/* ================= 版本查看 modal ================= */
function VersionModal({ b, v, ideaId, t, lang, onClose }: { b: BrainstormData; v: number; ideaId: string; t: Translate; lang: string; onClose: () => void }) {
  const snap = b.versions.find((x) => x.v === v)
  if (!snap) return null
  return (
    <div className="loop-modal">
      <div className="loop-modal-card">
        <header><b>{versionToken(ideaId, v)} · {t('v1ViewVersion')}</b><button type="button" className="loop-modal-x" onClick={onClose}>×</button></header>
        <div className="loop-modal-body">
          <div className="loop-diff">
            <div className="loop-diff-rq"><b>09 {lang === 'en' ? 'Initial RQ' : '初步 RQ'}</b><p>{snap.rq || (lang === 'en' ? '（empty）' : '（空）')}</p></div>
            {STAGES.filter((s) => s.key !== 'recheck').map((s) => (
              <div key={s.key} className="loop-diff-row"><b>{s.no} {lang === 'en' ? s.title.en : s.title.zh}</b><p>{snap.steps[s.key] || (lang === 'en' ? '（empty）' : '（空）')}</p></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================= 版本比较 modal ================= */
function CompareModal({ b, t, lang, onClose }: { b: BrainstormData; t: Translate; lang: string; onClose: () => void }) {
  const [a, setA] = useState<number>(b.versions.length >= 2 ? b.versions[b.versions.length - 2].v : b.versions[0]?.v || 0)
  const [bb, setBb] = useState<number>(b.versions[b.versions.length - 1]?.v || 0)
  const va = b.versions.find((x) => x.v === a)
  const vb = b.versions.find((x) => x.v === bb)
  return (
    <div className="loop-modal">
      <div className="loop-modal-card">
        <header><b>{t('v1Compare')} · V{a} ↔ V{bb}</b><button type="button" className="loop-modal-x" onClick={onClose}>×</button></header>
        <div className="loop-modal-body">
          <div className="loop-compare-pick">
            <select value={a} onChange={(e) => setA(Number(e.target.value))}>
              {b.versions.map((x) => <option key={x.v} value={x.v}>V{x.v} · {x.label}</option>)}
            </select>
            <span>↔</span>
            <select value={bb} onChange={(e) => setBb(Number(e.target.value))}>
              {b.versions.map((x) => <option key={x.v} value={x.v}>V{x.v} · {x.label}</option>)}
            </select>
          </div>
          <div className="loop-diff">
            {STAGES.filter((s) => s.key !== 'recheck').map((s) => {
              const xa = va?.steps[s.key] || ''
              const xb = vb?.steps[s.key] || ''
              const diff = xa !== xb
              return (
                <div key={s.key} className={`loop-diff-row${diff ? ' is-diff' : ''}`}>
                  <b>{s.no} {lang === 'en' ? s.title.en : s.title.zh}{diff ? ' ✱' : ''}</b>
                  <p><em>V{a}</em> {xa || '（空）'}</p>
                  <p><em>V{bb}</em> {xb || '（空）'}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================= 反馈 modal ================= */
function FeedbackModal({ b, t, lang, onSave, onClose }: { b: BrainstormData; t: Translate; lang: string; onSave: (types: string[], text: string) => void; onClose: () => void }) {
  const [types, setTypes] = useState<string[]>([])
  const [text, setText] = useState('')
  return (
    <div className="loop-modal">
      <div className="loop-modal-card">
        <header><b>{t('v1FbTitle')}{b.pdfs.length ? ` · ${t('v1FbBound')} V${b.pdfs[b.pdfs.length - 1].version}` : ''}</b><button type="button" className="loop-modal-x" onClick={onClose}>×</button></header>
        <div className="loop-modal-body">
          <label className="loop-field">
            <span>{t('v1FbTypes')}</span>
            <div className="loop-fb-types">
              {FEEDBACK_TYPES.map(([key, name]) => (
                <label key={key}>
                  <input type="checkbox" checked={types.includes(key)} onChange={(e) => setTypes((prev) => (e.target.checked ? [...prev, key] : prev.filter((k) => k !== key)))} />
                  {' '}{lang === 'en' ? name.en : name.zh}
                </label>
              ))}
            </div>
          </label>
          <label className="loop-field">
            <span>{t('v1FbText')}</span>
            <textarea className="textarea" data-fb-text value={text} onChange={(e) => setText(e.target.value)} placeholder={lang === 'en' ? 'What you want to tell me…' : '想对我说的…'} />
          </label>
          <div className="loop-toolbar">
            <button type="button" className="btn primary" onClick={() => onSave(types, text)}>{t('v1FbSave')}</button>
            <button type="button" className="btn" onClick={onClose}>{t('v1FbCancel')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
