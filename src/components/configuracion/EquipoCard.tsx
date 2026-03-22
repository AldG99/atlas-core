import { useState } from 'react';
import { PiUsersThreeBold, PiWarningBold } from 'react-icons/pi';
import { useEquipo } from '../../hooks/useEquipo';
import { useToast } from '../../hooks/useToast';
import PhoneInput from '../clientes/PhoneInput';
import './EquipoCard.scss';

const EquipoCard = () => {
  const { miembros, loading, crearEmpleado, remover } = useEquipo();
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '', apellido: '', fechaNacimiento: '', telefono: '', telefonoCodigoPais: 'MX', password: '', confirmarPassword: ''
  });
  const [creando, setCreando] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (form.password !== form.confirmarPassword) {
      setFormError('Las contraseñas no coinciden');
      return;
    }
    if (!form.fechaNacimiento) {
      setFormError('La fecha de nacimiento es requerida');
      return;
    }
    if (!form.telefono || form.telefono.length < 10) {
      setFormError('Ingresa un número de teléfono válido');
      return;
    }
    setCreando(true);
    try {
      await crearEmpleado({
        nombre: form.nombre,
        apellido: form.apellido,
        fechaNacimiento: form.fechaNacimiento,
        telefono: form.telefono,
        telefonoCodigoPais: form.telefonoCodigoPais,
        password: form.password,
      });
      showToast('Miembro creado correctamente', 'success');
      setForm({ nombre: '', apellido: '', fechaNacimiento: '', telefono: '', telefonoCodigoPais: 'MX', password: '', confirmarPassword: '' });
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear miembro');
    } finally {
      setCreando(false);
    }
  };

  const handleRemover = async (uid: string, nombre: string) => {
    try {
      await remover(uid);
      showToast(`${nombre} ha sido removido del equipo`, 'success');
    } catch {
      showToast('Error al remover al miembro', 'error');
    }
  };

  return (
    <div className="configuracion__card configuracion__card--full equipo-card">
      <div className="configuracion__card-header">
        <div className="configuracion__card-icon configuracion__card-icon--equipo">
          <PiUsersThreeBold size={18} />
        </div>
        <h2 className="configuracion__card-title">Equipo</h2>
      </div>
      <p className="configuracion__card-desc">
        Crea cuentas para los miembros de tu equipo. Entran con su usuario y contraseña desde la pantalla de inicio de sesión.
      </p>

      {loading ? (
        <div className="equipo-card__loading">Cargando equipo...</div>
      ) : (
        <>
          {miembros.length > 0 && (
            <div className="equipo-card__section">
              <p className="equipo-card__section-title">Miembros</p>
              <ul className="equipo-card__list">
                {miembros.map((m) => (
                  <li key={m.uid} className="equipo-card__item">
                    <div className="equipo-card__item-avatar">
                      {m.fotoPerfil
                        ? <img src={m.fotoPerfil} alt={m.nombre} />
                        : <span>{(m.nombre?.[0] ?? '').toUpperCase()}{(m.apellido?.[0] ?? '').toUpperCase()}</span>
                      }
                    </div>
                    <div className="equipo-card__item-info">
                      <span className="equipo-card__item-name">
                        {m.nombre} {m.apellido}
                      </span>
                      <span className="equipo-card__item-email">
                        {m.username}{m.numeroEmpleado ? ` · Nº ${m.numeroEmpleado}` : ''}
                      </span>
                    </div>
                    <button
                      className="btn btn--ghost btn--sm equipo-card__remove-btn"
                      onClick={() => handleRemover(m.uid, `${m.nombre ?? ''} ${m.apellido ?? ''}`.trim())}
                      title="Remover del equipo"
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {miembros.length === 0 && (
            <p className="equipo-card__empty">No hay miembros todavía.</p>
          )}
        </>
      )}

      {!showForm ? (
        <button className="btn btn--primary btn--sm equipo-card__add-btn" onClick={() => setShowForm(true)}>
          + Nuevo miembro
        </button>
      ) : (
        <form onSubmit={handleCrear} className="equipo-card__form">
          <p className="equipo-card__section-title">Nuevo miembro</p>
          <div className="equipo-card__form-row">
            <div className="equipo-card__form-field">
              <label>Nombre</label>
              <input className="input" value={form.nombre} onChange={e => setForm(p => ({...p, nombre: e.target.value}))} placeholder="Nombre" required />
            </div>
            <div className="equipo-card__form-field">
              <label>Apellido</label>
              <input className="input" value={form.apellido} onChange={e => setForm(p => ({...p, apellido: e.target.value}))} placeholder="Apellido" required />
            </div>
          </div>
          <div className="equipo-card__form-field">
            <label>Fecha de nacimiento</label>
            <input
              className="input"
              type="date"
              value={form.fechaNacimiento}
              onChange={e => setForm(p => ({...p, fechaNacimiento: e.target.value}))}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="equipo-card__form-field">
            <label>Número de teléfono</label>
            <PhoneInput
              value={form.telefono}
              codigoPais={form.telefonoCodigoPais}
              onChange={(numero, iso) => setForm(p => ({...p, telefono: numero, telefonoCodigoPais: iso}))}
              placeholder="Número de celular"
            />
          </div>
          <div className="equipo-card__form-row">
            <div className="equipo-card__form-field">
              <label>Contraseña</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} placeholder="••••••••" required minLength={8} />
            </div>
            <div className="equipo-card__form-field">
              <label>Confirmar contraseña</label>
              <input className="input" type="password" value={form.confirmarPassword} onChange={e => setForm(p => ({...p, confirmarPassword: e.target.value}))} placeholder="••••••••" required />
            </div>
          </div>
          {formError && (
            <div className="equipo-card__form-error">
              <PiWarningBold size={13} /> {formError}
            </div>
          )}
          <div className="equipo-card__form-actions">
            <button type="button" className="btn btn--outline btn--sm" onClick={() => { setShowForm(false); setFormError(''); }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary btn--sm" disabled={creando}>
              {creando ? 'Creando...' : 'Crear miembro'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EquipoCard;
