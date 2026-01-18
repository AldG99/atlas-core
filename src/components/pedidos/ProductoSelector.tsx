import { useState } from 'react';
import { useProductos } from '../../hooks/useProductos';
import { useToast } from '../../hooks/useToast';
import type { Producto } from '../../types/Producto';
import './ProductoSelector.scss';

interface ProductoSelectorProps {
  onSelect: (producto: Producto) => void;
  onAddProductText: (text: string, precio: number) => void;
}

const ProductoSelector = ({ onSelect, onAddProductText }: ProductoSelectorProps) => {
  const { productos, loading, addProducto } = useProductos();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');

  const handleAddNew = async () => {
    if (!nombre.trim() || !precio) {
      showToast('Completa nombre y precio', 'warning');
      return;
    }

    try {
      await addProducto({
        nombre: nombre.trim(),
        precio: parseFloat(precio)
      });
      showToast('Producto agregado al catálogo', 'success');
      setNombre('');
      setPrecio('');
      setShowForm(false);
    } catch {
      showToast('Error al agregar producto', 'error');
    }
  };

  const handleQuickAdd = () => {
    if (!nombre.trim() || !precio) {
      showToast('Completa nombre y precio', 'warning');
      return;
    }

    onAddProductText(nombre.trim(), parseFloat(precio));
    setNombre('');
    setPrecio('');
    setShowForm(false);
  };

  return (
    <div className="producto-selector">
      <div className="producto-selector__header">
        <span className="producto-selector__title">Catálogo de productos</span>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : '+ Nuevo'}
        </button>
      </div>

      {showForm && (
        <div className="producto-selector__form">
          <input
            type="text"
            placeholder="Nombre del producto"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
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
              onClick={handleQuickAdd}
            >
              Solo agregar al pedido
            </button>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handleAddNew}
            >
              Guardar en catálogo
            </button>
          </div>
        </div>
      )}

      {loading && <p className="producto-selector__loading">Cargando...</p>}

      {!loading && productos.length === 0 && !showForm && (
        <p className="producto-selector__empty">No hay productos. Crea uno nuevo.</p>
      )}

      {!loading && productos.length > 0 && (
        <div className="producto-selector__list">
          {productos.map((producto) => (
            <button
              key={producto.id}
              type="button"
              className="producto-selector__item"
              onClick={() => onSelect(producto)}
            >
              <span className="producto-selector__item-name">{producto.nombre}</span>
              <span className="producto-selector__item-price">
                ${producto.precio.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductoSelector;
