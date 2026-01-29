import { useState } from 'react';
import { PiBellBold, PiCaretDownBold, PiUserBold, PiGearBold, PiSignOutBold } from 'react-icons/pi';
import { useAuth } from '../../hooks/useAuth';
import ProfileModal from './ProfileModal';
import './Header.scss';

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
            <PiBellBold size={20} />
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
            <PiCaretDownBold size={16} />
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
                  <PiUserBold size={18} />
                  <span>Mi perfil</span>
                </button>
                <button className="header__dropdown-item">
                  <PiGearBold size={18} />
                  <span>Configuración</span>
                </button>
                <div className="header__dropdown-divider"></div>
                <button className="header__dropdown-item header__dropdown-item--danger" onClick={handleLogout}>
                  <PiSignOutBold size={18} />
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
