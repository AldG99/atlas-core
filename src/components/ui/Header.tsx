import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ProfileModal from './ProfileModal';
import './Header.scss';

const IconBell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const IconChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const IconSettings = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const Header = () => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getWeekday = () => {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long'
    }).format(new Date());
  };

  const getDate = () => {
    const date = new Date();
    const day = date.getDate();
    const month = new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(date);
    const year = date.getFullYear();
    const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1).replace('.', '');
    return `${day} ${monthCapitalized}, ${year}`;
  };

  return (
    <header className="header">
      <div className="header__left">
        <div className="header__date-container">
          <span className="header__weekday">{getWeekday()}</span>
          <span className="header__date">{getDate()}</span>
        </div>
      </div>

      <div className="header__right">
        {/* Notifications */}
        <div className="header__notifications">
          <button
            className="header__icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <IconBell />
            <span className="header__notification-badge">3</span>
          </button>

          {showNotifications && (
            <div className="header__dropdown header__dropdown--notifications">
              <div className="header__dropdown-header">
                <span>Notificaciones</span>
              </div>
              <div className="header__dropdown-content">
                <div className="header__notification-item">
                  <div className="header__notification-dot"></div>
                  <div className="header__notification-text">
                    <p>Nuevo pedido recibido</p>
                    <span>Hace 5 minutos</span>
                  </div>
                </div>
                <div className="header__notification-item">
                  <div className="header__notification-dot"></div>
                  <div className="header__notification-text">
                    <p>Pedido #123 entregado</p>
                    <span>Hace 1 hora</span>
                  </div>
                </div>
                <div className="header__notification-item">
                  <div className="header__notification-dot"></div>
                  <div className="header__notification-text">
                    <p>Cliente frecuente agregado</p>
                    <span>Hace 2 horas</span>
                  </div>
                </div>
              </div>
              <div className="header__dropdown-footer">
                <button>Ver todas</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="header__profile">
          <button
            className="header__profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="header__avatar">
              {user?.fotoPerfil ? (
                <img src={user.fotoPerfil} alt={user.nombreNegocio} />
              ) : (
                getInitials(user?.nombreNegocio)
              )}
            </div>
            <div className="header__profile-info">
              <span className="header__profile-name">{user?.nombreNegocio}</span>
              <span className="header__profile-role">Administrador</span>
            </div>
            <IconChevronDown />
          </button>

          {showProfileMenu && (
            <div className="header__dropdown">
              <div className="header__dropdown-content">
                <button
                  className="header__dropdown-item"
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowProfileMenu(false);
                  }}
                >
                  <IconUser />
                  <span>Mi perfil</span>
                </button>
                <button className="header__dropdown-item">
                  <IconSettings />
                  <span>Configuración</span>
                </button>
                <div className="header__dropdown-divider"></div>
                <button className="header__dropdown-item header__dropdown-item--danger" onClick={handleLogout}>
                  <IconLogout />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close dropdowns */}
      {(showProfileMenu || showNotifications) && (
        <div
          className="header__overlay"
          onClick={() => {
            setShowProfileMenu(false);
            setShowNotifications(false);
          }}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </header>
  );
};

export default Header;
