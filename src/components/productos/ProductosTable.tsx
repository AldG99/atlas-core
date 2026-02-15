import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiCaretLeftBold, PiCaretRightBold } from 'react-icons/pi';
import type { Producto, Etiqueta } from '../../types/Producto';
import { ETIQUETA_ICONS } from '../../constants/etiquetaIcons';
import './ProductosTable.scss';

const PAGE_SIZE = 10;

interface ProductosTableProps {
  productos: Producto[];
  etiquetas: Etiqueta[];
  loading?: boolean;
  error?: string | null;
  searchTerm?: string;
}

const ProductosTable = ({ productos, etiquetas, loading, error, searchTerm }: ProductosTableProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [productos.length]);

  const totalPages = Math.ceil(productos.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedProductos = productos.slice(startIndex, startIndex + PAGE_SIZE);

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

  const colgroup = (
    <colgroup>
      <col style={{ width: '10%' }} />
      <col style={{ width: '22%' }} />
      <col style={{ width: '18%' }} />
      <col style={{ width: '14%' }} />
      <col style={{ width: '20%' }} />
      <col style={{ width: '16%' }} />
    </colgroup>
  );

  return (
    <div className="productos-table-wrapper">
      <div className="productos-table-header">
        <table className="productos-table">
          {colgroup}
          <thead>
            <tr>
              <th>Clave</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Etiquetas</th>
              <th>Descripción</th>
              <th>Registro</th>
            </tr>
          </thead>
        </table>
      </div>
      <div className="productos-table-container">
        <table className="productos-table">
          {colgroup}
          <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="productos-table__empty">
                Cargando productos...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={6} className="productos-table__empty productos-table__empty--error">
                {error}
              </td>
            </tr>
          ) : productos.length === 0 ? (
            <tr>
              <td colSpan={6} className="productos-table__empty">
                {searchTerm?.trim() ? `No se encontraron productos para "${searchTerm}"` : 'No hay ningún producto registrado'}
              </td>
            </tr>
          ) : paginatedProductos.map((producto) => {
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

      <div className="productos-table__pagination">
        <button
          className="productos-table__page-btn"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <PiCaretLeftBold size={16} />
        </button>
        <span className="productos-table__page-info">
          {currentPage} / {totalPages || 1}
        </span>
        <button
          className="productos-table__page-btn"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          <PiCaretRightBold size={16} />
        </button>
      </div>
    </div>
  );
};

export default ProductosTable;
