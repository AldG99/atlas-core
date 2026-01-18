import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../config/routes';
import './MainLayout.scss';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="main-layout">
      <header className="main-layout__header">
        <div className="container">
          <div className="main-layout__header-content">
            <Link to={ROUTES.DASHBOARD} className="main-layout__logo">
              Gestor de Pedidos
            </Link>
            <nav className="main-layout__nav">
              <span className="main-layout__user">{user?.nombreNegocio}</span>
              <button onClick={handleLogout} className="btn btn--secondary">
                Cerrar sesión
              </button>
            </nav>
          </div>
        </div>
      </header>
      <main className="main-layout__content">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
