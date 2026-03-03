import type { TopCliente } from '../../types/Reporte';
import { formatCurrency, formatTelefono } from '../../utils/formatters';
import { useClientes } from '../../hooks/useClientes';
import { getCodigoPais } from '../../data/codigosPais';
import './TopClientes.scss';

interface TopClientesProps {
  clientes: TopCliente[];
}

const TopClientes = ({ clientes }: TopClientesProps) => {
  const { clientes: clientesData } = useClientes();

  const getDialCode = (telefono: string): string => {
    const cliente = clientesData.find(c => c.telefono === telefono);
    if (!cliente?.telefonoCodigoPais) return '';
    return getCodigoPais(cliente.telefonoCodigoPais)?.codigo ?? '';
  };

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
              <span className="top-clientes__phone">
                {getDialCode(cliente.telefono)}{getDialCode(cliente.telefono) ? ' ' : ''}{formatTelefono(cliente.telefono)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopClientes;
