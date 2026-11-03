import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { registerSW } from 'virtual:pwa-register';
import { db, defaults, savePreferences, type Preferences } from './data/db';
import { textos as t } from './ui/textos';
import './ui/styles.css';
type Screen = 'welcome' | 'settings' | 'home' | 'install' | 'about';
function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [offline, setOffline] = useState(false);
  const [swError, setSwError] = useState(false);
  const [update, setUpdate] = useState(false);
  const updater = useRef<((reload?: boolean) => Promise<void>) | undefined>();
  const heading = useRef<HTMLHeadingElement>(null);
  async function load() {
    setLoading(true); setError(false);
    try { const value = await db.config.get('local'); if (value) { setPrefs(value); setScreen('home'); } }
    catch { setError(true); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); updater.current = registerSW({ onOfflineReady: () => setOffline(true), onNeedRefresh: () => setUpdate(true), onRegisterError: () => setSwError(true), onRegisteredSW: (_url, registration) => { if (registration?.active && navigator.serviceWorker.controller) setOffline(true); } }); }, []);
  useEffect(() => { document.documentElement.dataset.theme = prefs.theme; document.documentElement.style.setProperty('--text-scale', String(prefs.scale / 100)); }, [prefs]);
  useEffect(() => { if (!loading) heading.current?.focus(); }, [screen, loading]);
  const change = <K extends keyof Preferences>(key: K, value: Preferences[K]) => { setSaved(false); setPrefs(p => ({ ...p, [key]: value })); };
  async function save() {
    setSaving(true); setError(false);
    try { await savePreferences(prefs); setSaved(true); setScreen('home'); } catch { setError(true); } finally { setSaving(false); }
  }
  const back = () => setScreen('home');
  const title = loading ? t.loading : screen === 'welcome' ? t.welcome : screen === 'settings' ? t.settings : screen === 'home' ? t.homeTitle : screen === 'install' ? t.installTitle : t.aboutTitle;
  return <>
    <a class="skip" href="#main">{t.skip}</a>
    <header><span class="brand"><svg aria-hidden="true" viewBox="0 0 48 48"><path d="M12 34V20a4 4 0 0 1 8 0v9-17a4 4 0 0 1 8 0v17-12a4 4 0 0 1 8 0v15c0 9-6 13-13 13"/></svg>{t.brand}</span><span class="header-note">{t.motto}</span></header>
    <main id="main"><p class="eyebrow">{screen === 'welcome' ? t.eyebrow : t.motto}</p><h1 ref={heading} tabIndex={-1}>{title}</h1>
      {error && <div role="alert" class="notice"><p>{t.error}</p>{loading === false && <button onClick={() => void (screen === 'settings' ? save() : load())}>{t.retry}</button>}</div>}
      {!loading && screen === 'welcome' && <><p class="lead">{t.intro}</p><div class="gesture" aria-hidden="true"><span/><span/><span/><svg viewBox="0 0 300 140"><path d="M25 100C85 100 55 35 125 40S190 125 270 35"/></svg></div><section class="card"><h2>{t.privacyTitle}</h2><p>{t.privacy}</p><p>{t.hosting}</p><p>{t.storage}</p></section><p>{t.consentNote}</p><button class="primary" onClick={() => setScreen('settings')}>{t.consent}<span aria-hidden="true"> →</span></button></>}
      {!loading && screen === 'settings' && <form onSubmit={e => { e.preventDefault(); void save(); }}><p class="lead">{t.settingsIntro}</p>
        <section class="card"><label for="scale">{t.size}: <strong>{prefs.scale}%</strong></label><input id="scale" type="range" min="100" max="200" step="25" value={prefs.scale} onInput={e => change('scale', Number(e.currentTarget.value))}/><p class="sample">{t.sample}</p></section>
        <fieldset><legend>{t.theme}</legend>{(['claro','escuro','contraste'] as const).map(value => <label class="choice"><input type="radio" name="theme" value={value} checked={prefs.theme === value} onChange={() => change('theme', value)}/>{t[value]}</label>)}</fieldset>
        <fieldset><legend>{t.hand}</legend>{(['direita','esquerda'] as const).map(value => <label class="choice"><input type="radio" name="hand" checked={prefs.hand === value} onChange={() => change('hand', value)}/>{t[value]}</label>)}</fieldset>
        <fieldset><legend>{t.grip}</legend>{(['polegar','indicador','duas'] as const).map(value => <label class="choice"><input type="radio" name="grip" checked={prefs.grip === value} onChange={() => change('grip', value)}/>{t[value]}</label>)}</fieldset>
        <fieldset><legend>{t.feedback}</legend><p>{t.feedbackNote}</p><label class="choice"><input type="checkbox" checked={prefs.sound} onChange={e => change('sound', e.currentTarget.checked)}/>{t.sound}</label><label class="choice"><input type="checkbox" checked={prefs.vibration} onChange={e => change('vibration', e.currentTarget.checked)}/>{t.vibration}</label></fieldset>
        <button class="primary" disabled={saving}>{saving ? t.saving : t.save}</button></form>}
      {!loading && screen === 'home' && <><p class="lead">{t.homeIntro}</p><section class="card upcoming"><p class="eyebrow">{t.phase}</p><h2>{t.phaseTitle}</h2><p>{t.phaseBody}</p></section><nav aria-label={t.settings}><button class="primary" onClick={() => setScreen('settings')}>{t.comfort}<span aria-hidden="true"> →</span></button><button onClick={() => setScreen('install')}>{t.install}</button><button onClick={() => setScreen('about')}>{t.about}</button></nav></>}
      {!loading && screen === 'install' && <><p class="lead">{t.installIntro}</p><section class="card"><h2>{t.android}</h2><p>{t.androidHelp}</p><h2>{t.iphone}</h2><p>{t.iphoneHelp}</p></section><p>{t.offlineHelp}</p><button onClick={back}>{t.back}</button></>}
      {!loading && screen === 'about' && <><p class="lead">{t.aboutBody}</p><section class="card"><p>{t.medical}</p><p>{t.health}</p><h2>{t.dataTitle}</h2><p>{t.dataBody}</p><p>{t.hosting}</p></section><button onClick={back}>{t.back}</button></>}
      <div class="status" role="status">{saved && <p>{t.saved}</p>}<p><span aria-hidden="true">{offline ? '●' : '○'} </span>{swError ? t.offlineError : offline ? t.offlineReady : t.offlineWaiting}</p></div>
      {update && <aside class="notice"><p>{t.update}</p><button onClick={() => void updater.current?.(true)}>{t.updateButton}</button></aside>}
    </main><footer>{t.footer}</footer>
  </>;
}
render(<App/>, document.getElementById('app')!);
