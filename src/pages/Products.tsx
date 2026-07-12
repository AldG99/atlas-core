import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type SortOption = 'nombre_asc' | 'nombre_desc' | 'precio_asc' | 'precio_desc' | 'registro_desc' | 'registro_asc';
import { useLocation } from 'react-router-dom';
import { PiMagnifyingGlassBold, PiClockCounterClockwiseBold, PiWarningBold, PiPlusBold, PiDownloadSimpleBold } from 'react-icons/pi';
import { useProducts } from '../hooks/useProducts';
import { useLabels } from '../hooks/useLabels';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import type { ProductFormData } from '../types/Product';
import { exportProductsCSV } from '../utils/formatters';
import MainLayout from '../layouts/MainLayout';
import ProductsTable from '../components/products/ProductsTable';
import ProductModal from '../components/products/ProductModal';
import DiscountHistoryModal from '../components/products/DiscountHistoryModal';
import './Products.scss';

const PAGE_SIZE = 50;

const Products = () => {
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
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const location = useLocation();

  useEffect(() => {
    const state = location.state as Record<string, unknown> | null;
    if (state?.filterDescuento) setFilterExpiring(true);
  }, [location.state]);
  const [showHistory, setShowHistory] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{ id: string; data: ProductFormData } | null>(null);

  const { products, loading, error, addProduct, editProduct } = useProducts();
  const { labels } = useLabels();
  const { showToast } = useToast();
  const { role } = useAuth();

  const filteredProducts = useMemo(() => {
    let result = searchTerm.trim()
      ? products.filter(p =>
          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [...products];

    if (filterExpiring) {
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      result = result.filter(p => {
        if (!p.discount || !p.discountEndDate) return false;
        const msLeft = new Date(p.discountEndDate).getTime() - now;
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
        return daysLeft >= 0 && daysLeft <= 7;
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'nombre_asc': return a.name.localeCompare(b.name);
        case 'nombre_desc': return b.name.localeCompare(a.name);
        case 'precio_asc': return a.price - b.price;
        case 'precio_desc': return b.price - a.price;
        case 'registro_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'registro_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default: return 0;
      }
    });

    return result;
  }, [products, searchTerm, sortBy, filterExpiring]);

  const paginatedProducts = filteredProducts.slice(0, displayLimit);
  const hasMore = filteredProducts.length > displayLimit;

  const handleAdd = async (data: ProductFormData) => {
    try {
      await addProduct(data);
      showToast(t('products.addSuccess'), 'success');
      setIsModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('products.addError'), 'error');
    }
  };

  const handleExport = () => {
    if (filteredProducts.length === 0) {
      showToast(t('products.noProductsExport'), 'warning');
      return;
    }
    const labelMap = new Map(labels.map(l => [l.id, l.name]));
    exportProductsCSV(filteredProducts, (ids) => ids.map(id => labelMap.get(id) ?? id).join(' | '));
    showToast(t('products.exportSuccess'), 'success');
  };

  const handleEdit = async (data: ProductFormData) => {
    if (!editingProduct) return;

    try {
      await editProduct(editingProduct.id, data);
      showToast(t('products.updateSuccess'), 'success');
      setEditingProduct(null);
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
              disabled={products.length === 0}
            >
              <PiDownloadSimpleBold size={18} />
              {t('common.exportCsv')}
            </button>
            <button
              onClick={() => setShowHistory(true)}
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

        {filterExpiring && (
          <div className="productos__filter-banner">
            <PiWarningBold size={16} />
            <span>{t('products.filterDiscounting')}</span>
            <button onClick={() => setFilterExpiring(false)}>{t('products.removeFilter')}</button>
          </div>
        )}
        <ProductsTable
          products={paginatedProducts}
          labels={labels}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
        />

        {hasMore && (
          <div className="productos__load-more">
            <button
              className="btn btn--outline btn--sm"
              onClick={() => setDisplayLimit(prev => prev + PAGE_SIZE)}
            >
              {t('products.showMore', { count: filteredProducts.length - displayLimit })}
            </button>
          </div>
        )}

        {isModalOpen && (
          <ProductModal
            onClose={() => setIsModalOpen(false)}
            onSave={handleAdd}
          />
        )}

        {editingProduct && (
          <ProductModal
            product={editingProduct.data}
            onClose={() => setEditingProduct(null)}
            onSave={handleEdit}
          />
        )}

        {showHistory && (
          <DiscountHistoryModal
            products={products}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Products;
