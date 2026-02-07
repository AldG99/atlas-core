import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiWhatsappLogoBold,
  PiPencilBold,
  PiTrashBold,
  PiMapPinBold,
  PiPhoneBold,
  PiEnvelopeBold,
  PiClockBold,
  PiEyeBold,
  PiNoteBold
} from 'react-icons/pi';
import type { Cliente, ClienteFormData } from '../types/Cliente';
import { getClienteById, deleteCliente, updateCliente } from '../services/clienteService';
import { useToast } from '../hooks/useToast';
import { ROUTES } from '../config/routes';
import MainLayout from '../layouts/MainLayout';
import ClienteModal from '../components/clientes/ClienteModal';
import './ClienteDetail.scss';

const ClienteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const getFullAddress = (c: Cliente) => {
    const numInterior = c.numeroInterior ? `, Int. ${c.numeroInterior}` : '';
    return `${c.calle} ${c.numeroExterior}${numInterior}, ${c.colonia}, ${c.ciudad}, CP ${c.codigoPostal}`;
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

  const handleEdit = async (data: ClienteFormData) => {
    if (!cliente) return;
    try {
      await updateCliente(cliente.id, data);
      setCliente({ ...cliente, ...data });
      setIsEditModalOpen(false);
      showToast('Cliente actualizado correctamente', 'success');
    } catch {
      showToast('Error al actualizar el cliente', 'error');
    }
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
            <button
              onClick={handleWhatsApp}
              className="cliente-detail__icon-btn cliente-detail__icon-btn--whatsapp"
              title="Enviar WhatsApp"
            >
              <PiWhatsappLogoBold size={20} />
            </button>
            <span className="cliente-detail__top-divider" />
            <button
              onClick={() => setIsEditModalOpen(true)}
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
          </div>
        </div>

        {/* Content */}
        <div className="cliente-detail__content">
          {/* Header */}
          <div className="cliente-detail__header">
            <div className="cliente-detail__client">
              <div className="cliente-detail__avatar">
                {cliente.fotoPerfil ? (
                  <img src={cliente.fotoPerfil} alt={cliente.nombre} />
                ) : (
                  <span>{cliente.nombre[0]}{cliente.apellido?.[0] ?? ''}</span>
                )}
              </div>
              <div className="cliente-detail__client-info">
                <h1 className="cliente-detail__name">{cliente.nombre} {cliente.apellido}</h1>
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
                  <span className="cliente-detail__info-value">{cliente.telefono}</span>
                </div>
              </div>
              {cliente.telefonoSecundario && (
                <div className="cliente-detail__info-item">
                  <div className="cliente-detail__info-icon">
                    <PiPhoneBold size={18} />
                  </div>
                  <div className="cliente-detail__info-content">
                    <span className="cliente-detail__info-label">Teléfono secundario</span>
                    <span className="cliente-detail__info-value">{cliente.telefonoSecundario}</span>
                  </div>
                </div>
              )}
              {cliente.correo && (
                <div className="cliente-detail__info-item">
                  <div className="cliente-detail__info-icon">
                    <PiEnvelopeBold size={18} />
                  </div>
                  <div className="cliente-detail__info-content">
                    <span className="cliente-detail__info-label">Correo electrónico</span>
                    <span className="cliente-detail__info-value">{cliente.correo}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address Section */}
          <div className="cliente-detail__section">
            <div className="cliente-detail__section-header">
              <strong>Dirección de entrega</strong>
            </div>
            <div className="cliente-detail__info-grid">
              <div className="cliente-detail__info-item cliente-detail__info-item--full">
                <div className="cliente-detail__info-icon">
                  <PiMapPinBold size={18} />
                </div>
                <div className="cliente-detail__info-content">
                  <span className="cliente-detail__info-label">Dirección completa</span>
                  <span className="cliente-detail__info-value">{getFullAddress(cliente)}</span>
                </div>
              </div>
              {cliente.referencia && (
                <div className="cliente-detail__info-item cliente-detail__info-item--full">
                  <div className="cliente-detail__info-icon">
                    <PiNoteBold size={18} />
                  </div>
                  <div className="cliente-detail__info-content">
                    <span className="cliente-detail__info-label">Referencia</span>
                    <span className="cliente-detail__info-value">{cliente.referencia}</span>
                  </div>
                </div>
              )}
            </div>
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
                  <span className={`cliente-detail__badge ${cliente.numeroVisible ? 'cliente-detail__badge--success' : 'cliente-detail__badge--warning'}`}>
                    {cliente.numeroVisible ? 'Sí, es visible' : 'No es visible'}
                  </span>
                </div>
              </div>
              {cliente.horarioEntrega && (
                <div className="cliente-detail__info-item">
                  <div className="cliente-detail__info-icon">
                    <PiClockBold size={18} />
                  </div>
                  <div className="cliente-detail__info-content">
                    <span className="cliente-detail__info-label">Horario preferido</span>
                    <span className="cliente-detail__info-value">{cliente.horarioEntrega}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          {cliente.notas && (
            <div className="cliente-detail__section">
              <div className="cliente-detail__section-header">
                <strong>Notas</strong>
              </div>
              <p className="cliente-detail__notes">{cliente.notas}</p>
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <ClienteModal
          cliente={{
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
          }}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEdit}
        />
      )}
    </MainLayout>
  );
};

export default ClienteDetail;
