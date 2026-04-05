import { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Pedido } from '../../types/Pedido';
import { PEDIDO_STATUS_COLORS } from '../../constants/pedidoStatus';
import { formatDate, formatShortDate, getTotalPagado, formatTelefono } from '../../utils/formatters';
import { getCodigoPais } from '../../data/codigosPais';
import { useCurrency } from '../../hooks/useCurrency';
import './PedidoCaptura.scss';

interface PedidoCapturaProps {
  pedido: Pedido;
  cobertura: number[];
  telefonoCodigoPais?: string;
  fechaDescarga?: Date | null;
}

const PedidoCaptura = forwardRef<HTMLDivElement, PedidoCapturaProps>(
  ({ pedido, cobertura, telefonoCodigoPais, fechaDescarga }, ref) => {
    const { t, i18n } = useTranslation();
    const { format } = useCurrency();
    const pagado = getTotalPagado(pedido);
    const restante = pedido.total - pagado;
    const abonos = useMemo(
      () => [...(pedido.abonos || [])].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
      [pedido.abonos]
    );

    return (
      <div ref={ref} className="pedido-captura">
        {/* Encabezado */}
        <div className="pedido-captura__header">
          <div className="pedido-captura__client">
            <span className="pedido-captura__client-name">{pedido.clienteNombre}</span>
            <span className="pedido-captura__client-phone">
              {telefonoCodigoPais
                ? `${getCodigoPais(telefonoCodigoPais)?.codigo ?? ''} ${formatTelefono(pedido.clienteTelefono)}`
                : formatTelefono(pedido.clienteTelefono)}
            </span>
          </div>
          <div className="pedido-captura__meta">
            {pedido.folio && (
              <span className="pedido-captura__folio">{pedido.folio}</span>
            )}
            <span className="pedido-captura__date">{formatDate(pedido.fechaCreacion)}</span>
            <span
              className="pedido-captura__estado"
              style={{ color: PEDIDO_STATUS_COLORS[pedido.estado] }}
            >
              {t(`orders.status.${pedido.estado}`)}
            </span>
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="pedido-captura__section">
          <span className="pedido-captura__section-title">{t('orders.capture.products')}</span>
          <table className="pedido-captura__table pedido-captura__products-table">
            <thead>
              <tr>
                <th>{t('orders.code')}</th>
                <th>{t('orders.quantity')}</th>
                <th>{t('orders.product')}</th>
                <th>{t('orders.price')}</th>
                <th>{t('orders.paid')}</th>
                <th>{t('orders.subtotal')}</th>
                <th>{t('orders.status_col')}</th>
              </tr>
            </thead>
            <tbody>
              {pedido.productos.map((p, idx) => {
                const cubierto = Math.min(cobertura[idx] || 0, p.subtotal);
                const porcentaje = p.subtotal > 0 ? (cubierto / p.subtotal) * 100 : 0;
                const status =
                  porcentaje >= 100 ? 'paid' : porcentaje > 0 ? 'partial' : 'pending';
                return (
                  <tr key={idx}>
                    <td className="pedido-captura__clave">{p.clave || '-'}</td>
                    <td>{p.cantidad}</td>
                    <td>
                      {p.nombre}
                      {p.descuento && p.descuento > 0 ? (
                        <span className="pedido-captura__discount"> (-{p.descuento}%)</span>
                      ) : null}
                    </td>
                    <td>{format(p.precioUnitario)}</td>
                    <td>{format(cubierto)}</td>
                    <td>{format(p.subtotal)}</td>
                    <td className={`pedido-captura__pago-status pedido-captura__pago-status--${status}`}>
                      {status === 'paid'
                        ? t('orders.capture.statusPaid')
                        : status === 'partial'
                          ? `${Math.round(porcentaje)}%`
                          : t('orders.capture.statusPending')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notas */}
        {pedido.notas && (
          <div className="pedido-captura__section">
            <div className="pedido-captura__notes">
              <span className="pedido-captura__notes-label">{t('orders.capture.notes')}</span> {pedido.notas}
            </div>
          </div>
        )}

        {/* Tabla de abonos */}
        {abonos.length > 0 && (
          <div className="pedido-captura__section">
            <span className="pedido-captura__section-title">{t('orders.capture.payments')}</span>
            <table className="pedido-captura__table pedido-captura__abonos-table">
              <thead>
                <tr>
                  <th>{t('orders.code')}</th>
                  <th>{t('orders.product')}</th>
                  <th>{t('orders.detail.paymentsTable.amount')}</th>
                  <th>{t('common.date')}</th>
                </tr>
              </thead>
              <tbody>
                {abonos.map((abono, i) => (
                  <tr key={i}>
                    <td className="pedido-captura__clave">
                      {typeof abono.productoIndex === 'number' &&
                      pedido.productos[abono.productoIndex]
                        ? pedido.productos[abono.productoIndex].clave || '-'
                        : '-'}
                    </td>
                    <td>
                      {typeof abono.productoIndex === 'number' &&
                      pedido.productos[abono.productoIndex]
                        ? pedido.productos[abono.productoIndex].nombre
                        : t('orders.capture.general')}
                    </td>
                    <td>{format(abono.monto)}</td>
                    <td>{formatShortDate(abono.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totales */}
        <div className="pedido-captura__footer">
          <div className="pedido-captura__total-row">
            <span>{t('orders.capture.total')}</span>
            <strong>{format(pedido.total)}</strong>
          </div>
          <div className="pedido-captura__total-row">
            <span>{t('orders.capture.paid')}</span>
            <strong className="pedido-captura__total-paid">{format(pagado)}</strong>
          </div>
          <div className="pedido-captura__total-row pedido-captura__total-row--highlight">
            <span>{t('orders.capture.remaining')}</span>
            <strong className={restante <= 0 ? 'pedido-captura__total-paid' : 'pedido-captura__total-pending'}>
              {restante <= 0 ? t('orders.capture.settled') : format(restante)}
            </strong>
          </div>
        </div>

        {fechaDescarga && (
          <div className="pedido-captura__descarga">
            {t('orders.capture.generatedOn', {
              date: fechaDescarga.toLocaleDateString(i18n.language, { day: '2-digit', month: 'long', year: 'numeric' }),
              time: fechaDescarga.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
            })}
          </div>
        )}
      </div>
    );
  }
);

PedidoCaptura.displayName = 'PedidoCaptura';
export default PedidoCaptura;
