import { useState } from 'react';
import { PiUsersThreeBold, PiXBold, PiWarningBold } from 'react-icons/pi';
import PhoneInput from '../clientes/PhoneInput';

interface MiembroFormData {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  telefono: string;
  telefonoCodigoPais: string;
  password: string;
}

interface CrearMiembroModalProps {
  onClose: () => void;
  onSubmit: (form: MiembroFormData) => Promise<void>;
}

const FORM_INITIAL: MiembroFormData & { confirmarPassword: string } = {
  nombre: '', apellido: '', fechaNacimiento: '',
  telefono: '', telefonoCodigoPais: 'MX',
  password: '', confirmarPassword: '',
};

const CrearMiembroModal = ({ onClose, onSubmit }: CrearMiembroModalProps) => {
  const [form, setForm] = useState(FORM_INITIAL);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!form.fechaNacimiento) {
      setError('La fecha de nacimiento es requerida');
      return;
    }
    if (!form.telefono || form.telefono.length < 10) {
      setError('Ingresa un número de teléfono válido');
      return;
    }

    setLoading(true);
    try {
      const { confirmarPassword: _, ...data } = form;
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear miembro');
      setLoading(false);
    }
  };

  return (
    <div className="configuracion__modal-overlay" onClick={onClose}>
      <div className="configuracion__modal configuracion__modal--wide" onClick={e => e.stopPropagation()}>
        <div className="configuracion__modal-header">
          <PiUsersThreeBold size={20} className="configuracion__modal-icon" />
          <h3>Nuevo miembro</h3>
          <button className="configuracion__modal-close" onClick={onClose}>
            <PiXBold size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="configuracion__modal-body">
            <div className="configuracion__modal-row">
              <div className="configuracion__modal-field">
                <label>Nombre</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Juan"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  required
                  maxLength={40}
                />
              </div>
              <div className="configuracion__modal-field">
                <label>Apellido</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Pérez"
                  value={form.apellido}
                  onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
                  required
                  maxLength={40}
                />
              </div>
            </div>
            <div className="configuracion__modal-field">
              <label>Fecha de nacimiento</label>
              <input
                type="date"
                className="input"
                value={form.fechaNacimiento}
                onChange={e => setForm(f => ({ ...f, fechaNacimiento: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="configuracion__modal-field">
              <label>Número de teléfono</label>
              <PhoneInput
                value={form.telefono}
                codigoPais={form.telefonoCodigoPais}
                onChange={(numero, iso) => setForm(f => ({ ...f, telefono: numero, telefonoCodigoPais: iso }))}
                placeholder="Número de celular"
              />
            </div>
            <div className="configuracion__modal-row">
              <div className="configuracion__modal-field">
                <label>Contraseña</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  maxLength={32}
                />
              </div>
              <div className="configuracion__modal-field">
                <label>Confirmar contraseña</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={form.confirmarPassword}
                  onChange={e => setForm(f => ({ ...f, confirmarPassword: e.target.value }))}
                  required
                  maxLength={32}
                />
              </div>
            </div>
            {error && (
              <div className="configuracion__file-error">
                <PiWarningBold size={14} />
                {error}
              </div>
            )}
          </div>
          <div className="configuracion__modal-actions">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary btn--sm" disabled={loading}>
              {loading ? 'Creando...' : 'Crear miembro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearMiembroModal;
