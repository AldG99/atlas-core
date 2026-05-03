import { useMemo } from 'react';
import { usePedidos } from './usePedidos';
import { useProductos } from './useProductos';

export interface Notificacion {
  id: string;
  tipo: 'warning' | 'info';
  titulo: string;
  descripcion: string;
  link: string;
  filterState: Record<string, unknown>;
}

const DIAS_PENDIENTE = 2;
const DIAS_PREPARACION = 3;
const DIAS_ABONO = 3;
const DIAS_DESCUENTO = 7;
const UMBRAL_STOCK_BAJO = 5;

const diffDias = (fecha: Date): number =>
  Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));

export const useNotificaciones = () => {
  const { pedidos } = usePedidos();
  const { productos } = useProductos();

  const notificaciones: Notificacion[] = useMemo(() => {
    const result: Notificacion[] = [];
    // eslint-disable-next-line react-hooks/purity
    const ahora = Date.now();

    // 1. Pedidos en "Pendiente" hace más de 2 días
    const pendientesAtascados = pedidos.filter(
      p => !p.archivado && p.estado === 'pendiente' && diffDias(p.fechaCreacion) >= DIAS_PENDIENTE
    );
    if (pendientesAtascados.length > 0) {
      result.push({
        id: 'pendiente_atascado',
        tipo: 'warning',
        titulo: `${pendientesAtascados.length} pedido${pendientesAtascados.length > 1 ? 's' : ''} en Pendiente`,
        descripcion: `Llevan más de ${DIAS_PENDIENTE} días sin moverse`,
        link: '/dashboard',
        filterState: { filterStatus: 'pendiente' },
      });
    }

    // 2. Pedidos en "En preparación" hace más de 3 días
    const preparacionAtascados = pedidos.filter(
      p => !p.archivado && p.estado === 'en_preparacion' && diffDias(p.fechaCreacion) >= DIAS_PREPARACION
    );
    if (preparacionAtascados.length > 0) {
      result.push({
        id: 'preparacion_atascada',
        tipo: 'warning',
        titulo: `${preparacionAtascados.length} pedido${preparacionAtascados.length > 1 ? 's' : ''} en preparación`,
        descripcion: `Llevan más de ${DIAS_PREPARACION} días sin entregarse`,
        link: '/dashboard',
        filterState: { filterStatus: 'en_preparacion' },
      });
    }

    // 3. Descuentos próximos a vencer (próximos 7 días)
    const descuentosVenciendo = productos.filter(p => {
      if (!p.descuento || !p.fechaFinDescuento) return false;
      const msRestantes = new Date(p.fechaFinDescuento).getTime() - ahora;
      const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));
      return diasRestantes >= 0 && diasRestantes <= DIAS_DESCUENTO;
    });
    if (descuentosVenciendo.length > 0) {
      result.push({
        id: 'descuento_venciendo',
        tipo: 'info',
        titulo: `${descuentosVenciendo.length} descuento${descuentosVenciendo.length > 1 ? 's' : ''} por vencer`,
        descripcion: `Vencen en los próximos ${DIAS_DESCUENTO} días`,
        link: '/products',
        filterState: { filterDescuento: true },
      });
    }

    // 4. Pedidos con abono parcial sin movimiento en 3+ días
    const abonosPendientes = pedidos.filter(p => {
      if (p.archivado || p.estado === 'entregado') return false;
      const abonos = p.abonos || [];
      if (abonos.length === 0) return false;
      const totalPagado = abonos.reduce((sum, a) => sum + a.monto, 0);
      if (totalPagado <= 0 || totalPagado >= p.total) return false;
      const ultimoAbono = abonos.reduce((max, a) =>
        new Date(a.fecha) > new Date(max.fecha) ? a : max
      );
      return diffDias(ultimoAbono.fecha) >= DIAS_ABONO;
    });
    if (abonosPendientes.length > 0) {
      result.push({
        id: 'abono_pendiente',
        tipo: 'warning',
        titulo: `${abonosPendientes.length} pedido${abonosPendientes.length > 1 ? 's' : ''} con saldo pendiente`,
        descripcion: `Sin abonos en más de ${DIAS_ABONO} días`,
        link: '/dashboard',
        filterState: { filterStatus: 'abono_pendiente' },
      });
    }

    // 5. Productos sin stock
    const sinStock = productos.filter(p => p.controlStock && (p.stock ?? 0) <= 0);
    if (sinStock.length > 0) {
      result.push({
        id: 'sin_stock',
        tipo: 'warning',
        titulo: `${sinStock.length} producto${sinStock.length > 1 ? 's' : ''} sin stock`,
        descripcion: sinStock.length === 1 ? sinStock[0].nombre : `${sinStock[0].nombre} y ${sinStock.length - 1} más`,
        link: '/products',
        filterState: {},
      });
    }

    // 6. Productos con stock bajo (> 0 pero <= umbral)
    const stockBajo = productos.filter(p =>
      p.controlStock && (p.stock ?? 0) > 0 && (p.stock ?? 0) <= UMBRAL_STOCK_BAJO
    );
    if (stockBajo.length > 0) {
      result.push({
        id: 'stock_bajo',
        tipo: 'info',
        titulo: `${stockBajo.length} producto${stockBajo.length > 1 ? 's' : ''} con stock bajo`,
        descripcion: `Menos de ${UMBRAL_STOCK_BAJO} unidades disponibles`,
        link: '/products',
        filterState: {},
      });
    }

    return result;
  }, [pedidos, productos]);

  return { notificaciones };
};
