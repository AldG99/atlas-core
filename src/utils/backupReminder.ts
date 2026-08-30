// Marca en localStorage cuándo se exportó el último respaldo, para que la baja
// de cuenta / borrado de datos pueda exigir un respaldo reciente antes de
// permitir la acción. Es por dispositivo a propósito: si vas a borrar todo
// desde un equipo nuevo, volver a exportar cuesta 10 segundos.

const KEY = 'atlas:lastBackupExport';
const FRESH_DAYS = 7;

export const markBackupExported = (): void => {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* modo incógnito / storage bloqueado — sin registro, el gate pedirá exportar */
  }
};

export const getLastBackupExport = (): number | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
};

export const hasRecentBackup = (): boolean => {
  const ts = getLastBackupExport();
  return ts !== null && Date.now() - ts < FRESH_DAYS * 24 * 60 * 60 * 1000;
};
