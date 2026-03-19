import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../config/routes';
import AuthLayout from '../layouts/AuthLayout';
import './Login.scss';

type LoginMode = 'admin' | 'empleado';

const Login = () => {
  const [mode, setMode] = useState<LoginMode>('admin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Recuperación de contraseña
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const { login, loginEmpleado, sendPasswordReset } = useAuth();
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      await sendPasswordReset(resetEmail);
      setResetSent(true);
    } catch {
      setResetError('No se pudo enviar el correo. Verifica que el correo sea correcto.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'admin') {
        await login({ email, password });
      } else {
        await loginEmpleado(username, password);
      }
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  if (showReset) {
    return (
      <AuthLayout>
        <form onSubmit={handleReset} className="login-form">
          <h2>Recuperar contraseña</h2>
          <p className="login-form__subtitle">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          {resetSent ? (
            <div className="login-form__success">
              Correo enviado. Revisa tu bandeja de entrada.
            </div>
          ) : (
            <>
              {resetError && <div className="login-form__error">{resetError}</div>}
              <div className="form-group">
                <label htmlFor="resetEmail">Correo electrónico</label>
                <input
                  type="email"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="input"
                  placeholder="tu@correo.com"
                  required
                />
              </div>
              <button type="submit" className="btn btn--primary btn--full" disabled={resetLoading}>
                {resetLoading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </>
          )}

          <p className="login-form__link">
            <button type="button" className="login-form__link-btn" onClick={() => { setShowReset(false); setResetSent(false); setResetError(''); }}>
              Volver al inicio de sesión
            </button>
          </p>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Iniciar sesión</h2>

        {/* Mode toggle */}
        <div className="login-form__tabs">
          <button
            type="button"
            className={`login-form__tab${mode === 'admin' ? ' login-form__tab--active' : ''}`}
            onClick={() => { setMode('admin'); setError(''); }}
          >
            Administrador
          </button>
          <button
            type="button"
            className={`login-form__tab${mode === 'empleado' ? ' login-form__tab--active' : ''}`}
            onClick={() => { setMode('empleado'); setError(''); }}
          >
            Miembro
          </button>
        </div>

        {error && <div className="login-form__error">{error}</div>}

        {mode === 'admin' ? (
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              placeholder="tu@correo.com"
              required
            />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
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
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        {mode === 'admin' && (
          <>
            <p className="login-form__link">
              ¿No tienes cuenta? <Link to={ROUTES.REGISTER}>Regístrate</Link>
            </p>
            <p className="login-form__link">
              <button type="button" className="login-form__link-btn" onClick={() => { setShowReset(true); setResetEmail(email); }}>
                ¿Olvidaste tu contraseña?
              </button>
            </p>
          </>
        )}
      </form>
    </AuthLayout>
  );
};

export default Login;
