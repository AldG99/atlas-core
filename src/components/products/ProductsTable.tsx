import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Product, Label } from '../../types/Product';
import { LABEL_ICONS } from '../../constants/labelIcons';
import './ProductsTable.scss';

interface ProductsTableProps {
  products: Product[];
  labels: Label[];
  loading?: boolean;
  error?: string | null;
  searchTerm?: string;
}

const ProductsTable = ({ products, labels, loading, error, searchTerm }: ProductsTableProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

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
    if (!products.length) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.min(prev + 1, products.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRow(prev => prev === null ? 0 : Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedRow !== null) {
        e.preventDefault();
        navigate(`/products/${products[focusedRow].id}`, { state: { from: location.pathname } });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [products, focusedRow, navigate, location.pathname]);

  useEffect(() => {
    if (focusedRow === null || !tableContainerRef.current) return;
    const rows = tableContainerRef.current.querySelectorAll('tr');
    const row = rows[focusedRow];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedRow]);

  const colgroup = (
    <colgroup>
      <col style={{ width: '12%' }} />
      <col style={{ width: '24%' }} />
      <col style={{ width: '10%' }} />
      <col style={{ width: '18%' }} />
      <col style={{ width: '14%' }} />
      <col style={{ width: '10%' }} />
      <col style={{ width: '12%' }} />
    </colgroup>
  );

  return (
    <div className="productos-table-wrapper">
      <div className="productos-table-header">
        <table className="productos-table">
          {colgroup}
          <thead>
            <tr>
              <th>{t('products.table.code')}</th>
              <th>{t('products.table.product')}</th>
              <th>{t('products.table.unit')}</th>
              <th>{t('products.table.price')}</th>
              <th>{t('products.table.labels')}</th>
              <th>{t('products.table.stock')}</th>
              <th className="productos-table__col--right">{t('products.table.registration')}</th>
            </tr>
          </thead>
        </table>
      </div>
      <div ref={tableContainerRef} className="productos-table-container">
        <table className="productos-table">
          {colgroup}
          <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="productos-table__empty">
                {t('products.loadingProducts')}
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={7} className="productos-table__empty productos-table__empty--error">
                {error}
              </td>
            </tr>
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={7} className="productos-table__empty">
                {searchTerm?.trim() ? t('products.noProductsSearch', { term: searchTerm }) : t('products.noProducts')}
              </td>
            </tr>
          ) : products.map((product, index) => {
            const productLabels = getLabelsForProduct(product);
            return (
              <tr
                key={product.id}
                className={`productos-table__row${focusedRow === index ? ' productos-table__row--focused' : ''}`}
                onClick={() => navigate(`/products/${product.id}`, { state: { from: location.pathname } })}
                onMouseEnter={() => setFocusedRow(index)}
              >
                <td>
                  <span className="productos-table__clave">{product.sku}</span>
                </td>
                <td>
                  <span className="productos-table__name">{product.name}</span>
                </td>
                <td>
                  <span className="productos-table__unidad">
                    {product.unit
                      ? `${product.unitQuantity ?? ''} ${product.unit}`.trim()
                      : '—'}
                  </span>
                </td>
                <td>
                  {isDiscountActive(product) ? (
                    <div className="productos-table__price-cell">
                      <span className="productos-table__price-badge">-{product.discount}%</span>
                      <span className="productos-table__price-original">{formatPrice(product.price)}</span>
                      <span className="productos-table__price">{formatPrice(getDiscountedPrice(product.price, product.discount!))}</span>
                    </div>
                  ) : (
                    <span className="productos-table__price">{formatPrice(product.price)}</span>
                  )}
                </td>
                <td>
                  <div className="productos-table__etiquetas">
                    {productLabels.map(label => (
                      <span
                        key={label.id}
                        className="productos-table__etiqueta"
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
                      <span className="productos-table__no-etiquetas">—</span>
                    )}
                  </div>
                </td>
                <td>
                  {product.trackStock ? (
                    <span className={(product.stock ?? 0) === 0 ? 'productos-table__stock--empty' : 'productos-table__stock'}>
                      {(product.stock ?? 0) === 0 ? t('products.stockEmpty') : product.stock}
                    </span>
                  ) : (
                    <span className="productos-table__no-etiquetas">—</span>
                  )}
                </td>
                <td className="productos-table__col--right">
                  <span className="productos-table__date">{formatDate(product.createdAt)}</span>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>

      {products.length > 0 && (
        <div className="productos-table__pagination">
          <span className="productos-table__page-info">
            {t('products.count', { count: products.length })}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
