import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PiEyeBold, PiEyeSlashBold } from 'react-icons/pi';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { ROUTES } from '../config/routes';
import AuthLayout from '../layouts/AuthLayout';
import PhoneInput from '../components/clientes/PhoneInput';
import './Register.scss';

const SOLO_LETRAS = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s-]+$/;

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
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const getFirebaseError = (code: string): string => {
    switch (code) {
      case 'auth/email-already-in-use': return t('auth.register.errors.emailInUse');
      case 'auth/invalid-email': return t('auth.register.errors.invalidEmail');
      case 'auth/weak-password': return t('auth.register.errors.weakPassword');
      case 'auth/network-request-failed': return t('auth.register.errors.networkError');
      case 'auth/too-many-requests': return t('auth.register.errors.tooManyRequests');
      default: return t('auth.register.errors.generic');
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!nombreNegocio.trim()) {
      newErrors.nombreNegocio = t('auth.register.errors.businessNameRequired');
    } else if (nombreNegocio.trim().length < 2) {
      newErrors.nombreNegocio = t('auth.register.businessNameShort');
    }

    if (!nombre.trim()) {
      newErrors.nombre = t('auth.register.errors.firstNameRequired');
    } else if (nombre.trim().length < 2) {
      newErrors.nombre = t('auth.register.firstNameShort');
    } else if (!SOLO_LETRAS.test(nombre.trim())) {
      newErrors.nombre = t('auth.register.firstNameLetters');
    }

    if (!apellido.trim()) {
      newErrors.apellido = t('auth.register.errors.lastNameRequired');
    } else if (apellido.trim().length < 2) {
      newErrors.apellido = t('auth.register.lastNameShort');
    } else if (!SOLO_LETRAS.test(apellido.trim())) {
      newErrors.apellido = t('auth.register.lastNameLetters');
    }

    if (!fechaNacimiento) {
      newErrors.fechaNacimiento = t('auth.register.errors.dobRequired');
    } else {
      const edad = getEdad(fechaNacimiento);
      if (edad < 18) {
        newErrors.fechaNacimiento = t('auth.register.dobAgeMin');
      } else if (edad > 100) {
        newErrors.fechaNacimiento = t('auth.register.dobAgeMax');
      }
    }

    if (!telefono.trim()) {
      newErrors.telefono = t('auth.register.errors.phoneRequired');
    } else if (telefono.length < 10) {
      newErrors.telefono = t('auth.register.phoneShort');
    } else if (esTelefonoFicticio(telefono)) {
      newErrors.telefono = t('auth.register.phoneFictitious');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = t('auth.register.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = t('auth.register.emailInvalid');
    }

    if (password.length < 8) {
      newErrors.password = t('auth.register.passwordShort');
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.register.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setErrors({});
      setStep(2);
    }
  };

  const handleBack = () => {
    setErrors({});
    setSubmitError('');
    setStep(1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateStep2()) return;

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
      showToast(t('auth.register.welcome', { businessName: nombreNegocio.trim() }), 'success');
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
    <AuthLayout showSubtitle={false} fullWidth>
      <div className="register-form">
        {/* Indicador de pasos */}
        <div className="register-form__steps">
          <div className={`register-form__step ${step === 1 ? 'register-form__step--active' : 'register-form__step--done'}`}>
            <span className="register-form__step-dot">1</span>
            <span className="register-form__step-label">{t('auth.register.step1')}</span>
          </div>
          <div className="register-form__step-line" />
          <div className={`register-form__step ${step === 2 ? 'register-form__step--active' : ''}`}>
            <span className="register-form__step-dot">2</span>
            <span className="register-form__step-label">{t('auth.register.step2')}</span>
          </div>
        </div>

        <div className="register-form__panels">
          {/* Paso 1 */}
          <form
            onSubmit={handleNext}
            className={step !== 1 ? 'register-form__panel--hidden' : ''}
            {...(step !== 1 ? { inert: true } : {})}
          >
            <div className="form-group">
              <label htmlFor="nombreNegocio">{t('auth.register.businessName')}</label>
              <input
                type="text"
                id="nombreNegocio"
                value={nombreNegocio}
                onChange={(e) => setNombreNegocio(e.target.value)}
                className={`input${errors.nombreNegocio ? ' input--error' : ''}`}
                placeholder={t('auth.register.businessNamePlaceholder')}
                maxLength={60}
              />
              {errors.nombreNegocio && <span className="register-form__field-error">{errors.nombreNegocio}</span>}
            </div>

            <div className="register-form__grid">
              <div className="form-group">
                <label htmlFor="nombre">{t('auth.register.firstName')}</label>
                <input
                  type="text"
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={`input${errors.nombre ? ' input--error' : ''}`}
                  placeholder={t('auth.register.firstNamePlaceholder')}
                  maxLength={40}
                />
                {errors.nombre && <span className="register-form__field-error">{errors.nombre}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="apellido">{t('auth.register.lastName')}</label>
                <input
                  type="text"
                  id="apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className={`input${errors.apellido ? ' input--error' : ''}`}
                  placeholder={t('auth.register.lastNamePlaceholder')}
                  maxLength={40}
                />
                {errors.apellido && <span className="register-form__field-error">{errors.apellido}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="fechaNacimiento">{t('auth.register.dob')}</label>
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

            <div className="form-group">
              <label htmlFor="telefono">{t('auth.register.phone')}</label>
              <PhoneInput
                id="telefono"
                value={telefono}
                codigoPais={telefonoCodigoPais}
                onChange={(numero, iso) => {
                  setTelefono(numero);
                  setTelefonoCodigoPais(iso);
                }}
                hasError={!!errors.telefono}
                placeholder={t('auth.register.phonePlaceholder')}
              />
              {errors.telefono && <span className="register-form__field-error">{errors.telefono}</span>}
            </div>

            <button type="submit" className="btn btn--primary btn--full">
              {t('auth.register.next')}
            </button>
          </form>

          {/* Paso 2 */}
          <form
            onSubmit={handleSubmit}
            className={step !== 2 ? 'register-form__panel--hidden' : ''}
            {...(step !== 2 ? { inert: true } : {})}
          >
            {submitError && <div className="register-form__error">{submitError}</div>}

            <div className="form-group">
              <label htmlFor="email">{t('auth.register.email')}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input${errors.email ? ' input--error' : ''}`}
                placeholder={t('auth.register.emailPlaceholder')}
                maxLength={100}
              />
              {errors.email && <span className="register-form__field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('auth.register.password')}</label>
              <div className="register-form__pwd-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input${errors.password ? ' input--error' : ''}`}
                  placeholder={t('auth.register.passwordPlaceholder')}
                  maxLength={32}
                />
                <button
                  type="button"
                  className="register-form__pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <PiEyeSlashBold size={16} /> : <PiEyeBold size={16} />}
                </button>
              </div>
              {errors.password && <span className="register-form__field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">{t('auth.register.confirmPassword')}</label>
              <div className="register-form__pwd-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`input${errors.confirmPassword ? ' input--error' : ''}`}
                  placeholder={t('auth.register.confirmPasswordPlaceholder')}
                  maxLength={32}
                />
                <button
                  type="button"
                  className="register-form__pwd-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <PiEyeSlashBold size={16} /> : <PiEyeBold size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="register-form__field-error">{errors.confirmPassword}</span>}
            </div>

            <div className="register-form__actions">
              <button type="button" className="register-form__back" onClick={handleBack}>
                {t('common.back')}
              </button>
              <button
                type="submit"
                className="btn btn--primary btn--full"
                disabled={loading}
              >
                {loading ? t('auth.register.submitting') : t('auth.register.submit')}
              </button>
            </div>
          </form>
        </div>

        {step === 1 && (
          <p className="register-form__link">
            {t('auth.register.alreadyHaveAccount')} <Link to={ROUTES.LOGIN}>{t('auth.register.signIn')}</Link>
          </p>
        )}
        {step === 2 && (
          <p className="register-form__legal">
            {t('auth.register.termsText')}{' '}
            <a href="/terminos" target="_blank" rel="noopener noreferrer">{t('auth.register.terms')}</a>
            {' '}{t('common.of').toLowerCase()}{' '}
            <a href="/privacidad" target="_blank" rel="noopener noreferrer">{t('auth.register.privacy')}</a>.
          </p>
        )}
      </div>
    </AuthLayout>
  );
};

export default Register;
