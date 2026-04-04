import { useState } from 'react';
import {
  PiUserBold, PiXBold, PiIdentificationBadgeBold,
  PiPhoneBold, PiCalendarBold, PiEyeBold, PiEyeSlashBold,
} from 'react-icons/pi';
import type { User } from '../../types/User';
import { formatTelefono } from '../../utils/formatters';
import { getCodigoPais } from '../../data/codigosPais';
import PhoneInput from '../clientes/PhoneInput';
import Avatar from '../ui/Avatar';
import { useToast } from '../../hooks/useToast';

interface ProfileData {
  nombre: string;
  apellido: string;
  telefono: string;
  telefonoCodigoPais: string;
  fechaNacimiento: string;
}

interface MiembroPerfilModalProps {
  miembro: User;
  onClose: () => void;
  onRemover: (uid: string) => void;
  onActualizar: (uid: string, data: ProfileData) => Promise<void>;
  onActualizarContrasena: (uid: string, password: string) => Promise<void>;
}

const MiembroPerfilModal = ({
  miembro,
  onClose,
  onRemover,
  onActualizar,
  onActualizarContrasena,
}: MiembroPerfilModalProps) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<ProfileData & { password: string; confirmarPassword: string }>({
    nombre: miembro.nombre ?? '',
    apellido: miembro.apellido ?? '',
    telefono: miembro.telefono ?? '',
    telefonoCodigoPais: miembro.telefonoCodigoPais ?? 'MX',
    fechaNacimiento: miembro.fechaNacimiento ?? '',
    password: '',
    confirmarPassword: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const nombreCompleto = `${miembro.nombre ?? ''} ${miembro.apellido ?? ''}`.trim();
  const initials = `${(miembro.nombre?.[0] ?? '').toUpperCase()}${(miembro.apellido?.[0] ?? '').toUpperCase()}`;
  const codigoPais = miembro.telefonoCodigoPais ? getCodigoPais(miembro.telefonoCodigoPais) : null;
  const telefonoFormateado = miembro.telefono
    ? `${codigoPais ? `${codigoPais.codigo} ` : ''}${formatTelefono(miembro.telefono)}`
    : null;
  const fechaNacStr = miembro.fechaNacimiento
    ? new Date(miembro.fechaNacimiento + 'T12:00:00').toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

  const handleStartEdit = () => {
    setEditForm({
      nombre: miembro.nombre ?? '',
      apellido: miembro.apellido ?? '',
      telefono: miembro.telefono ?? '',
      telefonoCodigoPais: miembro.telefonoCodigoPais ?? 'MX',
      fechaNacimiento: miembro.fechaNacimiento ?? '',
      password: '',
      confirmarPassword: '',
    });
    setShowPwd(false);
    setShowConfirmPwd(false);
    setEditing(true);
  };

  const handleSave = async () => {
    if (editForm.password && editForm.password !== editForm.confirmarPassword) {
      showToast('Las contraseñas no coinciden', 'warning');
      return;
    }
    if (editForm.password && editForm.password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }
    setSaving(true);
    try {
      const { password, confirmarPassword: _, ...profileData } = editForm;
      await onActualizar(miembro.uid, profileData);
      if (password) await onActualizarContrasena(miembro.uid, password);
      setEditing(false);
      showToast('Miembro actualizado', 'success');
    } catch {
      showToast('Error al guardar cambios', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="configuracion__modal-overlay" onClick={onClose}>
      <div className="configuracion__modal configuracion__modal--wide" onClick={e => e.stopPropagation()}>
        <div className="configuracion__modal-header">
          <PiUserBold size={20} className="configuracion__modal-icon--user" />
          <h3>{editing ? 'Editar miembro' : 'Perfil del miembro'}</h3>
          <button className="configuracion__modal-close" onClick={onClose}>
            <PiXBold size={16} />
          </button>
        </div>
        <div className="configuracion__modal-body">
          {!editing ? (
            <>
              <div className="configuracion__miembro-profile">
                <div className="configuracion__miembro-avatar">
                  <Avatar src={miembro.fotoPerfil} initials={initials || '?'} alt={nombreCompleto} />
                </div>
                <div className="configuracion__miembro-name">{nombreCompleto || '—'}</div>
                {miembro.numeroMiembro && (
                  <div className="configuracion__miembro-badge">#{miembro.numeroMiembro}</div>
                )}
              </div>
              <div className="configuracion__miembro-fields">
                <div className="configuracion__miembro-field">
                  <PiIdentificationBadgeBold size={14} className="configuracion__miembro-field-icon" />
                  <div>
                    <p className="configuracion__miembro-field-label">Usuario</p>
                    <p className="configuracion__miembro-field-value">{miembro.username ?? '—'}</p>
                  </div>
                </div>
                {telefonoFormateado && (
                  <div className="configuracion__miembro-field">
                    <PiPhoneBold size={14} className="configuracion__miembro-field-icon" />
                    <div>
                      <p className="configuracion__miembro-field-label">Teléfono</p>
                      <p className="configuracion__miembro-field-value">{telefonoFormateado}</p>
                    </div>
                  </div>
                )}
                {fechaNacStr && (
                  <div className="configuracion__miembro-field">
                    <PiCalendarBold size={14} className="configuracion__miembro-field-icon" />
                    <div>
                      <p className="configuracion__miembro-field-label">Fecha de nacimiento</p>
                      <p className="configuracion__miembro-field-value">{fechaNacStr}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="configuracion__modal-row" style={{ gridTemplateColumns: '1fr' }}>
              <div className="configuracion__modal-row">
                <div className="configuracion__modal-field">
                  <label>Nombre</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.nombre}
                    onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                    maxLength={40}
                  />
                </div>
                <div className="configuracion__modal-field">
                  <label>Apellido</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.apellido}
                    onChange={e => setEditForm(f => ({ ...f, apellido: e.target.value }))}
                    maxLength={40}
                  />
                </div>
              </div>
              <div className="configuracion__modal-field">
                <label>Teléfono</label>
                <PhoneInput
                  value={editForm.telefono}
                  codigoPais={editForm.telefonoCodigoPais}
                  onChange={(val, cod) => setEditForm(f => ({ ...f, telefono: val, telefonoCodigoPais: cod }))}
                />
              </div>
              <div className="configuracion__modal-field">
                <label>Fecha de nacimiento</label>
                <input
                  type="date"
                  className="input"
                  value={editForm.fechaNacimiento}
                  onChange={e => setEditForm(f => ({ ...f, fechaNacimiento: e.target.value }))}
                />
              </div>
              <div className="configuracion__modal-field">
                <label>Nueva contraseña <span className="configuracion__modal-optional">(opcional)</span></label>
                <div className="configuracion__modal-pwd">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="input"
                    placeholder="••••••••"
                    value={editForm.password}
                    onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                    maxLength={32}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? <PiEyeSlashBold size={16} /> : <PiEyeBold size={16} />}
                  </button>
                </div>
              </div>
              <div className="configuracion__modal-field">
                <label>Confirmar contraseña</label>
                <div className="configuracion__modal-pwd">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    className="input"
                    placeholder="••••••••"
                    value={editForm.confirmarPassword}
                    onChange={e => setEditForm(f => ({ ...f, confirmarPassword: e.target.value }))}
                    maxLength={32}
                  />
                  <button type="button" onClick={() => setShowConfirmPwd(v => !v)}>
                    {showConfirmPwd ? <PiEyeSlashBold size={16} /> : <PiEyeBold size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="configuracion__modal-actions">
          {!editing ? (
            <>
              <button className="btn btn--danger btn--sm" onClick={() => { onRemover(miembro.uid); onClose(); }}>
                Remover
              </button>
              <button className="btn btn--outline btn--sm" onClick={onClose}>
                Cerrar
              </button>
              <button className="btn btn--primary btn--sm" onClick={handleStartEdit}>
                Editar
              </button>
            </>
          ) : (
            <>
              <button className="btn btn--outline btn--sm" onClick={() => setEditing(false)} disabled={saving}>
                Cancelar
              </button>
              <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiembroPerfilModal;
