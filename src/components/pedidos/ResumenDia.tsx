import type { Pedido } from '../../types/Pedido';
import { formatCurrency } from '../../utils/formatters';
import { PEDIDO_STATUS, PEDIDO_STATUS_COLORS } from '../../constants/pedidoStatus';
import './ResumenDia.scss';

interface ResumenDiaProps {
  pedidos: Pedido[];
}

const ResumenDia = ({ pedidos }: ResumenDiaProps) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const pedidosHoy = pedidos.filter((pedido) => {
    const fechaPedido = new Date(pedido.fechaCreacion);
    fechaPedido.setHours(0, 0, 0, 0);
    return fechaPedido.getTime() === hoy.getTime();
  });

  const totalVentas = pedidosHoy.reduce((sum, pedido) => sum + pedido.total, 0);

  const contadorEstados = {
    pendiente: pedidosHoy.filter((p) => p.estado === 'pendiente').length,
    en_preparacion: pedidosHoy.filter((p) => p.estado === 'en_preparacion').length,
    entregado: pedidosHoy.filter((p) => p.estado === 'entregado').length
  };

  return (
    <div className="resumen-dia">
      <h2 className="resumen-dia__title">Resumen de hoy</h2>

      <div className="resumen-dia__stats">
        <div className="resumen-dia__stat">
          <span className="resumen-dia__stat-value">{pedidosHoy.length}</span>
          <span className="resumen-dia__stat-label">Pedidos</span>
        </div>
        <div className="resumen-dia__stat resumen-dia__stat--primary">
          <span className="resumen-dia__stat-value">{formatCurrency(totalVentas)}</span>
          <span className="resumen-dia__stat-label">Ventas</span>
        </div>
      </div>

      <div className="resumen-dia__estados">
        {(Object.keys(contadorEstados) as Array<keyof typeof contadorEstados>).map((estado) => (
          <div key={estado} className="resumen-dia__estado">
            <span
              className="resumen-dia__estado-dot"
              style={{ backgroundColor: PEDIDO_STATUS_COLORS[estado] }}
            />
            <span className="resumen-dia__estado-label">{PEDIDO_STATUS[estado]}</span>
            <span className="resumen-dia__estado-count">{contadorEstados[estado]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumenDia;
