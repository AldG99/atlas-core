import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiPencilBold,
  PiTrashBold,
  PiPackageBold,
  PiTagBold,
  PiCurrencyDollarBold,
  PiCalendarBold,
  PiTextAlignLeftBold
} from 'react-icons/pi';
import type { Producto, ProductoFormData } from '../types/Producto';
import { getProductoById, deleteProducto, updateProducto } from '../services/productoService';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { useToast } from '../hooks/useToast';
import { ROUTES } from '../config/routes';
import { ETIQUETA_ICONS } from '../constants/etiquetaIcons';
import MainLayout from '../layouts/MainLayout';
import ProductoModal from '../components/productos/ProductoModal';
import './ProductoDetail.scss';

const ProductoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { etiquetas } = useEtiquetas();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchProducto = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getProductoById(id);
      if (!data) {
        showToast('Producto no encontrado', 'error');
        navigate(ROUTES.PRODUCTOS);
        return;
      }
      setProducto(data);
    } catch {
      showToast('Error al cargar el producto', 'error');
      navigate(ROUTES.PRODUCTOS);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchProducto();
  }, [fetchProducto]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const getEtiquetasForProducto = (p: Producto) => {
    return (p.etiquetas || [])
      .map(id => etiquetas.find(e => e.id === id))
      .filter((e): e is NonNullable<typeof e> => !!e);
  };

  const handleDelete = async () => {
    if (!producto) return;
    if (!window.confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) return;
    try {
      await deleteProducto(producto.id);
      showToast('Producto eliminado', 'success');
      navigate(ROUTES.PRODUCTOS);
    } catch {
      showToast('Error al eliminar el producto', 'error');
    }
  };

  const handleEdit = async (data: ProductoFormData) => {
    if (!producto) return;
    try {
      await updateProducto(producto.id, data);
      setProducto({ ...producto, ...data });
      setIsEditModalOpen(false);
      showToast('Producto actualizado correctamente', 'success');
    } catch {
      showToast('Error al actualizar el producto', 'error');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="producto-detail">
          <p className="producto-detail__loading">Cargando producto...</p>
        </div>
      </MainLayout>
    );
  }

  if (!producto) return null;

  const productoEtiquetas = getEtiquetasForProducto(producto);

  return (
    <MainLayout>
      <div className="producto-detail">
        {/* Fixed Top Bar */}
        <div className="producto-detail__top-bar">
          <div className="producto-detail__top-bar-inner">
            <button
              className="producto-detail__icon-btn producto-detail__icon-btn--back"
              onClick={() => navigate(ROUTES.PRODUCTOS)}
              title="Volver"
            >
              <PiArrowLeftBold size={20} />
            </button>
            <span className="producto-detail__top-divider" />
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="producto-detail__icon-btn producto-detail__icon-btn--primary"
              title="Editar producto"
            >
              <PiPencilBold size={20} />
            </button>
            <button
              onClick={handleDelete}
              className="producto-detail__icon-btn producto-detail__icon-btn--danger"
              title="Eliminar producto"
            >
              <PiTrashBold size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="producto-detail__content">
          {/* Image Section */}
          <div className="producto-detail__image-section">
            {producto.imagen ? (
              <img src={producto.imagen} alt={producto.nombre} />
            ) : (
              <div className="producto-detail__image-placeholder">
                <PiPackageBold size={64} />
                <span>Sin imagen</span>
              </div>
            )}
          </div>

          {/* Header */}
          <div className="producto-detail__header">
            <div className="producto-detail__title-section">
              <span className="producto-detail__clave">{producto.clave}</span>
              <h1 className="producto-detail__name">{producto.nombre}</h1>
            </div>
            <div className="producto-detail__price">
              {formatCurrency(producto.precio)}
            </div>
          </div>

          {/* Info Section */}
          <div className="producto-detail__section">
            <div className="producto-detail__section-header">
              <strong>Información</strong>
            </div>
            <div className="producto-detail__info-grid">
              <div className="producto-detail__info-item">
                <div className="producto-detail__info-icon">
                  <PiTagBold size={18} />
                </div>
                <div className="producto-detail__info-content">
                  <span className="producto-detail__info-label">Clave</span>
                  <span className="producto-detail__info-value producto-detail__info-value--clave">{producto.clave}</span>
                </div>
              </div>
              <div className="producto-detail__info-item">
                <div className="producto-detail__info-icon">
                  <PiCurrencyDollarBold size={18} />
                </div>
                <div className="producto-detail__info-content">
                  <span className="producto-detail__info-label">Precio</span>
                  <span className="producto-detail__info-value producto-detail__info-value--price">{formatCurrency(producto.precio)}</span>
                </div>
              </div>
              <div className="producto-detail__info-item">
                <div className="producto-detail__info-icon">
                  <PiCalendarBold size={18} />
                </div>
                <div className="producto-detail__info-content">
                  <span className="producto-detail__info-label">Fecha de registro</span>
                  <span className="producto-detail__info-value">{formatDate(producto.fechaCreacion)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Etiquetas Section */}
          {productoEtiquetas.length > 0 && (
            <div className="producto-detail__section">
              <div className="producto-detail__section-header">
                <strong>Etiquetas</strong>
              </div>
              <div className="producto-detail__etiquetas">
                {productoEtiquetas.map(et => {
                  const iconData = ETIQUETA_ICONS[et.icono];
                  const Icon = iconData?.icon;
                  return (
                    <span
                      key={et.id}
                      className="producto-detail__etiqueta"
                      style={{ backgroundColor: et.color }}
                    >
                      {Icon && <Icon size={14} />}
                      <span>{et.nombre}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="producto-detail__section">
            <div className="producto-detail__section-header">
              <strong>Descripción</strong>
            </div>
            <div className="producto-detail__description-box">
              <div className="producto-detail__info-icon">
                <PiTextAlignLeftBold size={18} />
              </div>
              <p className="producto-detail__description">
                {producto.descripcion || 'Sin descripción'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <ProductoModal
          producto={{
            clave: producto.clave,
            nombre: producto.nombre,
            precio: producto.precio,
            descripcion: producto.descripcion,
            imagen: producto.imagen,
            etiquetas: producto.etiquetas
          }}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEdit}
        />
      )}
    </MainLayout>
  );
};

export default ProductoDetail;
