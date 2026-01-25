import type { StatusBreakdownItem } from '../../types/Reporte';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../../constants/pedidoStatus';
import { formatCurrency } from '../../utils/formatters';
import './StatusBreakdown.scss';

interface StatusBreakdownProps {
  breakdown: StatusBreakdownItem[];
}

const StatusBreakdown = ({ breakdown }: StatusBreakdownProps) => {
  const total = breakdown.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className="status-breakdown">
      <h3 className="status-breakdown__title">Por Estado</h3>

      {total === 0 ? (
        <p className="status-breakdown__empty">No hay pedidos en este período</p>
      ) : (
        <>
          <div className="status-breakdown__bar">
            {breakdown.map((item) => (
              item.porcentaje > 0 && (
                <div
                  key={item.estado}
                  className="status-breakdown__bar-segment"
                  style={{
                    width: `${item.porcentaje}%`,
                    backgroundColor: PEDIDO_STATUS_COLORS[item.estado]
                  }}
                  title={`${PEDIDO_STATUS[item.estado]}: ${item.cantidad}`}
                />
              )
            ))}
          </div>

          <ul className="status-breakdown__list">
            {breakdown.map((item) => (
              <li key={item.estado} className="status-breakdown__item">
                <div className="status-breakdown__item-header">
                  <span
                    className="status-breakdown__dot"
                    style={{ backgroundColor: PEDIDO_STATUS_COLORS[item.estado] }}
                  />
                  <span className="status-breakdown__name">{PEDIDO_STATUS[item.estado]}</span>
                </div>
                <div className="status-breakdown__item-data">
                  <span className="status-breakdown__count">{item.cantidad}</span>
                  <span className="status-breakdown__percent">({item.porcentaje.toFixed(0)}%)</span>
                  <span className="status-breakdown__total">{formatCurrency(item.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default StatusBreakdown;
