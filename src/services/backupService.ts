import { collection, doc, getDocs, query, where, Timestamp, writeBatch, type DocumentReference } from 'firebase/firestore';
import { db, auth } from './firebase';
import i18n from '../i18n';

const BACKUP_VERSION = 1;

// Elimina recursivamente todos los campos con valor undefined (Firestore los rechaza).
// Respeta Timestamps y Dates sin convertirlos a objetos planos.
const cleanUndefined = (obj: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value instanceof Timestamp || value instanceof Date) {
      result[key] = value;
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        item !== null && typeof item === 'object' && !(item instanceof Timestamp) && !(item instanceof Date)
          ? cleanUndefined(item as Record<string, unknown>)
          : item
      );
    } else if (value !== null && typeof value === 'object') {
      result[key] = cleanUndefined(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
};

export interface BackupData {
  version: number;
  exportedAt: string;
  clients: Record<string, unknown>[];
  products: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  labels: Record<string, unknown>[];
}

export interface ImportSummary {
  clients: number;
  products: number;
  orders: number;
  labels: number;
  skipped: number;
}

const toIso = (val: unknown): string | undefined => {
  if (!val) return undefined;
  if (typeof (val as { toDate?: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return undefined;
};

const parseDate = (val: unknown): Date => {
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return new Date();
};

export const exportBackup = async (userId: string): Promise<void> => {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error(i18n.t('errors.notAuthorized'));
  }

  const [clientsSnap, productsSnap, ordersSnap, labelsSnap] = await Promise.all([
    getDocs(query(collection(db, 'clients'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'products'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'orders'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'labels'), where('userId', '==', userId))),
  ]);

  const clients = clientsSnap.docs.map(doc => {
    const { profilePhoto: _photo, ...data } = doc.data();
    return { ...data, id: doc.id, createdAt: toIso(data.createdAt) };
  });

  const products = productsSnap.docs.map(doc => {
    const { image: _img, ...data } = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: toIso(data.createdAt),
      discountEndDate: toIso(data.discountEndDate),
      discountHistory: (data.discountHistory || []).map((h: Record<string, unknown>) => ({
        ...h,
        startDate: toIso(h.startDate),
        endDate: toIso(h.endDate),
        closedAt: toIso(h.closedAt),
      })),
    };
  });

  const orders = ordersSnap.docs.map(doc => {
    const { clientPhoto: _photo, ...data } = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: toIso(data.createdAt),
      deliveredAt: toIso(data.deliveredAt),
      payments: (data.payments || []).map((p: Record<string, unknown>) => ({
        ...p,
        date: toIso(p.date),
      })),
    };
  });

  const labels = labelsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

  const backup: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    clients,
    products,
    orders,
    labels,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `skytla-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const parseBackupFile = (file: File): Promise<BackupData> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        if (data.version !== BACKUP_VERSION) {
          reject(new Error(i18n.t('errors.backupIncompatibleVersion')));
          return;
        }
        if (!data.clients || !data.products || !data.orders) {
          reject(new Error(i18n.t('errors.backupIncomplete')));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error(i18n.t('errors.backupInvalidFile')));
      }
    };
    reader.onerror = () => reject(new Error(i18n.t('errors.backupReadError')));
    reader.readAsText(file);
  });

export const importBackup = async (data: BackupData, userId: string): Promise<ImportSummary> => {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error(i18n.t('errors.notAuthorized'));
  }

  const insertedRefs: DocumentReference[] = [];

  const rollback = async () => {
    for (let i = 0; i < insertedRefs.length; i += 400) {
      const batch = writeBatch(db);
      insertedRefs.slice(i, i + 400).forEach(r => batch.delete(r));
      await batch.commit().catch(() => { /* best effort */ });
    }
  };

  // Pre-cargar datos existentes para detectar duplicados
  const [existingClientsSnap, existingProductsSnap, existingOrdersSnap, existingLabelsSnap] = await Promise.all([
    getDocs(query(collection(db, 'clients'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'products'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'orders'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'labels'), where('userId', '==', userId))),
  ]);

  // Conjuntos de claves únicas existentes
  const existingPhones = new Set(existingClientsSnap.docs.map(d => d.data().phone as string));
  const existingSkus = new Set(existingProductsSnap.docs.map(d => d.data().sku as string));
  const existingOrderNumbers = new Set(
    existingOrdersSnap.docs.map(d => d.data().orderNumber as string).filter(Boolean)
  );

  // Mapa name → id para labels existentes
  const existingLabelMap: Record<string, string> = {};
  existingLabelsSnap.docs.forEach(d => {
    existingLabelMap[d.data().name as string] = d.id;
  });

  // Mapa sku → id para products existentes
  const existingProductMap: Record<string, string> = {};
  existingProductsSnap.docs.forEach(d => {
    existingProductMap[d.data().sku as string] = d.id;
  });

  let skipped = 0;
  // Pending writes — refs generated client-side so ID maps can be built before any network call
  const allWrites: Array<{ ref: DocumentReference; data: Record<string, unknown> }> = [];
  const BATCH_SIZE = 499;

  try {
    // 1. Labels
    const labelIdMap: Record<string, string> = {};
    let labelsImported = 0;
    for (const label of data.labels || []) {
      const { id: oldId, userId: _uid, ...rest } = label;
      const name = rest.name as string;
      if (existingLabelMap[name]) {
        if (typeof oldId === 'string') labelIdMap[oldId] = existingLabelMap[name];
        skipped++;
        continue;
      }
      try {
        const ref = doc(collection(db, 'labels'));
        if (typeof oldId === 'string') labelIdMap[oldId] = ref.id;
        allWrites.push({ ref, data: cleanUndefined({ ...rest, userId }) });
        labelsImported++;
      } catch { skipped++; }
    }

    // 2. Products — labelIdMap ya está completo, no hay dependencia de red
    const productIdMap: Record<string, string> = {};
    let productsImported = 0;
    for (const product of data.products || []) {
      const { id: oldId, userId: _uid, createdAt: _ca, discountEndDate, discountHistory, labels, image: _img, ...rest } = product;
      const sku = rest.sku as string;
      if (existingSkus.has(sku)) {
        if (typeof oldId === 'string') productIdMap[oldId] = existingProductMap[sku];
        skipped++;
        continue;
      }
      try {
        const productData: Record<string, unknown> = {
          ...rest,
          userId,
          createdAt: Timestamp.now(),
          labels: Array.isArray(labels)
            ? labels.map(lid => labelIdMap[lid as string] ?? lid)
            : [],
        };
        if (discountEndDate) {
          productData.discountEndDate = Timestamp.fromDate(parseDate(discountEndDate));
        }
        if (Array.isArray(discountHistory) && discountHistory.length > 0) {
          productData.discountHistory = discountHistory.map((h: Record<string, unknown>) => ({
            ...h,
            startDate: Timestamp.fromDate(parseDate(h.startDate)),
            endDate: Timestamp.fromDate(parseDate(h.endDate)),
            closedAt: Timestamp.fromDate(parseDate(h.closedAt)),
          }));
        }
        const ref = doc(collection(db, 'products'));
        if (typeof oldId === 'string') productIdMap[oldId] = ref.id;
        allWrites.push({ ref, data: cleanUndefined(productData) });
        productsImported++;
      } catch { skipped++; }
    }

    // 3. Clients — duplicado detectado por teléfono
    let clientsImported = 0;
    for (const client of data.clients || []) {
      const { id: _id, userId: _uid, createdAt: _ca, profilePhoto: _photo, ...rest } = client;
      const phone = rest.phone as string;
      if (existingPhones.has(phone)) {
        skipped++;
        continue;
      }
      try {
        const ref = doc(collection(db, 'clients'));
        allWrites.push({ ref, data: cleanUndefined({ ...rest, userId, createdAt: Timestamp.now() }) });
        clientsImported++;
      } catch { skipped++; }
    }

    // 4. Orders — productIdMap ya está completo
    let ordersImported = 0;
    for (const order of data.orders || []) {
      const { id: _id, userId: _uid, createdAt, deliveredAt, clientPhoto: _photo, payments, items, orderNumber, ...rest } = order;
      if (orderNumber && existingOrderNumbers.has(orderNumber as string)) {
        skipped++;
        continue;
      }
      try {
        const orderData: Record<string, unknown> = {
          ...rest,
          orderNumber,
          userId,
          createdAt: Timestamp.fromDate(parseDate(createdAt)),
          items: Array.isArray(items)
            ? items.map((i: Record<string, unknown>) => ({
                ...i,
                productId: i.productId ? (productIdMap[i.productId as string] ?? i.productId) : undefined,
              }))
            : [],
          payments: Array.isArray(payments)
            ? payments.map((p: Record<string, unknown>) => ({
                ...p,
                date: Timestamp.fromDate(parseDate(p.date)),
              }))
            : [],
        };
        if (deliveredAt) {
          orderData.deliveredAt = Timestamp.fromDate(parseDate(deliveredAt));
        }
        const ref = doc(collection(db, 'orders'));
        allWrites.push({ ref, data: cleanUndefined(orderData) });
        ordersImported++;
      } catch { skipped++; }
    }

    // Commit all writes in batches of BATCH_SIZE (Firestore limit: 500 ops/batch)
    for (let i = 0; i < allWrites.length; i += BATCH_SIZE) {
      const chunk = allWrites.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(({ ref, data }) => batch.set(ref, data));
      await batch.commit();
      // Track committed refs for rollback only after each successful commit
      chunk.forEach(({ ref }) => insertedRefs.push(ref));
    }

    return {
      clients: clientsImported,
      products: productsImported,
      orders: ordersImported,
      labels: labelsImported,
      skipped,
    };
  } catch (err) {
    await rollback();
    throw err;
  }
};
