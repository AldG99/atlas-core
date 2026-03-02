import type { TopCliente } from '../../types/Reporte';
import { formatCurrency } from '../../utils/formatters';
import './TopClientes.scss';

interface TopClientesProps {
  clientes: TopCliente[];
}

const TopClientes = ({ clientes }: TopClientesProps) => {
  return (
    <div className="top-clientes">
      <h3 className="top-clientes__title">Top Clientes</h3>

      {clientes.length === 0 ? (
        <p className="top-clientes__empty">No hay clientes en este período</p>
      ) : (
        <ul className="top-clientes__list">
          {clientes.map((cliente, index) => (
            <li key={cliente.nombre} className="top-clientes__item">
              <div className="top-clientes__rank">#{index + 1}</div>
              <div className="top-clientes__info">
                <span className="top-clientes__name">{cliente.nombre}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopClientes;
