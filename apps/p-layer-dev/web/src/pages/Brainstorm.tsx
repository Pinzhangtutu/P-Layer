import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { useNav } from '../nav'
import { askAssistant } from '../lib/api'
import {
  STAGES,
  completeTraining,
  createSession,
  readSessions,
  researchQuestionOf,
  writeSessions,
  type BrainstormSession,
} from '../lib/brainstorm'
import { takeBrainstormSeed } from '../lib/handoff'
import type { LiteratureSource } from '../lib/ideas'
import { useProject } from '../lib/useProject'
import { SessionList } from '../components/brainstorm/SessionList'
import { StageProgress } from '../components/brainstorm/StageProgress'
import { StageEditor, type PiaState } from '../components/brainstorm/StageEditor'
import { CompletedView } from '../components/brainstorm/CompletedView'
import { IdeaForm } from '../components/brainstorm/IdeaForm'
import { IdeaDatabase } from '../components/brainstorm/IdeaDatabase'
import { TheoryLibrary } from '../components/brainstorm/TheoryLibrary'
import { TrainingPanelV1 } from '../components/brainstorm/TrainingPanelV1'
import { isBound, readZoteroState } from '../lib/literature'
import { readIdeas, type Idea } from '../lib/ideas'
import { normBrainstorm } from '../lib/brainstormV1'

const AUTOSAVE_MS = 500

