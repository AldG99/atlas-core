import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PiBellBold, PiCaretDownBold, PiUserBold, PiSignOutBold, PiCrownSimpleBold, PiWarningBold, PiInfoBold, PiShieldCheckBold } from 'react-icons/pi';
import { useAuth } from '../../hooks/useAuth';
import { useNotificaciones, type Notificacion } from '../../hooks/useNotificaciones';
import { ROUTES } from '../../config/routes';
import Avatar from './Avatar';
import './Header.scss';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, role } = useAuth();
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
    return new Intl.DateTimeFormat(i18n.language, { weekday: 'long' }).format(new Date());
  };

  const getDate = () => {
    const date = new Date();
    const day = date.getDate();
    const month = new Intl.DateTimeFormat(i18n.language, { month: 'short' }).format(date);
    const year = date.getFullYear();
    const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1).replace('.', '');
    return `${day} ${monthCapitalized}, ${year}`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProfileMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
            className="header__icon-btn header__icon-btn--notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={`${t('nav.notifications')}${notificaciones.length > 0 ? ` (${notificaciones.length})` : ''}`}
            aria-haspopup="true"
            aria-expanded={showNotifications}
          >
            <PiBellBold size={20} />
            {notificaciones.length > 0 && (
              <span className="header__notification-badge" aria-hidden="true">{notificaciones.length > 99 ? '99+' : notificaciones.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className="header__dropdown header__dropdown--notifications">
              <div className="header__dropdown-header">
                <span>{t('nav.notifications')}</span>
              </div>
              <div className="header__dropdown-content">
                {notificaciones.length === 0 ? (
                  <div className="header__notification-empty">
                    <p>{t('nav.noNotifications')}</p>
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
            aria-haspopup="true"
            aria-expanded={showProfileMenu}
            aria-label={`${t('nav.profile')} — ${user?.nombreNegocio ?? ''}`}
          >
            <div className="header__avatar">
              <Avatar
                src={user?.fotoPerfil}
                initials={getInitials(user?.nombreNegocio)}
                alt={user?.nombreNegocio}
              />
            </div>
            <div className="header__profile-info">
              <span className="header__profile-name">{user?.nombreNegocio}</span>
              <div className="header__profile-bottom">
                <span className="header__profile-role">
                  {user?.nombre && user?.apellido
                    ? `${user.nombre} ${user.apellido}`
                    : t('auth.login.adminTab')}
                </span>
                {role === 'miembro'
                  ? <PiUserBold size={11} color="#2368C4" />
                  : <PiShieldCheckBold size={11} color="#F8A800" />
                }
              </div>
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
                  <span>{t('nav.profile')}</span>
                </button>
                <button
                  className="header__dropdown-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate(ROUTES.PLANES);
                  }}
                >
                  <PiCrownSimpleBold size={18} />
                  <span>{t('nav.plan', { plan: user?.plan === 'pro' ? 'Pro' : user?.plan === 'enterprise' ? 'Enterprise' : t('plans.free') })}</span>
                </button>
                <div className="header__dropdown-divider"></div>
                <button className="header__dropdown-item header__dropdown-item--danger" onClick={handleLogout}>
                  <PiSignOutBold size={18} />
                  <span>{t('nav.logout')}</span>
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
