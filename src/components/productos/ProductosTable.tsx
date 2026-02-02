import { useState } from 'react';
import { PiEyeBold, PiPencilBold, PiTrashBold, PiPackageBold } from 'react-icons/pi';
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

  const getEtiquetasForProducto = (producto: Producto) => {
    return (producto.etiquetas || [])
      .map(id => etiquetas.find(e => e.id === id))
      .filter((e): e is Etiqueta => !!e);
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
                      onClick={() => setSelectedProducto(producto)}
                      className="btn-icon btn-icon--primary"
                      title="Ver detalles"
                    >
                      <PiEyeBold size={18} />
                    </button>
                    <button
                      onClick={() => {
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
                      onClick={() => onDelete(producto.id)}
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
                    <PiPackageBold size={48} />
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

              {getEtiquetasForProducto(selectedProducto).length > 0 && (
                <div className="productos-table__modal-section">
                  <h4>Etiquetas</h4>
                  <div className="productos-table__etiquetas">
                    {getEtiquetasForProducto(selectedProducto).map(et => (
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
                  </div>
                </div>
              )}

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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosTable;