export function Brainstorm({
  v1Target,
  onV1TargetConsumed,
}: {
  v1Target?: { ideaId?: string; step?: string } | null
  onV1TargetConsumed?: () => void
}) {
  const { lang, t } = useI18n()
  const { active, mutate, projects } = useProject()
  const { navigate } = useNav()

  const sessions = useMemo(() => readSessions(active), [active, projects])
  const zoteroBound = useMemo(() => isBound(readZoteroState(active)), [active, projects])
  const [openId, setOpenId] = useState<string | null>(null)
  const [seed, setSeed] = useState('')
  const [incomingSource, setIncomingSource] = useState<LiteratureSource | null>(null)
  const [draft, setDraft] = useState('')
  const [pia, setPia] = useState<PiaState>({ state: 'idle' })
  const [status, setStatus] = useState('')
  /** P-Layer v1 · 10 步训练面板（科学环 / 想法库入口触发） */
  const [v1Idea, setV1Idea] = useState<Idea | null>(null)
  const [v1Step, setV1Step] = useState<string | undefined>(undefined)

  /* 科学环「重新检查假设」→ 自动打开第一个已训练 Idea 的重检步骤 */
  useEffect(() => {
    if (!v1Target) return
    const ideas = active ? readIdeas(active) : []
    const target =
      ideas.find((i) => i.id === v1Target.ideaId) ||
      ideas.find((i) => normBrainstorm(i.brainstorm).status !== '未开始') ||
      ideas[0]
    if (target) {
      setV1Idea(target)
      setV1Step(v1Target.step || undefined)
    }
    if (onV1TargetConsumed) onV1TargetConsumed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v1Target])

  const session = openId ? (sessions.find((s) => s.id === openId) ?? null) : null
  const stepIndex = session ? session.current : 0
  const savedText = session ? (session.steps[stepIndex]?.text ?? '') : ''

  // 从文献审计记录「写入头脑风暴草稿」跳过来时，接住那一句草稿和文献元信息
  useEffect(() => {
    const handed = takeBrainstormSeed()
    if (handed) {
      setSeed(handed.text)
      if (handed.literatureSource) {
        setIncomingSource(handed.literatureSource)
      }
    }
  }, [])

  // 组件卸载后不再 setState（Pia 的回答可能回来得很晚）
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  // 切换 session 或跳步时，把输入框同步成已保存的内容。
  // 刻意不监听 session.status：训练完成的瞬间下面会写一句提示，
  // 如果这里跟着重置就被清掉了。
  useEffect(() => {
    setDraft(session ? (session.steps[session.current]?.text ?? '') : '')
    setPia({ state: 'idle' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, stepIndex])

  // 边打字边存，但不阻塞输入
  useEffect(() => {
    if (!session || draft === savedText) return
    const timer = setTimeout(() => saveDraft(draft, stepIndex), AUTOSAVE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, savedText, openId, stepIndex])

  const mutateSessions = (fn: (list: BrainstormSession[]) => void) => {
    mutate((project) => {
      const list = readSessions(project)
      fn(list)
      writeSessions(project, list)
    })
  }

  function saveDraft(text: string, index: number) {
    if (!session) return
    const id = session.id
    mutateSessions((list) => {
      const target = list.find((s) => s.id === id)
      if (!target) return
      target.steps[index] = { text, savedAt: new Date().toISOString() }
      target.updatedAt = new Date().toISOString()
      if (index === 0 && text.trim()) target.title = text.trim().slice(0, 42)
    })
  }

  const startTraining = () => {
    const next = createSession(seed, lang)
    mutateSessions((list) => list.unshift(next))
    setSeed('')
    setStatus('')
    setOpenId(next.id)
  }

  const openSession = (id: string) => {
    setStatus('')
    setOpenId(id)
  }

  const deleteSession = (id: string) => {
    mutateSessions((list) => {
      const idx = list.findIndex((s) => s.id === id)
      if (idx >= 0) list.splice(idx, 1)
    })
    if (openId === id) setOpenId(null)
  }

  const goto = (index: number) => {
    if (!session) return
    saveDraft(draft, stepIndex)
    const id = session.id
    mutateSessions((list) => {
      const target = list.find((s) => s.id === id)
      if (!target) return
      target.current = Math.max(0, Math.min(STAGES.length - 1, index))
      target.updatedAt = new Date().toISOString()
    })
  }

  const handlePrev = () => {
    if (!session || session.current === 0) return
    saveDraft(draft, stepIndex)
    goto(session.current - 1)
  }

  const handleNext = () => {
    if (!session || !draft.trim()) return
    saveDraft(draft, stepIndex)
    const id = session.id
    const isLast = session.current === STAGES.length - 1

    mutate((project) => {
      const list = readSessions(project)
      const target = list.find((s) => s.id === id)
      if (!target) return
      if (isLast) {
        // 旧版在这里创建「学术申请」卡片；该看板已下线（§5.4），
        // 现在只完成会话并写 rqDraft，不再写入 applications。
        completeTraining(project, target)
      } else {
        target.current = Math.min(STAGES.length - 1, target.current + 1)
        target.updatedAt = new Date().toISOString()
      }
      writeSessions(project, list)
    })
    // setState 不能写在 mutate 的 updater 里：那个函数 React 会重复执行
    if (isLast) setStatus(t('trainingDoneHint'))
  }

  const handleAskPia = async () => {
    if (!session) return
    const stage = STAGES[stepIndex]
    const myText = draft.trim()
    const prompt =
      lang === 'en'
        ? `I am doing an 8-step research training, currently at step ${stepIndex + 1} "${
            stage.title.en
          }": ${stage.guide.en} ${stage.hint.en}${
            myText ? ` I have written: "${myText}".` : ''
          } Explain in plain language what this step asks for, with a concrete example.`
        : `我在做 8 步研究训练，当前是第 ${stepIndex + 1} 步「${stage.title.zh}」：${stage.guide.zh} ${
            stage.hint.zh
          }${myText ? ` 我已经写了："${myText}"。` : ''} 请用通俗的话解释这一步要做什么，并给我一个可参考的例子。`

    setPia({ state: 'loading' })
    try {
      const data = await askAssistant({
        page: 'brainstorm',
        prompt,
        project: { id: active.id, name: active.name, milestones: [], steps: [] },
        context: { research_question: rqDraftOf(active.notes), fields: [] },
        language: lang === 'en' ? 'en' : 'zh-CN',
        ai_config: {},
      })
      if (alive.current) setPia({ state: 'done', title: data.title, content: data.content })
    } catch (err) {
      if (alive.current) {
        setPia({ state: 'error', message: err instanceof Error ? err.message : t('piaFailed') })
      }
    }
  }

  const addAbandoned = (text: string) => {
    if (!session) return
    const id = session.id
    mutateSessions((list) => {
      const target = list.find((s) => s.id === id)
      if (!target) return
      target.abandoned.push({ text: text.trim(), at: new Date().toLocaleString() })
      target.updatedAt = new Date().toISOString()
    })
  }

  const writeRq = () => {
    if (!session) return
    const rq = researchQuestionOf(session)
    if (!rq) return
    mutate((project) => {
      if (!project.notes) project.notes = {}
      const notes = project.notes as Record<string, unknown>
      notes.rqDraft = rq
      notes.rqDraftMeta = { fromTraining: session.id, updatedAt: new Date().toISOString() }
    })
    setStatus(t('rqWritten'))
  }

  const copyRq = async () => {
    const rq = session ? researchQuestionOf(session) : ''
    if (!rq) return
    try {
      await navigator.clipboard.writeText(rq)
    } catch {
      // 非 HTTPS 环境下 clipboard API 不可用，退回 execCommand
      const ta = document.createElement('textarea')
      ta.value = rq
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        /* 复制不了就算了，RQ 就在屏幕上可以直接选中 */
      }
      document.body.removeChild(ta)
    }
    setStatus(t('copied'))
  }

  const reopen = () => {
    if (!session) return
    const id = session.id
    mutateSessions((list) => {
      const target = list.find((s) => s.id === id)
      if (target) {
        target.status = 'in_progress'
        target.updatedAt = new Date().toISOString()
      }
    })
    setStatus('')
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>{t('brainstorm')}</h1>
        <p className="brain-inspiration brain-inspiration-lg">
          {lang === 'en' ? t('ideaInspirationEn') : t('ideaInspirationZh')}
        </p>
      </div>

      <section className="card bt-card">
        <div className="head">
          <div>
            <h2>{t('brainstormTitle')}</h2>
            <h3>{t('brainstormNote')}</h3>
          </div>
          <span className="tag">Socratic training</span>
        </div>

        {session ? (
          <div className="bt-session">
            <div className="bt-session-top">
              <button type="button" className="btn" onClick={() => setOpenId(null)}>
                {t('backToList')}
              </button>
              <strong className="bt-session-title">{session.title}</strong>
            </div>

            <StageProgress session={session} lang={lang} onJump={goto} />

            {session.status === 'completed' ? (
              <CompletedView
                session={session}
                status={status}
                onWriteRq={writeRq}
                onCopy={copyRq}
                onReopen={reopen}
              />
            ) : (
              <StageEditor
                session={session}
                draft={draft}
                onDraft={setDraft}
                onPrev={handlePrev}
                onNext={handleNext}
                onAskPia={handleAskPia}
                onAddAbandoned={addAbandoned}
                pia={pia}
              />
            )}
          </div>
        ) : (
          <>
            <div className="bt-new">
              <input
                className="input"
                value={seed}
                placeholder={t('seedPlaceholder')}
                onChange={(e) => setSeed(e.target.value)}
              />
              <button type="button" className="btn primary" onClick={startTraining}>
                {t('startTraining')}
              </button>
            </div>
            <SessionList sessions={sessions} onOpen={openSession} onDelete={deleteSession} />
          </>
        )}
      </section>

      <section className="card idea-card">
        <div className="head">
          <div>
            <h2>{lang === 'en' ? 'Idea database' : '想法数据库'}</h2>
            <h3 className="idea-card-sub">
              <span className="idea-process-line">{t('ideaProcess')}</span>
            </h3>
          </div>
          <span className="tag">{t('ideaStudio')}</span>
        </div>

        <IdeaForm
          literatureSource={incomingSource}
          onLiteratureConsumed={() => setIncomingSource(null)}
        />

        <div className="idea-zotero-link">
          <div className="idea-zotero-head">
            <strong>📖 {t('ideaZoteroTitle')}</strong>
            <span className="idea-zotero-tag">Zotero → Idea</span>
          </div>
          <p className="idea-zotero-sub">{t('ideaZoteroSub')}</p>
          {zoteroBound ? (
            <div className="idea-zotero-hint">
              {lang === 'en'
                ? 'Zotero is connected. Pin literature and use "Send to Brainstorm" on a literature audit to start a new idea from a paper.'
                : 'Zotero 已连接。在文献审计里把条目「转头脑风暴」，就能把一篇文献作为新 Idea 的起点。'}
            </div>
          ) : (
            <div className="idea-zotero-empty">
              <span>{t('ideaZoteroEmpty')}</span>
              <button
                type="button"
                className="btn"
                onClick={() => navigate('settings')}
              >
                {t('ideaZoteroSetup')}
              </button>
            </div>
          )}
        </div>

        <IdeaDatabase onTrain={(idea) => { setV1Idea(idea); setV1Step(undefined) }} />
      </section>

      {/* §9.2 理论资产库：概念 / 机制 / 命题 / 边界，与 Idea、文献同属研究资产库 */}
      <TheoryLibrary />

      {v1Idea ? (
        <TrainingPanelV1
          idea={v1Idea}
          initialStep={v1Step}
          onClose={() => { setV1Idea(null); setV1Step(undefined) }}
          onNavigate={(route) => { setV1Idea(null); setV1Step(undefined); navigate(route) }}
        />
      ) : null}
    </div>
  )
}

function rqDraftOf(notes: Record<string, unknown> | undefined): string {
  if (!notes) return ''
  return typeof notes.rqDraft === 'string' ? notes.rqDraft : ''
}
