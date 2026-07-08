import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { PiPlusBold, PiMinusBold, PiMagnifyingGlassBold, PiXBold } from 'react-icons/pi';
import ProductDetailModal from '../products/ProductDetailModal';
import ProductModal from '../products/ProductModal';
import { useProducts } from '../../hooks/useProducts';
import { useLabels } from '../../hooks/useLabels';
import { useToast } from '../../hooks/useToast';
import { useCurrency } from '../../hooks/useCurrency';
import { LABEL_ICONS } from '../../constants/labelIcons';
import type { Product, ProductFormData } from '../../types/Product';
import './ProductSelector.scss';

export interface OrderLineItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface ProductSelectorProps {
  items: OrderLineItem[];
  onAddItem: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  total: number;
  disabled?: boolean;
  error?: string;
}


const ProductSelector = ({
  items,
  onAddItem,
  onUpdateQuantity,
  onRemoveItem,
  total,
  disabled = false,
  error
}: ProductSelectorProps) => {
  const { t } = useTranslation();
  const { products, loading, addProduct } = useProducts();
  const { format } = useCurrency();
  const { labels: allLabels } = useLabels();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const isDiscountActive = (p: Product): boolean => {
    if (!p.discount || p.discount <= 0) return false;
    if (!p.discountEndDate) return false;
    return new Date(p.discountEndDate) >= new Date(new Date().toDateString());
  };

  const getEffectivePrice = (p: Product): number => {
    if (isDiscountActive(p)) {
      return p.price * (1 - p.discount! / 100);
    }
    return p.price;
  };


  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(value.length > 0);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredProducts.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => {
        const next = Math.min(prev + 1, filteredProducts.length - 1);
        dropdownRef.current?.querySelectorAll<HTMLElement>('.producto-selector__dropdown-item')?.[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => {
        const next = Math.max(prev - 1, 0);
        dropdownRef.current?.querySelectorAll<HTMLElement>('.producto-selector__dropdown-item')?.[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      handleSelectProduct(filteredProducts[focusedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setFocusedIndex(-1);
    }
  };

  const handleSelectProduct = (product: Product) => {
    if (product.trackStock) {
      const currentItem = items.find(i => i.product.id === product.id);
      const currentQuantity = currentItem?.quantity ?? 0;
      if (currentQuantity >= (product.stock ?? 0)) {
        showToast(t('orders.noStockWarning'), 'warning');
        setSearchTerm('');
        setShowDropdown(false);
        return;
      }
    }
    onAddItem(product);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleSaveProduct = async (data: ProductFormData) => {
    try {
      const newProduct = await addProduct(data);
      if (newProduct) onAddItem(newProduct);
      showToast(t('products.addSuccess'), 'success');
      setShowModal(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('products.addError'), 'error');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = focusedRow === null ? 0 : Math.min(focusedRow + 1, items.length - 1);
        setFocusedRow(next);
        if (selectedProduct) setSelectedProduct(items[next].product);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = focusedRow === null ? 0 : Math.max(focusedRow - 1, 0);
        setFocusedRow(next);
        if (selectedProduct) setSelectedProduct(items[next].product);
      } else if (e.key === 'Enter' && focusedRow !== null) {
        e.preventDefault();
        if (selectedProduct) {
          setSelectedProduct(null);
        } else {
          setSelectedProduct(items[focusedRow].product);
        }
      } else if (e.key === 'Escape' && selectedProduct) {
        setSelectedProduct(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedRow, selectedProduct]);

  useEffect(() => {
    if (focusedRow === null || !tableScrollRef.current) return;
    const rows = tableScrollRef.current.querySelectorAll('tr');
    const row = rows[focusedRow];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedRow]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`producto-selector${disabled ? ' producto-selector--disabled' : ''}`}>
      <label className="producto-selector__label">
        {t('orders.products')}
        {disabled && <span className="producto-selector__label-hint">{t('orders.selectClientFirst')}</span>}
      </label>

      <div className="producto-selector__search-row" ref={wrapperRef}>
        <div className="producto-selector__search-wrapper">
          <PiMagnifyingGlassBold size={16} className="producto-selector__search-icon" />
          <input
            type="text"
            placeholder={t('orders.searchProductPlaceholder')}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchTerm && setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            className="input producto-selector__search"
            disabled={disabled}
          />
          {loading && <span className="producto-selector__spinner" />}

          {showDropdown && (
            <div className="producto-selector__dropdown" ref={dropdownRef}>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`producto-selector__dropdown-item${focusedIndex === index ? ' producto-selector__dropdown-item--focused' : ''}`}
                    onClick={() => handleSelectProduct(product)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    <span className={`producto-selector__dropdown-clave${product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ? ' producto-selector__dropdown-clave--match' : ''}`}>
                      {product.sku || ''}
                    </span>
                    <span className="producto-selector__dropdown-name">
                      {product.name}
                      {product.unit && (
                        <span className="producto-selector__dropdown-unidad">
                          {product.unitQuantity ? `${product.unitQuantity} ` : ''}{product.unit}
                        </span>
                      )}
                    </span>
                    <span className={`producto-selector__dropdown-stock ${!product.trackStock ? 'producto-selector__dropdown-stock--hidden' : (product.stock ?? 0) === 0 ? 'producto-selector__dropdown-stock--empty' : ''}`}>
                      {product.trackStock
                        ? (product.stock ?? 0) === 0 ? t('products.detail.noStock') : t('orders.stockInWarehouse', { count: product.stock })
                        : ''}
                    </span>
                    <div className="producto-selector__dropdown-etiquetas">
                      {(product.labels || []).map(labelId => {
                        const label = allLabels.find(l => l.id === labelId);
                        if (!label) return null;
                        const iconData = LABEL_ICONS[label.icon];
                        const Icon = iconData?.icon;
                        return (
                          <span
                            key={label.id}
                            className="producto-selector__dropdown-etiqueta"
                            style={{ backgroundColor: label.color }}
                          >
                            {Icon && <Icon size={10} />}
                          </span>
                        );
                      })}
                    </div>
                    {isDiscountActive(product) ? (
                      <span className="producto-selector__dropdown-discount">
                        <span className="producto-selector__dropdown-badge">-{product.discount}%</span>
                        <span className="producto-selector__dropdown-original">{format(product.price)}</span>
                        <span className="producto-selector__dropdown-final">{format(getEffectivePrice(product))}</span>
                      </span>
                    ) : (
                      <span className="producto-selector__dropdown-price">
                        {format(product.price)}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="producto-selector__dropdown-empty">
                  {t('orders.noProductsFound')}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn--primary producto-selector__add-btn"
          onClick={() => setShowModal(true)}
          title={t('orders.addProductTitle')}
          disabled={disabled}
        >
          <PiPlusBold size={18} />
        </button>
      </div>

      {showModal && createPortal(
        <ProductModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveProduct}
        />,
        document.body
      )}

      {error && (
        <span className="error-message producto-selector__error">{error}</span>
      )}

      <div className="producto-selector__items">
        <div className="producto-selector__table-wrapper">
          {/* Header fijo */}
          <div className="producto-selector__table-head">
            <table className="producto-selector__table">
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '4%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>{t('orders.code')}</th>
                  <th>{t('orders.quantity')}</th>
                  <th>{t('orders.product')}</th>
                  <th>{t('orders.unit')}</th>
                  <th>{t('orders.labels')}</th>
                  <th>{t('orders.stock')}</th>
                  <th className="producto-selector__col--right">{t('orders.price')}</th>
                  <th>{t('orders.subtotal')}</th>
                  <th></th>
                </tr>
              </thead>
            </table>
          </div>
          {/* Cuerpo scrolleable */}
          <div className="producto-selector__table-scroll" ref={tableScrollRef}>
            <table className="producto-selector__table">
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '4%' }} />
              </colgroup>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="producto-selector__empty-row">
                      {t('orders.emptyProducts')}
                    </td>
                  </tr>
                )}
                {items.map((item, index) => (
                  <tr
                    key={item.product.id}
                    className={focusedRow === index ? 'producto-selector__product-row--focused' : undefined}
                    onClick={() => setFocusedRow(index)}
                  >
                    <td>
                      {item.product.sku && (
                        <span className="producto-selector__table-clave">
                          {item.product.sku}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="producto-selector__cantidad">
                        <button
                          type="button"
                          className="producto-selector__cantidad-btn"
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.quantity - 1)
                          }
                        >
                          <PiMinusBold size={10} />
                        </button>
                        <span className="producto-selector__cantidad-value">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="producto-selector__cantidad-btn"
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.quantity + 1)
                          }
                          disabled={item.product.trackStock && item.quantity >= (item.product.stock ?? 0)}
                        >
                          <PiPlusBold size={10} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="producto-selector__table-name-text">
                        {item.product.name}
                      </span>
                    </td>
                    <td>
                      <span className="producto-selector__table-unidad">
                        {item.product.unit
                          ? `${item.product.unitQuantity ? `${item.product.unitQuantity} ` : ''}${item.product.unit}`
                          : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="producto-selector__table-etiquetas">
                        {(item.product.labels || []).map(labelId => {
                          const label = allLabels.find(l => l.id === labelId);
                          if (!label) return null;
                          const iconData = LABEL_ICONS[label.icon];
                          const Icon = iconData?.icon;
                          return (
                            <span
                              key={label.id}
                              className="producto-selector__table-etiqueta"
                              style={{ backgroundColor: label.color }}
                              title={label.name}
                            >
                              {Icon && <Icon size={10} />}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      {item.product.trackStock ? (() => {
                        const remaining = (item.product.stock ?? 0) - item.quantity;
                        return (
                          <span className={`producto-selector__table-stock ${remaining < 0 ? 'producto-selector__table-stock--over' : remaining === 0 ? 'producto-selector__table-stock--zero' : ''}`}>
                            {remaining < 0 ? `−${Math.abs(remaining)}` : remaining === 0 ? '0' : remaining}
                          </span>
                        );
                      })() : <span className="producto-selector__table-stock-none">—</span>}
                    </td>
                    <td className="producto-selector__col--right">
                      {isDiscountActive(item.product) ? (
                        <div className="producto-selector__table-price-discount">
                          <span className="producto-selector__table-price-badge">-{item.product.discount}%</span>
                          <span className="producto-selector__table-price-original">{format(item.product.price)}</span>
                          <span>{format(getEffectivePrice(item.product))}</span>
                        </div>
                      ) : (
                        <span>{format(item.product.price)}</span>
                      )}
                    </td>
                    <td className="producto-selector__table-subtotal">
                      {format(item.subtotal)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="producto-selector__remove-btn"
                        onClick={() => onRemoveItem(item.product.id)}
                        title={t('common.delete')}
                      >
                        <PiXBold size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pie fijo (total) */}
          <div className="producto-selector__table-foot">
            <table className="producto-selector__table">
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '4%' }} />
              </colgroup>
              <tfoot className="producto-selector__tfoot">
                <tr>
                  <td className="producto-selector__total-label">{t('orders.total')}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="producto-selector__total-value">{format(total)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          labels={allLabels}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default ProductSelector;
