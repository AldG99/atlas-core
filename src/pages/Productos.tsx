import { useState, useMemo } from 'react';
import { useProductos } from '../hooks/useProductos';
import { useToast } from '../hooks/useToast';
import type { ProductoFormData } from '../types/Producto';
import MainLayout from '../layouts/MainLayout';
import ProductosTable from '../components/productos/ProductosTable';
import ProductoModal from '../components/productos/ProductoModal';
import './Productos.scss';

const Productos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<{ id: string; data: ProductoFormData } | null>(null);

  const { productos, loading, error, addProducto, editProducto, removeProducto } = useProductos();
  const { showToast } = useToast();

  const filteredProductos = useMemo(() => {
    if (!searchTerm.trim()) return productos;

    const term = searchTerm.toLowerCase();
    return productos.filter(
      (producto) =>
        producto.clave.toLowerCase().includes(term) ||
        producto.nombre.toLowerCase().includes(term) ||
        producto.descripcion?.toLowerCase().includes(term)
    );
  }, [productos, searchTerm]);

  const handleAdd = async (data: ProductoFormData) => {
    try {
      await addProducto(data);
      showToast('Producto agregado correctamente', 'success');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error al agregar producto:', err);
      showToast('Error al agregar el producto', 'error');
    }
  };

  const handleEdit = async (data: ProductoFormData) => {
    if (!editingProducto) return;

    try {
      await editProducto(editingProducto.id, data);
      showToast('Producto actualizado correctamente', 'success');
      setEditingProducto(null);
    } catch {
      showToast('Error al actualizar el producto', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await removeProducto(id);
        showToast('Producto eliminado', 'success');
      } catch {
        showToast('Error al eliminar el producto', 'error');
      }
    }
  };

  const openEditModal = (id: string, data: ProductoFormData) => {
    setEditingProducto({ id, data });
  };

  return (
    <MainLayout>
      <div className="productos">
        <div className="productos__header">
          <h1>Productos</h1>
          <div className="productos__header-actions">
            <button
              onClick={() => {}}
              className="btn btn--outline"
              title="Exportar a Google Drive"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <polyline points="16 16 12 12 8 16"></polyline>
                <line x1="12" y1="12" x2="12" y2="21"></line>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                <polyline points="16 16 12 12 8 16"></polyline>
              </svg>
              Google Drive
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn--primary"
            >
              Nuevo Producto
            </button>
          </div>
        </div>

        <div className="productos__controls">
          <div className="productos__search">
            <input
              type="text"
              placeholder="Buscar por clave, nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
          <div className="productos__count">
            {filteredProductos.length} {filteredProductos.length === 1 ? 'producto' : 'productos'}
          </div>
        </div>

        {loading && <p className="productos__loading">Cargando productos...</p>}

        {error && <p className="productos__error">{error}</p>}

        {!loading && !error && productos.length === 0 && (
          <div className="productos__empty">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <p>No hay productos registrados</p>
            <span>Los productos te permiten seleccionar rápidamente al crear pedidos</span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn--primary"
            >
              Agregar primer producto
            </button>
          </div>
        )}

        {!loading && !error && productos.length > 0 && filteredProductos.length === 0 && (
          <div className="productos__empty">
            <p>No se encontraron productos para "{searchTerm}"</p>
          </div>
        )}

        {!loading && !error && filteredProductos.length > 0 && (
          <ProductosTable
            productos={filteredProductos}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        )}

        {isModalOpen && (
          <ProductoModal
            onClose={() => setIsModalOpen(false)}
            onSave={handleAdd}
          />
        )}

        {editingProducto && (
          <ProductoModal
            producto={editingProducto.data}
            onClose={() => setEditingProducto(null)}
            onSave={handleEdit}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Productos;
