import { useTranslation } from 'react-i18next';
import { PiXBold } from 'react-icons/pi';
import type { Producto, Etiqueta } from '../../types/Producto';
import { ETIQUETA_ICONS } from '../../constants/etiquetaIcons';
import { useCurrency } from '../../hooks/useCurrency';
import ProductImage from '../ui/ProductImage';
import '../../pages/PedidoDetail.scss';

interface ProductoDetalleModalProps {
  producto: Producto;
  etiquetas: Etiqueta[];
  onClose: () => void;
}

const isDescuentoActivo = (p: Producto): boolean => {
  if (!p.descuento || p.descuento <= 0) return false;
  if (!p.fechaFinDescuento) return false;
  return new Date(p.fechaFinDescuento) >= new Date(new Date().toDateString());
};

const getPrecioConDescuento = (precio: number, descuento: number) =>
  precio * (1 - descuento / 100);

const ProductoDetalleModal = ({ producto, etiquetas, onClose }: ProductoDetalleModalProps) => {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));

  const productoEtiquetas = (producto.etiquetas || [])
    .map(id => etiquetas.find(e => e.id === id))
    .filter((e): e is Etiqueta => !!e);

  return (
    <div className="pedido-detail__modal-overlay" onClick={onClose}>
      <div
        className="pedido-detail__modal pedido-detail__modal--product"
        onClick={e => e.stopPropagation()}
      >
        <div className="pedido-detail__modal-header">
          <h3>{t('products.detailModal.title')}</h3>
          <button className="pedido-detail__modal-close" onClick={onClose}>
            <PiXBold size={18} />
          </button>
        </div>
        <div className="pedido-detail__modal-body">
          <div className="pedido-detail__modal-image">
            <ProductImage
              src={producto.imagen}
              alt={producto.nombre}
              placeholderClassName="pedido-detail__modal-placeholder"
            />
          </div>
          <div className="pedido-detail__modal-right">
            <div className="pedido-detail__modal-section">
              <h4>{t('products.detailModal.info')}</h4>
              <div className="pedido-detail__modal-info">
                {producto.clave && (
                  <div className="pedido-detail__modal-row">
                    <span className="pedido-detail__modal-label">{t('products.detailModal.code')}</span>
                    <span className="pedido-detail__modal-value">{producto.clave}</span>
                  </div>
                )}
                <div className="pedido-detail__modal-row">
                  <span className="pedido-detail__modal-label">{t('products.detailModal.name')}</span>
                  <span className="pedido-detail__modal-value">{producto.nombre}</span>
                </div>
                <div className="pedido-detail__modal-row">
                  <span className="pedido-detail__modal-label">{t('products.detailModal.unit')}</span>
                  <span className="pedido-detail__modal-value">
                    {producto.unidad
                      ? `${producto.unidadCantidad ? `${producto.unidadCantidad} ` : ''}${producto.unidad}`
                      : '—'}
                  </span>
                </div>
                <div className="pedido-detail__modal-row">
                  <span className="pedido-detail__modal-label">{t('products.detailModal.price')}</span>
                  {isDescuentoActivo(producto) ? (
                    <span className="pedido-detail__modal-price-discount">
                      <span className="pedido-detail__modal-price-badge">
                        -{producto.descuento}%
                      </span>
                      <span className="pedido-detail__modal-price-original">
                        {format(producto.precio)}
                      </span>
                      <span className="pedido-detail__modal-value">
                        {format(getPrecioConDescuento(producto.precio, producto.descuento!))}
                      </span>
                    </span>
                  ) : (
                    <span className="pedido-detail__modal-value">{format(producto.precio)}</span>
                  )}
                </div>
                {isDescuentoActivo(producto) && producto.fechaFinDescuento && (
                  <div className="pedido-detail__modal-row">
                    <span className="pedido-detail__modal-label">{t('products.detailModal.discountValidUntil')}</span>
                    <span className="pedido-detail__modal-value">
                      {formatDate(producto.fechaFinDescuento)}
                    </span>
                  </div>
                )}
                <div className="pedido-detail__modal-row">
                  <span className="pedido-detail__modal-label">{t('products.detailModal.labels')}</span>
                  {productoEtiquetas.length === 0 ? (
                    <span className="pedido-detail__modal-empty">{t('products.detailModal.noLabels')}</span>
                  ) : (
                    <div className="pedido-detail__etiquetas">
                      {productoEtiquetas.map(et => {
                        const iconData = ETIQUETA_ICONS[et.icono];
                        const Icon = iconData?.icon;
                        return (
                          <span
                            key={et.id}
                            className="pedido-detail__etiqueta"
                            style={{ backgroundColor: et.color }}
                            title={et.nombre}
                          >
                            {Icon && <Icon size={12} />}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="pedido-detail__modal-row">
                  <span className="pedido-detail__modal-label">{t('products.detailModal.warehouse')}</span>
                  {producto.controlStock ? (
                    <span className="pedido-detail__modal-stock-badge">
                      {(producto.stock ?? 0) === 0
                        ? t('products.detailModal.noStock')
                        : t('products.detailModal.stockUnits', { count: producto.stock })}
                    </span>
                  ) : (
                    <span className="pedido-detail__modal-empty">{t('products.detailModal.noStockControl')}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="pedido-detail__modal-section">
              <h4>{t('products.detailModal.description')}</h4>
              <p>{producto.descripcion || t('products.detailModal.noDescription')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductoDetalleModal;
