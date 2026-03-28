import { useState, useMemo, useEffect } from 'react';

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
import { useLocation } from 'react-router-dom';
import { PiMagnifyingGlassBold, PiClockCounterClockwiseBold, PiWarningBold, PiPlusBold } from 'react-icons/pi';
import { useProductos } from '../hooks/useProductos';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import type { ProductoFormData } from '../types/Producto';
import MainLayout from '../layouts/MainLayout';
import ProductosTable from '../components/productos/ProductosTable';
import ProductoModal from '../components/productos/ProductoModal';
import HistorialDescuentosModal from '../components/productos/HistorialDescuentosModal';
import './Productos.scss';

const PAGE_SIZE = 50;

const Productos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('nombre_asc');
  const [filterVenciendo, setFilterVenciendo] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const location = useLocation();

  useEffect(() => {
    const state = location.state as Record<string, unknown> | null;
    if (state?.filterDescuento) setFilterVenciendo(true);
  }, []);
  const [showHistorial, setShowHistorial] = useState(false);
  const [editingProducto, setEditingProducto] = useState<{ id: string; data: ProductoFormData } | null>(null);

  const { productos, loading, error, addProducto, editProducto } = useProductos();
  const { etiquetas } = useEtiquetas();
  const { showToast } = useToast();
  const { role } = useAuth();

  const filteredProductos = useMemo(() => {
    let resultado = searchTerm.trim()
      ? productos.filter(p =>
          p.clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [...productos];

    if (filterVenciendo) {
      const ahora = Date.now();
      resultado = resultado.filter(p => {
        if (!p.descuento || !p.fechaFinDescuento) return false;
        const msRestantes = new Date(p.fechaFinDescuento).getTime() - ahora;
        const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));
        return diasRestantes >= 0 && diasRestantes <= 7;
      });
    }

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
  }, [productos, searchTerm, sortBy, filterVenciendo]);

  const productosPaginados = filteredProductos.slice(0, displayLimit);
  const hayMas = filteredProductos.length > displayLimit;

  const handleAdd = async (data: ProductoFormData) => {
    try {
      await addProducto(data);
      showToast('Producto agregado correctamente', 'success');
      setIsModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al agregar el producto', 'error');
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
              <PiClockCounterClockwiseBold size={18} />
              Registro de descuentos
            </button>
            {role === 'admin' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn--primary"
              >
                <PiPlusBold size={18} />
                Nuevo Producto
              </button>
            )}
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

        {filterVenciendo && (
          <div className="productos__filter-banner">
            <PiWarningBold size={16} />
            <span>Mostrando solo productos con descuento por vencer</span>
            <button onClick={() => setFilterVenciendo(false)}>✕ Quitar filtro</button>
          </div>
        )}
        <ProductosTable
          productos={productosPaginados}
          etiquetas={etiquetas}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
        />

        {hayMas && (
          <div className="productos__load-more">
            <button
              className="btn btn--outline btn--sm"
              onClick={() => setDisplayLimit(prev => prev + PAGE_SIZE)}
            >
              Mostrar más ({filteredProductos.length - displayLimit} restantes)
            </button>
          </div>
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
