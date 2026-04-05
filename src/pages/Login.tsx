import type { FormEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../config/routes';
import AuthLayout from '../layouts/AuthLayout';
import './Login.scss';

type LoginMode = 'admin' | 'miembro';

const Login = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<LoginMode>('admin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recuperación de contraseña
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const { login, loginMiembro, sendPasswordReset } = useAuth();
  const navigate = useNavigate();

  // Live countdown when account is temporarily locked
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setLockCountdown(0);
        setError('');
        if (countdownRef.current) clearInterval(countdownRef.current);
      } else {
        setLockCountdown(remaining);
      }
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [lockedUntil]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      await sendPasswordReset(resetEmail);
      setResetSent(true);
    } catch {
      setResetError(t('auth.login.resetSentError'));
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (lockedUntil && Date.now() < lockedUntil.getTime()) {
      setError(t('auth.login.tooManyAttempts', { seconds: lockCountdown }));
      return;
    }

    setError('');
    setLoading(true);
    try {
      if (mode === 'admin') {
        await login({ email, password });
      } else {
        await loginMiembro(username, password);
      }
      setFailedAttempts(0);
      setLockedUntil(null);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        const until = new Date(Date.now() + 5 * 60 * 1000);
        setLockedUntil(until);
        setError(t('auth.login.tooManyAttemptsLong'));
      } else if (newAttempts >= 3) {
        const until = new Date(Date.now() + 30 * 1000);
        setLockedUntil(until);
        setError(t('auth.login.tooManyAttempts', { seconds: 30 }));
      } else {
        setError(err instanceof Error ? err.message : t('auth.login.invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (showReset) {
    return (
      <AuthLayout>
        <form onSubmit={handleReset} className="login-form">
          <h2>{t('auth.login.forgotPasswordTitle')}</h2>
          <p className="login-form__subtitle">
            {t('auth.login.forgotPasswordSubtitle')}
          </p>

          {resetSent ? (
            <div className="login-form__success">
              {t('auth.login.resetSentSuccess')}
            </div>
          ) : (
            <>
              {resetError && <div className="login-form__error">{resetError}</div>}
              <div className="form-group">
                <label htmlFor="resetEmail">{t('auth.login.email')}</label>
                <input
                  type="email"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="input"
                  placeholder={t('auth.login.emailPlaceholder')}
                  required
                />
              </div>
              <button type="submit" className="btn btn--primary btn--full" disabled={resetLoading}>
                {resetLoading ? t('auth.login.sending') : t('auth.login.sendLink')}
              </button>
            </>
          )}

          <p className="login-form__link">
            <button type="button" className="login-form__link-btn" onClick={() => { setShowReset(false); setResetSent(false); setResetError(''); }}>
              {t('auth.login.backToLogin')}
            </button>
          </p>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="login-form">
        <h2>{t('auth.login.title')}</h2>

        {/* Mode toggle */}
        <div className="login-form__tabs">
          <button
            type="button"
            className={`login-form__tab${mode === 'admin' ? ' login-form__tab--active' : ''}`}
            onClick={() => { setMode('admin'); setError(''); setFailedAttempts(0); setLockedUntil(null); }}
          >
            {t('auth.login.adminTab')}
          </button>
          <button
            type="button"
            className={`login-form__tab${mode === 'miembro' ? ' login-form__tab--active' : ''}`}
            onClick={() => { setMode('miembro'); setError(''); setFailedAttempts(0); setLockedUntil(null); }}
          >
            {t('auth.login.memberTab')}
          </button>
        </div>

        {error && <div className="login-form__error">{error}</div>}

        {mode === 'admin' ? (
          <div className="form-group">
            <label htmlFor="email">{t('auth.login.email')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              placeholder={t('auth.login.emailPlaceholder')}
              required
            />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="username">{t('auth.login.username')}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="input"
              placeholder="AL0898-0126-4723"
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="password">{t('auth.login.password')}</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input"
            placeholder={t('auth.login.passwordPlaceholder')}
            required
          />
        </div>

        <button type="submit" className="btn btn--primary btn--full" disabled={loading || (lockedUntil !== null && Date.now() < lockedUntil.getTime())}>
          {loading ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>

        {mode === 'admin' && (
          <>
            <p className="login-form__link">
              {t('auth.login.noAccount')} <Link to={ROUTES.REGISTER}>{t('auth.login.register')}</Link>
            </p>
            <p className="login-form__link">
              <button type="button" className="login-form__link-btn" onClick={() => { setShowReset(true); setResetEmail(email); }}>
                {t('auth.login.forgotPassword')}
              </button>
            </p>
          </>
        )}
      </form>
    </AuthLayout>
  );
};

export default Login;
