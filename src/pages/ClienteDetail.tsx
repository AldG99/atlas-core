import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PiArrowLeftBold,
  PiWhatsappLogoBold,
  PiPencilBold,
  PiTrashBold,
  PiCameraBold,
  PiStarFill,
  PiStarBold,
  PiXBold,
} from 'react-icons/pi';
import type { Cliente, ClienteFormData } from '../types/Cliente';
import type { Pedido } from '../types/Pedido';
import { getClienteById, deleteCliente, updateCliente, toggleClienteFavorito } from '../services/clienteService';
import ImageCropper from '../components/ui/ImageCropper';
import Avatar from '../components/ui/Avatar';
import PhoneInput from '../components/clientes/PhoneInput';
import ClienteHistorialPedidos from '../components/clientes/ClienteHistorialPedidos';
import { getPedidosByClientPhone } from '../services/pedidoService';
import { getCodigoPais } from '../data/codigosPais';
import { formatTelefono } from '../utils/formatters';
import { useCurrency } from '../hooks/useCurrency';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useProductos } from '../hooks/useProductos';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { ROUTES } from '../config/routes';
import MainLayout from '../layouts/MainLayout';
import './ClienteDetail.scss';

const ClienteDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, role } = useAuth();
  const { format } = useCurrency();
  const { productos: catalogoProductos } = useProductos();
  const { etiquetas: todasEtiquetas } = useEtiquetas();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteCode, setDeleteCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ClienteFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosLoading, setPedidosLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCropSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropConfirm = (blob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditData(prev => prev ? { ...prev, fotoPerfil: reader.result as string } : prev);
    };
    reader.readAsDataURL(blob);
    setCropSrc(null);
  };

  const fetchCliente = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getClienteById(id);
      if (!data) {
        showToast(t('clients.detail.notFound'), 'error');
        navigate(ROUTES.CLIENTES);
        return;
      }
      setCliente(data);
    } catch {
      showToast(t('clients.detail.loadError'), 'error');
      navigate(ROUTES.CLIENTES);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast, t]);

  useEffect(() => {
    fetchCliente();
  }, [fetchCliente]);

  const fetchPedidos = useCallback(async (telefono: string) => {
    if (!user) return;
    try {
      setPedidosLoading(true);
      const data = await getPedidosByClientPhone(user.uid, telefono);
      setPedidos(data);
    } catch {
      // silently fail
    } finally {
      setPedidosLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (cliente) fetchPedidos(cliente.telefono);
  }, [cliente, fetchPedidos]);


  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));

  const getPostalAddress = (c: Cliente) => {
    const numInterior = c.numeroInterior ? `, Int. ${c.numeroInterior}` : '';
    return {
      line1: `${c.calle} ${c.numeroExterior}${numInterior}`,
      line2: c.colonia,
      line3: c.ciudad,
      line4: `CP ${c.codigoPostal}`,
      line5: c.estado,
      line6: c.pais
    };
  };

  const handleWhatsApp = () => {
    if (!cliente) return;
    const cleanPhone = cliente.telefono.replace(/\D/g, '');
    const dialCode = cliente.telefonoCodigoPais
      ? (getCodigoPais(cliente.telefonoCodigoPais)?.codigo ?? '').replace('+', '')
      : '';
    window.open(`https://wa.me/${dialCode}${cleanPhone}`, '_blank');
  };

  const generateDeleteCode = () =>
    Array.from({ length: 10 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

  const handleDelete = () => {
    if (!cliente) return;
    setDeleteConfirmText('');
    setDeleteCode(generateDeleteCode());
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!cliente) return;
    if (deleteConfirmText !== deleteCode) return;
    setShowDeleteModal(false);
    try {
      await deleteCliente(cliente.id);
      showToast(t('clients.detail.deleted'), 'success');
      navigate(ROUTES.CLIENTES);
    } catch {
      showToast(t('clients.detail.deleteError'), 'error');
    }
  };

  const handleToggleFavorito = async () => {
    if (!cliente) return;
    const nuevoValor = !cliente.favorito;
    try {
      await toggleClienteFavorito(cliente.id, nuevoValor);
      setCliente({ ...cliente, favorito: nuevoValor });
    } catch {
      showToast(t('clients.detail.favoriteError'), 'error');
    }
  };

  const startEditing = () => {
    if (!cliente) return;
    setEditData({
      fotoPerfil: cliente.fotoPerfil,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono,
      telefonoCodigoPais: cliente.telefonoCodigoPais ?? 'MX',
      correo: cliente.correo,
      calle: cliente.calle,
      numeroExterior: cliente.numeroExterior,
      numeroInterior: cliente.numeroInterior,
      colonia: cliente.colonia,
      ciudad: cliente.ciudad,
      estado: cliente.estado,
      codigoPostal: cliente.codigoPostal,
      pais: cliente.pais,
      referencia: cliente.referencia
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleSave = async () => {
    if (!cliente || !editData) return;
    try {
      setSaving(true);
      const dataToSave: ClienteFormData = {
        ...editData,
        calle: editData.calle?.toUpperCase() ?? editData.calle,
        numeroExterior: editData.numeroExterior?.toUpperCase() ?? editData.numeroExterior,
        numeroInterior: editData.numeroInterior?.toUpperCase() ?? editData.numeroInterior,
        colonia: editData.colonia?.toUpperCase() ?? editData.colonia,
        ciudad: editData.ciudad?.toUpperCase() ?? editData.ciudad,
        estado: editData.estado?.toUpperCase() ?? editData.estado,
        codigoPostal: editData.codigoPostal?.toUpperCase() ?? editData.codigoPostal,
        pais: editData.pais?.toUpperCase() ?? editData.pais,
      };
      await updateCliente(cliente.id, dataToSave);
      setCliente({ ...cliente, ...dataToSave });
      setEditData(null);
      setIsEditing(false);
      showToast(t('clients.detail.updateSuccess'), 'success');
    } catch {
      showToast(t('clients.detail.updateError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ClienteFormData, value: string | boolean) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const handlePhoneChange = (numero: string, iso: string) => {
    if (!editData) return;
    setEditData({ ...editData, telefono: numero, telefonoCodigoPais: iso });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="cliente-detail">
          <p className="cliente-detail__loading">{t('clients.detail.loading')}</p>
        </div>
      </MainLayout>
    );
  }

  if (!cliente) return null;

  const addr = getPostalAddress(cliente);

  return (
    <>
    <MainLayout>
      <div className="cliente-detail">
        {/* Fixed Top Bar */}
        <div className="cliente-detail__top-bar">
          <div className="cliente-detail__top-bar-inner">
            <button
              className="cliente-detail__icon-btn cliente-detail__icon-btn--back"
              onClick={() => navigate(ROUTES.CLIENTES)}
              title={t('common.back')}
            >
              <PiArrowLeftBold size={20} />
            </button>
            {role === 'admin' && isEditing ? (
              <div className="cliente-detail__top-bar-actions">
                <button onClick={cancelEditing} className="btn btn--outline btn--sm" disabled={saving}>
                  {t('common.cancel')}
                </button>
                <button onClick={handleSave} className="btn btn--primary btn--sm" disabled={saving}>
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            ) : (
              <>
                <button onClick={handleWhatsApp} className="cliente-detail__icon-btn cliente-detail__icon-btn--whatsapp" title={t('orders.detail.whatsapp')}>
                  <PiWhatsappLogoBold size={20} />
                </button>
                {role === 'admin' && (
                  <>
                    <span className="cliente-detail__top-divider" />
                    <button
                      onClick={handleToggleFavorito}
                      className={`cliente-detail__icon-btn ${cliente.favorito ? 'cliente-detail__icon-btn--fav-active' : ''}`}
                      title={cliente.favorito ? t('clients.detail.removeFavorite') : t('clients.detail.addFavorite')}
                    >
                      {cliente.favorito ? <PiStarFill size={20} /> : <PiStarBold size={20} />}
                    </button>
                  </>
                )}
                {role === 'admin' && (
                  <>
                    <button onClick={startEditing} className="cliente-detail__icon-btn cliente-detail__icon-btn--primary" title={t('common.edit')}>
                      <PiPencilBold size={20} />
                    </button>
                    <button onClick={handleDelete} className="cliente-detail__icon-btn cliente-detail__icon-btn--danger" title={t('common.delete')}>
                      <PiTrashBold size={20} />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="cliente-detail__content">
          <div className="cliente-detail__card">

            {/* Header: avatar + nombre + info del cliente */}
            <div className="cliente-detail__header">
              {/* Avatar + nombre + fecha + info */}
              <div className="cliente-detail__client">
                <div
                  className={`cliente-detail__avatar ${isEditing ? 'cliente-detail__avatar--editable' : ''}`}
                  onClick={() => isEditing && fileInputRef.current?.click()}
                >
                  <Avatar
                    src={isEditing ? editData?.fotoPerfil : cliente.fotoPerfil}
                    initials={`${(editData?.nombre || cliente.nombre)[0]}${(editData?.apellido || cliente.apellido)?.[0] ?? ''}`}
                    alt={cliente.nombre}
                  />
                  {isEditing && (
                    <div className="cliente-detail__avatar-overlay"><PiCameraBold size={20} /></div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                </div>
                <div className="cliente-detail__client-info">
                  <div className="cliente-detail__client-name-row">
                    <div className="cliente-detail__client-name-group">
                      {isEditing ? (
                        <div className="cliente-detail__name-edit">
                          <input type="text" value={editData?.nombre || ''} onChange={(e) => updateField('nombre', e.target.value)} placeholder="Nombre *" className="cliente-detail__input" />
                          <input type="text" value={editData?.apellido || ''} onChange={(e) => updateField('apellido', e.target.value)} placeholder="Apellido *" className="cliente-detail__input" />
                        </div>
                      ) : (
                        <h1 className="cliente-detail__name">{cliente.nombre} {cliente.apellido}</h1>
                      )}
                      <span className="cliente-detail__date">{t('clients.detail.clientSince')} {formatDate(cliente.fechaCreacion)}</span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="cliente-detail__header-fields">
                <div className="cliente-detail__header-field">
                  <span className="cliente-detail__info-label">{t('clients.detail.address')}</span>
                  {isEditing ? (
                    <>
                      <div className="cliente-detail__address-row">
                        <input type="text" value={editData?.calle || ''} onChange={(e) => updateField('calle', e.target.value)} placeholder="Calle" className="cliente-detail__input cliente-detail__input--flex" />
                        <input type="text" value={editData?.numeroExterior || ''} onChange={(e) => updateField('numeroExterior', e.target.value)} placeholder="No. Ext" className="cliente-detail__input cliente-detail__input--small" />
                        <input type="text" value={editData?.numeroInterior || ''} onChange={(e) => updateField('numeroInterior', e.target.value)} placeholder="No. Int" className="cliente-detail__input cliente-detail__input--small" />
                      </div>
                      <input type="text" value={editData?.colonia || ''} onChange={(e) => updateField('colonia', e.target.value)} placeholder="Colonia" className="cliente-detail__input" />
                      <div className="cliente-detail__address-row">
                        <input type="text" value={editData?.pais || ''} onChange={(e) => updateField('pais', e.target.value)} placeholder="País" className="cliente-detail__input cliente-detail__input--flex" />
                        <input type="text" value={editData?.estado || ''} onChange={(e) => updateField('estado', e.target.value)} placeholder="Estado" className="cliente-detail__input cliente-detail__input--flex" />
                        <input type="text" value={editData?.ciudad || ''} onChange={(e) => updateField('ciudad', e.target.value)} placeholder="Ciudad" className="cliente-detail__input cliente-detail__input--flex" />
                      </div>
                      <input type="text" value={editData?.codigoPostal || ''} onChange={(e) => updateField('codigoPostal', e.target.value)} placeholder="CP" className="cliente-detail__input cliente-detail__input--small" />
                    </>
                  ) : (
                    <>
                      <span className="cliente-detail__info-value">{addr.line1}</span>
                      <span className="cliente-detail__info-value">{addr.line2}</span>
                      <span className="cliente-detail__info-value">{addr.line3}{addr.line5 ? `, ${addr.line5}` : ''}{addr.line6 ? `, ${addr.line6}` : ''}</span>
                      <span className="cliente-detail__info-value">{addr.line4}</span>
                    </>
                  )}
                </div>
                <div className="cliente-detail__header-contact">
                  <div className="cliente-detail__header-field">
                    <span className="cliente-detail__info-label">{t('clients.detail.phone')}</span>
                    {isEditing ? (
                      <PhoneInput
                        value={editData?.telefono || ''}
                        codigoPais={editData?.telefonoCodigoPais ?? 'MX'}
                        onChange={handlePhoneChange}
                        placeholder="Teléfono"
                      />
                    ) : (
                      <span className="cliente-detail__info-value">
                        {cliente.telefonoCodigoPais
                          ? `${getCodigoPais(cliente.telefonoCodigoPais)?.codigo ?? ''} ${formatTelefono(cliente.telefono)}`
                          : formatTelefono(cliente.telefono)}
                      </span>
                    )}
                  </div>
                  <div className="cliente-detail__header-field">
                    <span className="cliente-detail__info-label">{t('clients.detail.email')}</span>
                    {isEditing ? (
                      <input type="email" value={editData?.correo || ''} onChange={(e) => updateField('correo', e.target.value)} placeholder="Correo electrónico" className="cliente-detail__input" />
                    ) : (
                      <span className={`cliente-detail__info-value ${!cliente.correo ? 'cliente-detail__info-value--empty' : ''}`}>
                        {cliente.correo || t('clients.detail.noEmail')}
                      </span>
                    )}
                  </div>
                  <div className="cliente-detail__header-field cliente-detail__header-field--full">
                    <span className="cliente-detail__info-label">{t('clients.detail.reference')}</span>
                    {isEditing ? (
                      <>
                        <textarea value={editData?.referencia || ''} onChange={(e) => updateField('referencia', e.target.value)} placeholder="Referencia..." className="cliente-detail__textarea cliente-detail__textarea--small" rows={2} maxLength={140} style={{ resize: 'none' }} />
                        <span className="cliente-detail__char-count">{(editData?.referencia || '').length}/140</span>
                      </>
                    ) : (
                      <span className={`cliente-detail__info-value ${!cliente.referencia ? 'cliente-detail__info-value--empty' : ''}`}>
                        {cliente.referencia || t('clients.detail.noReference')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de pedidos: ocupa el resto del card */}
            <ClienteHistorialPedidos
              clienteId={id!}
              pedidos={pedidos}
              pedidosLoading={pedidosLoading}
              catalogoProductos={catalogoProductos}
              todasEtiquetas={todasEtiquetas}
              format={format}
            />

          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="cliente-detail__modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="cliente-detail__modal" onClick={e => e.stopPropagation()}>
            <div className="cliente-detail__modal-header">
              <h3>{t('clients.detail.deleteModal.title')}</h3>
              <button className="cliente-detail__modal-close" onClick={() => setShowDeleteModal(false)}>
                <PiXBold size={18} />
              </button>
            </div>
            <div className="cliente-detail__modal-body">
              <p>{t('clients.detail.deleteModal.warning')}</p>
              <p className="cliente-detail__delete-label">
                {t('clients.detail.deleteModal.instruction')}
              </p>
              <code className="cliente-detail__delete-code">{deleteCode}</code>
              <input
                type="text"
                className="input"
                placeholder={t('clients.detail.deleteModal.placeholder')}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                autoComplete="off"
              />
            </div>
            <div className="cliente-detail__modal-footer">
              <button className="btn btn--secondary btn--sm" onClick={() => setShowDeleteModal(false)}>{t('clients.detail.deleteModal.cancel')}</button>
              <button
                className="btn btn--danger btn--sm"
                onClick={confirmDelete}
                disabled={deleteConfirmText !== deleteCode}
              >
                {t('clients.detail.deleteModal.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
    {cropSrc && (
      <ImageCropper
        imageSrc={cropSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropSrc(null)}
      />
    )}
    </>
  );
};

export default ClienteDetail;
