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
          <img
            src="/logo-orderly.svg"
            alt="Orderly"
            className="auth-layout__logo"
          />
          <p className="auth-layout__subtitle">Gestión de pedidos simplificada</p>
        </div>
        <div className="auth-layout__content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
