import type { TopProducto } from '../../types/Reporte';
import './TopProductos.scss';

interface TopProductosProps {
  productos: TopProducto[];
}

const TopProductos = ({ productos }: TopProductosProps) => {
  return (
    <div className="top-productos">
      <h3 className="top-productos__title">Productos más vendidos</h3>

      {productos.length === 0 ? (
        <p className="top-productos__empty">No hay ventas en este período</p>
      ) : (
        <ul className="top-productos__list">
          {productos.map((producto, index) => (
            <li key={`${producto.nombre}-${index}`} className="top-productos__item">
              <div className="top-productos__rank">#{index + 1}</div>
              <div className="top-productos__info">
                <span className="top-productos__name">
                  {producto.clave && (
                    <span className="top-productos__clave">{producto.clave}</span>
                  )}
                  {producto.nombre}
                </span>
              </div>
              <span className="top-productos__unidades">{producto.unidades} uds</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopProductos;
