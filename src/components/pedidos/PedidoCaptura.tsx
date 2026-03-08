import { forwardRef } from 'react';
import type { Pedido } from '../../types/Pedido';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../../constants/pedidoStatus';
import { formatCurrency, formatDate, formatShortDate, getTotalPagado } from '../../utils/formatters';
import './PedidoCaptura.scss';

interface PedidoCapturaProps {
  pedido: Pedido;
  cobertura: number[];
}

const PedidoCaptura = forwardRef<HTMLDivElement, PedidoCapturaProps>(
  ({ pedido, cobertura }, ref) => {
    const pagado = getTotalPagado(pedido);
    const restante = pedido.total - pagado;
    const abonos = [...(pedido.abonos || [])].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    return (
      <div ref={ref} className="pedido-captura">
        {/* Encabezado */}
        <div className="pedido-captura__header">
          <div className="pedido-captura__client">
            <span className="pedido-captura__client-name">{pedido.clienteNombre}</span>
            <span className="pedido-captura__client-phone">{pedido.clienteTelefono}</span>
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
              {PEDIDO_STATUS[pedido.estado]}
            </span>
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="pedido-captura__section">
          <span className="pedido-captura__section-title">Productos</span>
          <table className="pedido-captura__table">
            <thead>
              <tr>
                <th>Clave</th>
                <th>Cant.</th>
                <th>Producto</th>
                <th>Precio unit.</th>
                <th>Subtotal</th>
                <th>Pagado</th>
                <th>Estado</th>
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
                    <td className="pedido-captura__center">{p.cantidad}</td>
                    <td>
                      {p.nombre}
                      {p.descuento && p.descuento > 0 ? (
                        <span className="pedido-captura__discount"> (-{p.descuento}%)</span>
                      ) : null}
                    </td>
                    <td className="pedido-captura__right">{formatCurrency(p.precioUnitario)}</td>
                    <td className="pedido-captura__right">{formatCurrency(p.subtotal)}</td>
                    <td className="pedido-captura__right">{formatCurrency(cubierto)}</td>
                    <td className={`pedido-captura__pago-status pedido-captura__pago-status--${status}`}>
                      {status === 'paid'
                        ? 'Pagado'
                        : status === 'partial'
                          ? `${Math.round(porcentaje)}%`
                          : 'Pendiente'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tabla de abonos */}
        {abonos.length > 0 && (
          <div className="pedido-captura__section">
            <span className="pedido-captura__section-title">Pagos registrados</span>
            <table className="pedido-captura__table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {abonos.map((abono, i) => (
                  <tr key={i}>
                    <td>{formatShortDate(abono.fecha)}</td>
                    <td>
                      {typeof abono.productoIndex === 'number' &&
                      pedido.productos[abono.productoIndex]
                        ? pedido.productos[abono.productoIndex].nombre
                        : 'General'}
                    </td>
                    <td className="pedido-captura__right">{formatCurrency(abono.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totales */}
        <div className="pedido-captura__footer">
          <div className="pedido-captura__total-row">
            <span>Total</span>
            <strong>{formatCurrency(pedido.total)}</strong>
          </div>
          <div className="pedido-captura__total-row">
            <span>Pagado</span>
            <strong className="pedido-captura__total-paid">{formatCurrency(pagado)}</strong>
          </div>
          <div className="pedido-captura__total-row pedido-captura__total-row--highlight">
            <span>Restante</span>
            <strong className={restante <= 0 ? 'pedido-captura__total-paid' : 'pedido-captura__total-pending'}>
              {restante <= 0 ? 'Liquidado' : formatCurrency(restante)}
            </strong>
          </div>
          {pedido.notas && (
            <div className="pedido-captura__notes">
              <span className="pedido-captura__notes-label">Notas:</span> {pedido.notas}
            </div>
          )}
        </div>
      </div>
    );
  }
);

PedidoCaptura.displayName = 'PedidoCaptura';
export default PedidoCaptura;
