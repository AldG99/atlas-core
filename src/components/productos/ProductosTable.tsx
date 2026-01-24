import type { Producto, ProductoFormData } from '../../types/Producto';
import './ProductosTable.scss';

interface ProductosTableProps {
  productos: Producto[];
  onEdit: (id: string, data: ProductoFormData) => void;
  onDelete: (id: string) => void;
}

const ProductosTable = ({ productos, onEdit, onDelete }: ProductosTableProps) => {
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

  return (
    <div className="productos-table-container">
      <table className="productos-table">
        <thead>
          <tr>
            <th>Clave</th>
            <th>Producto</th>
            <th>Precio</th>
            <th>Descripción</th>
            <th>Fecha de registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => (
            <tr key={producto.id}>
              <td>
                <span className="productos-table__clave">{producto.clave}</span>
              </td>
              <td>
                <div className="productos-table__product">
                  <div className="productos-table__image">
                    {producto.imagen ? (
                      <img src={producto.imagen} alt={producto.nombre} />
                    ) : (
                      <div className="productos-table__icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                          <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="productos-table__name">{producto.nombre}</span>
                </div>
              </td>
              <td>
                <span className="productos-table__price">{formatPrice(producto.precio)}</span>
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
                    onClick={() => onEdit(producto.id, {
                      clave: producto.clave,
                      nombre: producto.nombre,
                      precio: producto.precio,
                      descripcion: producto.descripcion,
                      imagen: producto.imagen
                    })}
                    className="btn-icon btn-icon--primary"
                    title="Editar producto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(producto.id)}
                    className="btn-icon btn-icon--danger"
                    title="Eliminar producto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductosTable;
