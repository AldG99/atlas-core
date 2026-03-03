import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PiStarFill } from 'react-icons/pi';
import type { Pedido } from '../../types/Pedido';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../../constants/pedidoStatus';
import { formatCurrency, formatShortDate, getTotalPagado, formatTelefono } from '../../utils/formatters';
import { getCodigoPais } from '../../data/codigosPais';
import { useClientes } from '../../hooks/useClientes';
import './PedidosTable.scss';

interface PedidosTableProps {
  pedidos: Pedido[];
  loading?: boolean;
  error?: string | null;
  searchTerm?: string;
}

const PedidosTable = ({ pedidos, loading, error, searchTerm }: PedidosTableProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientes } = useClientes();
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const getClienteFoto = (pedido: Pedido): string | undefined => {
    if (pedido.clienteFoto) return pedido.clienteFoto;
    const cliente = clientes.find(c => c.telefono === pedido.clienteTelefono);
    return cliente?.fotoPerfil;
  };

  const getClienteFavorito = (pedido: Pedido): boolean => {
    const cliente = clientes.find(c => c.telefono === pedido.clienteTelefono);
    return cliente?.favorito ?? false;
  };

  const getClienteDialCode = (pedido: Pedido): string => {
    const cliente = clientes.find(c => c.telefono === pedido.clienteTelefono);
    if (!cliente?.telefonoCodigoPais) return '';
    return getCodigoPais(cliente.telefonoCodigoPais)?.codigo ?? '';
  };

  useEffect(() => {
    if (!pedidos.length) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.min(prev + 1, pedidos.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedRow !== null) {
        e.preventDefault();
        navigate(`/pedido/${pedidos[focusedRow].id}`, { state: { from: location.pathname } });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pedidos, focusedRow, navigate, location.pathname]);

  useEffect(() => {
    if (focusedRow === null || !tableContainerRef.current) return;
    const rows = tableContainerRef.current.querySelectorAll('tr');
    const row = rows[focusedRow];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedRow]);

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
      <div ref={tableContainerRef} className="pedidos-table-container">
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
          ) : pedidos.map((pedido, index) => {
            const foto = getClienteFoto(pedido);
            const favorito = getClienteFavorito(pedido);
            const dialCode = getClienteDialCode(pedido);
            return (
            <tr
              key={pedido.id}
              className={`pedidos-table__row${focusedRow === index ? ' pedidos-table__row--focused' : ''}`}
              onClick={() => navigate(`/pedido/${pedido.id}`, { state: { from: location.pathname } })}
              onMouseEnter={() => setFocusedRow(index)}
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
                  {favorito && <PiStarFill size={14} className="pedidos-table__fav-icon" />}
                </div>
              </td>
              <td>
                <span className="pedidos-table__phone">
                  {dialCode ? `${dialCode} ${formatTelefono(pedido.clienteTelefono)}` : formatTelefono(pedido.clienteTelefono)}
                </span>
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

      {pedidos.length > 0 && (
        <div className="pedidos-table__pagination">
        </div>
      )}
    </div>
  );
};

export default PedidosTable;
