import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type SortOption = 'nombre_asc' | 'nombre_desc' | 'precio_asc' | 'precio_desc' | 'registro_desc' | 'registro_asc';
import { useLocation } from 'react-router-dom';
import { PiMagnifyingGlassBold, PiClockCounterClockwiseBold, PiWarningBold, PiPlusBold, PiDownloadSimpleBold } from 'react-icons/pi';
import { useProductos } from '../hooks/useProductos';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import type { ProductoFormData } from '../types/Producto';
import { exportProductosCSV } from '../utils/formatters';
import MainLayout from '../layouts/MainLayout';
import ProductosTable from '../components/productos/ProductosTable';
import ProductoModal from '../components/productos/ProductoModal';
import HistorialDescuentosModal from '../components/productos/HistorialDescuentosModal';
import './Productos.scss';

const PAGE_SIZE = 50;

const Productos = () => {
  const { t } = useTranslation();

  const PRECIO_OPTIONS: Partial<Record<SortOption, string>> = {
    precio_asc: t('products.priceAsc'),
    precio_desc: t('products.priceDesc'),
  };

  const NOMBRE_OPTIONS: Partial<Record<SortOption, string>> = {
    nombre_asc: t('products.nameAsc'),
    nombre_desc: t('products.nameDesc'),
    registro_desc: t('products.registrationNewest'),
    registro_asc: t('products.registrationOldest'),
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('nombre_asc');
  const [filterVenciendo, setFilterVenciendo] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const location = useLocation();

  useEffect(() => {
    const state = location.state as Record<string, unknown> | null;
    if (state?.filterDescuento) setFilterVenciendo(true);
  }, [location.state]);
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
      // eslint-disable-next-line react-hooks/purity
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
      showToast(t('products.addSuccess'), 'success');
      setIsModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('products.addError'), 'error');
    }
  };

  const handleExport = () => {
    if (filteredProductos.length === 0) {
      showToast(t('products.noProductsExport'), 'warning');
      return;
    }
    const etiquetaMap = new Map(etiquetas.map(e => [e.id, e.nombre]));
    exportProductosCSV(filteredProductos, (ids) => ids.map(id => etiquetaMap.get(id) ?? id).join(' | '));
    showToast(t('products.exportSuccess'), 'success');
  };

  const handleEdit = async (data: ProductoFormData) => {
    if (!editingProducto) return;

    try {
      await editProducto(editingProducto.id, data);
      showToast(t('products.updateSuccess'), 'success');
      setEditingProducto(null);
    } catch {
      showToast(t('products.updateError'), 'error');
    }
  };

  return (
    <MainLayout>
      <div className="productos">
        <div className="productos__header">
          <h1>{t('products.title')}</h1>
          <div className="productos__header-actions">
            <button
              onClick={handleExport}
              className="btn btn--secondary"
              disabled={productos.length === 0}
            >
              <PiDownloadSimpleBold size={18} />
              {t('common.exportCsv')}
            </button>
            <button
              onClick={() => setShowHistorial(true)}
              className="btn btn--outline"
            >
              <PiClockCounterClockwiseBold size={18} />
              {t('products.discountHistory')}
            </button>
            {role === 'admin' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn--primary"
              >
                <PiPlusBold size={18} />
                {t('products.newProduct')}
              </button>
            )}
          </div>
        </div>

        <div className="productos__controls">
          <div className="productos__search">
            <PiMagnifyingGlassBold size={16} className="productos__search-icon" />
            <input
              type="text"
              placeholder={t('products.searchPlaceholder')}
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
              <option value="">{t('products.sortByPrice')}</option>
              {(Object.keys(PRECIO_OPTIONS) as SortOption[]).map(opt => (
                <option key={opt} value={opt}>{PRECIO_OPTIONS[opt]}</option>
              ))}
            </select>
            <select
              value={sortBy in NOMBRE_OPTIONS ? sortBy : ''}
              onChange={(e) => e.target.value && setSortBy(e.target.value as SortOption)}
              className="select"
            >
              <option value="">{t('products.sortByName')}</option>
              {(Object.keys(NOMBRE_OPTIONS) as SortOption[]).map(opt => (
                <option key={opt} value={opt}>{NOMBRE_OPTIONS[opt]}</option>
              ))}
            </select>
          </div>
        </div>

        {filterVenciendo && (
          <div className="productos__filter-banner">
            <PiWarningBold size={16} />
            <span>{t('products.filterDiscounting')}</span>
            <button onClick={() => setFilterVenciendo(false)}>{t('products.removeFilter')}</button>
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
              {t('products.showMore', { count: filteredProductos.length - displayLimit })}
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
