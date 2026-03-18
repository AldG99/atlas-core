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
  // Admin fields
  const [email, setEmail] = useState('');
  // Employee fields
  const [username, setUsername] = useState('');
  // Shared
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginEmpleado } = useAuth();
  const navigate = useNavigate();

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
          <p className="login-form__link">
            ¿No tienes cuenta? <Link to={ROUTES.REGISTER}>Regístrate</Link>
          </p>
        )}
      </form>
    </AuthLayout>
  );
};

export default Login;
