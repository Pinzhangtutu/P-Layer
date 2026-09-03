import { useCallback, useEffect, useState } from 'react'
import { LanguageSwitch } from '../components/LanguageSwitch'
import { PiaWorkshop } from '../components/PiaWorkshop'
import { SettingsPanels } from '../components/SettingsPanels'
import { useI18n } from '../i18n'

const AUTH_SESSION_KEY = 'pLayerDemoSignedIn'

/** 与旧版 local-auth-ui.js 保持同一份存储键，避免新旧页面登录状态不一致 */
function readSignedIn(): boolean {
  return localStorage.getItem(AUTH_SESSION_KEY) === 'true' || sessionStorage.getItem(AUTH_SESSION_KEY) === 'true'
}

export function Settings() {
  const { t } = useI18n()
  const [signedIn, setSignedIn] = useState(readSignedIn)

  const refresh = useCallback(() => setSignedIn(readSignedIn()), [])

  useEffect(() => {
    window.addEventListener('player-auth-state', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('player-auth-state', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])

  return (
    <div className="page">
      <div className="page-head">
        <h1>{t('settings')}</h1>
        <p>{t('settingsSub')}</p>
      </div>

      <section className="card access-card">
        <div className="access-head">
          <div>
            <b>{t('accountAndLanguage')}</b>
          </div>
          <span className="access-mark">P</span>
        </div>

        <div className="access-row">
          <div>
            <b>{t('interfaceLanguage')}</b>
            <small>{t('languageHint')}</small>
          </div>
          <div className="access-control">
            <LanguageSwitch />
          </div>
        </div>

        <div className="access-row">
          <div>
            <b>{t('signIn')}</b>
            <small>{t('localDemoNote')}</small>
          </div>
          <div className="access-control">
            <button className="btn access-auth" onClick={() => window.dispatchEvent(new Event('player-auth-open'))}>
              {signedIn ? t('signedIn') : t('signIn')}
            </button>
          </div>
        </div>
      </section>

      <PiaWorkshop />
      <SettingsPanels />
    </div>
  )
}
