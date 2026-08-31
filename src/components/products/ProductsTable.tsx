import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, Label } from '../../types/Product';
import { LABEL_ICONS } from '../../constants/labelIcons';
import { DEFAULT_LOW_STOCK_THRESHOLD } from '../../constants/stock';
import { getStockStatus, suggestRestock } from '../../utils/inventoryCalculations';
import { useCurrency } from '../../hooks/useCurrency';
import './ProductsTable.scss';

const PAGE_SIZE = 50;

interface ProductsTableProps {
  products: Product[];
  labels: Label[];
  loading?: boolean;
  error?: string | null;
  searchTerm?: string;
}

const ProductsTable = ({ products, labels, loading, error, searchTerm }: ProductsTableProps) => {
  const { t } = useTranslation();
  const { format: formatValue } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [prevProducts, setPrevProducts] = useState(products);

  if (prevProducts !== products) {
    setPrevProducts(products);
    if (page !== 0) setPage(0);
    if (focusedRow !== null) setFocusedRow(null);
  }

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const paginatedProducts = products.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const isDiscountActive = (p: Product): boolean => {
    if (!p.discount || p.discount <= 0) return false;
    if (!p.discountEndDate) return false;
    return new Date(p.discountEndDate) >= new Date(new Date().toDateString());
  };

  const getDiscountedPrice = (price: number, discount: number): number => {
    return price * (1 - discount / 100);
  };

  const getLabelsForProduct = (product: Product) => {
    return (product.labels || [])
      .map(id => labels.find(l => l.id === id))
      .filter((l): l is Label => !!l);
  };

  useEffect(() => {
    if (!paginatedProducts.length) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.min(prev + 1, paginatedProducts.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedRow !== null) {
        e.preventDefault();
        navigate(`/products/${paginatedProducts[focusedRow].id}`, { state: { from: location.pathname } });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [paginatedProducts, focusedRow, navigate, location.pathname]);

  useEffect(() => {
    if (focusedRow === null || !tableContainerRef.current) return;
    const rows = tableContainerRef.current.querySelectorAll('tr');
    const row = rows[focusedRow];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedRow]);

  const colgroup = (
    <colgroup>
      <col style={{ width: '11%' }} />
      <col style={{ width: '20%' }} />
      <col style={{ width: '9%' }} />
      <col style={{ width: '16%' }} />
      <col style={{ width: '13%' }} />
      <col style={{ width: '10%' }} />
      <col style={{ width: '11%' }} />
      <col style={{ width: '10%' }} />
    </colgroup>
  );

  return (
    <div className="products-table-wrapper">
      <div className="products-table-header">
        <table className="products-table">
          {colgroup}
          <thead>
            <tr>
              <th>{t('products.table.code')}</th>
              <th>{t('products.table.product')}</th>
              <th>{t('products.table.unit')}</th>
              <th>{t('products.table.price')}</th>
              <th>{t('products.table.labels')}</th>
              <th>{t('products.table.stock')}</th>
              <th>{t('inventory.table.minMax')}</th>
              <th>{t('inventory.table.value')}</th>
            </tr>
          </thead>
        </table>
      </div>
      <div ref={tableContainerRef} className="products-table-container">
        <table className="products-table">
          {colgroup}
          <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="products-table__empty">
                {t('products.loadingProducts')}
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={8} className="products-table__empty products-table__empty--error">
                {error}
              </td>
            </tr>
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={8} className="products-table__empty">
                {searchTerm?.trim() ? t('products.noProductsSearch', { term: searchTerm }) : t('products.noProducts')}
              </td>
            </tr>
          ) : paginatedProducts.map((product, index) => {
            const productLabels = getLabelsForProduct(product);
            return (
              <tr
                key={product.id}
                className={`products-table__row${focusedRow === index ? ' products-table__row--focused' : ''}`}
                onClick={() => navigate(`/products/${product.id}`, { state: { from: location.pathname } })}
                onMouseEnter={() => setFocusedRow(index)}
              >
                <td>
                  <span className="products-table__sku">{product.sku}</span>
                </td>
                <td>
                  <span className="products-table__name">{product.name}</span>
                </td>
                <td>
                  <span className="products-table__unit">
                    {product.unit
                      ? `${product.unitQuantity ?? ''} ${product.unit}`.trim()
                      : '—'}
                  </span>
                </td>
                <td>
                  {isDiscountActive(product) ? (
                    <div className="products-table__price-cell">
                      <span className="products-table__price-badge">-{product.discount}%</span>
                      <span className="products-table__price-original">{formatValue(product.price)}</span>
                      <span className="products-table__price">{formatValue(getDiscountedPrice(product.price, product.discount!))}</span>
                    </div>
                  ) : (
                    <span className="products-table__price">{formatValue(product.price)}</span>
                  )}
                </td>
                <td>
                  <div className="products-table__labels">
                    {productLabels.map(label => (
                      <span
                        key={label.id}
                        className="products-table__label"
                        style={{ backgroundColor: label.color }}
                        title={label.name}
                      >
                        {LABEL_ICONS[label.icon] && (() => {
                          const Icon = LABEL_ICONS[label.icon].icon;
                          return <Icon size={12} />;
                        })()}
                      </span>
                    ))}
                    {productLabels.length === 0 && (
                      <span className="products-table__no-labels">—</span>
                    )}
                  </div>
                </td>
                <td>
                  {product.trackStock ? (
                    <div className="products-table__stock-cell">
                      <span className={`products-table__stock products-table__stock--${getStockStatus(product)}`}>
                        {(product.stock ?? 0) === 0 ? t('products.stockEmpty') : product.stock}
                      </span>
                      {getStockStatus(product) !== 'ok' && suggestRestock(product) !== undefined && (
                        <span className="products-table__restock-badge">
                          {t('inventory.restockSuggestion', { count: suggestRestock(product) })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="products-table__no-labels">—</span>
                  )}
                </td>
                <td>
                  <span className="products-table__minmax">
                    {product.trackStock
                      ? `${product.minStock ?? DEFAULT_LOW_STOCK_THRESHOLD} / ${product.maxStock ?? '—'}`
                      : '—'}
                  </span>
                </td>
                <td>
                  <span className="products-table__value">
                    {product.trackStock ? formatValue((product.stock ?? 0) * product.costPrice) : '—'}
                  </span>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>

      {!loading && products.length > 0 && (
        <div className="products-table__pagination">
          <span className="products-table__page-info products-table__page-info--total">
            {t('products.count', { count: products.length })}
          </span>
          <button
            className="products-table__page-btn"
            onClick={() => { setPage(p => p - 1); setFocusedRow(null); }}
            disabled={page === 0}
          >
            <ChevronLeft size={14} />
          </button>
          <span className="products-table__page-info">
            {page + 1} / {Math.max(totalPages, 1)}
          </span>
          <button
            className="products-table__page-btn"
            onClick={() => { setPage(p => p + 1); setFocusedRow(null); }}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
