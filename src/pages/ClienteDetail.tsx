import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiArrowRightBold,
  PiWhatsappLogoBold,
  PiPencilBold,
  PiTrashBold,
  PiCameraBold,
  PiArchiveBold,
  PiStarFill,
  PiStarBold,
  PiMagnifyingGlassBold
} from 'react-icons/pi';
import type { Cliente, ClienteFormData } from '../types/Cliente';
import type { Pedido } from '../types/Pedido';
import type { Etiqueta } from '../types/Producto';
import { getClienteById, deleteCliente, updateCliente, toggleClienteFavorito } from '../services/clienteService';
import PhoneInput from '../components/clientes/PhoneInput';
import { getPedidosByClientPhone } from '../services/pedidoService';
import { getCodigoPais } from '../data/codigosPais';
import { formatTelefono, formatCurrency } from '../utils/formatters';
import { ETIQUETA_ICONS } from '../constants/etiquetaIcons';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useProductos } from '../hooks/useProductos';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { ROUTES } from '../config/routes';
import MainLayout from '../layouts/MainLayout';
import './ClienteDetail.scss';

type DateFilter = 'todo' | 'semana' | 'mes' | '3meses';

const ClienteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { productos: catalogoProductos } = useProductos();
  const { etiquetas: todasEtiquetas } = useEtiquetas();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ClienteFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosLoading, setPedidosLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroFecha, setFiltroFecha] = useState<DateFilter>('todo');

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

  // Pedidos filtrados y ordenados
  const pedidosFiltrados = useMemo(() => {
    let resultado = [...pedidos];

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter(p =>
        p.productos.some(prod =>
          prod.nombre.toLowerCase().includes(q) ||
          (prod.clave && prod.clave.toLowerCase().includes(q))
        )
      );
    }

    resultado = resultado.filter(p => p.estado === 'entregado');

    if (filtroFecha !== 'todo') {
      const ahora = new Date();
      let desde: Date;
      switch (filtroFecha) {
        case 'semana': desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case 'mes':    desde = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000); break;
        case '3meses': desde = new Date(ahora.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      }
      resultado = resultado.filter(p => new Date(p.fechaCreacion) >= desde!);
    }

    resultado.sort((a, b) =>
      new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
    );

    return resultado;
  }, [pedidos, busqueda, filtroFecha]);

  // Acumulado solo de pedidos entregados, por orden cronológico
  const acumuladoMap = useMemo(() => {
    const sorted = [...pedidos]
      .filter(p => p.estado === 'entregado')
      .sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime());
    const map = new Map<string, number>();
    let acumulado = 0;
    sorted.forEach(p => {
      acumulado += p.total;
      map.set(p.id, acumulado);
    });
    return map;
  }, [pedidos]);

  const getEtiquetasForClave = (clave?: string): Etiqueta[] => {
    if (!clave) return [];
    const producto = catalogoProductos.find(cp => cp.clave === clave);
    if (!producto?.etiquetas) return [];
    return producto.etiquetas
      .map(etId => todasEtiquetas.find(e => e.id === etId))
      .filter((e): e is Etiqueta => !!e);
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));

  const formatPedidoDate = (date: Date) =>
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));

  const getPostalAddress = (c: Cliente) => {
    const numInterior = c.numeroInterior ? `, Int. ${c.numeroInterior}` : '';
    return {
      line1: `${c.calle} ${c.numeroExterior}${numInterior}`,
      line2: c.colonia,
      line3: c.ciudad,
      line4: `CP ${c.codigoPostal}`,
      line5: c.pais
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
      telefonoCodigoPais: cliente.telefonoCodigoPais ?? 'MX',
      correo: cliente.correo,
      calle: cliente.calle,
      numeroExterior: cliente.numeroExterior,
      numeroInterior: cliente.numeroInterior,
      colonia: cliente.colonia,
      ciudad: cliente.ciudad,
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
        codigoPostal: editData.codigoPostal?.toUpperCase() ?? editData.codigoPostal,
        pais: editData.pais?.toUpperCase() ?? editData.pais,
      };
      await updateCliente(cliente.id, dataToSave);
      setCliente({ ...cliente, ...dataToSave });
      setEditData(null);
      setIsEditing(false);
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

  const handlePhoneChange = (numero: string, iso: string) => {
    if (!editData) return;
    setEditData({ ...editData, telefono: numero, telefonoCodigoPais: iso });
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

  const addr = getPostalAddress(cliente);

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
                <button onClick={cancelEditing} className="btn btn--outline btn--sm" disabled={saving}>
                  Cancelar
                </button>
                <button onClick={handleSave} className="btn btn--primary btn--sm" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            ) : (
              <>
                <button onClick={handleWhatsApp} className="cliente-detail__icon-btn cliente-detail__icon-btn--whatsapp" title="Enviar WhatsApp">
                  <PiWhatsappLogoBold size={20} />
                </button>
                <button onClick={() => navigate(`/cliente/${id}/pedidos`)} className="cliente-detail__icon-btn" title="Historial de pedidos">
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
                <button onClick={startEditing} className="cliente-detail__icon-btn cliente-detail__icon-btn--primary" title="Editar cliente">
                  <PiPencilBold size={20} />
                </button>
                <button onClick={handleDelete} className="cliente-detail__icon-btn cliente-detail__icon-btn--danger" title="Eliminar cliente">
                  <PiTrashBold size={20} />
                </button>
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
                  {(isEditing ? editData?.fotoPerfil : cliente.fotoPerfil) ? (
                    <img src={(isEditing ? editData?.fotoPerfil : cliente.fotoPerfil) || ''} alt={cliente.nombre} />
                  ) : (
                    <span>{(editData?.nombre || cliente.nombre)[0]}{(editData?.apellido || cliente.apellido)?.[0] ?? ''}</span>
                  )}
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
                          <input type="text" value={editData?.nombre || ''} onChange={(e) => updateField('nombre', e.target.value)} placeholder="Nombre" className="cliente-detail__input" />
                          <input type="text" value={editData?.apellido || ''} onChange={(e) => updateField('apellido', e.target.value)} placeholder="Apellido" className="cliente-detail__input" />
                        </div>
                      ) : (
                        <h1 className="cliente-detail__name">{cliente.nombre} {cliente.apellido}</h1>
                      )}
                      <span className="cliente-detail__date">Cliente desde {formatDate(cliente.fechaCreacion)}</span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="cliente-detail__header-fields">
                <div className="cliente-detail__header-field">
                  <span className="cliente-detail__info-label">Dirección</span>
                  {isEditing ? (
                    <>
                      <div className="cliente-detail__address-row">
                        <input type="text" value={editData?.calle || ''} onChange={(e) => updateField('calle', e.target.value)} placeholder="Calle" className="cliente-detail__input cliente-detail__input--flex" />
                        <input type="text" value={editData?.numeroExterior || ''} onChange={(e) => updateField('numeroExterior', e.target.value)} placeholder="No. Ext" className="cliente-detail__input cliente-detail__input--small" />
                        <input type="text" value={editData?.numeroInterior || ''} onChange={(e) => updateField('numeroInterior', e.target.value)} placeholder="No. Int" className="cliente-detail__input cliente-detail__input--small" />
                      </div>
                      <input type="text" value={editData?.colonia || ''} onChange={(e) => updateField('colonia', e.target.value)} placeholder="Colonia" className="cliente-detail__input" />
                      <div className="cliente-detail__address-row">
                        <input type="text" value={editData?.ciudad || ''} onChange={(e) => updateField('ciudad', e.target.value)} placeholder="Ciudad" className="cliente-detail__input cliente-detail__input--flex" />
                        <input type="text" value={editData?.pais || ''} onChange={(e) => updateField('pais', e.target.value)} placeholder="País" className="cliente-detail__input cliente-detail__input--flex" />
                      </div>
                      <input type="text" value={editData?.codigoPostal || ''} onChange={(e) => updateField('codigoPostal', e.target.value)} placeholder="CP" className="cliente-detail__input cliente-detail__input--small" />
                    </>
                  ) : (
                    <>
                      <span className="cliente-detail__info-value">{addr.line1}</span>
                      <span className="cliente-detail__info-value">{addr.line2}</span>
                      <span className="cliente-detail__info-value">{addr.line3}{addr.line5 ? `, ${addr.line5}` : ''}</span>
                      <span className="cliente-detail__info-value">{addr.line4}</span>
                    </>
                  )}
                </div>
                <div className="cliente-detail__header-contact">
                  <div className="cliente-detail__header-field">
                    <span className="cliente-detail__info-label">Teléfono</span>
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
                    <span className="cliente-detail__info-label">Correo electrónico</span>
                    {isEditing ? (
                      <input type="email" value={editData?.correo || ''} onChange={(e) => updateField('correo', e.target.value)} placeholder="Correo electrónico" className="cliente-detail__input" />
                    ) : (
                      <span className={`cliente-detail__info-value ${!cliente.correo ? 'cliente-detail__info-value--empty' : ''}`}>
                        {cliente.correo || 'Sin correo registrado'}
                      </span>
                    )}
                  </div>
                  <div className="cliente-detail__header-field cliente-detail__header-field--full">
                    <span className="cliente-detail__info-label">Referencia</span>
                    {isEditing ? (
                      <>
                        <textarea value={editData?.referencia || ''} onChange={(e) => updateField('referencia', e.target.value)} placeholder="Referencia..." className="cliente-detail__textarea cliente-detail__textarea--small" rows={2} maxLength={150} style={{ resize: 'none' }} />
                        <span className="cliente-detail__char-count">{(editData?.referencia || '').length}/150</span>
                      </>
                    ) : (
                      <span className={`cliente-detail__info-value ${!cliente.referencia ? 'cliente-detail__info-value--empty' : ''}`}>
                        {cliente.referencia || 'Sin referencia'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de pedidos: ocupa el resto del card */}
            <div className="cliente-detail__main">
                {/* Filtros */}
                <div className="cliente-detail__pedidos-filters">
                  <div className="cliente-detail__pedidos-search">
                    <PiMagnifyingGlassBold size={16} />
                    <input
                      type="text"
                      placeholder="Buscar producto o clave..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                    />
                  </div>
                  <select value={filtroFecha} onChange={e => setFiltroFecha(e.target.value as DateFilter)}>
                    <option value="todo">Todo el tiempo</option>
                    <option value="semana">Última semana</option>
                    <option value="mes">Último mes</option>
                    <option value="3meses">Últimos 3 meses</option>
                  </select>
                </div>

                {/* Tabla */}
                <div className="cliente-detail__pedidos-table-wrapper">
                  <div className="cliente-detail__pedidos-table-head">
                    <table className="cliente-detail__pedidos-table">
                      <colgroup>
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '34%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '18%' }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Clave</th>
                          <th>Cant.</th>
                          <th>Producto</th>
                          <th>Etiquetas</th>
                          <th>Importe</th>
                          <th>Acumulado</th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  <div className="cliente-detail__pedidos-table-body">
                    <table className="cliente-detail__pedidos-table">
                      <colgroup>
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '34%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '18%' }} />
                      </colgroup>
                      <tbody>
                        {pedidosLoading ? (
                          <tr>
                            <td colSpan={6} className="cliente-detail__pedidos-table-empty">Cargando pedidos...</td>
                          </tr>
                        ) : pedidosFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="cliente-detail__pedidos-table-empty">
                              {pedidos.length === 0 ? 'Este cliente no tiene pedidos' : 'No se encontraron pedidos con los filtros aplicados'}
                            </td>
                          </tr>
                        ) : pedidosFiltrados.map((pedido) => (
                          <React.Fragment key={pedido.id}>
                            {/* Fila de fecha del pedido */}
                            <tr className="cliente-detail__pedidos-date-row">
                              <td colSpan={6}>
                                <div className="cliente-detail__pedidos-date-row-inner">
                                  <span className="cliente-detail__pedidos-date-main">{formatPedidoDate(pedido.fechaCreacion)}</span>
                                  <button
                                    className="cliente-detail__pedidos-detail-btn"
                                    onClick={() => navigate(ROUTES.DETAIL_PEDIDO.replace(':id', pedido.id), { state: { from: `/cliente/${id}` } })}
                                    title="Ver detalle del pedido"
                                  >
                                    <PiArrowRightBold size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {/* Filas de productos */}
                            {pedido.productos.map((p, i) => (
                              <tr key={i} className="cliente-detail__pedidos-product-row">
                                <td>
                                  {p.clave
                                    ? <span className="cliente-detail__clave">{p.clave}</span>
                                    : '—'}
                                </td>
                                <td>{p.cantidad}</td>
                                <td>{p.nombre}</td>
                                <td>
                                  <div className="cliente-detail__pedidos-etiquetas">
                                    {getEtiquetasForClave(p.clave).map(et => {
                                      const iconData = ETIQUETA_ICONS[et.icono];
                                      const Icon = iconData?.icon;
                                      return (
                                        <span key={et.id} className="cliente-detail__pedidos-etiqueta" style={{ backgroundColor: et.color }} title={et.nombre}>
                                          {Icon && <Icon size={12} />}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </td>
                                <td>{formatCurrency(p.subtotal)}</td>
                                {i === 0 ? (
                                  <td rowSpan={pedido.productos.length} />
                                ) : null}
                              </tr>
                            ))}
                            {/* Fila de total */}
                            <tr className="cliente-detail__pedidos-total-row">
                              <td colSpan={4} className="cliente-detail__pedidos-total-label">Total</td>
                              <td className="cliente-detail__pedidos-total-value">{formatCurrency(pedido.total)}</td>
                              <td className="cliente-detail__pedidos-acumulado-value">{formatCurrency(acumuladoMap.get(pedido.id) ?? 0)}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="cliente-detail__pedidos-table-total">
                    <table className="cliente-detail__pedidos-table">
                      <colgroup>
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '34%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '18%' }} />
                      </colgroup>
                      <tfoot>
                        <tr>
                          <td colSpan={5} className="cliente-detail__pedidos-table-total-label">Total acumulado</td>
                          <td className="cliente-detail__pedidos-table-total-value">{formatCurrency(pedidos.filter(p => p.estado === 'entregado').reduce((s, p) => s + p.total, 0))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="cliente-detail__pedidos-table-footer" />
                </div>
              </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ClienteDetail;
