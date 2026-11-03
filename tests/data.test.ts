import { afterEach, expect, test } from 'vitest';
import { DestrezaDB, defaults } from '../src/data/db';
const database = new DestrezaDB('destreza-test');
afterEach(async () => { await database.config.clear(); });
test('preferências sobrevivem ao fechamento e à reabertura do banco', async () => {
  await database.config.put({ ...defaults, hand: 'esquerda', scale: 200, theme: 'contraste' });
  database.close();
  await database.open();
  expect(await database.config.get('local')).toMatchObject({ hand: 'esquerda', scale: 200, theme: 'contraste', consentVersion: 1 });
});
test('a primeira abertura não cria consentimento ou preferências implicitamente', async () => {
  expect(await database.config.get('local')).toBeUndefined();
});
