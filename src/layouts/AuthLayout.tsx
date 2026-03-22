import type { ReactNode } from 'react';
import './AuthLayout.scss';

interface AuthLayoutProps {
  children: ReactNode;
  showSubtitle?: boolean;
}

const AuthLayout = ({ children, showSubtitle = true }: AuthLayoutProps) => {
  return (
    <div className="auth-layout">
      <div className="auth-layout__container">
        <div className="auth-layout__header">
          <img
            src="/logo-orderly.svg"
            alt="Orderly"
            className="auth-layout__logo"
          />
          {showSubtitle && (
            <p className="auth-layout__subtitle">
              Diseñado para gestionar tus pedidos. Construido para escalar tu
              negocio.
            </p>
          )}
          <span className="auth-layout__beta">Versión Beta</span>
        </div>
        <div className="auth-layout__content">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
