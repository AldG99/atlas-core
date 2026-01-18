import type { ReactNode } from 'react';
import './AuthLayout.scss';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="auth-layout">
      <div className="auth-layout__container">
        <div className="auth-layout__header">
          <h1 className="auth-layout__title">Gestor de Pedidos</h1>
          <p className="auth-layout__subtitle">WhatsApp / Instagram</p>
        </div>
        <div className="auth-layout__content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
