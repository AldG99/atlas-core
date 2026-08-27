import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { Search, History, TriangleAlert, LayersPlus, DownloadCloud } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useLabels } from '../hooks/useLabels';
import { useToast } from '../hooks/useToast';
import type { ProductFormData } from '../types/Product';
import { exportProductsCSV } from '../utils/formatters';
import { calculateInventoryStats, getStockStatus, type StockStatus } from '../utils/inventoryCalculations';
import MainLayout from '../layouts/MainLayout';
import InventoryStatus from '../components/inventory/InventoryStatus';
import ProductsTable from '../components/products/ProductsTable';
import ProductModal from '../components/products/ProductModal';
import DiscountHistoryModal from '../components/products/DiscountHistoryModal';
import './Inventory.scss';

type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'registration_desc' | 'registration_asc';
type StatusFilter = 'all' | StockStatus;

const PAGE_SIZE = 50;

const Inventory = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const PRICE_OPTIONS: Partial<Record<SortOption, string>> = {
    price_asc: t('products.priceAsc'),
    price_desc: t('products.priceDesc'),
  };

  const NAME_OPTIONS: Partial<Record<SortOption, string>> = {
    name_asc: t('products.nameAsc'),
    name_desc: t('products.nameDesc'),
    registration_desc: t('products.registrationNewest'),
    registration_asc: t('products.registrationOldest'),
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const [showHistory, setShowHistory] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{ id: string; data: ProductFormData } | null>(null);

  useEffect(() => {
    // Falso positivo del compiler: seed de estado desde location.state al navegar, no un fetch. Ver eslint.config.js.
    const state = location.state as { filterDescuento?: boolean; statusFilter?: StockStatus } | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state?.filterDescuento) setFilterExpiring(true);
    if (state?.statusFilter) setStatusFilter(state.statusFilter);
  }, [location.state]);

  const { products, loading, error, addProduct, editProduct } = useProducts();
  const { labels } = useLabels();
  const { showToast } = useToast();

  const inventory = useMemo(() => calculateInventoryStats(products), [products]);

  const existingSkus = useMemo(
    () => products
      .filter(p => p.id !== editingProduct?.id)
      .map(p => p.sku.trim().toLowerCase()),
    [products, editingProduct]
  );

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

    if (statusFilter !== 'all') {
      result = result.filter(p => p.trackStock && getStockStatus(p) === statusFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'registration_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'registration_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default: return 0;
      }
    });

    return result;
  }, [products, searchTerm, sortBy, filterExpiring, statusFilter]);

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
      <div className="inventory-page">
        <div className="inventory-page__header">
          <h1>{t('inventory.title')}</h1>
          <div className="inventory-page__header-actions">
            <button
              onClick={handleExport}
              className="btn btn--secondary"
              disabled={products.length === 0}
            >
              <DownloadCloud size={18} />
              {t('common.exportCsv')}
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="btn btn--outline"
            >
              <History size={18} />
              {t('products.discountHistory')}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn--primary"
            >
              <LayersPlus size={18} />
              {t('products.newProduct')}
            </button>
          </div>
        </div>

        {loading && <p className="inventory-page__loading">{t('common.loading')}</p>}
        {error && <p className="inventory-page__error">{error}</p>}

        {!loading && !error && (
          <>
            <InventoryStatus inventory={inventory} />

            <div className="inventory-page__controls">
              <div className="inventory-page__search">
                <Search size={16} className="inventory-page__search-icon" />
                <input
                  type="text"
                  placeholder={t('products.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input"
                />
              </div>
              <div className="inventory-page__selects">
                <select
                  value={sortBy in PRICE_OPTIONS ? sortBy : ''}
                  onChange={(e) => e.target.value && setSortBy(e.target.value as SortOption)}
                  className="select"
                >
                  <option value="">{t('products.sortByPrice')}</option>
                  {(Object.keys(PRICE_OPTIONS) as SortOption[]).map(opt => (
                    <option key={opt} value={opt}>{PRICE_OPTIONS[opt]}</option>
                  ))}
                </select>
                <select
                  value={sortBy in NAME_OPTIONS ? sortBy : ''}
                  onChange={(e) => e.target.value && setSortBy(e.target.value as SortOption)}
                  className="select"
                >
                  <option value="">{t('products.sortByName')}</option>
                  {(Object.keys(NAME_OPTIONS) as SortOption[]).map(opt => (
                    <option key={opt} value={opt}>{NAME_OPTIONS[opt]}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="select"
                >
                  <option value="all">{t('inventory.filterAll')}</option>
                  <option value="out">{t('inventory.empty')}</option>
                  <option value="low">{t('inventory.lowStock')}</option>
                  <option value="ok">{t('inventory.ok')}</option>
                </select>
              </div>
            </div>

            {filterExpiring && (
              <div className="inventory-page__filter-banner">
                <TriangleAlert size={16} />
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
              <div className="inventory-page__load-more">
                <button
                  className="btn btn--outline btn--sm"
                  onClick={() => setDisplayLimit(prev => prev + PAGE_SIZE)}
                >
                  {t('products.showMore', { count: filteredProducts.length - displayLimit })}
                </button>
              </div>
            )}
          </>
        )}

        {isModalOpen && (
          <ProductModal
            existingSkus={existingSkus}
            onClose={() => setIsModalOpen(false)}
            onSave={handleAdd}
          />
        )}

        {editingProduct && (
          <ProductModal
            product={editingProduct.data}
            existingSkus={existingSkus}
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

export default Inventory;
