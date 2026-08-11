import { describe, it, expect, vi } from 'vitest';
import { parseBackupFile } from '../services/backupService';
import type { BackupData } from '../services/backupService';
import i18n from '../i18n';

vi.mock('../services/firebase', () => ({
  db: {},
  auth: { currentUser: null },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  writeBatch: vi.fn(),
  Timestamp: { now: vi.fn(), fromDate: vi.fn() },
}));

const makeFile = (content: string): File =>
  new File([content], 'backup.json', { type: 'application/json' });

const validBackup: BackupData = {
  version: 1,
  exportedAt: '2024-06-15T10:00:00.000Z',
  clients: [],
  products: [],
  orders: [],
  labels: [],
};

// ── parseBackupFile ──────────────────────────────────────────────────────────

describe('parseBackupFile', () => {
  it('resolves with a valid backup file', async () => {
    const file = makeFile(JSON.stringify(validBackup));
    const result = await parseBackupFile(file);
    expect(result.version).toBe(1);
    expect(result.exportedAt).toBe(validBackup.exportedAt);
    expect(result.clients).toEqual([]);
    expect(result.orders).toEqual([]);
  });

  it('preserves non-empty collections', async () => {
    const backup: BackupData = {
      ...validBackup,
      clients: [{ id: 'c1', firstName: 'Ana', phone: '5551234567' }],
      orders:  [{ id: 'p1', orderNumber: 'ORD-20240101-0001', total: 100 }],
    };
    const result = await parseBackupFile(makeFile(JSON.stringify(backup)));
    expect(result.clients).toHaveLength(1);
    expect(result.orders).toHaveLength(1);
  });

  it('rejects when version is not 1', async () => {
    const file = makeFile(JSON.stringify({ ...validBackup, version: 2 }));
    await expect(parseBackupFile(file)).rejects.toThrow(i18n.t('errors.backupIncompatibleVersion'));
  });

  it('rejects when clients is missing', async () => {
    const { clients: _, ...rest } = validBackup;
    const file = makeFile(JSON.stringify(rest));
    await expect(parseBackupFile(file)).rejects.toThrow(i18n.t('errors.backupIncomplete'));
  });

  it('rejects when products is missing', async () => {
    const { products: _, ...rest } = validBackup;
    const file = makeFile(JSON.stringify(rest));
    await expect(parseBackupFile(file)).rejects.toThrow(i18n.t('errors.backupIncomplete'));
  });

  it('rejects when orders is missing', async () => {
    const { orders: _, ...rest } = validBackup;
    const file = makeFile(JSON.stringify(rest));
    await expect(parseBackupFile(file)).rejects.toThrow(i18n.t('errors.backupIncomplete'));
  });

  it('rejects when content is not valid JSON', async () => {
    const file = makeFile('not valid { json }');
    await expect(parseBackupFile(file)).rejects.toThrow(i18n.t('errors.backupInvalidFile'));
  });

  it('rejects on an empty file', async () => {
    const file = makeFile('');
    await expect(parseBackupFile(file)).rejects.toThrow(i18n.t('errors.backupInvalidFile'));
  });
});
