import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiCaretLeftBold, PiCaretRightBold } from 'react-icons/pi';
import type { Pedido } from '../../types/Pedido';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../../constants/pedidoStatus';
import { formatCurrency, formatShortDate, getTotalPagado } from '../../utils/formatters';
import { useClientes } from '../../hooks/useClientes';
import './PedidosTable.scss';

const PAGE_SIZE = 10;

interface PedidosTableProps {
  pedidos: Pedido[];
  loading?: boolean;
  error?: string | null;
  searchTerm?: string;
}

const PedidosTable = ({ pedidos, loading, error, searchTerm }: PedidosTableProps) => {
  const navigate = useNavigate();
  const { clientes } = useClientes();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [pedidos.length]);

  const totalPages = Math.ceil(pedidos.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedPedidos = pedidos.slice(startIndex, startIndex + PAGE_SIZE);

  const getClienteFoto = (pedido: Pedido): string | undefined => {
    if (pedido.clienteFoto) return pedido.clienteFoto;
    const cliente = clientes.find(c => c.telefono === pedido.clienteTelefono);
    return cliente?.fotoPerfil;
  };

  return (
    <div className="pedidos-table-wrapper">
      <div className="pedidos-table-header">
        <table className="pedidos-table">
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>C.P.</th>
              <th>Productos</th>
              <th>Abonado</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
        </table>
      </div>
      <div className="pedidos-table-container">
        <table className="pedidos-table">
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="pedidos-table__empty">
                Cargando pedidos...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={8} className="pedidos-table__empty pedidos-table__empty--error">
                {error}
              </td>
            </tr>
          ) : pedidos.length === 0 ? (
            <tr>
              <td colSpan={8} className="pedidos-table__empty">
                {searchTerm?.trim() ? `No se encontraron pedidos para "${searchTerm}"` : 'No hay ningún pedido agregado'}
              </td>
            </tr>
          ) : paginatedPedidos.map((pedido) => {
            const foto = getClienteFoto(pedido);
            return (
            <tr
              key={pedido.id}
              className="pedidos-table__row"
              onClick={() => navigate(`/pedido/${pedido.id}`)}
            >
              <td>
                <div className="pedidos-table__client">
                  <div className="pedidos-table__avatar">
                    {foto ? (
                      <img src={foto} alt={pedido.clienteNombre} />
                    ) : (
                      <span>{pedido.clienteNombre.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="pedidos-table__name" title={pedido.clienteNombre}>
                    {pedido.clienteNombre}
                  </span>
                </div>
              </td>
              <td>
                <span className="pedidos-table__phone">{pedido.clienteTelefono}</span>
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
                <span className="pedidos-table__date">{formatShortDate(pedido.fechaCreacion)}</span>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>

      <div className="pedidos-table__pagination">
          <button
            className="pedidos-table__page-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <PiCaretLeftBold size={16} />
          </button>
          <span className="pedidos-table__page-info">
            {currentPage} / {totalPages}
          </span>
          <button
            className="pedidos-table__page-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <PiCaretRightBold size={16} />
          </button>
      </div>
    </div>
  );
};

export default PedidosTable;
