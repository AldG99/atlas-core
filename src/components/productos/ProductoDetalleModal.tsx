import { PiXBold, PiPackageBold } from 'react-icons/pi';
import type { Producto, Etiqueta } from '../../types/Producto';
import { ETIQUETA_ICONS } from '../../constants/etiquetaIcons';
import { useCurrency } from '../../hooks/useCurrency';
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

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));

const ProductoDetalleModal = ({ producto, etiquetas, onClose }: ProductoDetalleModalProps) => {
  const { format } = useCurrency();

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
          <h3>Detalles del producto</h3>
          <button className="pedido-detail__modal-close" onClick={onClose}>
            <PiXBold size={18} />
          </button>
        </div>
        <div className="pedido-detail__modal-body">
          <div className="pedido-detail__modal-image">
            {producto.imagen ? (
              <img src={producto.imagen} alt={producto.nombre} />
            ) : (
              <div className="pedido-detail__modal-placeholder">
                <PiPackageBold size={48} />
                <span>Sin imagen</span>
              </div>
            )}
          </div>
          <div className="pedido-detail__modal-right">
            <div className="pedido-detail__modal-section">
              <h4>Información</h4>
              <div className="pedido-detail__modal-info">
                {producto.clave && (
                  <div className="pedido-detail__modal-row">
                    <span className="pedido-detail__modal-label">Clave</span>
                    <span className="pedido-detail__modal-value">{producto.clave}</span>
                  </div>
                )}
                <div className="pedido-detail__modal-row">
                  <span className="pedido-detail__modal-label">Nombre</span>
                  <span className="pedido-detail__modal-value">{producto.nombre}</span>
                </div>
                <div className="pedido-detail__modal-row">
                  <span className="pedido-detail__modal-label">Unidad</span>
                  <span className="pedido-detail__modal-value">
                    {producto.unidad
                      ? `${producto.unidadCantidad ? `${producto.unidadCantidad} ` : ''}${producto.unidad}`
                      : '—'}
                  </span>
                </div>
                <div className="pedido-detail__modal-row">
                  <span className="pedido-detail__modal-label">Precio</span>
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
                    <span className="pedido-detail__modal-label">Descuento válido hasta</span>
                    <span className="pedido-detail__modal-value">
                      {formatDate(producto.fechaFinDescuento)}
                    </span>
                  </div>
                )}
                <div className="pedido-detail__modal-row">
                  <span className="pedido-detail__modal-label">Etiquetas</span>
                  {productoEtiquetas.length === 0 ? (
                    <span className="pedido-detail__modal-empty">Sin etiquetas</span>
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
                  <span className="pedido-detail__modal-label">Almacén</span>
                  {producto.controlStock ? (
                    <span className="pedido-detail__modal-stock-badge">
                      {(producto.stock ?? 0) === 0 ? 'Sin existencias' : `${producto.stock} uds`}
                    </span>
                  ) : (
                    <span className="pedido-detail__modal-empty">Sin control de inventario</span>
                  )}
                </div>
              </div>
            </div>
            <div className="pedido-detail__modal-section">
              <h4>Descripción</h4>
              <p>{producto.descripcion || 'Sin descripción'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductoDetalleModal;
