import { collection, doc, getDocs, query, where, Timestamp, writeBatch, type DocumentReference } from 'firebase/firestore';
import { db, auth } from './firebase';

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
  exportadoEn: string;
  clientes: Record<string, unknown>[];
  productos: Record<string, unknown>[];
  pedidos: Record<string, unknown>[];
  etiquetas: Record<string, unknown>[];
}

export interface ImportSummary {
  clientes: number;
  productos: number;
  pedidos: number;
  etiquetas: number;
  omitidos: number;
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
    throw new Error('No autorizado');
  }

  const [clientesSnap, productosSnap, pedidosSnap, etiquetasSnap] = await Promise.all([
    getDocs(query(collection(db, 'clientes'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'productos'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'pedidos'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'etiquetas'), where('userId', '==', userId))),
  ]);

  const clientes = clientesSnap.docs.map(doc => {
    const { fotoPerfil: _foto, ...data } = doc.data();
    return { ...data, id: doc.id, fechaCreacion: toIso(data.fechaCreacion) };
  });

  const productos = productosSnap.docs.map(doc => {
    const { imagen: _img, ...data } = doc.data();
    return {
      ...data,
      id: doc.id,
      fechaCreacion: toIso(data.fechaCreacion),
      fechaFinDescuento: toIso(data.fechaFinDescuento),
      historialDescuentos: (data.historialDescuentos || []).map((h: Record<string, unknown>) => ({
        ...h,
        fechaInicio: toIso(h.fechaInicio),
        fechaFin: toIso(h.fechaFin),
        fechaCierre: toIso(h.fechaCierre),
      })),
    };
  });

  const pedidos = pedidosSnap.docs.map(doc => {
    const { clienteFoto: _foto, ...data } = doc.data();
    return {
      ...data,
      id: doc.id,
      fechaCreacion: toIso(data.fechaCreacion),
      fechaEntrega: toIso(data.fechaEntrega),
      abonos: (data.abonos || []).map((a: Record<string, unknown>) => ({
        ...a,
        fecha: toIso(a.fecha),
      })),
    };
  });

  const etiquetas = etiquetasSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

  const backup: BackupData = {
    version: BACKUP_VERSION,
    exportadoEn: new Date().toISOString(),
    clientes,
    productos,
    pedidos,
    etiquetas,
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
          reject(new Error('Versión de respaldo no compatible'));
          return;
        }
        if (!data.clientes || !data.productos || !data.pedidos) {
          reject(new Error('Archivo incompleto o corrupto'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('El archivo no es un respaldo válido'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });

export const importBackup = async (data: BackupData, userId: string): Promise<ImportSummary> => {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('No autorizado');
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
  const [existingClientesSnap, existingProductosSnap, existingPedidosSnap, existingEtiquetasSnap] = await Promise.all([
    getDocs(query(collection(db, 'clientes'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'productos'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'pedidos'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'etiquetas'), where('userId', '==', userId))),
  ]);

  // Conjuntos de claves únicas existentes
  const existingTelefonos = new Set(existingClientesSnap.docs.map(d => d.data().telefono as string));
  const existingClaves = new Set(existingProductosSnap.docs.map(d => d.data().clave as string));
  const existingFolios = new Set(
    existingPedidosSnap.docs.map(d => d.data().folio as string).filter(Boolean)
  );

  // Mapa nombre → id para etiquetas existentes
  const existingEtiquetaMap: Record<string, string> = {};
  existingEtiquetasSnap.docs.forEach(d => {
    existingEtiquetaMap[d.data().nombre as string] = d.id;
  });

  // Mapa clave → id para productos existentes
  const existingProductoMap: Record<string, string> = {};
  existingProductosSnap.docs.forEach(d => {
    existingProductoMap[d.data().clave as string] = d.id;
  });

  let omitidos = 0;
  // Pending writes — refs generated client-side so ID maps can be built before any network call
  const allWrites: Array<{ ref: DocumentReference; data: Record<string, unknown> }> = [];
  const BATCH_SIZE = 499;

  try {
    // 1. Etiquetas
    const etiquetaIdMap: Record<string, string> = {};
    let etiquetasImported = 0;
    for (const etiqueta of data.etiquetas || []) {
      const { id: oldId, userId: _uid, ...rest } = etiqueta;
      const nombre = rest.nombre as string;
      if (existingEtiquetaMap[nombre]) {
        if (typeof oldId === 'string') etiquetaIdMap[oldId] = existingEtiquetaMap[nombre];
        omitidos++;
        continue;
      }
      try {
        const ref = doc(collection(db, 'etiquetas'));
        if (typeof oldId === 'string') etiquetaIdMap[oldId] = ref.id;
        allWrites.push({ ref, data: cleanUndefined({ ...rest, userId }) });
        etiquetasImported++;
      } catch { omitidos++; }
    }

    // 2. Productos — etiquetaIdMap ya está completo, no hay dependencia de red
    const productoIdMap: Record<string, string> = {};
    let productosImported = 0;
    for (const producto of data.productos || []) {
      const { id: oldId, userId: _uid, fechaCreacion: _fc, fechaFinDescuento, historialDescuentos, etiquetas, imagen: _img, ...rest } = producto;
      const clave = rest.clave as string;
      if (existingClaves.has(clave)) {
        if (typeof oldId === 'string') productoIdMap[oldId] = existingProductoMap[clave];
        omitidos++;
        continue;
      }
      try {
        const productoData: Record<string, unknown> = {
          ...rest,
          userId,
          fechaCreacion: Timestamp.now(),
          etiquetas: Array.isArray(etiquetas)
            ? etiquetas.map(eid => etiquetaIdMap[eid as string] ?? eid)
            : [],
        };
        if (fechaFinDescuento) {
          productoData.fechaFinDescuento = Timestamp.fromDate(parseDate(fechaFinDescuento));
        }
        if (Array.isArray(historialDescuentos) && historialDescuentos.length > 0) {
          productoData.historialDescuentos = historialDescuentos.map((h: Record<string, unknown>) => ({
            ...h,
            fechaInicio: Timestamp.fromDate(parseDate(h.fechaInicio)),
            fechaFin: Timestamp.fromDate(parseDate(h.fechaFin)),
            fechaCierre: Timestamp.fromDate(parseDate(h.fechaCierre)),
          }));
        }
        const ref = doc(collection(db, 'productos'));
        if (typeof oldId === 'string') productoIdMap[oldId] = ref.id;
        allWrites.push({ ref, data: cleanUndefined(productoData) });
        productosImported++;
      } catch { omitidos++; }
    }

    // 3. Clientes — duplicado detectado por teléfono
    let clientesImported = 0;
    for (const cliente of data.clientes || []) {
      const { id: _id, userId: _uid, fechaCreacion: _fc, fotoPerfil: _foto, ...rest } = cliente;
      const telefono = rest.telefono as string;
      if (existingTelefonos.has(telefono)) {
        omitidos++;
        continue;
      }
      try {
        const ref = doc(collection(db, 'clientes'));
        allWrites.push({ ref, data: cleanUndefined({ ...rest, userId, fechaCreacion: Timestamp.now() }) });
        clientesImported++;
      } catch { omitidos++; }
    }

    // 4. Pedidos — productoIdMap ya está completo
    let pedidosImported = 0;
    for (const pedido of data.pedidos || []) {
      const { id: _id, userId: _uid, fechaCreacion, fechaEntrega, clienteFoto: _foto, abonos, productos, folio, ...rest } = pedido;
      if (folio && existingFolios.has(folio as string)) {
        omitidos++;
        continue;
      }
      try {
        const pedidoData: Record<string, unknown> = {
          ...rest,
          folio,
          userId,
          fechaCreacion: Timestamp.fromDate(parseDate(fechaCreacion)),
          productos: Array.isArray(productos)
            ? productos.map((p: Record<string, unknown>) => ({
                ...p,
                productoId: p.productoId ? (productoIdMap[p.productoId as string] ?? p.productoId) : undefined,
              }))
            : [],
          abonos: Array.isArray(abonos)
            ? abonos.map((a: Record<string, unknown>) => ({
                ...a,
                fecha: Timestamp.fromDate(parseDate(a.fecha)),
              }))
            : [],
        };
        if (fechaEntrega) {
          pedidoData.fechaEntrega = Timestamp.fromDate(parseDate(fechaEntrega));
        }
        const ref = doc(collection(db, 'pedidos'));
        allWrites.push({ ref, data: cleanUndefined(pedidoData) });
        pedidosImported++;
      } catch { omitidos++; }
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
      clientes: clientesImported,
      productos: productosImported,
      pedidos: pedidosImported,
      etiquetas: etiquetasImported,
      omitidos,
    };
  } catch (err) {
    await rollback();
    throw err;
  }
};
