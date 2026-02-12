import { useState, useRef, useEffect } from 'react';
import { PiEyeBold, PiXBold, PiPackageBold, PiCalendarBold } from 'react-icons/pi';
import { useProductos } from '../../hooks/useProductos';
import { useEtiquetas } from '../../hooks/useEtiquetas';
import { useToast } from '../../hooks/useToast';
import { ETIQUETA_ICONS } from '../../constants/etiquetaIcons';
import type { Producto } from '../../types/Producto';
import './ProductoSelector.scss';

export interface ItemPedido {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

interface ProductoSelectorProps {
  items: ItemPedido[];
  onAddItem: (producto: Producto) => void;
  onUpdateCantidad: (productoId: string, cantidad: number) => void;
  onRemoveItem: (productoId: string) => void;
  total: number;
  disabled?: boolean;
}

const ProductoSelector = ({
  items,
  onAddItem,
  onUpdateCantidad,
  onRemoveItem,
  total,
  disabled = false
}: ProductoSelectorProps) => {
  const { productos, loading, addProducto } = useProductos();
  const { etiquetas: todasEtiquetas } = useEtiquetas();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');
  const [precio, setPrecio] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isDescuentoActivo = (p: Producto): boolean => {
    if (!p.descuento || p.descuento <= 0) return false;
    if (!p.fechaFinDescuento) return false;
    return new Date(p.fechaFinDescuento) >= new Date(new Date().toDateString());
  };

  const getEffectivePrice = (p: Producto): number => {
    if (isDescuentoActivo(p)) {
      return p.precio * (1 - p.descuento! / 100);
    }
    return p.precio;
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));

