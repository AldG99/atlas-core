import { useNavigate } from 'react-router-dom';
import { PiPencilBold, PiTrashBold } from 'react-icons/pi';
import type { Producto, ProductoFormData, Etiqueta } from '../../types/Producto';
import { ETIQUETA_ICONS } from '../../constants/etiquetaIcons';
import './ProductosTable.scss';

interface ProductosTableProps {
  productos: Producto[];
  etiquetas: Etiqueta[];
  onEdit: (id: string, data: ProductoFormData) => void;
  onDelete: (id: string) => void;
}

const ProductosTable = ({ productos, etiquetas, onEdit, onDelete }: ProductosTableProps) => {
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

  const getEtiquetasForProducto = (producto: Producto) => {
    return (producto.etiquetas || [])
      .map(id => etiquetas.find(e => e.id === id))
      .filter((e): e is Etiqueta => !!e);
  };

  return (
    <div className="productos-table-container">
      <table className="productos-table">
        <thead>
          <tr>
            <th>Clave</th>
            <th>Producto</th>
            <th>Precio</th>
            <th>Etiquetas</th>
            <th>Descripción</th>
            <th>Fecha de registro</th>
            <th>Acciones</th>
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
                  <span className="productos-table__price">{formatPrice(producto.precio)}</span>
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
                <td>
                  <div className="productos-table__actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(producto.id, {
                          clave: producto.clave,
                          nombre: producto.nombre,
                          precio: producto.precio,
                          descripcion: producto.descripcion,
                          imagen: producto.imagen,
                          etiquetas: producto.etiquetas
                        });
                      }}
                      className="btn-icon btn-icon--secondary"
                      title="Editar producto"
                    >
                      <PiPencilBold size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(producto.id); }}
                      className="btn-icon btn-icon--danger"
                      title="Eliminar producto"
                    >
                      <PiTrashBold size={18} />
                    </button>
                  </div>
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
