import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiBellBold, PiCaretDownBold, PiUserBold, PiSignOutBold, PiCrownSimpleBold, PiWarningBold, PiInfoBold } from 'react-icons/pi';
import { useAuth } from '../../hooks/useAuth';
import { useNotificaciones, type Notificacion } from '../../hooks/useNotificaciones';
import { ROUTES } from '../../config/routes';
import './Header.scss';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notificaciones } = useNotificaciones();

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getWeekday = () => {
    return new Intl.DateTimeFormat('es-MX', { weekday: 'long' }).format(new Date());
  };

  const getDate = () => {
    const date = new Date();
    const day = date.getDate();
    const month = new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(date);
    const year = date.getFullYear();
    const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1).replace('.', '');
    return `${day} ${monthCapitalized}, ${year}`;
  };

  const handleNotificacionClick = (n: Notificacion) => {
    setShowNotifications(false);
    navigate(n.link, { state: n.filterState });
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
            {notificaciones.length > 0 && (
              <span className="header__notification-badge">{notificaciones.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className="header__dropdown header__dropdown--notifications">
              <div className="header__dropdown-header">
                <span>Notificaciones</span>
                {notificaciones.length > 0 && (
                  <span className="header__notification-count">{notificaciones.length}</span>
                )}
              </div>
              <div className="header__dropdown-content">
                {notificaciones.length === 0 ? (
                  <div className="header__notification-empty">
                    <p>Sin notificaciones</p>
                  </div>
                ) : (
                  notificaciones.map(n => (
                    <div
                      key={n.id}
                      className={`header__notification-item header__notification-item--${n.tipo}`}
                      onClick={() => handleNotificacionClick(n)}
                    >
                      <div className="header__notification-icon">
                        {n.tipo === 'warning'
                          ? <PiWarningBold size={16} />
                          : <PiInfoBold size={16} />
                        }
                      </div>
                      <div className="header__notification-text">
                        <p>{n.titulo}</p>
                        <span>{n.descripcion}</span>
                      </div>
                    </div>
                  ))
                )}
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
              <span className="header__profile-role">
                {user?.nombre && user?.apellido
                  ? `${user.nombre} ${user.apellido}`
                  : 'Administrador'}
              </span>
            </div>
            <PiCaretDownBold size={16} />
          </button>

          {showProfileMenu && (
            <div className="header__dropdown">
              <div className="header__dropdown-content">
                <button
                  className="header__dropdown-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate(ROUTES.PERFIL);
                  }}
                >
                  <PiUserBold size={18} />
                  <span>Mi perfil</span>
                </button>
                <button
                  className="header__dropdown-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate(ROUTES.PLANES);
                  }}
                >
                  <PiCrownSimpleBold size={18} />
                  <span>Plan {user?.plan === 'pro' ? 'Pro' : user?.plan === 'enterprise' ? 'Enterprise' : 'Gratuito'}</span>
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
    </header>
  );
};

export default Header;
