import { useState } from 'react'
import { useI18n } from '../i18n'
import { PALETTES, readTheme, selectTheme } from '../lib/theme'

function PiaHeader({ title }: { title: string }) {
  return (
    <div className="pia-header">
      <img className="pia-avatar" src="/pia-mascot.png" alt="" />
      <h2 className="pia-title">{title}</h2>
    </div>
  )
}

function StatusPill({ kind, text }: { kind: 'on' | 'off' | 'warn'; text: string }) {
  return <span className={`status-pill status-${kind}`}>{text}</span>
}

export function SettingsPanels() {
  const { lang, t } = useI18n()
  const [autoSave, setAutoSave] = useState(true)
  const [researchLog, setResearchLog] = useState(true)
  const [navGlass, setNavGlass] = useState(() => localStorage.getItem('pLayerNavGlassFocusV2') !== 'false')
  const [selectedPalette, setSelectedPalette] = useState(readTheme)
  const [themeToast, setThemeToast] = useState('')
  const [apiKeyShown, setApiKeyShown] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [endpoint, setEndpoint] = useState('http://127.0.0.1:11434')
  const [model, setModel] = useState('qwen2.5:7b-instruct')
  const [provider, setProvider] = useState('local')
  const [zoteroConnected] = useState(false)

  const pickPalette = (key: string) => {
    setSelectedPalette(key)
    selectTheme(key)
    const p = PALETTES.find((x) => x.key === key)
    setThemeToast((lang === 'en' ? 'Theme applied: ' : '主题已切换：') + (p ? (lang === 'en' ? p.en : p.zh) : key))
    window.setTimeout(() => setThemeToast(''), 1600)
  }

  return (
    <>
      {/* 顶部 4 个配置行：自动保存 / 研究记录模式 / 统计引擎 / 桌面应用 / Pia 本地教练 */}
      <section className="card settings-card">
        <div className="settings-row">
          <div>
            <b>{t('autoSave')}</b>
            <small>{t('autoSaveHint')}</small>
          </div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
            />
            <span />
          </label>
        </div>
        <div className="settings-row">
          <div>
            <b>{t('researchLog')}</b>
            <small>{t('researchLogHint')}</small>
          </div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={researchLog}
              onChange={(e) => setResearchLog(e.target.checked)}
            />
            <span />
          </label>
        </div>
        <div className="settings-row">
          <div>
            <b>{t('navGlassFocus')}</b>
            <small>{t('navGlassFocusHint')}</small>
          </div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={navGlass}
              onChange={(e) => {
                const next = e.target.checked
                setNavGlass(next)
                try {
                  localStorage.setItem('pLayerNavGlassFocusV2', next ? 'true' : 'false')
                } catch {
                  /* ignore */
                }
              }}
            />
            <span />
          </label>
        </div>
        <div className="settings-row">
          <div>
            <b>{t('statEngine')}</b>
            <small>{t('statEngineHint')}</small>
          </div>
          <StatusPill kind="on" text={t('statEngineState')} />
        </div>
        <div className="settings-row">
          <div>
            <b>{t('desktopApp')}</b>
            <small>{t('desktopAppHint')}</small>
          </div>
          <StatusPill kind="warn" text={t('desktopAppState')} />
        </div>
        <div className="settings-row">
          <div>
            <PiaHeader title={t('piaCoach')} />
            <small>{t('piaCoachHint')}</small>
          </div>
          <StatusPill kind="on" text={t('piaCoachState')} />
        </div>
      </section>

      {/* 主题配色 */}
      <section className="card settings-card">
        <div className="head">
          <div>
            <h2>{t('themePalette')}</h2>
            <h3>{t('themePaletteHint')}</h3>
          </div>
        </div>
        <div className="palette-grid">
          {PALETTES.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`palette-card${selectedPalette === p.key ? ' is-selected' : ''}`}
              onClick={() => pickPalette(p.key)}
            >
              <div className="palette-strip">
                {p.swatches.map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </div>
              <strong>{lang === 'en' ? p.en : p.zh}</strong>
              <small>{lang === 'en' ? p.noteEn : p.noteZh}</small>
            </button>
          ))}
        </div>
        {themeToast && <div className="settings-toast">{themeToast}</div>}
      </section>

      {/* AI API 连接 */}
      <section className="card settings-card">
        <div className="head">
          <PiaHeader title={t('aiApi')} />
          <span className="tag">{t('aiApiBadge')}</span>
        </div>
        <p className="settings-sub">{t('aiApiHint')}</p>
        <div className="api-provider-chips">
          {[
            { id: 'local', zh: 'Pia! 7B', en: 'Pia! 7B' },
            { id: 'openai', zh: 'OpenAI', en: 'OpenAI' },
            { id: 'claude', zh: 'Anthropic Claude', en: 'Anthropic Claude' },
            { id: 'gemini', zh: 'Google Gemini', en: 'Google Gemini' },
            { id: 'deepseek', zh: 'DeepSeek', en: 'DeepSeek' },
            { id: 'openrouter', zh: 'OpenRouter', en: 'OpenRouter' },
            { id: 'compat', zh: 'OpenAI-compatible', en: 'OpenAI-compatible' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              className={`api-chip${provider === p.id ? ' is-selected' : ''}`}
              onClick={() => setProvider(p.id)}
            >
              {lang === 'en' ? p.en : p.zh}
            </button>
          ))}
        </div>
        <div className="api-grid">
          <div className="field">
            <label>{t('aiProvider')}</label>
            <select className="select" value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="local">Pia! · {t('piaCoach')}</option>
              <option value="openai">OpenAI</option>
              <option value="claude">Anthropic Claude</option>
              <option value="gemini">Google Gemini</option>
              <option value="deepseek">DeepSeek</option>
              <option value="openrouter">OpenRouter</option>
              <option value="compat">OpenAI-compatible</option>
            </select>
          </div>
          <div className="field">
            <label>{t('modelName')}</label>
            <input
              className="input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="qwen2.5:7b-instruct"
            />
          </div>
        </div>
        <div className="field">
          <label>API Endpoint</label>
          <input
            className="input"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="http://127.0.0.1:11434"
          />
        </div>
        <div className="field">
          <label>API Key</label>
          <div className="api-key-row">
            <input
              className="input"
              type={apiKeyShown ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('apiKeyPlaceholder')}
            />
            <button type="button" className="btn ghost" onClick={() => setApiKeyShown((v) => !v)}>
              {t('apiKeyShow')}
            </button>
          </div>
          <small className="field-help">{t('apiKeyHint')}</small>
        </div>
        <div className="api-toolbar">
          <button type="button" className="btn primary">{t('saveConfig')}</button>
          <button type="button" className="btn">{t('testConnection')}</button>
          <button type="button" className="btn ghost">{t('switchToLocal')}</button>
        </div>
        <p className="api-note">{t('localModeNote')}</p>
      </section>

      {/* Zotero 文献库 */}
      <section className="card settings-card">
        <div className="head">
          <div>
            <h2>📚 {t('zotero')}</h2>
            <h3>{t('zoteroHint')}</h3>
          </div>
          <span className="tag">{t('zoteroBadge')}</span>
        </div>
        <div className="zotero-status">
          <div className="zotero-status-row">
            <span>666</span>
            <StatusPill kind="warn" text={t('zoteroEmpty')} />
          </div>
          <div className="zotero-status-row">
            <span>{t('zoteroFailed')}</span>
            <StatusPill kind="off" text={t('zoteroFailedState')} />
          </div>
        </div>
        <div className="zotero-empty">
          <strong>{t('zoteroConnectSteps')}</strong>
          <ol>
            <li>{t('zoteroStep1')}</li>
            <li>{t('zoteroStep2')}</li>
            <li>{t('zoteroStep3')}</li>
          </ol>
          <p className="field-help">{t('zoteroFooter')}</p>
        </div>
        <div className="zotero-options">
          <label className="checkbox">
            <input type="checkbox" defaultChecked />
            <span>{t('zoteroSyncNotes')}</span>
          </label>
          <label className="checkbox">
            <input type="checkbox" />
            <span>{t('zoteroPdfIndex')}</span>
          </label>
        </div>
        <div className="zotero-toolbar">
          <button type="button" className="btn">{t('zoteroTest')}</button>
          <button type="button" className="btn primary" disabled={!zoteroConnected}>
            {t('zoteroBind')}
          </button>
        </div>
        <p className="api-note">
          <strong>{t('zoteroPdfNote')}</strong>
          {t('zoteroPdfNote2')}
        </p>
      </section>

      {/* Pia! 本地文献库 (RAG) */}
      <section className="card settings-card">
        <div className="head">
          <PiaHeader title={t('ragTitle')} />
          <span className="tag">{t('ragBadge')}</span>
        </div>
        <p className="settings-sub">{t('ragHint')}</p>
        <div className="rag-how">
          <strong>{t('ragHow')}</strong>
          <p>{t('ragHowHint')}</p>
        </div>
        <div className="rag-folder">
          <div>
            <strong>📚 {t('ragFolder')}</strong>
            <p>{t('ragFolderHint')}</p>
          </div>
          <button type="button" className="btn">{t('ragImport')}</button>
        </div>
        <div className="rag-error">{t('zoteroFailedState')}</div>
        <div className="rag-import">
          <button type="button" className="btn">{t('ragChooseFiles')}</button>
          <span className="rag-file-name">{t('ragNoFile')}</span>
          <button type="button" className="btn primary" style={{ marginLeft: 'auto' }}>
            {t('ragImportProject')}
          </button>
        </div>
        <p className="field-help">{t('ragFileTypes')}</p>
        <div className="rag-error">{t('zoteroFailedState')}</div>
        <div className="rag-search">
          <input className="input" placeholder={t('ragTestPlaceholder')} />
          <button type="button" className="btn">{t('ragTest')}</button>
        </div>
        <p className="api-note">
          <strong>{t('ragPrivacy')}</strong>
          {t('ragPrivacyHint')}
        </p>
      </section>

      {/* Pia! 本地模型 */}
      <section className="card settings-card">
        <div className="head">
          <PiaHeader title={t('localModel')} />
          <span className="tag">{t('ollamaBadge')}</span>
        </div>
        <p className="settings-sub">{t('localModelHint')}</p>
        <div className="ollama-status">
          <span className="ollama-dot" />
          <div>
            <strong>{t('ollamaState')}</strong>
            <small className="field-help">{t('zoteroFailedState')}</small>
          </div>
        </div>
        <div className="ollama-grid">
          <div className="field">
            <label>{t('ollamaModelLabel')}</label>
            <strong>{t('ollamaModel')}</strong>
          </div>
          <div className="field">
            <label>{t('ollamaService')}</label>
            <span className="ollama-dash">—</span>
          </div>
          <div className="field">
            <label>{t('ollamaModelState')}</label>
            <span className="ollama-dash">—</span>
          </div>
        </div>
        <div className="ollama-toolbar">
          <button type="button" className="btn">{t('ollamaInstall')}</button>
          <button type="button" className="btn primary">{t('ollamaDownload')}</button>
          <button type="button" className="btn">{t('ollamaRecheck')}</button>
          <button type="button" className="btn">{t('ollamaTest')}</button>
        </div>
        <p className="api-note"><strong>{lang === 'en' ? 'Privacy: ' : '隐私：'}</strong>{t('ollamaPrivacy')}</p>
      </section>
    </>
  )
}