  const filteredProductos = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clave?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(value.length > 0);
  };

  const handleSelectProducto = (producto: Producto) => {
    onAddItem(producto);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleAddNew = async () => {
    if (!nombre.trim() || !precio) {
      showToast('Completa nombre y precio', 'warning');
      return;
    }

    try {
      await addProducto({
        nombre: nombre.trim(),
        clave: clave.trim(),
        precio: parseFloat(precio)
      });
      showToast('Producto creado correctamente', 'success');
      setNombre('');
      setClave('');
      setPrecio('');
      setShowForm(false);
    } catch {
      showToast('Error al crear producto', 'error');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`producto-selector${disabled ? ' producto-selector--disabled' : ''}`}>
      <label className="producto-selector__label">
        Productos
        {disabled && <span className="producto-selector__label-hint">Selecciona un cliente primero</span>}
      </label>

      <div className="producto-selector__search-row" ref={wrapperRef}>
        <div className="producto-selector__search-wrapper">
          <input
            type="text"
            placeholder="Buscar por nombre o clave..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchTerm && setShowDropdown(true)}
            className="input producto-selector__search"
            disabled={disabled}
          />
          {loading && <span className="producto-selector__spinner" />}

          {showDropdown && (
            <div className="producto-selector__dropdown">
              {filteredProductos.length > 0 ? (
                filteredProductos.map((producto) => (
                  <button
                    key={producto.id}
                    type="button"
                    className="producto-selector__dropdown-item"
                    onClick={() => handleSelectProducto(producto)}
                  >
                    <span className={`producto-selector__dropdown-clave${producto.clave?.toLowerCase().includes(searchTerm.toLowerCase()) ? ' producto-selector__dropdown-clave--match' : ''}`}>
                      {producto.clave || ''}
                    </span>
                    <span className="producto-selector__dropdown-name">
                      {producto.nombre}
                    </span>
                    <div className="producto-selector__dropdown-etiquetas">
                      {(producto.etiquetas || []).map(etId => {
                        const et = todasEtiquetas.find(e => e.id === etId);
                        if (!et) return null;
                        const iconData = ETIQUETA_ICONS[et.icono];
                        const Icon = iconData?.icon;
                        return (
                          <span
                            key={et.id}
                            className="producto-selector__dropdown-etiqueta"
                            style={{ backgroundColor: et.color }}
                          >
                            {Icon && <Icon size={10} />}
                          </span>
                        );
                      })}
                    </div>
                    {isDescuentoActivo(producto) ? (
                      <span className="producto-selector__dropdown-discount">
                        <span className="producto-selector__dropdown-badge">-{producto.descuento}%</span>
                        <span className="producto-selector__dropdown-original">${producto.precio.toFixed(2)}</span>
                        <span className="producto-selector__dropdown-final">${getEffectivePrice(producto).toFixed(2)}</span>
                      </span>
                    ) : (
                      <span className="producto-selector__dropdown-price">
                        ${producto.precio.toFixed(2)}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="producto-selector__dropdown-empty">
                  No se encontraron productos
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn--primary producto-selector__add-btn"
          onClick={() => setShowForm(!showForm)}
          title="Agregar nuevo producto"
          disabled={disabled}
        >
          +
        </button>
      </div>

      {showForm && (
        <div className="producto-selector__form">
          <div className="producto-selector__form-title">Nuevo producto</div>
          <input
            type="text"
            placeholder="Nombre del producto"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="Clave (opcional)"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className="input"
          />
          <input
            type="number"
            placeholder="Precio"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="input"
            min="0"
            step="0.01"
          />
          <div className="producto-selector__form-actions">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handleAddNew}
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="producto-selector__items">
          <table className="producto-selector__table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.producto.id}>
                  <td className="producto-selector__table-name">
                    {item.producto.clave && (
                      <span className="producto-selector__table-clave">
                        {item.producto.clave}
                      </span>
                    )}
                    <span className="producto-selector__table-name-text">
                      {item.producto.nombre}
                    </span>
                    {item.producto.etiquetas && item.producto.etiquetas.length > 0 && (
                      <div className="producto-selector__table-etiquetas">
                        {item.producto.etiquetas.map(etId => {
                          const et = todasEtiquetas.find(e => e.id === etId);
                          if (!et) return null;
                          const iconData = ETIQUETA_ICONS[et.icono];
                          const Icon = iconData?.icon;
                          return (
                            <span
                              key={et.id}
                              className="producto-selector__table-etiqueta"
                              style={{ backgroundColor: et.color }}
                              title={et.nombre}
                            >
                              {Icon && <Icon size={10} />}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td>
                    {isDescuentoActivo(item.producto) ? (
                      <div className="producto-selector__table-price-discount">
                        <span className="producto-selector__table-price-badge">-{item.producto.descuento}%</span>
                        <span className="producto-selector__table-price-original">${item.producto.precio.toFixed(2)}</span>
                        <span>${getEffectivePrice(item.producto).toFixed(2)}</span>
                      </div>
                    ) : (
                      <span>${item.producto.precio.toFixed(2)}</span>
                    )}
                  </td>
                  <td>
                    <div className="producto-selector__cantidad">
                      <button
                        type="button"
                        className="producto-selector__cantidad-btn"
                        onClick={() =>
                          onUpdateCantidad(item.producto.id, item.cantidad - 1)
                        }
                      >
                        -
                      </button>
                      <span className="producto-selector__cantidad-value">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        className="producto-selector__cantidad-btn"
                        onClick={() =>
                          onUpdateCantidad(item.producto.id, item.cantidad + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="producto-selector__table-subtotal">
                    ${item.subtotal.toFixed(2)}
                  </td>
                  <td>
                    <div className="producto-selector__actions">
                      <button
                        type="button"
                        className="producto-selector__eye-btn"
                        title="Ver detalles"
                        onClick={() => setSelectedProducto(item.producto)}
                      >
                        <PiEyeBold size={18} />
                      </button>
                      <button
                        type="button"
                        className="producto-selector__remove-btn"
                        onClick={() => onRemoveItem(item.producto.id)}
                        title="Eliminar"
                      >
                        &times;
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="producto-selector__total">
            <span className="producto-selector__total-label">Total:</span>
            <span className="producto-selector__total-value">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="producto-selector__empty">
          No hay productos agregados. Busca y selecciona productos para agregarlos al pedido.
        </div>
      )}

      {selectedProducto && (
        <div className="producto-selector__modal-overlay" onClick={() => setSelectedProducto(null)}>
          <div className="producto-selector__modal" onClick={(e) => e.stopPropagation()}>
            <div className="producto-selector__modal-header">
              <h3>Detalles del producto</h3>
              <button className="producto-selector__modal-close" onClick={() => setSelectedProducto(null)}>
                <PiXBold size={18} />
              </button>
            </div>
            <div className="producto-selector__modal-body">
              <div className="producto-selector__modal-image">
                {selectedProducto.imagen ? (
                  <img src={selectedProducto.imagen} alt={selectedProducto.nombre} />
                ) : (
                  <div className="producto-selector__modal-placeholder">
                    <PiPackageBold size={48} />
                    <span>Sin imagen</span>
                  </div>
                )}
              </div>
              <div className="producto-selector__modal-section">
                <h4>Información</h4>
                <div className="producto-selector__modal-info">
                  {selectedProducto.clave && (
                    <div className="producto-selector__modal-row">
                      <span className="producto-selector__modal-label">Clave</span>
                      <span className="producto-selector__modal-value">{selectedProducto.clave}</span>
                    </div>
                  )}
                  <div className="producto-selector__modal-row">
                    <span className="producto-selector__modal-label">Nombre</span>
                    <span className="producto-selector__modal-value">{selectedProducto.nombre}</span>
                  </div>
                  <div className="producto-selector__modal-row">
                    <span className="producto-selector__modal-label">Precio</span>
                    {isDescuentoActivo(selectedProducto) ? (
                      <span className="producto-selector__modal-price-discount">
                        <span className="producto-selector__modal-price-badge">-{selectedProducto.descuento}%</span>
                        <span className="producto-selector__modal-price-original">${selectedProducto.precio.toFixed(2)}</span>
                        <span className="producto-selector__modal-value">${getEffectivePrice(selectedProducto).toFixed(2)}</span>
                      </span>
                    ) : (
                      <span className="producto-selector__modal-value">${selectedProducto.precio.toFixed(2)}</span>
                    )}
                  </div>
                  {isDescuentoActivo(selectedProducto) && selectedProducto.fechaFinDescuento && (
                    <div className="producto-selector__modal-row">
                      <span className="producto-selector__modal-label">Descuento válido hasta</span>
                      <span className="producto-selector__modal-value producto-selector__modal-value--expiry">
                        <PiCalendarBold size={12} />
                        {formatDate(selectedProducto.fechaFinDescuento)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {selectedProducto.descripcion && (
                <div className="producto-selector__modal-section">
                  <h4>Descripción</h4>
                  <p>{selectedProducto.descripcion}</p>
                </div>
              )}
            </div>
            <div className="producto-selector__modal-footer">
              <button className="btn btn--secondary btn--sm" onClick={() => setSelectedProducto(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductoSelector;
