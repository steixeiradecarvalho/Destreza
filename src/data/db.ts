import Dexie, { type Table } from 'dexie';
export interface Preferences {
  id: 'local'; consentVersion: number; theme: 'claro' | 'escuro' | 'contraste';
  scale: number; hand: 'direita' | 'esquerda'; grip: 'polegar' | 'indicador' | 'duas';
  sound: boolean; vibration: boolean;
}
export const defaults: Preferences = { id: 'local', consentVersion: 1, theme: 'claro', scale: 100, hand: 'direita', grip: 'polegar', sound: false, vibration: false };
export class DestrezaDB extends Dexie {
  config!: Table<Preferences, string>;
  constructor(name = 'destreza') {
    super(name);
    this.version(1).stores({ config: '&id' });
  }
}
export const db = new DestrezaDB();
export async function savePreferences(value: Preferences) { await db.config.put(value); }
