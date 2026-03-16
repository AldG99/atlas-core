import { useState, useRef, useEffect } from 'react';
import ProductoDetalleModal from '../productos/ProductoDetalleModal';
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
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

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


  const filteredProductos = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clave?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(value.length > 0);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredProductos.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => {
        const next = Math.min(prev + 1, filteredProductos.length - 1);
        dropdownRef.current?.querySelectorAll<HTMLElement>('.producto-selector__dropdown-item')?.[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => {
        const next = Math.max(prev - 1, 0);
        dropdownRef.current?.querySelectorAll<HTMLElement>('.producto-selector__dropdown-item')?.[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      handleSelectProducto(filteredProductos[focusedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setFocusedIndex(-1);
    }
  };

  const handleSelectProducto = (producto: Producto) => {
    if (producto.controlStock) {
      const itemActual = items.find(i => i.producto.id === producto.id);
      const cantidadActual = itemActual?.cantidad ?? 0;
      if (cantidadActual >= (producto.stock ?? 0)) {
        showToast('No hay más existencias de este producto', 'warning');
        setSearchTerm('');
        setShowDropdown(false);
        return;
      }
    }
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
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = focusedRow === null ? 0 : Math.min(focusedRow + 1, items.length - 1);
        setFocusedRow(next);
        if (selectedProducto) setSelectedProducto(items[next].producto);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = focusedRow === null ? 0 : Math.max(focusedRow - 1, 0);
        setFocusedRow(next);
        if (selectedProducto) setSelectedProducto(items[next].producto);
      } else if (e.key === 'Enter' && focusedRow !== null) {
        e.preventDefault();
        if (selectedProducto) {
          setSelectedProducto(null);
        } else {
          setSelectedProducto(items[focusedRow].producto);
        }
      } else if (e.key === 'Escape' && selectedProducto) {
        setSelectedProducto(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedRow, selectedProducto]);

  useEffect(() => {
    if (focusedRow === null || !tableScrollRef.current) return;
    const rows = tableScrollRef.current.querySelectorAll('tr');
    const row = rows[focusedRow];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedRow]);

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
            onKeyDown={handleKeyDown}
            className="input producto-selector__search"
            disabled={disabled}
          />
          {loading && <span className="producto-selector__spinner" />}

          {showDropdown && (
            <div className="producto-selector__dropdown" ref={dropdownRef}>
              {filteredProductos.length > 0 ? (
                filteredProductos.map((producto, index) => (
                  <button
                    key={producto.id}
                    type="button"
                    className={`producto-selector__dropdown-item${focusedIndex === index ? ' producto-selector__dropdown-item--focused' : ''}`}
                    onClick={() => handleSelectProducto(producto)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    <span className={`producto-selector__dropdown-clave${producto.clave?.toLowerCase().includes(searchTerm.toLowerCase()) ? ' producto-selector__dropdown-clave--match' : ''}`}>
                      {producto.clave || ''}
                    </span>
                    <span className="producto-selector__dropdown-name">
                      {producto.nombre}
                      {producto.unidad && (
                        <span className="producto-selector__dropdown-unidad">
                          {producto.unidadCantidad ? `${producto.unidadCantidad} ` : ''}{producto.unidad}
                        </span>
                      )}
                    </span>
                    <span className={`producto-selector__dropdown-stock ${!producto.controlStock ? 'producto-selector__dropdown-stock--hidden' : (producto.stock ?? 0) === 0 ? 'producto-selector__dropdown-stock--empty' : ''}`}>
                      {producto.controlStock
                        ? (producto.stock ?? 0) === 0 ? 'Sin existencias' : `${producto.stock} en almacén`
                        : ''}
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

      <div className="producto-selector__items">
        <div className="producto-selector__table-wrapper">
          {/* Header fijo */}
          <div className="producto-selector__table-head">
            <table className="producto-selector__table">
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '4%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Clave</th>
                  <th>Cant.</th>
                  <th>Producto</th>
                  <th>Unidad</th>
                  <th>Etiquetas</th>
                  <th>Stock</th>
                  <th className="producto-selector__col--right">Precio</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
            </table>
          </div>
          {/* Cuerpo scrolleable */}
          <div className="producto-selector__table-scroll" ref={tableScrollRef}>
            <table className="producto-selector__table">
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '4%' }} />
              </colgroup>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="producto-selector__empty-row">
                      No hay productos agregados. Busca y selecciona productos para agregarlos al pedido.
                    </td>
                  </tr>
                )}
                {items.map((item, index) => (
                  <tr
                    key={item.producto.id}
                    className={focusedRow === index ? 'producto-selector__product-row--focused' : undefined}
                    onClick={() => setFocusedRow(index)}
                  >
                    <td>
                      {item.producto.clave && (
                        <span className="producto-selector__table-clave">
                          {item.producto.clave}
                        </span>
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
                          disabled={item.producto.controlStock && item.cantidad >= (item.producto.stock ?? 0)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="producto-selector__table-name-text">
                        {item.producto.nombre}
                      </span>
                    </td>
                    <td>
                      <span className="producto-selector__table-unidad">
                        {item.producto.unidad
                          ? `${item.producto.unidadCantidad ? `${item.producto.unidadCantidad} ` : ''}${item.producto.unidad}`
                          : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="producto-selector__table-etiquetas">
                        {(item.producto.etiquetas || []).map(etId => {
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
                    </td>
                    <td>
                      {item.producto.controlStock ? (() => {
                        const restante = (item.producto.stock ?? 0) - item.cantidad;
                        return (
                          <span className={`producto-selector__table-stock ${restante < 0 ? 'producto-selector__table-stock--over' : restante === 0 ? 'producto-selector__table-stock--zero' : ''}`}>
                            {restante < 0 ? `−${Math.abs(restante)}` : restante === 0 ? '0' : restante}
                          </span>
                        );
                      })() : <span className="producto-selector__table-stock-none">—</span>}
                    </td>
                    <td className="producto-selector__col--right">
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
                    <td className="producto-selector__table-subtotal">
                      ${item.subtotal.toFixed(2)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="producto-selector__remove-btn"
                        onClick={() => onRemoveItem(item.producto.id)}
                        title="Eliminar"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pie fijo (total) */}
          <div className="producto-selector__table-foot">
            <table className="producto-selector__table">
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '4%' }} />
              </colgroup>
              <tfoot className="producto-selector__tfoot">
                <tr>
                  <td className="producto-selector__total-label">Total</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="producto-selector__total-value">${total.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {selectedProducto && (
        <ProductoDetalleModal
          producto={selectedProducto}
          etiquetas={todasEtiquetas}
          onClose={() => setSelectedProducto(null)}
        />
      )}
    </div>
  );
};

export default ProductoSelector;
