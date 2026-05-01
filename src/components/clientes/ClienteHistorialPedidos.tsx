import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PiArrowRightBold, PiMagnifyingGlassBold } from 'react-icons/pi';
import type { Pedido } from '../../types/Pedido';
import type { Producto, Etiqueta } from '../../types/Producto';
import { ETIQUETA_ICONS } from '../../constants/etiquetaIcons';
import { ROUTES } from '../../config/routes';

type DateFilter = 'todo' | 'semana' | 'mes' | '3meses';

interface Props {
  clienteId: string;
  pedidos: Pedido[];
  pedidosLoading: boolean;
  catalogoProductos: Producto[];
  todasEtiquetas: Etiqueta[];
  format: (n: number) => string;
}

const ClienteHistorialPedidos: React.FC<Props> = ({
  clienteId,
  pedidos,
  pedidosLoading,
  catalogoProductos,
  todasEtiquetas,
  format,
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [busqueda, setBusqueda] = useState('');
  const [filtroFecha, setFiltroFecha] = useState<DateFilter>('todo');
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const tableBodyRef = useRef<HTMLDivElement>(null);

  const formatPedidoDate = (date: Date) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));

  const getEtiquetasForClave = (clave?: string): Etiqueta[] => {
    if (!clave) return [];
    const producto = catalogoProductos.find(cp => cp.clave === clave);
    if (!producto?.etiquetas) return [];
    return producto.etiquetas
      .map(etId => todasEtiquetas.find(e => e.id === etId))
      .filter((e): e is Etiqueta => !!e);
  };

  const pedidosFiltrados = useMemo(() => {
    let resultado = [...pedidos];

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter(p =>
        p.productos.some(prod =>
          prod.nombre.toLowerCase().includes(q) ||
          (prod.clave && prod.clave.toLowerCase().includes(q))
        )
      );
    }

    resultado = resultado.filter(p => p.estado === 'entregado');

    if (filtroFecha !== 'todo') {
      const ahora = new Date();
      let desde: Date;
      switch (filtroFecha) {
        case 'semana': desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case 'mes':    desde = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000); break;
        case '3meses': desde = new Date(ahora.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      }
      resultado = resultado.filter(p => new Date(p.fechaCreacion) >= desde!);
    }

    resultado.sort((a, b) =>
      new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
    );

    return resultado;
  }, [pedidos, busqueda, filtroFecha]);

  const acumuladoMap = useMemo(() => {
    const sorted = [...pedidos]
      .filter(p => p.estado === 'entregado')
      .sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime());
    const map = new Map<string, number>();
    let acumulado = 0;
    sorted.forEach(p => {
      acumulado += p.total;
      map.set(p.id, acumulado);
    });
    return map;
  }, [pedidos]);

  useEffect(() => {
    if (!pedidosFiltrados.length) return;
    const totalRows = pedidosFiltrados.reduce((sum, p) => sum + p.productos.length + 2, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.min(prev + 1, totalRows - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedRow !== null) {
        e.preventDefault();
        let ri = 0;
        for (const pedido of pedidosFiltrados) {
          if (focusedRow === ri) {
            navigate(ROUTES.DETAIL_PEDIDO.replace(':id', pedido.id), { state: { from: `/cliente/${clienteId}` } });
            break;
          }
          ri += pedido.productos.length + 2;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pedidosFiltrados, focusedRow, navigate, clienteId]);

  useEffect(() => {
    if (focusedRow === null || !tableBodyRef.current) return;
    const rows = tableBodyRef.current.querySelectorAll('tr');
    const row = rows[focusedRow];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedRow]);

  const totalAcumulado = pedidos.filter(p => p.estado === 'entregado').reduce((s, p) => s + p.total, 0);

  return (
    <div className="cliente-detail__main">
      {/* Filtros */}
      <div className="cliente-detail__pedidos-filters">
        <div className="cliente-detail__pedidos-search">
          <PiMagnifyingGlassBold size={16} />
          <input
            type="text"
            placeholder={t('clients.detail.searchPlaceholder')}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <select value={filtroFecha} onChange={e => setFiltroFecha(e.target.value as DateFilter)}>
          <option value="todo">{t('clients.detail.allTime')}</option>
          <option value="semana">{t('clients.detail.lastWeek')}</option>
          <option value="mes">{t('clients.detail.lastMonth')}</option>
          <option value="3meses">{t('clients.detail.last3Months')}</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="cliente-detail__pedidos-table-wrapper">
        <div className="cliente-detail__pedidos-table-head">
          <table className="cliente-detail__pedidos-table">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '34%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>{t('clients.detail.historyTable.code')}</th>
                <th>{t('clients.detail.historyTable.quantity')}</th>
                <th>{t('clients.detail.historyTable.product')}</th>
                <th>{t('clients.detail.historyTable.labels')}</th>
                <th>{t('clients.detail.historyTable.amount')}</th>
                <th>{t('clients.detail.historyTable.accumulated')}</th>
              </tr>
            </thead>
          </table>
        </div>
        <div ref={tableBodyRef} className="cliente-detail__pedidos-table-body">
          <table className="cliente-detail__pedidos-table">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '34%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <tbody>
              {pedidosLoading ? (
                <tr>
                  <td colSpan={6} className="cliente-detail__pedidos-table-empty">{t('clients.detail.orderHistoryLoading')}</td>
                </tr>
              ) : pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="cliente-detail__pedidos-table-empty">
                    {pedidos.length === 0 ? t('clients.detail.orderHistoryEmpty') : t('clients.detail.orderHistoryNotFound')}
                  </td>
                </tr>
              ) : (() => {
                let rowIdx = 0;
                return pedidosFiltrados.map((pedido) => {
                  const dateIdx = rowIdx++;
                  const productIndices = pedido.productos.map(() => rowIdx++);
                  const totalIdx = rowIdx++;
                  return (
                    <React.Fragment key={pedido.id}>
                      {/* Fila de fecha del pedido */}
                      <tr
                        className={`cliente-detail__pedidos-date-row${focusedRow === dateIdx ? ' cliente-detail__pedidos-date-row--focused' : ''}`}
                        onMouseEnter={() => setFocusedRow(dateIdx)}
                      >
                        <td colSpan={6}>
                          <div className="cliente-detail__pedidos-date-row-inner">
                            {pedido.folio && (
                              <span className="cliente-detail__pedidos-folio">{pedido.folio}</span>
                            )}
                            <span className="cliente-detail__pedidos-date-main">{formatPedidoDate(pedido.fechaCreacion)}</span>
                            {pedido.fechaEntrega && (
                              <PiArrowRightBold size={12} className="cliente-detail__pedidos-date-arrow" />
                            )}
                            {pedido.fechaEntrega && (
                              <span className="cliente-detail__pedidos-date-entrega">
                                {formatPedidoDate(pedido.fechaEntrega)}
                              </span>
                            )}
                            <button
                              className="cliente-detail__pedidos-detail-btn"
                              onClick={() => navigate(ROUTES.DETAIL_PEDIDO.replace(':id', pedido.id), { state: { from: `/cliente/${clienteId}` } })}
                              title={t('clients.detail.viewOrderDetail')}
                            >
                              <PiArrowRightBold size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Filas de productos */}
                      {pedido.productos.map((p, i) => (
                        <tr
                          key={i}
                          className={`cliente-detail__pedidos-product-row${focusedRow === productIndices[i] ? ' cliente-detail__pedidos-product-row--focused' : ''}`}
                          onMouseEnter={() => setFocusedRow(productIndices[i])}
                        >
                          <td>
                            {p.clave
                              ? <span className="cliente-detail__clave">{p.clave}</span>
                              : '—'}
                          </td>
                          <td>{p.cantidad}</td>
                          <td>{p.nombre}</td>
                          <td>
                            <div className="cliente-detail__pedidos-etiquetas">
                              {getEtiquetasForClave(p.clave).map(et => {
                                const iconData = ETIQUETA_ICONS[et.icono];
                                const Icon = iconData?.icon;
                                return (
                                  <span key={et.id} className="cliente-detail__pedidos-etiqueta" style={{ backgroundColor: et.color }} title={et.nombre}>
                                    {Icon && <Icon size={12} />}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td>{format(p.subtotal)}</td>
                          <td />
                        </tr>
                      ))}
                      {/* Fila de total */}
                      <tr
                        className={`cliente-detail__pedidos-total-row${focusedRow === totalIdx ? ' cliente-detail__pedidos-total-row--focused' : ''}`}
                        onMouseEnter={() => setFocusedRow(totalIdx)}
                      >
                        <td colSpan={4} className="cliente-detail__pedidos-total-label">{t('clients.detail.historyTotal')}</td>
                        <td className="cliente-detail__pedidos-total-value">{format(pedido.total)}</td>
                        <td className="cliente-detail__pedidos-acumulado-value">{format(acumuladoMap.get(pedido.id) ?? 0)}</td>
                      </tr>
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        <div className="cliente-detail__pedidos-table-total">
          <table className="cliente-detail__pedidos-table">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '34%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <tfoot>
              <tr>
                <td colSpan={5} className="cliente-detail__pedidos-table-total-label">{t('clients.detail.historyAccumulated')}</td>
                <td className="cliente-detail__pedidos-table-total-value">{format(totalAcumulado)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClienteHistorialPedidos;
