import type { Preferences } from "../data/db";
let audio: AudioContext | undefined;
export function feedback(prefs: Preferences, correct: boolean) {
  // Errors receive text feedback only; all optional APIs fail without blocking practice.
  if (!correct) return;
  if (prefs.vibration) {
    try {
      navigator.vibrate?.(20);
    } catch {
      /* unsupported */
    }
  }
  if (prefs.sound) {
    try {
      audio ??= new AudioContext();
      void audio.resume().catch(() => {});
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = 520;
      gain.gain.setValueAtTime(0.025, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.09);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.1);
    } catch {
      /* optional */
    }
  }
}
