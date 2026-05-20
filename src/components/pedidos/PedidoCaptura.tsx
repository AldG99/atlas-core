import { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Pedido } from '../../types/Pedido';
import { formatShortDate, getTotalPagado, formatTelefono } from '../../utils/formatters';
import { getCodigoPais } from '../../data/codigosPais';
import { useCurrency } from '../../hooks/useCurrency';
import './PedidoCaptura.scss';

interface PedidoCapturaProps {
  pedido: Pedido;
  cobertura: number[];
  telefonoCodigoPais?: string;
  fechaDescarga?: Date | null;
  nombreNegocio?: string;
}

const PedidoCaptura = forwardRef<HTMLDivElement, PedidoCapturaProps>(
  ({ pedido, cobertura, telefonoCodigoPais, fechaDescarga, nombreNegocio }, ref) => {
    const { t, i18n } = useTranslation();
    const { format } = useCurrency();
    const pagado = getTotalPagado(pedido);
    const restante = pedido.total - pagado;
    const abonos = useMemo(
      () => [...(pedido.abonos || [])].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
      [pedido.abonos]
    );

    const tel = telefonoCodigoPais
      ? `${getCodigoPais(telefonoCodigoPais)?.codigo ?? ''} ${formatTelefono(pedido.clienteTelefono)}`
      : formatTelefono(pedido.clienteTelefono);

    return (
      <div ref={ref} className="pedido-captura">

        {/* Header */}
        <div className="pedido-captura__header">
          {nombreNegocio && (
            <div className="pedido-captura__negocio">{nombreNegocio}</div>
          )}
          {pedido.folio && (
            <div className="pedido-captura__folio">{pedido.folio}</div>
          )}
        </div>

        <hr className="pedido-captura__sep pedido-captura__sep--double" />

        {/* Info del cliente */}
        <div className="pedido-captura__info">
          <div className="pedido-captura__info-row">
            <span>{pedido.clienteNombre}</span>
            <span className="pedido-captura__estado">
              {t(`orders.status.${pedido.estado}`)}
            </span>
          </div>
          <div className="pedido-captura__info-row">
            <span>{tel}</span>
            <span>{formatShortDate(pedido.fechaCreacion)}</span>
          </div>
        </div>

        <hr className="pedido-captura__sep pedido-captura__sep--dashed" />

        {/* Productos */}
        <div className="pedido-captura__section-title">{t('orders.capture.products')}</div>
        {pedido.productos.map((p, idx) => {
          const cubierto = Math.min(cobertura[idx] || 0, p.subtotal);
          const porcentaje = p.subtotal > 0 ? (cubierto / p.subtotal) * 100 : 0;
          const statusLabel =
            porcentaje >= 100
              ? t('orders.capture.statusPaid')
              : porcentaje > 0
                ? `${Math.round(porcentaje)}%`
                : t('orders.capture.statusPending');
          return (
            <div key={idx} className="pedido-captura__product">
              <div className="pedido-captura__product-name">
                {p.clave && <span className="pedido-captura__clave">[{p.clave}] </span>}
                {p.nombre}
                {p.descuento ? ` (-${p.descuento}%)` : ''}
              </div>
              <div className="pedido-captura__product-detail">
                <span>{p.cantidad} × {format(p.precioUnitario)}</span>
                <span>{format(p.subtotal)} · {statusLabel}</span>
              </div>
            </div>
          );
        })}

        <hr className="pedido-captura__sep pedido-captura__sep--double" />

        {/* Totales */}
        <div className="pedido-captura__total-block">
          <div className="pedido-captura__total-row">
            <span>{t('orders.capture.total')}</span>
            <span>{format(pedido.total)}</span>
          </div>
          <div className="pedido-captura__total-row">
            <span>{t('orders.capture.paid')}</span>
            <span>{format(pagado)}</span>
          </div>
          <div className="pedido-captura__total-row pedido-captura__total-row--highlight">
            <span>{t('orders.capture.remaining')}</span>
            <span>{restante <= 0 ? t('orders.capture.settled') : format(restante)}</span>
          </div>
        </div>

        {/* Notas */}
        {pedido.notas && (
          <>
            <hr className="pedido-captura__sep pedido-captura__sep--dashed" />
            <div className="pedido-captura__section-title">{t('orders.capture.notes')}</div>
            <div className="pedido-captura__notas">{pedido.notas}</div>
          </>
        )}

        {/* Abonos */}
        {abonos.length > 0 && (
          <>
            <hr className="pedido-captura__sep pedido-captura__sep--dashed" />
            <div className="pedido-captura__section-title">{t('orders.capture.payments')}</div>
            {abonos.map((abono, i) => {
              const prod =
                typeof abono.productoIndex === 'number'
                  ? pedido.productos[abono.productoIndex]
                  : undefined;
              const label = prod
                ? `${prod.clave ? `[${prod.clave}] ` : ''}${prod.nombre}`
                : t('orders.capture.general');
              return (
                <div key={i} className="pedido-captura__abono-row">
                  <span className="pedido-captura__abono-left">{label}</span>
                  <span className="pedido-captura__abono-right">
                    {format(abono.monto)}{'  '}{formatShortDate(abono.fecha)}
                  </span>
                </div>
              );
            })}
          </>
        )}

        <hr className="pedido-captura__sep pedido-captura__sep--double" />

        {/* Pie */}
        <div className="pedido-captura__footer">
          {fechaDescarga &&
            t('orders.capture.generatedOn', {
              date: fechaDescarga.toLocaleDateString(i18n.language, {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              }),
              time: fechaDescarga.toLocaleTimeString(i18n.language, {
                hour: '2-digit',
                minute: '2-digit',
              }),
            })}
        </div>

      </div>
    );
  }
);

PedidoCaptura.displayName = 'PedidoCaptura';
export default PedidoCaptura;
