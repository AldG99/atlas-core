import { useState } from 'react';
import type { Producto, ProductoFormData } from '../../types/Producto';
import './ProductosTable.scss';

interface ProductosTableProps {
  productos: Producto[];
  onEdit: (id: string, data: ProductoFormData) => void;
  onDelete: (id: string) => void;
}

const ProductosTable = ({ productos, onEdit, onDelete }: ProductosTableProps) => {
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

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

  const closeModal = () => setSelectedProducto(null);

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
                <span className="productos-table__name">{producto.nombre}</span>
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
                    onClick={() => setSelectedProducto(producto)}
                    className="btn-icon btn-icon--primary"
                    title="Ver detalles"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
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

      {selectedProducto && (
        <div className="productos-table__modal-overlay" onClick={closeModal}>
          <div className="productos-table__modal" onClick={(e) => e.stopPropagation()}>
            <div className="productos-table__modal-header">
              <h3>Detalles del producto</h3>
              <button className="productos-table__modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="productos-table__modal-body">
              <div className="productos-table__modal-image">
                {selectedProducto.imagen ? (
                  <img src={selectedProducto.imagen} alt={selectedProducto.nombre} />
                ) : (
                  <div className="productos-table__modal-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                    <span>Sin imagen</span>
                  </div>
                )}
              </div>

              <div className="productos-table__modal-section">
                <h4>Información</h4>
                <div className="productos-table__modal-info">
                  <div className="productos-table__modal-row">
                    <span className="productos-table__modal-label">Clave:</span>
                    <span className="productos-table__modal-value">{selectedProducto.clave}</span>
                  </div>
                  <div className="productos-table__modal-row">
                    <span className="productos-table__modal-label">Nombre:</span>
                    <span className="productos-table__modal-value">{selectedProducto.nombre}</span>
                  </div>
                  <div className="productos-table__modal-row">
                    <span className="productos-table__modal-label">Precio:</span>
                    <span className="productos-table__modal-value productos-table__modal-price">
                      {formatPrice(selectedProducto.precio)}
                    </span>
                  </div>
                  <div className="productos-table__modal-row">
                    <span className="productos-table__modal-label">Registro:</span>
                    <span className="productos-table__modal-value">{formatDate(selectedProducto.fechaCreacion)}</span>
                  </div>
                </div>
              </div>

              <div className="productos-table__modal-section">
                <h4>Descripción</h4>
                <p className="productos-table__modal-description">
                  {selectedProducto.descripcion || 'Sin descripción'}
                </p>
              </div>
            </div>
            <div className="productos-table__modal-footer">
              <button className="btn btn--secondary" onClick={closeModal}>
                Cerrar
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  onEdit(selectedProducto.id, {
                    clave: selectedProducto.clave,
                    nombre: selectedProducto.nombre,
                    precio: selectedProducto.precio,
                    descripcion: selectedProducto.descripcion,
                    imagen: selectedProducto.imagen
                  });
                  closeModal();
                }}
              >
                Editar producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosTable;
