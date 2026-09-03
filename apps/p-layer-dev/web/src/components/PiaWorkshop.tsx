import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchServiceStatus,
  readAutoStart,
  startServices,
  writeAutoStart,
  type ServiceId,
  type ServiceStatus,
} from '../lib/api'
import { useI18n } from '../i18n'

type ServiceMeta = {
  id: ServiceId
  logo: string
  labelZh: string
  labelEn: string
  descZh: string
  descEn: string
}

const SERVICES: ServiceMeta[] = [
  {
    id: 'ollama',
    logo: '/ollama-logo.svg',
    labelZh: 'Ollama 7B 本地模型',
    labelEn: 'Ollama 7B Local Model',
    descZh: '断网时 Pia! 仍然能回答方法学问题；分析意图由此生成。',
    descEn: 'Pia! answers methodological questions offline; intent classification runs here.',
  },
  {
    id: 'r',
    logo: '/r-logo.svg',
    labelZh: 'R 统计引擎',
    labelEn: 'R Statistical Engine',
    descZh: '实际跑 t 检验、回归、信度 α、中介（lavaan）等分析。',
    descEn: "Runs t-tests, regressions, Cronbach's α, mediation (lavaan), etc.",
  },
  {
    id: 'zotero',
    logo: '/zotero-logo.png',
    labelZh: 'Zotero 文献库',
    labelEn: 'Zotero Library',
    descZh: '本地 PDF / 摘要 / 笔记；分析时自动加入上下文。',
    descEn: "Local PDFs / abstracts / notes; auto-injected into Pia!'s context.",
  },
]

export function PiaWorkshop() {
  const { lang, t } = useI18n()
  const [statuses, setStatuses] = useState<Partial<Record<ServiceId, ServiceStatus>>>({})
  const [busy, setBusy] = useState<ServiceId | null>(null)
  const [note, setNote] = useState('')
  const [autoStart, setAutoStart] = useState<Record<ServiceId, boolean>>(readAutoStart)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const pollAll = useCallback(async () => {
    const entries = await Promise.all(
      SERVICES.map(async (s) => {
        try {
          return [s.id, await fetchServiceStatus(s.id)] as const
        } catch {
          return [s.id, { connected: false }] as const
        }
      }),
    )
    if (!alive.current) return
    setStatuses(Object.fromEntries(entries) as Partial<Record<ServiceId, ServiceStatus>>)
  }, [])

  useEffect(() => {
    void pollAll()
  }, [pollAll])

  const startOne = async (id: ServiceId) => {
    setBusy(id)
    setNote(lang === 'en' ? `Starting ${id}…` : `正在启动 ${id}…`)
    try {
      await startServices([id])
    } catch {
      setNote(lang === 'en' ? `Failed to start ${id}.` : `${id} 启动失败。`)
    } finally {
      setBusy(null)
      void pollAll()
    }
  }

  const startSelected = async () => {
    const ids = SERVICES.filter((s) => autoStart[s.id]).map((s) => s.id)
    if (ids.length === 0) {
      setNote(t('startSelected') + (lang === 'en' ? ' — nothing selected' : ' — 未选择任何服务'))
      return
    }
    setNote((lang === 'en' ? 'Starting: ' : '正在启动：') + ids.join(', '))
    try {
      await startServices(ids)
    } finally {
      void pollAll()
    }
  }

  const toggleAuto = (id: ServiceId) => {
    const next = { ...autoStart, [id]: !autoStart[id] }
    setAutoStart(next)
    writeAutoStart(next)
  }

  return (
    <section className="card workshop-card">
      <div className="head">
        <div>
          <h2>{t('piaWorkshop')}</h2>
          <h3>{t('piaWorkshopSub')}</h3>
        </div>
        <span className="tag">{t('piaWorkshop')}</span>
      </div>

      <div className="workshop-grid">
        {SERVICES.map((s) => {
          const st = statuses[s.id]
          const detail = st?.model ? ` · ${st.model}` : st?.version ? ` · ${st.version}` : ''
          return (
            <article key={s.id} className="workshop-service">
              <div className="workshop-service-head">
                <span className={`workshop-service-icon workshop-service-logo-${s.id}`}>
                  <img src={s.logo} alt={`${s.id} logo`} />
                </span>
                <div className="workshop-service-meta">
                  <strong>{lang === 'en' ? s.labelEn : s.labelZh}</strong>
                  <small>{lang === 'en' ? s.descEn : s.descZh}</small>
                </div>
              </div>
              <div className="workshop-service-state">
                {st === undefined ? (
                  <span className="service-state state-loading">{t('checking')}</span>
                ) : st.connected ? (
                  <span className="service-state state-on">
                    {t('connected')}
                    {detail}
                  </span>
                ) : (
                  <span className="service-state state-off">{t('notRunning')}</span>
                )}
              </div>
              <div className="workshop-service-actions">
                <label className="workshop-autostart">
                  <input type="checkbox" checked={autoStart[s.id]} onChange={() => toggleAuto(s.id)} />
                  <span>{t('autoStart')}</span>
                </label>
                <button className="btn" onClick={() => void startOne(s.id)} disabled={busy === s.id}>
                  {busy === s.id ? t('starting') : lang === 'en' ? 'Start' : '启动'}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="toolbar workshop-toolbar">
        <button className="btn" onClick={() => void pollAll()}>
          {t('recheckAll')}
        </button>
        <button className="btn primary" onClick={() => void startSelected()}>
          {t('startSelected')}
        </button>
      </div>

      {note && <div className="api-status">{note}</div>}
    </section>
  )
}
