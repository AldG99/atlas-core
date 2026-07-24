import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PiArrowLeftBold,
  PiWhatsappLogoBold,
  PiPencilBold,
  PiTrashBold,
  PiStarFill,
  PiStarBold,
  PiXBold,
  PiMapPinBold,
  PiPhoneBold,
  PiEnvelopeSimpleBold,
  PiNoteBold,
} from 'react-icons/pi';
import type { Client, ClientFormData } from '../types/Client';
import type { Order } from '../types/Order';
import { getClientById, deleteClient, updateClient, toggleClientFavorite } from '../services/clientService';
import Avatar from '../components/ui/Avatar';
import PhoneInput from '../components/clients/PhoneInput';
import ClientOrderHistory from '../components/clients/ClientOrderHistory';
import { getOrdersByClientPhone } from '../services/orderService';
import { getCountryCode } from '../data/countryCodes';
import { formatPhone } from '../utils/formatters';
import { useCurrency } from '../hooks/useCurrency';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useProducts } from '../hooks/useProducts';
import { useLabels } from '../hooks/useLabels';
import { ROUTES } from '../config/routes';
import MainLayout from '../layouts/MainLayout';
import './ClientDetail.scss';

const ClientDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { format } = useCurrency();
  const { products: productCatalog } = useProducts();
  const { labels: allLabels } = useLabels();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteCode, setDeleteCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ClientFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(false);

  const fetchClient = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getClientById(id);
      if (!data) {
        showToast(t('clients.detail.notFound'), 'error');
        navigate(ROUTES.CLIENTS);
        return;
      }
      setClient(data);
    } catch {
      showToast(t('clients.detail.loadError'), 'error');
      navigate(ROUTES.CLIENTS);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast, t]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const fetchOrders = useCallback(async (phone: string) => {
    if (!user) return;
    try {
      setOrdersLoading(true);
      setOrdersError(false);
      const data = await getOrdersByClientPhone(user.uid, phone);
      setOrders(data);
    } catch {
      setOrdersError(true);
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (client) fetchOrders(client.phone);
  }, [client, fetchOrders]);


  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));

  const getPostalAddress = (c: Client) => {
    const interiorNumber = c.interiorNumber ? `, Int. ${c.interiorNumber}` : '';
    return {
      line1: `${c.street} ${c.exteriorNumber}${interiorNumber}`,
      line2: c.neighborhood,
      line3: c.city,
      line4: `CP ${c.postalCode}`,
      line5: c.state,
      line6: c.country
    };
  };

  const handleWhatsApp = () => {
    if (!client) return;
    const cleanPhone = client.phone.replace(/\D/g, '');
    const dialCode = client.phoneCountryCode
      ? (getCountryCode(client.phoneCountryCode)?.code ?? '').replace('+', '')
      : '';
    window.open(`https://wa.me/${dialCode}${cleanPhone}`, '_blank');
  };

  const generateDeleteCode = () =>
    Array.from({ length: 10 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

  const handleDelete = () => {
    if (!client) return;
    setDeleteConfirmText('');
    setDeleteCode(generateDeleteCode());
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!client) return;
    if (deleteConfirmText !== deleteCode) return;
    setShowDeleteModal(false);
    try {
      await deleteClient(client.id);
      showToast(t('clients.detail.deleted'), 'success');
      navigate(ROUTES.CLIENTS);
    } catch {
      showToast(t('clients.detail.deleteError'), 'error');
    }
  };

  const handleToggleFavorite = async () => {
    if (!client) return;
    const newValue = !client.favorite;
    try {
      await toggleClientFavorite(client.id, newValue);
      setClient({ ...client, favorite: newValue });
    } catch {
      showToast(t('clients.detail.favoriteError'), 'error');
    }
  };

  const startEditing = () => {
    if (!client) return;
    setEditData({
      profilePhoto: client.profilePhoto,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      phoneCountryCode: client.phoneCountryCode ?? 'MX',
      email: client.email,
      street: client.street,
      exteriorNumber: client.exteriorNumber,
      interiorNumber: client.interiorNumber,
      neighborhood: client.neighborhood,
      city: client.city,
      state: client.state,
      postalCode: client.postalCode,
      country: client.country,
      reference: client.reference
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleSave = async () => {
    if (!client || !editData || !user) return;
    try {
      setSaving(true);
      const dataToSave: ClientFormData = {
        ...editData,
        street: editData.street?.toUpperCase() ?? editData.street,
        exteriorNumber: editData.exteriorNumber?.toUpperCase() ?? editData.exteriorNumber,
        interiorNumber: editData.interiorNumber?.toUpperCase() ?? editData.interiorNumber,
        neighborhood: editData.neighborhood?.toUpperCase() ?? editData.neighborhood,
        city: editData.city?.toUpperCase() ?? editData.city,
        state: editData.state?.toUpperCase() ?? editData.state,
        postalCode: editData.postalCode?.toUpperCase() ?? editData.postalCode,
        country: editData.country?.toUpperCase() ?? editData.country,
      };
      await updateClient(client.id, dataToSave);
      setClient({ ...client, ...dataToSave });
      setEditData(null);
      setIsEditing(false);
      showToast(t('clients.detail.updateSuccess'), 'success');
    } catch {
      showToast(t('clients.detail.updateError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ClientFormData, value: string | boolean) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const handlePhoneChange = (number: string, iso: string) => {
    if (!editData) return;
    setEditData({ ...editData, phone: number, phoneCountryCode: iso });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="client-detail">
          <p className="client-detail__loading">{t('clients.detail.loading')}</p>
        </div>
      </MainLayout>
    );
  }

  if (!client) return null;

  const addr = getPostalAddress(client);

  return (
    <MainLayout>
      <div className="client-detail">
        {/* Fixed Top Bar */}
        <div className="client-detail__top-bar">
          <div className="client-detail__top-bar-inner">
            <button
              className="client-detail__icon-btn client-detail__icon-btn--back"
              onClick={() => navigate(ROUTES.CLIENTS)}
              title={t('common.back')}
            >
              <PiArrowLeftBold size={20} />
            </button>
            {isEditing ? (
              <div className="client-detail__top-bar-actions">
                <button onClick={cancelEditing} className="btn btn--outline btn--sm" disabled={saving}>
                  {t('common.cancel')}
                </button>
                <button onClick={handleSave} className="btn btn--primary btn--sm" disabled={saving}>
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            ) : (
              <>
                <button onClick={handleWhatsApp} className="client-detail__icon-btn client-detail__icon-btn--whatsapp" title={t('orders.detail.whatsapp')}>
                  <PiWhatsappLogoBold size={20} />
                </button>
                <span className="client-detail__top-divider" />
                <button
                  onClick={handleToggleFavorite}
                  className={`client-detail__icon-btn ${client.favorite ? 'client-detail__icon-btn--fav-active' : ''}`}
                  title={client.favorite ? t('clients.detail.removeFavorite') : t('clients.detail.addFavorite')}
                >
                  {client.favorite ? <PiStarFill size={20} /> : <PiStarBold size={20} />}
                </button>
                <button onClick={startEditing} className="client-detail__icon-btn client-detail__icon-btn--primary" title={t('common.edit')}>
                  <PiPencilBold size={20} />
                </button>
                <button onClick={handleDelete} className="client-detail__icon-btn client-detail__icon-btn--danger" title={t('common.delete')}>
                  <PiTrashBold size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="client-detail__content">
          <div className="client-detail__card">

            {/* Header: avatar + nombre + info del cliente */}
            <div className="client-detail__header">
              {/* Avatar + nombre + fecha + info */}
              <div className="client-detail__client">
                <div className="client-detail__avatar">
                  <Avatar src={client.profilePhoto} seed={client.id} alt={client.firstName} />
                </div>
                <div className="client-detail__client-info">
                  <div className="client-detail__client-name-row">
                    <div className="client-detail__client-name-group">
                      {isEditing ? (
                        <div className="client-detail__name-edit">
                          <input type="text" value={editData?.firstName || ''} onChange={(e) => updateField('firstName', e.target.value)} placeholder="Nombre *" className="client-detail__input" />
                          <input type="text" value={editData?.lastName || ''} onChange={(e) => updateField('lastName', e.target.value)} placeholder="Apellido *" className="client-detail__input" />
                        </div>
                      ) : (
                        <h1 className="client-detail__name">{client.firstName} {client.lastName}</h1>
                      )}
                      <span className="client-detail__date">{t('clients.detail.clientSince')} {formatDate(client.createdAt)}</span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="client-detail__header-fields">
                <div className="client-detail__header-field">
                  <span className="client-detail__info-label"><PiMapPinBold size={12} />{t('clients.detail.address')}</span>
                  {isEditing ? (
                    <>
                      <div className="client-detail__address-row">
                        <input type="text" value={editData?.street || ''} onChange={(e) => updateField('street', e.target.value)} placeholder="Calle" className="client-detail__input client-detail__input--flex" />
                        <input type="text" value={editData?.exteriorNumber || ''} onChange={(e) => updateField('exteriorNumber', e.target.value)} placeholder="No. Ext" className="client-detail__input client-detail__input--small" />
                        <input type="text" value={editData?.interiorNumber || ''} onChange={(e) => updateField('interiorNumber', e.target.value)} placeholder="No. Int" className="client-detail__input client-detail__input--small" />
                      </div>
                      <input type="text" value={editData?.neighborhood || ''} onChange={(e) => updateField('neighborhood', e.target.value)} placeholder="Colonia" className="client-detail__input" />
                      <div className="client-detail__address-row">
                        <input type="text" value={editData?.country || ''} onChange={(e) => updateField('country', e.target.value)} placeholder="País" className="client-detail__input client-detail__input--flex" />
                        <input type="text" value={editData?.state || ''} onChange={(e) => updateField('state', e.target.value)} placeholder="Estado" className="client-detail__input client-detail__input--flex" />
                        <input type="text" value={editData?.city || ''} onChange={(e) => updateField('city', e.target.value)} placeholder="Ciudad" className="client-detail__input client-detail__input--flex" />
                      </div>
                      <input type="text" value={editData?.postalCode || ''} onChange={(e) => updateField('postalCode', e.target.value)} placeholder="CP" className="client-detail__input client-detail__input--small" />
                    </>
                  ) : (
                    <>
                      <span className="client-detail__info-value">{addr.line1}</span>
                      <span className="client-detail__info-value">{addr.line2}</span>
                      <span className="client-detail__info-value">{addr.line3}{addr.line5 ? `, ${addr.line5}` : ''}{addr.line6 ? `, ${addr.line6}` : ''}</span>
                      <span className="client-detail__info-value">{addr.line4}</span>
                    </>
                  )}
                </div>
                <div className="client-detail__header-contact">
                  <div className="client-detail__header-field">
                    <span className="client-detail__info-label"><PiPhoneBold size={12} />{t('clients.detail.phone')}</span>
                    {isEditing ? (
                      <PhoneInput
                        value={editData?.phone || ''}
                        countryCode={editData?.phoneCountryCode ?? 'MX'}
                        onChange={handlePhoneChange}
                        placeholder="Teléfono"
                      />
                    ) : (
                      <span className="client-detail__info-value">
                        {client.phoneCountryCode
                          ? `${getCountryCode(client.phoneCountryCode)?.code ?? ''} ${formatPhone(client.phone)}`
                          : formatPhone(client.phone)}
                      </span>
                    )}
                  </div>
                  <div className="client-detail__header-field">
                    <span className="client-detail__info-label"><PiEnvelopeSimpleBold size={12} />{t('clients.detail.email')}</span>
                    {isEditing ? (
                      <input type="email" value={editData?.email || ''} onChange={(e) => updateField('email', e.target.value)} placeholder="Correo electrónico" className="client-detail__input" />
                    ) : (
                      <span className={`client-detail__info-value ${!client.email ? 'client-detail__info-value--empty' : ''}`}>
                        {client.email || t('clients.detail.noEmail')}
                      </span>
                    )}
                  </div>
                  <div className="client-detail__header-field client-detail__header-field--full">
                    <span className="client-detail__info-label"><PiNoteBold size={12} />{t('clients.detail.reference')}</span>
                    {isEditing ? (
                      <>
                        <textarea value={editData?.reference || ''} onChange={(e) => updateField('reference', e.target.value)} placeholder="Referencia..." className="client-detail__textarea client-detail__textarea--small" rows={2} maxLength={140} style={{ resize: 'none' }} />
                        <span className="client-detail__char-count">{(editData?.reference || '').length}/140</span>
                      </>
                    ) : (
                      <span className={`client-detail__info-value ${!client.reference ? 'client-detail__info-value--empty' : ''}`}>
                        {client.reference || t('clients.detail.noReference')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de pedidos: ocupa el resto del card */}
            <ClientOrderHistory
              clientId={id!}
              orders={orders}
              ordersLoading={ordersLoading}
              ordersError={ordersError}
              productCatalog={productCatalog}
              allLabels={allLabels}
              format={format}
            />

          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="client-detail__modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="client-detail__modal" onClick={e => e.stopPropagation()}>
            <div className="client-detail__modal-header">
              <h3>{t('clients.detail.deleteModal.title')}</h3>
              <button className="client-detail__modal-close" onClick={() => setShowDeleteModal(false)}>
                <PiXBold size={18} />
              </button>
            </div>
            <div className="client-detail__modal-body">
              <p>{t('clients.detail.deleteModal.warning')}</p>
              <p className="client-detail__delete-label">
                {t('clients.detail.deleteModal.instruction')}
              </p>
              <code className="client-detail__delete-code">{deleteCode}</code>
              <input
                type="text"
                className="input"
                placeholder={t('clients.detail.deleteModal.placeholder')}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                autoComplete="off"
              />
            </div>
            <div className="client-detail__modal-footer">
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
  );
};

export default ClientDetail;
