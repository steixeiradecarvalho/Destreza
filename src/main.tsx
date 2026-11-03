import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { registerSW } from "virtual:pwa-register";
import {
  db,
  defaults,
  savePreferences,
  type Preferences,
  type Session,
  type Attempt,
} from "./data/db";
import { textos as t } from "./ui/textos";
import "./ui/styles.css";
import { Lesson } from "./modules/teclado/Lesson";
import { unlockedLevel } from "./core/typing";
type Screen =
  "welcome" | "settings" | "home" | "install" | "about" | "library" | "lesson";
function App() {
  const [selected, setSelected] = useState({ level: 1, free: false });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [screen, setScreen] = useState<Screen>("welcome");
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
    setLoading(true);
    setError(false);
    try {
      const value = await db.config.get("local");
      if (value) {
        setPrefs({ ...defaults, ...value });
        setScreen("home");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    updater.current = registerSW({
      onOfflineReady: () => setOffline(true),
      onNeedRefresh: () => setUpdate(true),
      onRegisterError: () => setSwError(true),
      onRegisteredSW: (_url, registration) => {
        if (registration?.active && navigator.serviceWorker.controller)
          setOffline(true);
      },
    });
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.style.setProperty(
      "--text-scale",
      String(prefs.scale / 100),
    );
  }, [prefs]);
  useEffect(() => {
    if (!loading) heading.current?.focus();
  }, [screen, loading]);
  const change = <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => {
    setSaved(false);
    setPrefs((p) => ({ ...p, [key]: value }));
  };
  async function save() {
    setSaving(true);
    setError(false);
    try {
      await savePreferences(prefs);
      setSaved(true);
      setScreen("home");
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }
  async function refreshLessons() {
    setHistoryReady(false);
    try {
      const [history, results] = await Promise.all([
        db.sessoes.orderBy("startedAt").reverse().limit(5).toArray(),
        db.tentativas.toArray(),
      ]);
      setSessions(history);
      setAttempts(results);
      setHistoryError(false);
    } catch {
      setHistoryError(true);
    } finally {
      setHistoryReady(true);
    }
  }
  useEffect(() => {
    if (!loading && (screen === "home" || screen === "library"))
      void refreshLessons();
  }, [screen, loading]);
  const nextLevel = unlockedLevel(attempts);
  const openLesson = (level: number, free: boolean) => {
    setSelected({ level, free });
    setScreen("lesson");
  };
  const back = () => setScreen("home");
  const title = loading
    ? t.loading
    : screen === "welcome"
      ? t.welcome
      : screen === "settings"
        ? t.settings
        : screen === "home"
          ? t.homeTitle
          : screen === "install"
            ? t.installTitle
            : screen === "library"
              ? t.libraryTitle
              : screen === "lesson"
                ? `${t.level} ${selected.level}`
                : t.aboutTitle;
  return (
    <>
      <a class="skip" href="#main">
        {t.skip}
      </a>
      <header class={screen === "lesson" ? "training-header" : ""}>
        <span class="brand">
          <svg aria-hidden="true" viewBox="0 0 48 48">
            <path d="M12 34V20a4 4 0 0 1 8 0v9-17a4 4 0 0 1 8 0v17-12a4 4 0 0 1 8 0v15c0 9-6 13-13 13" />
          </svg>
          {t.brand}
        </span>
        <span class="header-note">{t.motto}</span>
      </header>
      <main id="main" class={screen === "lesson" ? "training-page" : ""}>
        <p class="eyebrow">{screen === "welcome" ? t.eyebrow : t.motto}</p>
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        {error && (
          <div role="alert" class="notice">
            <p>{t.error}</p>
            {loading === false && (
              <button
                onClick={() => void (screen === "settings" ? save() : load())}
              >
                {t.retry}
              </button>
            )}
          </div>
        )}
        {!loading && screen === "welcome" && (
          <>
            <p class="lead">{t.intro}</p>
            <div class="gesture" aria-hidden="true">
              <span />
              <span />
              <span />
              <svg viewBox="0 0 300 140">
                <path d="M25 100C85 100 55 35 125 40S190 125 270 35" />
              </svg>
            </div>
            <section class="card">
              <h2>{t.privacyTitle}</h2>
              <p>{t.privacy}</p>
              <p>{t.hosting}</p>
              <p>{t.storage}</p>
            </section>
            <p>{t.consentNote}</p>
            <button onClick={() => setScreen("settings")}>
              {t.consent}
              <span aria-hidden="true"> →</span>
            </button>
          </>
        )}
        {!loading && screen === "settings" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <p class="lead">{t.settingsIntro}</p>
            <section class="card">
              <label for="scale">
                {t.size}: <strong>{prefs.scale}%</strong>
              </label>
              <input
                id="scale"
                type="range"
                min="100"
                max="200"
                step="25"
                value={prefs.scale}
                onInput={(e) => change("scale", Number(e.currentTarget.value))}
              />
              <p class="sample">{t.sample}</p>
            </section>
            <section class="card">
              <label for="keyboard-size">
                {t.keyboardSize}: <strong>{prefs.keyboardSize ?? 100}%</strong>
              </label>
              <input
                id="keyboard-size"
                type="range"
                min="100"
                max="160"
                step="20"
                value={prefs.keyboardSize ?? 100}
                onInput={(e) =>
                  change("keyboardSize", Number(e.currentTarget.value))
                }
              />
              <label class="choice">
                <input
                  type="checkbox"
                  checked={prefs.ghost ?? true}
                  onChange={(e) => change("ghost", e.currentTarget.checked)}
                />
                {t.ghost}
              </label>
            </section>
            <fieldset>
              <legend>{t.theme}</legend>
              {(["claro", "escuro", "contraste"] as const).map((value) => (
                <label class="choice">
                  <input
                    type="radio"
                    name="theme"
                    value={value}
                    checked={prefs.theme === value}
                    onChange={() => change("theme", value)}
                  />
                  {t[value]}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>{t.hand}</legend>
              {(["direita", "esquerda"] as const).map((value) => (
                <label class="choice">
                  <input
                    type="radio"
                    name="hand"
                    checked={prefs.hand === value}
                    onChange={() => change("hand", value)}
                  />
                  {t[value]}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>{t.grip}</legend>
              {(["polegar", "indicador", "duas"] as const).map((value) => (
                <label class="choice">
                  <input
                    type="radio"
                    name="grip"
                    checked={prefs.grip === value}
                    onChange={() => change("grip", value)}
                  />
                  {t[value]}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>{t.feedback}</legend>
              <p>{t.feedbackNote}</p>
              <label class="choice">
                <input
                  type="checkbox"
                  checked={prefs.sound}
                  onChange={(e) => change("sound", e.currentTarget.checked)}
                />
                {t.sound}
              </label>
              <label class="choice">
                <input
                  type="checkbox"
                  checked={prefs.vibration}
                  onChange={(e) => change("vibration", e.currentTarget.checked)}
                />
                {t.vibration}
              </label>
            </fieldset>
            <button class="primary" disabled={saving}>
              {saving ? t.saving : t.save}
            </button>
          </form>
        )}
        {!loading && screen === "home" && (
          <>
            <p class="lead">{t.homeIntro}</p>
            <section class="card upcoming">
              <p class="eyebrow">{t.phase}</p>
              <h2>{t.phaseTitle}</h2>
              <p>{t.phaseBody}</p>
            </section>
            <nav aria-label={t.settings}>
              <button
                class="primary"
                disabled={!historyReady || historyError}
                onClick={() => openLesson(nextLevel, false)}
              >
                {t.training}
              </button>
              <button onClick={() => setScreen("library")}>{t.library}</button>
              <button onClick={() => setScreen("settings")}>
                {t.comfort}
                <span aria-hidden="true"> →</span>
              </button>
              <button onClick={() => setScreen("install")}>{t.install}</button>
              <button onClick={() => setScreen("about")}>{t.about}</button>
            </nav>
            <section class="card">
              <h2>{t.history}</h2>
              {historyError ? (
                <p role="alert">{t.lessonError}</p>
              ) : sessions.length ? (
                <ol class="history-list">
                  {sessions.map((session) => {
                    const attempt = attempts.find(
                      (a) => a.sessionId === session.id,
                    );
                    return (
                      <li>
                        {t.level} {session.level} ·{" "}
                        {session.status === "completed"
                          ? t.completed
                          : t.interrupted}
                        {attempt?.completed && (
                          <>
                            {" "}
                            ·{" "}
                            {new Intl.NumberFormat("pt-BR", {
                              maximumFractionDigits: 1,
                            }).format(attempt.accuracy)}
                            %
                          </>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p>{t.noHistory}</p>
              )}
            </section>
          </>
        )}
        {!loading && screen === "install" && (
          <>
            <p class="lead">{t.installIntro}</p>
            <section class="card">
              <h2>{t.android}</h2>
              <p>{t.androidHelp}</p>
              <h2>{t.iphone}</h2>
              <p>{t.iphoneHelp}</p>
            </section>
            <p>{t.offlineHelp}</p>
            <button onClick={back}>{t.back}</button>
          </>
        )}
        {!loading && screen === "about" && (
          <>
            <p class="lead">{t.aboutBody}</p>
            <section class="card">
              <p>{t.medical}</p>
              <p>{t.health}</p>
              <h2>{t.dataTitle}</h2>
              <p>{t.dataBody}</p>
              <p>{t.hosting}</p>
            </section>
            <button onClick={back}>{t.back}</button>
          </>
        )}
        {!loading && screen === "library" && (
          <>
            <p>{t.libraryIntro}</p>
            <ol class="lesson-list">
              {t.levels.map((name, i) => (
                <li class="card">
                  <h2>
                    {t.level} {i + 1}: {name}
                  </h2>
                  {i + 1 <= nextLevel ? (
                    <button
                      class="primary"
                      disabled={!historyReady || historyError}
                      onClick={() => openLesson(i + 1, false)}
                    >
                      {t.guided}
                    </button>
                  ) : (
                    <p>{t.locked}</p>
                  )}
                  <button onClick={() => openLesson(i + 1, true)}>
                    {t.free}
                  </button>
                </li>
              ))}
            </ol>
            <button onClick={back}>{t.back}</button>
          </>
        )}
        {!loading && screen === "lesson" && (
          <Lesson
            key={`${selected.level}-${selected.free}`}
            level={selected.level}
            free={selected.free}
            prefs={prefs}
            onExit={back}
            onSaved={() => void refreshLessons()}
          />
        )}
        {screen !== "lesson" && (
          <div class="status" role="status">
            {saved && <p>{t.saved}</p>}
            <p>
              <span aria-hidden="true">{offline ? "●" : "○"} </span>
              {swError
                ? t.offlineError
                : offline
                  ? t.offlineReady
                  : t.offlineWaiting}
            </p>
          </div>
        )}
        {update && screen !== "lesson" && (
          <aside class="notice">
            <p>{t.update}</p>
            <button onClick={() => void updater.current?.(true)}>
              {t.updateButton}
            </button>
          </aside>
        )}
      </main>
      {screen !== "lesson" && <footer>{t.footer}</footer>}
    </>
  );
}
render(<App />, document.getElementById("app")!);
