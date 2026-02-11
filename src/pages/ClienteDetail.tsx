import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiWhatsappLogoBold,
  PiPencilBold,
  PiTrashBold,
  PiMapPinBold,
  PiPhoneBold,
  PiEnvelopeBold,
  PiEyeBold,
  PiCameraBold,
  PiArchiveBold,
  PiStarFill,
  PiStarBold
} from 'react-icons/pi';
import type { Cliente, ClienteFormData } from '../types/Cliente';
import { getClienteById, deleteCliente, updateCliente, toggleClienteFavorito } from '../services/clienteService';
import { useToast } from '../hooks/useToast';
import { ROUTES } from '../config/routes';
import MainLayout from '../layouts/MainLayout';
import './ClienteDetail.scss';

const ClienteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ClienteFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editData) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({ ...editData, fotoPerfil: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchCliente = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getClienteById(id);
      if (!data) {
        showToast('Cliente no encontrado', 'error');
        navigate(ROUTES.CLIENTES);
        return;
      }
      setCliente(data);
    } catch {
      showToast('Error al cargar el cliente', 'error');
      navigate(ROUTES.CLIENTES);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchCliente();
  }, [fetchCliente]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));

  const getPostalAddress = (c: Cliente) => {
    const numInterior = c.numeroInterior ? `, Int. ${c.numeroInterior}` : '';
    return {
      line1: `${c.calle} ${c.numeroExterior}${numInterior}`,
      line2: c.colonia,
      line3: `${c.ciudad}, CP ${c.codigoPostal}`
    };
  };

  const handleWhatsApp = () => {
    if (!cliente) return;
    const cleanPhone = cliente.telefono.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleDelete = async () => {
    if (!cliente) return;
    if (!window.confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) return;
    try {
      await deleteCliente(cliente.id);
      showToast('Cliente eliminado', 'success');
      navigate(ROUTES.CLIENTES);
    } catch {
      showToast('Error al eliminar el cliente', 'error');
    }
  };

  const handleToggleFavorito = async () => {
    if (!cliente) return;
    const nuevoValor = !cliente.favorito;
    try {
      await toggleClienteFavorito(cliente.id, nuevoValor);
      setCliente({ ...cliente, favorito: nuevoValor });
    } catch {
      showToast('Error al actualizar favorito', 'error');
    }
  };

  const startEditing = () => {
    if (!cliente) return;
    setEditData({
      fotoPerfil: cliente.fotoPerfil,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono,
      telefonoSecundario: cliente.telefonoSecundario,
      correo: cliente.correo,
      calle: cliente.calle,
      numeroExterior: cliente.numeroExterior,
      numeroInterior: cliente.numeroInterior,
      colonia: cliente.colonia,
      ciudad: cliente.ciudad,
      codigoPostal: cliente.codigoPostal,
      referencia: cliente.referencia,
      numeroVisible: cliente.numeroVisible,
      horarioEntrega: cliente.horarioEntrega,
      notas: cliente.notas
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
      await updateCliente(cliente.id, editData);
      setCliente({ ...cliente, ...editData });
      setIsEditing(false);
      setEditData(null);
      showToast('Cliente actualizado correctamente', 'success');
    } catch {
      showToast('Error al actualizar el cliente', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ClienteFormData, value: string | boolean) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="cliente-detail">
          <p className="cliente-detail__loading">Cargando cliente...</p>
        </div>
      </MainLayout>
    );
  }

  if (!cliente) return null;

  return (
    <MainLayout>
      <div className="cliente-detail">
        {/* Fixed Top Bar */}
        <div className="cliente-detail__top-bar">
          <div className="cliente-detail__top-bar-inner">
            <button
              className="cliente-detail__icon-btn cliente-detail__icon-btn--back"
              onClick={() => navigate(ROUTES.CLIENTES)}
              title="Volver"
            >
              <PiArrowLeftBold size={20} />
            </button>
            {isEditing ? (
              <div className="cliente-detail__top-bar-actions">
                <button
                  onClick={cancelEditing}
                  className="btn btn--outline btn--sm"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn--primary btn--sm"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleWhatsApp}
                  className="cliente-detail__icon-btn cliente-detail__icon-btn--whatsapp"
                  title="Enviar WhatsApp"
                >
                  <PiWhatsappLogoBold size={20} />
                </button>
                <button
                  onClick={() => navigate(`/cliente/${id}/pedidos`)}
                  className="cliente-detail__icon-btn"
                  title="Historial de pedidos"
                >
                  <PiArchiveBold size={20} />
                </button>
                <span className="cliente-detail__top-divider" />
                <button
                  onClick={handleToggleFavorito}
                  className={`cliente-detail__icon-btn ${cliente.favorito ? 'cliente-detail__icon-btn--fav-active' : ''}`}
                  title={cliente.favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  {cliente.favorito ? <PiStarFill size={20} /> : <PiStarBold size={20} />}
                </button>
                <button
                  onClick={startEditing}
                  className="cliente-detail__icon-btn cliente-detail__icon-btn--primary"
                  title="Editar cliente"
                >
                  <PiPencilBold size={20} />
                </button>
                <button
                  onClick={handleDelete}
                  className="cliente-detail__icon-btn cliente-detail__icon-btn--danger"
                  title="Eliminar cliente"
                >
                  <PiTrashBold size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="cliente-detail__content">
          {/* Header */}
          <div className="cliente-detail__header">
            <div className="cliente-detail__client">
              <div
                className={`cliente-detail__avatar ${isEditing ? 'cliente-detail__avatar--editable' : ''}`}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                {(isEditing ? editData?.fotoPerfil : cliente.fotoPerfil) ? (
                  <img src={(isEditing ? editData?.fotoPerfil : cliente.fotoPerfil) || ''} alt={cliente.nombre} />
                ) : (
                  <span>{(editData?.nombre || cliente.nombre)[0]}{(editData?.apellido || cliente.apellido)?.[0] ?? ''}</span>
                )}
                {isEditing && (
                  <div className="cliente-detail__avatar-overlay">
                    <PiCameraBold size={24} />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="cliente-detail__client-info">
                {isEditing ? (
                  <div className="cliente-detail__name-edit">
                    <input
                      type="text"
                      value={editData?.nombre || ''}
                      onChange={(e) => updateField('nombre', e.target.value)}
                      placeholder="Nombre"
                      className="cliente-detail__input"
                    />
                    <input
                      type="text"
                      value={editData?.apellido || ''}
                      onChange={(e) => updateField('apellido', e.target.value)}
                      placeholder="Apellido"
                      className="cliente-detail__input"
                    />
                  </div>
                ) : (
                  <h1 className="cliente-detail__name">{cliente.nombre} {cliente.apellido}</h1>
                )}
                <span className="cliente-detail__date">Cliente desde {formatDate(cliente.fechaCreacion)}</span>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="cliente-detail__section">
            <div className="cliente-detail__section-header">
              <strong>Contacto</strong>
            </div>
            <div className="cliente-detail__info-grid">
              <div className="cliente-detail__info-item">
                <div className="cliente-detail__info-icon">
                  <PiPhoneBold size={18} />
                </div>
                <div className="cliente-detail__info-content">
                  <span className="cliente-detail__info-label">Teléfono</span>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData?.telefono || ''}
                      onChange={(e) => updateField('telefono', e.target.value)}
                      className="cliente-detail__input"
                    />
                  ) : (
                    <span className="cliente-detail__info-value">{cliente.telefono}</span>
                  )}
                </div>
              </div>
              {(isEditing || cliente.telefonoSecundario) && (
                <div className="cliente-detail__info-item">
                  <div className="cliente-detail__info-icon">
                    <PiPhoneBold size={18} />
                  </div>
                  <div className="cliente-detail__info-content">
                    <span className="cliente-detail__info-label">Teléfono secundario</span>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData?.telefonoSecundario || ''}
                        onChange={(e) => updateField('telefonoSecundario', e.target.value)}
                        className="cliente-detail__input"
                      />
                    ) : (
                      <span className="cliente-detail__info-value">{cliente.telefonoSecundario}</span>
                    )}
                  </div>
                </div>
              )}
              {(isEditing || cliente.correo) && (
                <div className="cliente-detail__info-item">
                  <div className="cliente-detail__info-icon">
                    <PiEnvelopeBold size={18} />
                  </div>
                  <div className="cliente-detail__info-content">
                    <span className="cliente-detail__info-label">Correo electrónico</span>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData?.correo || ''}
                        onChange={(e) => updateField('correo', e.target.value)}
                        className="cliente-detail__input"
                      />
                    ) : (
                      <span className="cliente-detail__info-value">{cliente.correo}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address Section */}
          <div className="cliente-detail__section">
            <div className="cliente-detail__section-header">
              <strong>Dirección</strong>
            </div>
            {isEditing ? (
              <div className="cliente-detail__address-edit">
                <div className="cliente-detail__address-row">
                  <input
                    type="text"
                    value={editData?.calle || ''}
                    onChange={(e) => updateField('calle', e.target.value)}
                    placeholder="Calle"
                    className="cliente-detail__input cliente-detail__input--flex"
                  />
                  <input
                    type="text"
                    value={editData?.numeroExterior || ''}
                    onChange={(e) => updateField('numeroExterior', e.target.value)}
                    placeholder="No. Ext"
                    className="cliente-detail__input cliente-detail__input--small"
                  />
                  <input
                    type="text"
                    value={editData?.numeroInterior || ''}
                    onChange={(e) => updateField('numeroInterior', e.target.value)}
                    placeholder="No. Int"
                    className="cliente-detail__input cliente-detail__input--small"
                  />
                </div>
                <div className="cliente-detail__address-row">
                  <input
                    type="text"
                    value={editData?.colonia || ''}
                    onChange={(e) => updateField('colonia', e.target.value)}
                    placeholder="Colonia"
                    className="cliente-detail__input"
                  />
                  <input
                    type="text"
                    value={editData?.ciudad || ''}
                    onChange={(e) => updateField('ciudad', e.target.value)}
                    placeholder="Ciudad"
                    className="cliente-detail__input"
                  />
                  <input
                    type="text"
                    value={editData?.codigoPostal || ''}
                    onChange={(e) => updateField('codigoPostal', e.target.value)}
                    placeholder="CP"
                    className="cliente-detail__input cliente-detail__input--small"
                  />
                </div>
                <textarea
                  value={editData?.referencia || ''}
                  onChange={(e) => updateField('referencia', e.target.value)}
                  placeholder="Ej: Casa color azul, entre calle X y calle Y"
                  className="cliente-detail__textarea cliente-detail__textarea--small"
                  rows={2}
                />
              </div>
            ) : (
              <div className="cliente-detail__info-item cliente-detail__info-item--full">
                <div className="cliente-detail__info-icon">
                  <PiMapPinBold size={18} />
                </div>
                <div className="cliente-detail__address">
                  <p>{getPostalAddress(cliente).line1}</p>
                  <p>{getPostalAddress(cliente).line2}</p>
                  <p>{getPostalAddress(cliente).line3}</p>
                  {cliente.referencia && (
                    <p className="cliente-detail__address-ref">Ref: {cliente.referencia}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Delivery Section */}
          <div className="cliente-detail__section">
            <div className="cliente-detail__section-header">
              <strong>Información de entrega</strong>
            </div>
            <div className="cliente-detail__info-grid">
              <div className="cliente-detail__info-item">
                <div className="cliente-detail__info-icon">
                  <PiEyeBold size={18} />
                </div>
                <div className="cliente-detail__info-content">
                  <span className="cliente-detail__info-label">Número visible</span>
                  {isEditing ? (
                    <label className="cliente-detail__toggle">
                      <input
                        type="checkbox"
                        checked={editData?.numeroVisible || false}
                        onChange={(e) => updateField('numeroVisible', e.target.checked)}
                      />
                      <span>{editData?.numeroVisible ? 'Sí, es visible' : 'No es visible'}</span>
                    </label>
                  ) : (
                    <span className={`cliente-detail__info-value ${cliente.numeroVisible ? 'cliente-detail__info-value--success' : 'cliente-detail__info-value--warning'}`}>
                      {cliente.numeroVisible ? 'Sí, es visible' : 'No es visible'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {(isEditing || cliente.notas) && (
            <div className="cliente-detail__section">
              <div className="cliente-detail__section-header">
                <strong>Notas</strong>
              </div>
              {isEditing ? (
                <textarea
                  value={editData?.notas || ''}
                  onChange={(e) => updateField('notas', e.target.value)}
                  placeholder="Notas sobre el cliente..."
                  className="cliente-detail__textarea"
                  rows={3}
                />
              ) : (
                <p className="cliente-detail__notes">{cliente.notas}</p>
              )}
            </div>
          )}

        </div>
      </div>

    </MainLayout>
  );
};

export default ClienteDetail;
