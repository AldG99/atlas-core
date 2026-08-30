import type { Order } from '../types/Order';

// Caché en memoria de los datos ya calculados para Reportes, para no volver a
// pedir a Firestore el mismo rango de fechas cada vez que se entra a la página.
// Se invalida por completo (invalidateReportsCache) cuando una mutación de
// pedidos puede cambiar lo que Reportes muestra (crear, cambiar estado o
// borrar) — app de un solo usuario por sesión, así que no hace falta filtrar
// por negocio, limpiar todo equivale a limpiar lo del usuario activo.
export interface ReportsCacheEntry {
  current: { orders: Order[]; hasMore: boolean };
  previous: { orders: Order[]; hasMore: boolean };
  cachedAt: number;
}

export const REPORTS_CACHE_TTL = 5 * 60 * 1000;

const cache = new Map<string, ReportsCacheEntry>();

export const getReportsCacheKey = (businessUid: string, start: Date, end: Date): string =>
  `${businessUid}:${start.getTime()}:${end.getTime()}`;

export const getCachedReportEntry = (key: string): ReportsCacheEntry | undefined => cache.get(key);

export const setCachedReportEntry = (key: string, entry: ReportsCacheEntry): void => {
  cache.set(key, entry);
};

export const invalidateReportsCache = (): void => {
  cache.clear();
};
