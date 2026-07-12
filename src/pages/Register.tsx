import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PiEyeBold, PiEyeSlashBold } from 'react-icons/pi';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { ROUTES } from '../config/routes';
import AuthLayout from '../layouts/AuthLayout';
import PhoneInput from '../components/clients/PhoneInput';
import './Register.scss';

const LETTERS_ONLY = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s-]+$/;

const isFakePhone = (phone: string): boolean => {
  if (/^(\d)\1+$/.test(phone)) return true;
  let isAscending = true;
  let isDescending = true;
  for (let i = 1; i < phone.length; i++) {
    if (parseInt(phone[i]) - parseInt(phone[i - 1]) !== 1) isAscending = false;
    if (parseInt(phone[i - 1]) - parseInt(phone[i]) !== 1) isDescending = false;
  }
  return isAscending || isDescending;
};

const getAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

interface FormErrors {
  businessName?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const Register = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [businessName, setBusinessName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('MX');
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

    if (!businessName.trim()) {
      newErrors.businessName = t('auth.register.errors.businessNameRequired');
    } else if (businessName.trim().length < 2) {
      newErrors.businessName = t('auth.register.businessNameShort');
    }

    if (!firstName.trim()) {
      newErrors.firstName = t('auth.register.errors.firstNameRequired');
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = t('auth.register.firstNameShort');
    } else if (!LETTERS_ONLY.test(firstName.trim())) {
      newErrors.firstName = t('auth.register.firstNameLetters');
    }

    if (!lastName.trim()) {
      newErrors.lastName = t('auth.register.errors.lastNameRequired');
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = t('auth.register.lastNameShort');
    } else if (!LETTERS_ONLY.test(lastName.trim())) {
      newErrors.lastName = t('auth.register.lastNameLetters');
    }

    if (!birthDate) {
      newErrors.birthDate = t('auth.register.errors.dobRequired');
    } else {
      const age = getAge(birthDate);
      if (age < 18) {
        newErrors.birthDate = t('auth.register.dobAgeMin');
      } else if (age > 100) {
        newErrors.birthDate = t('auth.register.dobAgeMax');
      }
    }

    if (!phone.trim()) {
      newErrors.phone = t('auth.register.errors.phoneRequired');
    } else if (phone.length < 10) {
      newErrors.phone = t('auth.register.phoneShort');
    } else if (isFakePhone(phone)) {
      newErrors.phone = t('auth.register.phoneFictitious');
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
        businessName: businessName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate,
        phone,
        phoneCountryCode,
      });
      showToast(t('auth.register.welcome', { businessName: businessName.trim() }), 'success');
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      setSubmitError(getFirebaseError(code));
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);
  const minDateStr = minDate.toISOString().split('T')[0];

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
              <label htmlFor="businessName">{t('auth.register.businessName')}</label>
              <input
                type="text"
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={`input${errors.businessName ? ' input--error' : ''}`}
                placeholder={t('auth.register.businessNamePlaceholder')}
                maxLength={60}
              />
              {errors.businessName && <span className="register-form__field-error">{errors.businessName}</span>}
            </div>

            <div className="register-form__grid">
              <div className="form-group">
                <label htmlFor="firstName">{t('auth.register.firstName')}</label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`input${errors.firstName ? ' input--error' : ''}`}
                  placeholder={t('auth.register.firstNamePlaceholder')}
                  maxLength={40}
                />
                {errors.firstName && <span className="register-form__field-error">{errors.firstName}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="lastName">{t('auth.register.lastName')}</label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`input${errors.lastName ? ' input--error' : ''}`}
                  placeholder={t('auth.register.lastNamePlaceholder')}
                  maxLength={40}
                />
                {errors.lastName && <span className="register-form__field-error">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="birthDate">{t('auth.register.dob')}</label>
              <input
                type="date"
                id="birthDate"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={`input${errors.birthDate ? ' input--error' : ''}`}
                max={today}
                min={minDateStr}
              />
              {errors.birthDate && <span className="register-form__field-error">{errors.birthDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">{t('auth.register.phone')}</label>
              <PhoneInput
                id="phone"
                value={phone}
                countryCode={phoneCountryCode}
                onChange={(number, iso) => {
                  setPhone(number);
                  setPhoneCountryCode(iso);
                }}
                hasError={!!errors.phone}
                placeholder={t('auth.register.phonePlaceholder')}
              />
              {errors.phone && <span className="register-form__field-error">{errors.phone}</span>}
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
            <a href={ROUTES.TERMS} target="_blank" rel="noopener noreferrer">{t('auth.register.terms')}</a>
            {' '}{t('common.of').toLowerCase()}{' '}
            <a href={ROUTES.PRIVACY} target="_blank" rel="noopener noreferrer">{t('auth.register.privacy')}</a>.
          </p>
        )}
      </div>
    </AuthLayout>
  );
};

export default Register;
