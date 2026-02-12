import { useNavigate } from 'react-router-dom';
import type { Pedido } from '../../types/Pedido';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../../constants/pedidoStatus';
import { useClientes } from '../../hooks/useClientes';
import './PedidosTable.scss';

interface PedidosTableProps {
  pedidos: Pedido[];
}

const PedidosTable = ({ pedidos }: PedidosTableProps) => {
  const navigate = useNavigate();
  const { clientes } = useClientes();

  const getClienteFoto = (pedido: Pedido): string | undefined => {
    if (pedido.clienteFoto) return pedido.clienteFoto;
    const cliente = clientes.find(c => c.telefono === pedido.clienteTelefono);
    return cliente?.fotoPerfil;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getTotalPagado = (pedido: Pedido) =>
    (pedido.abonos || []).reduce((sum, a) => sum + a.monto, 0);

  return (
    <div className="pedidos-table-container">
      <table className="pedidos-table">
        <colgroup>
          <col style={{ width: '24%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '16%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>C.P.</th>
            <th>Productos</th>
            <th>Abonado</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr
              key={pedido.id}
              className="pedidos-table__row"
              onClick={() => navigate(`/pedido/${pedido.id}`)}
            >
              <td>
                <div className="pedidos-table__client">
                  <div className="pedidos-table__avatar">
                    {getClienteFoto(pedido) ? (
                      <img src={getClienteFoto(pedido)} alt={pedido.clienteNombre} />
                    ) : (
                      <span>{pedido.clienteNombre.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="pedidos-table__client-info">
                    <span className="pedidos-table__name" title={pedido.clienteNombre}>
                      {pedido.clienteNombre}
                    </span>
                    <span className="pedidos-table__phone">{pedido.clienteTelefono}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className="pedidos-table__cp">{pedido.clienteCodigoPostal || '-'}</span>
              </td>
              <td>
                <div className="pedidos-table__product-cell">
                  <span className="pedidos-table__product-count">
                    {pedido.productos.reduce((sum, p) => sum + p.cantidad, 0)}
                  </span>
                  {pedido.productos.some(p => p.descuento && p.descuento > 0) && (
                    <span className="pedidos-table__discount-indicator" title="Incluye descuento">%</span>
                  )}
                </div>
              </td>
              <td>
                {(() => {
                  const pagado = getTotalPagado(pedido);
                  const porcentaje = pedido.total > 0 ? Math.round((pagado / pedido.total) * 100) : 0;
                  const status = pagado >= pedido.total ? 'paid' : pagado > 0 ? 'partial' : 'pending';
                  return (
                    <div className={`pedidos-table__paid pedidos-table__paid--${status}`}>
                      <span className="pedidos-table__paid-amount">{formatCurrency(pagado)}</span>
                      <span className="pedidos-table__paid-percent">{porcentaje}%</span>
                    </div>
                  );
                })()}
              </td>
              <td>
                {(() => {
                  const pagado = getTotalPagado(pedido);
                  const totalClass = pagado >= pedido.total
                    ? 'pedidos-table__total--paid'
                    : pagado > 0
                      ? 'pedidos-table__total--pending'
                      : '';
                  return (
                    <span className={`pedidos-table__total ${totalClass}`}>
                      {formatCurrency(pedido.total)}
                    </span>
                  );
                })()}
              </td>
              <td>
                <span
                  className="pedidos-table__status-dot-indicator"
                  style={{ backgroundColor: PEDIDO_STATUS_COLORS[pedido.estado] }}
                  title={PEDIDO_STATUS[pedido.estado]}
                />
              </td>
              <td>
                <span className="pedidos-table__date">{formatDate(pedido.fechaCreacion)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PedidosTable;
