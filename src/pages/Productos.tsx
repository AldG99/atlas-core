import { useState, useMemo } from 'react';
import { PiCloudArrowUpBold, PiPackageBold } from 'react-icons/pi';
import { useProductos } from '../hooks/useProductos';
import { useEtiquetas } from '../hooks/useEtiquetas';
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
  const { etiquetas } = useEtiquetas();
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
              <PiCloudArrowUpBold size={18} style={{ marginRight: '6px' }} />
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
            <PiPackageBold size={48} />
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
            etiquetas={etiquetas}
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
