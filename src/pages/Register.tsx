import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { ROUTES } from '../config/routes';
import AuthLayout from '../layouts/AuthLayout';
import PhoneInput from '../components/clientes/PhoneInput';
import './Register.scss';

const SOLO_LETRAS = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s\-]+$/;

const esTelefonoFicticio = (tel: string): boolean => {
  if (/^(\d)\1+$/.test(tel)) return true;
  let esAscendente = true;
  let esDescendente = true;
  for (let i = 1; i < tel.length; i++) {
    if (parseInt(tel[i]) - parseInt(tel[i - 1]) !== 1) esAscendente = false;
    if (parseInt(tel[i - 1]) - parseInt(tel[i]) !== 1) esDescendente = false;
  }
  return esAscendente || esDescendente;
};

const getEdad = (fechaNacimiento: string): number => {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
};

const getFirebaseError = (code: string): string => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este correo ya está registrado. ¿Quieres iniciar sesión?';
    case 'auth/invalid-email':
      return 'El correo electrónico no es válido.';
    case 'auth/weak-password':
      return 'La contraseña es muy débil. Usa al menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Sin conexión a internet. Revisa tu red e intenta de nuevo.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento e intenta de nuevo.';
    default:
      return 'Error al crear la cuenta. Intenta de nuevo.';
  }
};

interface FormErrors {
  nombreNegocio?: string;
  nombre?: string;
  apellido?: string;
  fechaNacimiento?: string;
  telefono?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const Register = () => {
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [telefonoCodigoPais, setTelefonoCodigoPais] = useState('MX');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Nombre del negocio
    if (!nombreNegocio.trim()) {
      newErrors.nombreNegocio = 'El nombre del negocio es requerido';
    } else if (nombreNegocio.trim().length < 2) {
      newErrors.nombreNegocio = 'Debe tener al menos 2 caracteres';
    }

    // Nombre
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (nombre.trim().length < 2) {
      newErrors.nombre = 'Debe tener al menos 2 caracteres';
    } else if (!SOLO_LETRAS.test(nombre.trim())) {
      newErrors.nombre = 'Solo puede contener letras';
    }

    // Apellido
    if (!apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    } else if (apellido.trim().length < 2) {
      newErrors.apellido = 'Debe tener al menos 2 caracteres';
    } else if (!SOLO_LETRAS.test(apellido.trim())) {
      newErrors.apellido = 'Solo puede contener letras';
    }

    // Fecha de nacimiento
    if (!fechaNacimiento) {
      newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida';
    } else {
      const edad = getEdad(fechaNacimiento);
      if (edad < 18) {
        newErrors.fechaNacimiento = 'Debes tener al menos 18 años';
      } else if (edad > 100) {
        newErrors.fechaNacimiento = 'Ingresa una fecha válida';
      }
    }

    // Teléfono
    if (!telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (telefono.length < 10) {
      newErrors.telefono = 'Debe tener 10 dígitos';
    } else if (esTelefonoFicticio(telefono)) {
      newErrors.telefono = 'Ingresa un número de teléfono válido';
    }

    // Contraseña
    if (password.length < 6) {
      newErrors.password = 'Debe tener al menos 6 caracteres';
    }

    // Confirmar contraseña
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        email,
        password,
        nombreNegocio: nombreNegocio.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        fechaNacimiento,
        telefono,
        telefonoCodigoPais,
      });
      showToast(`¡Bienvenido a Orderly, ${nombreNegocio.trim()}!`, 'success');
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      setSubmitError(getFirebaseError(code));
    } finally {
      setLoading(false);
    }
  };

  const hoy = new Date().toISOString().split('T')[0];
  const minFecha = new Date();
  minFecha.setFullYear(minFecha.getFullYear() - 100);
  const minFechaStr = minFecha.toISOString().split('T')[0];

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="register-form">
        <h2>Crear cuenta</h2>

        {submitError && <div className="register-form__error">{submitError}</div>}

        {/* Nombre del negocio */}
        <div className="form-group">
          <label htmlFor="nombreNegocio">Nombre del negocio *</label>
          <input
            type="text"
            id="nombreNegocio"
            value={nombreNegocio}
            onChange={(e) => setNombreNegocio(e.target.value)}
            className={`input${errors.nombreNegocio ? ' input--error' : ''}`}
            placeholder="Mi Negocio"
          />
          {errors.nombreNegocio && <span className="register-form__field-error">{errors.nombreNegocio}</span>}
        </div>

        {/* Nombre y Apellido */}
        <div className="register-form__grid">
          <div className="form-group">
            <label htmlFor="nombre">Nombre *</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={`input${errors.nombre ? ' input--error' : ''}`}
              placeholder="Nombre"
            />
            {errors.nombre && <span className="register-form__field-error">{errors.nombre}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="apellido">Apellido *</label>
            <input
              type="text"
              id="apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className={`input${errors.apellido ? ' input--error' : ''}`}
              placeholder="Apellido"
            />
            {errors.apellido && <span className="register-form__field-error">{errors.apellido}</span>}
          </div>
        </div>

        {/* Fecha de nacimiento */}
        <div className="form-group">
          <label htmlFor="fechaNacimiento">Fecha de nacimiento *</label>
          <input
            type="date"
            id="fechaNacimiento"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            className={`input${errors.fechaNacimiento ? ' input--error' : ''}`}
            max={hoy}
            min={minFechaStr}
          />
          {errors.fechaNacimiento && <span className="register-form__field-error">{errors.fechaNacimiento}</span>}
        </div>

        {/* Teléfono */}
        <div className="form-group">
          <label htmlFor="telefono">Número de celular *</label>
          <PhoneInput
            id="telefono"
            value={telefono}
            codigoPais={telefonoCodigoPais}
            onChange={(numero, iso) => {
              setTelefono(numero);
              setTelefonoCodigoPais(iso);
            }}
            hasError={!!errors.telefono}
            placeholder="Número de celular"
          />
          {errors.telefono && <span className="register-form__field-error">{errors.telefono}</span>}
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email">Correo electrónico *</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`input${errors.email ? ' input--error' : ''}`}
            placeholder="tu@correo.com"
          />
          {errors.email && <span className="register-form__field-error">{errors.email}</span>}
        </div>

        {/* Contraseña */}
        <div className="register-form__grid">
          <div className="form-group">
            <label htmlFor="password">Contraseña *</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`input${errors.password ? ' input--error' : ''}`}
              placeholder="Mínimo 6 caracteres"
            />
            {errors.password && <span className="register-form__field-error">{errors.password}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña *</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`input${errors.confirmPassword ? ' input--error' : ''}`}
              placeholder="Repite tu contraseña"
            />
            {errors.confirmPassword && <span className="register-form__field-error">{errors.confirmPassword}</span>}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--full"
          disabled={loading}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p className="register-form__link">
          ¿Ya tienes cuenta? <Link to={ROUTES.LOGIN}>Inicia sesión</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
