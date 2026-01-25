import { useState, useRef, useEffect } from 'react';
import { useProductos } from '../../hooks/useProductos';
import { useToast } from '../../hooks/useToast';
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
}

const ProductoSelector = ({
  items,
  onAddItem,
  onUpdateCantidad,
  onRemoveItem,
  total
}: ProductoSelectorProps) => {
  const { productos, loading, addProducto } = useProductos();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');
  const [precio, setPrecio] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

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
    <div className="producto-selector">
      <label className="producto-selector__label">Productos</label>

      <div className="producto-selector__search-row" ref={wrapperRef}>
        <div className="producto-selector__search-wrapper">
          <input
            type="text"
            placeholder="Buscar por nombre o clave..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchTerm && setShowDropdown(true)}
            className="input producto-selector__search"
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
                    <div className="producto-selector__dropdown-info">
                      <span className="producto-selector__dropdown-name">
                        {producto.nombre}
                      </span>
                      {producto.clave && (
                        <span className="producto-selector__dropdown-clave">
                          {producto.clave}
                        </span>
                      )}
                    </div>
                    <span className="producto-selector__dropdown-price">
                      ${producto.precio.toFixed(2)}
                    </span>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.producto.id}>
                  <td className="producto-selector__table-name">
                    {item.producto.nombre}
                    {item.producto.clave && (
                      <span className="producto-selector__table-clave">
                        {item.producto.clave}
                      </span>
                    )}
                  </td>
                  <td>${item.producto.precio.toFixed(2)}</td>
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
    </div>
  );
};

export default ProductoSelector;
