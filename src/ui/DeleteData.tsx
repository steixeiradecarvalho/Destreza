import { useState } from "preact/hooks";
import { clearLocalData } from "../data/history";
import { textos as t } from "./textos";
export function DeleteData({ onDeleted }: { onDeleted: () => void }) {
  const [stage, setStage] = useState(false),
    [ack, setAck] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  async function remove() {
    if (!ack || busy) return;
    setBusy(true);
    setError(false);
    try {
      await clearLocalData();
      onDeleted();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section class="card">
      <h2>{t.deleteTitle}</h2>
      <p>{t.deleteHelp}</p>
      {!stage ? (
        <button type="button" onClick={() => setStage(true)}>
          {t.deletePrepare}
        </button>
      ) : (
        <>
          <p role="status">{t.deletePending}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setStage(false);
              setAck(false);
              setError(false);
            }}
          >
            {t.deleteUndo}
          </button>
          <label class="choice">
            <input
              type="checkbox"
              checked={ack}
              disabled={busy}
              onChange={(e) => setAck(e.currentTarget.checked)}
            />
            {t.deleteAcknowledge}
          </label>
          <button
            type="button"
            disabled={!ack || busy}
            onClick={() => void remove()}
          >
            {t.deleteConfirm}
          </button>
        </>
      )}
      {error && <p role="alert">{t.deleteError}</p>}
    </section>
  );
}
