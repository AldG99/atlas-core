import { useState, useMemo } from 'react';

type SortOption = 'nombre_asc' | 'nombre_desc' | 'precio_asc' | 'precio_desc' | 'registro_desc' | 'registro_asc';

const PRECIO_OPTIONS: Partial<Record<SortOption, string>> = {
  precio_asc: 'Precio menor a mayor',
  precio_desc: 'Precio mayor a menor',
};

const NOMBRE_OPTIONS: Partial<Record<SortOption, string>> = {
  nombre_asc: 'Nombre A-Z',
  nombre_desc: 'Nombre Z-A',
  registro_desc: 'Más recientes',
  registro_asc: 'Más antiguos',
};
import { PiCloudArrowUpBold, PiMagnifyingGlassBold, PiClockCounterClockwiseBold } from 'react-icons/pi';
import { useProductos } from '../hooks/useProductos';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { useToast } from '../hooks/useToast';
import type { ProductoFormData } from '../types/Producto';
import MainLayout from '../layouts/MainLayout';
import ProductosTable from '../components/productos/ProductosTable';
import ProductoModal from '../components/productos/ProductoModal';
import HistorialDescuentosModal from '../components/productos/HistorialDescuentosModal';
import './Productos.scss';

const Productos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('nombre_asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [editingProducto, setEditingProducto] = useState<{ id: string; data: ProductoFormData } | null>(null);

  const { productos, loading, error, addProducto, editProducto, removeProducto } = useProductos();
  const { etiquetas } = useEtiquetas();
  const { showToast } = useToast();

  const filteredProductos = useMemo(() => {
    let resultado = searchTerm.trim()
      ? productos.filter(p =>
          p.clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [...productos];

    resultado.sort((a, b) => {
      switch (sortBy) {
        case 'nombre_asc': return a.nombre.localeCompare(b.nombre);
        case 'nombre_desc': return b.nombre.localeCompare(a.nombre);
        case 'precio_asc': return a.precio - b.precio;
        case 'precio_desc': return b.precio - a.precio;
        case 'registro_desc': return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
        case 'registro_asc': return new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime();
        default: return 0;
      }
    });

    return resultado;
  }, [productos, searchTerm, sortBy]);

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
              onClick={() => setShowHistorial(true)}
              className="btn btn--outline"
            >
              <PiClockCounterClockwiseBold size={18} style={{ marginRight: '6px' }} />
              Registro de descuentos
            </button>
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
            <PiMagnifyingGlassBold size={16} className="productos__search-icon" />
            <input
              type="text"
              placeholder="Buscar por clave, nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
          <div className="productos__selects">
            <select
              value={sortBy in PRECIO_OPTIONS ? sortBy : ''}
              onChange={(e) => e.target.value && setSortBy(e.target.value as SortOption)}
              className="select"
            >
              <option value="">Precio</option>
              {(Object.keys(PRECIO_OPTIONS) as SortOption[]).map(opt => (
                <option key={opt} value={opt}>{PRECIO_OPTIONS[opt]}</option>
              ))}
            </select>
            <select
              value={sortBy in NOMBRE_OPTIONS ? sortBy : ''}
              onChange={(e) => e.target.value && setSortBy(e.target.value as SortOption)}
              className="select"
            >
              <option value="">Nombre / Registro</option>
              {(Object.keys(NOMBRE_OPTIONS) as SortOption[]).map(opt => (
                <option key={opt} value={opt}>{NOMBRE_OPTIONS[opt]}</option>
              ))}
            </select>
          </div>
        </div>

        <ProductosTable
          productos={filteredProductos}
          etiquetas={etiquetas}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
        />

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

        {showHistorial && (
          <HistorialDescuentosModal
            productos={productos}
            onClose={() => setShowHistorial(false)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Productos;
