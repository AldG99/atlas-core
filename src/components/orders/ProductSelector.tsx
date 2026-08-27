import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Minus, Search, X, LayersPlus } from 'lucide-react';
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
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const getProfit = (p: Product, quantity: number): number | undefined =>
    p.costPrice !== undefined ? (getEffectivePrice(p) - p.costPrice) * quantity : undefined;

  const totalProfit = items.reduce((sum, item) => sum + (getProfit(item.product, item.quantity) ?? 0), 0);
  const hasIncompleteCost = items.some((item) => item.product.costPrice === undefined);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);


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
    if (showDropdown && filteredProducts.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = Math.min(prev + 1, filteredProducts.length - 1);
          dropdownRef.current?.querySelectorAll<HTMLElement>('.product-selector__dropdown-item')?.[next]?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = Math.max(prev - 1, 0);
          dropdownRef.current?.querySelectorAll<HTMLElement>('.product-selector__dropdown-item')?.[next]?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        handleSelectProduct(filteredProducts[focusedIndex]);
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
        setFocusedIndex(-1);
      }
      return;
    }

    // Sin sugerencias de búsqueda visibles: las flechas navegan la tabla de
    // productos ya agregados (el buscador queda enfocado tras cada alta, ver
    // efecto de auto-foco más abajo) en vez de no hacer nada.
    if (items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveFocusedRow(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveFocusedRow(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      changeFocusedRowQuantity(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      changeFocusedRowQuantity(-1);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // Se previene siempre (aunque no haya fila enfocada) para no disparar
      // el submit implícito del <form> al presionar Enter con el buscador vacío.
      // Shift+Enter se deja pasar sin abrir el detalle: OrderForm lo usa
      // exclusivamente para crear el pedido.
      e.preventDefault();
      toggleProductDetail();
    } else if (e.key === 'Escape' && selectedProduct) {
      setSelectedProduct(null);
    }
  };

  const moveFocusedRow = useCallback((direction: 1 | -1) => {
    if (items.length === 0) return;
    setFocusedRow(prev => {
      const next = prev === null ? 0 : Math.min(Math.max(prev + direction, 0), items.length - 1);
      if (selectedProduct) setSelectedProduct(items[next].product);
      return next;
    });
  }, [items, selectedProduct]);

  const toggleProductDetail = useCallback(() => {
    if (focusedRow === null) return;
    setSelectedProduct(selectedProduct ? null : items[focusedRow].product);
  }, [focusedRow, items, selectedProduct]);

  const changeFocusedRowQuantity = useCallback((delta: 1 | -1) => {
    if (focusedRow === null) return;
    const item = items[focusedRow];
    if (delta > 0 && item.product.trackStock && item.quantity >= (item.product.stock ?? 0)) return;
    onUpdateQuantity(item.product.id, item.quantity + delta);
  }, [focusedRow, items, onUpdateQuantity]);

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
        moveFocusedRow(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveFocusedRow(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        changeFocusedRowQuantity(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        changeFocusedRowQuantity(-1);
      } else if (e.key === 'Enter' && focusedRow !== null && !e.shiftKey) {
        // Shift+Enter se deja pasar sin abrir el detalle: OrderForm lo usa
        // exclusivamente para crear el pedido.
        e.preventDefault();
        toggleProductDetail();
      } else if (e.key === 'Escape' && selectedProduct) {
        setSelectedProduct(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedRow, selectedProduct, moveFocusedRow, toggleProductDetail, changeFocusedRowQuantity]);

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

  // Al confirmar un cliente (registrado u ocasional), `disabled` pasa de
  // true a false: se salta el foco al buscador de productos para poder
  // seguir armando el pedido solo con teclado, sin clic intermedio.
  useEffect(() => {
    if (!disabled) {
      searchInputRef.current?.focus();
    }
  }, [disabled]);

  return (
    <div className={`product-selector${disabled ? ' product-selector--disabled' : ''}`}>
      <div className="product-selector__search-row" ref={wrapperRef}>
        <div className="product-selector__search-wrapper">
          <Search size={16} className="product-selector__search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('orders.searchProductPlaceholder')}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchTerm && setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            className="input product-selector__search"
            disabled={disabled}
          />
          {loading && <span className="product-selector__spinner" />}

          {showDropdown && (
            <div className="product-selector__dropdown" ref={dropdownRef}>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`product-selector__dropdown-item${focusedIndex === index ? ' product-selector__dropdown-item--focused' : ''}`}
                    onClick={() => handleSelectProduct(product)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    <span className={`product-selector__dropdown-sku${product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ? ' product-selector__dropdown-sku--match' : ''}`}>
                      {product.sku || ''}
                    </span>
                    <span className="product-selector__dropdown-name">
                      {product.name}
                      {product.unit && (
                        <span className="product-selector__dropdown-unit">
                          {product.unitQuantity ? `${product.unitQuantity} ` : ''}{product.unit}
                        </span>
                      )}
                    </span>
                    <span className={`product-selector__dropdown-stock ${!product.trackStock ? 'product-selector__dropdown-stock--hidden' : (product.stock ?? 0) === 0 ? 'product-selector__dropdown-stock--empty' : ''}`}>
                      {product.trackStock
                        ? (product.stock ?? 0) === 0 ? t('products.detail.noStock') : t('orders.stockInWarehouse', { count: product.stock })
                        : ''}
                    </span>
                    <div className="product-selector__dropdown-labels">
                      {(product.labels || []).map(labelId => {
                        const label = allLabels.find(l => l.id === labelId);
                        if (!label) return null;
                        const iconData = LABEL_ICONS[label.icon];
                        const Icon = iconData?.icon;
                        return (
                          <span
                            key={label.id}
                            className="product-selector__dropdown-label"
                            style={{ backgroundColor: label.color }}
                          >
                            {Icon && <Icon size={10} />}
                          </span>
                        );
                      })}
                    </div>
                    {isDiscountActive(product) ? (
                      <span className="product-selector__dropdown-discount">
                        <span className="product-selector__dropdown-badge">-{product.discount}%</span>
                        <span className="product-selector__dropdown-original">{format(product.price)}</span>
                        <span className="product-selector__dropdown-final">{format(getEffectivePrice(product))}</span>
                      </span>
                    ) : (
                      <span className="product-selector__dropdown-price">
                        {format(product.price)}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="product-selector__dropdown-empty">
                  {t('orders.noProductsFound')}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn--primary product-selector__add-btn"
          onClick={() => setShowModal(true)}
          title={t('orders.addProductTitle')}
          disabled={disabled}
        >
          <LayersPlus size={18} />
        </button>
      </div>

      {showModal && createPortal(
        <ProductModal
          existingSkus={products.map(p => p.sku.trim().toLowerCase())}
          onClose={() => setShowModal(false)}
          onSave={handleSaveProduct}
        />,
        document.body
      )}

      {error && (
        <span className="error-message product-selector__error">{error}</span>
      )}

      <div className="product-selector__items">
        <div className="product-selector__table-wrapper">
          {/* Header fijo */}
          <div className="product-selector__table-head">
            <table className="product-selector__table">
              <colgroup>
                <col style={{ width: '7%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '11%' }} />
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
                  <th className="product-selector__col--right">{t('orders.price')}</th>
                  <th>{t('orders.subtotal')}</th>
                  <th className="product-selector__col--right">{t('orders.detail.profit')}</th>
                  <th></th>
                </tr>
              </thead>
            </table>
          </div>
          {/* Cuerpo scrolleable */}
          <div className="product-selector__table-scroll" ref={tableScrollRef}>
            <table className="product-selector__table">
              <colgroup>
                <col style={{ width: '7%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '4%' }} />
              </colgroup>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="product-selector__empty-row">
                      {t('orders.emptyProducts')}
                    </td>
                  </tr>
                )}
                {items.map((item, index) => (
                  <tr
                    key={item.product.id}
                    className={focusedRow === index ? 'product-selector__product-row--focused' : undefined}
                    onClick={() => setFocusedRow(index)}
                  >
                    <td>
                      {item.product.sku && (
                        <span className="product-selector__table-sku">
                          {item.product.sku}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="product-selector__quantity">
                        <button
                          type="button"
                          className="product-selector__quantity-btn"
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.quantity - 1)
                          }
                        >
                          <Minus size={10} />
                        </button>
                        <span className="product-selector__quantity-value">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="product-selector__quantity-btn"
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.quantity + 1)
                          }
                          disabled={item.product.trackStock && item.quantity >= (item.product.stock ?? 0)}
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="product-selector__table-name-text">
                        {item.product.name}
                      </span>
                    </td>
                    <td>
                      <span className="product-selector__table-unit">
                        {item.product.unit
                          ? `${item.product.unitQuantity ? `${item.product.unitQuantity} ` : ''}${item.product.unit}`
                          : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="product-selector__table-labels">
                        {(item.product.labels || []).map(labelId => {
                          const label = allLabels.find(l => l.id === labelId);
                          if (!label) return null;
                          const iconData = LABEL_ICONS[label.icon];
                          const Icon = iconData?.icon;
                          return (
                            <span
                              key={label.id}
                              className="product-selector__table-label"
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
                          <span className={`product-selector__table-stock ${remaining < 0 ? 'product-selector__table-stock--over' : remaining === 0 ? 'product-selector__table-stock--zero' : ''}`}>
                            {remaining < 0 ? `−${Math.abs(remaining)}` : remaining === 0 ? '0' : remaining}
                          </span>
                        );
                      })() : <span className="product-selector__table-stock-none">—</span>}
                    </td>
                    <td className="product-selector__col--right">
                      {isDiscountActive(item.product) ? (
                        <div className="product-selector__table-price-discount">
                          <span className="product-selector__table-price-badge">-{item.product.discount}%</span>
                          <span className="product-selector__table-price-original">{format(item.product.price)}</span>
                          <span>{format(getEffectivePrice(item.product))}</span>
                        </div>
                      ) : (
                        <span>{format(item.product.price)}</span>
                      )}
                    </td>
                    <td className="product-selector__table-subtotal">
                      {format(item.subtotal)}
                    </td>
                    <td className="product-selector__col--right">
                      {(() => {
                        const profit = getProfit(item.product, item.quantity);
                        return profit !== undefined ? (
                          <span className="product-selector__table-profit">{format(profit)}</span>
                        ) : (
                          <span
                            className="product-selector__table-profit product-selector__table-profit--unknown"
                            title={t('orders.detail.profitUnknownHint')}
                          >
                            —
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="product-selector__remove-btn"
                        onClick={() => onRemoveItem(item.product.id)}
                        title={t('common.delete')}
                      >
                        <X size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pie fijo (total) */}
          <div className="product-selector__table-foot">
            <table className="product-selector__table">
              <colgroup>
                <col style={{ width: '7%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '4%' }} />
              </colgroup>
              <tfoot className="product-selector__tfoot">
                <tr>
                  <td className="product-selector__total-label">{t('orders.total')}</td>
                  <td className="product-selector__total-quantity">{totalQuantity}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="product-selector__total-value">{format(total)}</td>
                  <td className="product-selector__col--right">
                    <span className="product-selector__table-profit product-selector__table-profit--total">
                      {format(totalProfit)}
                    </span>
                    {hasIncompleteCost && (
                      <span
                        className="product-selector__table-profit-warning"
                        title={t('orders.detail.profitUnknownHint')}
                      >
                        *
                      </span>
                    )}
                  </td>
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
