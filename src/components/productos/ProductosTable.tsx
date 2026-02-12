import { useNavigate } from 'react-router-dom';
import type { Producto, Etiqueta } from '../../types/Producto';
import { ETIQUETA_ICONS } from '../../constants/etiquetaIcons';
import './ProductosTable.scss';

interface ProductosTableProps {
  productos: Producto[];
  etiquetas: Etiqueta[];
}

const ProductosTable = ({ productos, etiquetas }: ProductosTableProps) => {
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const isDescuentoActivo = (p: Producto): boolean => {
    if (!p.descuento || p.descuento <= 0) return false;
    if (!p.fechaFinDescuento) return false;
    return new Date(p.fechaFinDescuento) >= new Date(new Date().toDateString());
  };

  const getPrecioConDescuento = (precio: number, descuento: number): number => {
    return precio * (1 - descuento / 100);
  };

  const getEtiquetasForProducto = (producto: Producto) => {
    return (producto.etiquetas || [])
      .map(id => etiquetas.find(e => e.id === id))
      .filter((e): e is Etiqueta => !!e);
  };

  return (
    <div className="productos-table-container">
      <table className="productos-table">
        <colgroup>
          <col style={{ width: '10%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '16%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Clave</th>
            <th>Producto</th>
            <th>Precio</th>
            <th>Etiquetas</th>
            <th>Descripción</th>
            <th>Fecha de registro</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => {
            const productoEtiquetas = getEtiquetasForProducto(producto);
            return (
              <tr key={producto.id} className="productos-table__row" onClick={() => navigate(`/producto-detalle/${producto.id}`)}>
                <td>
                  <span className="productos-table__clave">{producto.clave}</span>
                </td>
                <td>
                  <span className="productos-table__name">{producto.nombre}</span>
                </td>
                <td>
                  {isDescuentoActivo(producto) ? (
                    <div className="productos-table__price-cell">
                      <span className="productos-table__price-badge">-{producto.descuento}%</span>
                      <span className="productos-table__price-original">{formatPrice(producto.precio)}</span>
                      <span className="productos-table__price">{formatPrice(getPrecioConDescuento(producto.precio, producto.descuento!))}</span>
                    </div>
                  ) : (
                    <span className="productos-table__price">{formatPrice(producto.precio)}</span>
                  )}
                </td>
                <td>
                  <div className="productos-table__etiquetas">
                    {productoEtiquetas.map(et => (
                      <span
                        key={et.id}
                        className="productos-table__etiqueta"
                        style={{ backgroundColor: et.color }}
                        title={et.nombre}
                      >
                        {ETIQUETA_ICONS[et.icono] && (() => {
                          const Icon = ETIQUETA_ICONS[et.icono].icon;
                          return <Icon size={11} />;
                        })()}
                      </span>
                    ))}
                    {productoEtiquetas.length === 0 && (
                      <span className="productos-table__no-etiquetas">—</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="productos-table__description" title={producto.descripcion}>
                    {producto.descripcion || '—'}
                  </span>
                </td>
                <td>
                  <span className="productos-table__date">{formatDate(producto.fechaCreacion)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductosTable;
