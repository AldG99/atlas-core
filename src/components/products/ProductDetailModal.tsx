import { useTranslation } from 'react-i18next';
import { PiXBold } from 'react-icons/pi';
import type { Product, Label } from '../../types/Product';
import { LABEL_ICONS } from '../../constants/labelIcons';
import { useCurrency } from '../../hooks/useCurrency';
import ProductImage from '../ui/ProductImage';
import '../../pages/OrderDetail.scss';

interface ProductDetailModalProps {
  product: Product;
  labels: Label[];
  onClose: () => void;
}

const isDiscountActive = (p: Product): boolean => {
  if (!p.discount || p.discount <= 0) return false;
  if (!p.discountEndDate) return false;
  return new Date(p.discountEndDate) >= new Date(new Date().toDateString());
};

const getDiscountedPrice = (price: number, discount: number) =>
  price * (1 - discount / 100);

const ProductDetailModal = ({ product, labels, onClose }: ProductDetailModalProps) => {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));

  const productLabels = (product.labels || [])
    .map(id => labels.find(l => l.id === id))
    .filter((l): l is Label => !!l);

  return (
    <div className="order-detail__modal-overlay" onClick={onClose}>
      <div
        className="order-detail__modal order-detail__modal--product"
        onClick={e => e.stopPropagation()}
      >
        <div className="order-detail__modal-header">
          <h3>{t('products.detailModal.title')}</h3>
          <button className="order-detail__modal-close" onClick={onClose}>
            <PiXBold size={18} />
          </button>
        </div>
        <div className="order-detail__modal-body">
          <div className="order-detail__modal-image">
            <ProductImage
              src={product.image}
              alt={product.name}
              placeholderClassName="order-detail__modal-placeholder"
            />
          </div>
          <div className="order-detail__modal-right">
            <div className="order-detail__modal-section">
              <h4>{t('products.detailModal.info')}</h4>
              <div className="order-detail__modal-info">
                {product.sku && (
                  <div className="order-detail__modal-row">
                    <span className="order-detail__modal-label">{t('products.detailModal.code')}</span>
                    <span className="order-detail__modal-value">{product.sku}</span>
                  </div>
                )}
                <div className="order-detail__modal-row">
                  <span className="order-detail__modal-label">{t('products.detailModal.name')}</span>
                  <span className="order-detail__modal-value">{product.name}</span>
                </div>
                <div className="order-detail__modal-row">
                  <span className="order-detail__modal-label">{t('products.detailModal.unit')}</span>
                  <span className="order-detail__modal-value">
                    {product.unit
                      ? `${product.unitQuantity ? `${product.unitQuantity} ` : ''}${product.unit}`
                      : '—'}
                  </span>
                </div>
                <div className="order-detail__modal-row">
                  <span className="order-detail__modal-label">{t('products.detailModal.price')}</span>
                  {isDiscountActive(product) ? (
                    <span className="order-detail__modal-price-discount">
                      <span className="order-detail__modal-price-badge">
                        -{product.discount}%
                      </span>
                      <span className="order-detail__modal-price-original">
                        {format(product.price)}
                      </span>
                      <span className="order-detail__modal-value">
                        {format(getDiscountedPrice(product.price, product.discount!))}
                      </span>
                    </span>
                  ) : (
                    <span className="order-detail__modal-value">{format(product.price)}</span>
                  )}
                </div>
                <div className="order-detail__modal-row">
                  <span className="order-detail__modal-label">{t('products.detailModal.costPrice')}</span>
                  <span className="order-detail__modal-value">
                    {product.costPrice ? format(product.costPrice) : t('products.detailModal.noCostPrice')}
                  </span>
                </div>
                {!!product.costPrice && (
                  <div className="order-detail__modal-row">
                    <span className="order-detail__modal-label">{t('products.detailModal.margin')}</span>
                    <span className="order-detail__modal-value">
                      {(((product.price - product.costPrice) / product.price) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                {isDiscountActive(product) && product.discountEndDate && (
                  <div className="order-detail__modal-row">
                    <span className="order-detail__modal-label">{t('products.detailModal.discountValidUntil')}</span>
                    <span className="order-detail__modal-value">
                      {formatDate(product.discountEndDate)}
                    </span>
                  </div>
                )}
                <div className="order-detail__modal-row">
                  <span className="order-detail__modal-label">{t('products.detailModal.labels')}</span>
                  {productLabels.length === 0 ? (
                    <span className="order-detail__modal-empty">{t('products.detailModal.noLabels')}</span>
                  ) : (
                    <div className="order-detail__labels">
                      {productLabels.map(label => {
                        const iconData = LABEL_ICONS[label.icon];
                        const Icon = iconData?.icon;
                        return (
                          <span
                            key={label.id}
                            className="order-detail__label"
                            style={{ backgroundColor: label.color }}
                            title={label.name}
                          >
                            {Icon && <Icon size={12} />}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="order-detail__modal-row">
                  <span className="order-detail__modal-label">{t('products.detailModal.warehouse')}</span>
                  {product.trackStock ? (
                    <span className="order-detail__modal-stock-badge">
                      {(product.stock ?? 0) === 0
                        ? t('products.detailModal.noStock')
                        : t('products.detailModal.stockUnits', { count: product.stock })}
                    </span>
                  ) : (
                    <span className="order-detail__modal-empty">{t('products.detailModal.noStockControl')}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="order-detail__modal-section">
              <h4>{t('products.detailModal.description')}</h4>
              <p>{product.description || t('products.detailModal.noDescription')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
