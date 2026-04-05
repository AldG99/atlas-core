import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PiClipboardTextBold,
  PiUsersBold,
  PiPackageBold,
  PiChartBarBold,
  PiListBold,
} from 'react-icons/pi';
import { ROUTES } from '../../config/routes';
import './BottomNav.scss';

interface BottomNavProps {
  onOpenMenu: () => void;
}

const BottomNav = ({ onOpenMenu }: BottomNavProps) => {
  const { t } = useTranslation();

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      <NavLink
        to={ROUTES.DASHBOARD}
        className={({ isActive }) =>
          `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
        }
      >
        <PiClipboardTextBold size={22} />
        <span>{t('nav.orders')}</span>
      </NavLink>

      <NavLink
        to={ROUTES.CLIENTES}
        className={({ isActive }) =>
          `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
        }
      >
        <PiUsersBold size={22} />
        <span>{t('nav.clients')}</span>
      </NavLink>

      <NavLink
        to={ROUTES.PRODUCTOS}
        className={({ isActive }) =>
          `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
        }
      >
        <PiPackageBold size={22} />
        <span>{t('nav.products')}</span>
      </NavLink>

      <NavLink
        to={ROUTES.REPORTES}
        className={({ isActive }) =>
          `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
        }
      >
        <PiChartBarBold size={22} />
        <span>{t('nav.reports')}</span>
      </NavLink>

      <button
        className="bottom-nav__item bottom-nav__item--menu"
        onClick={onOpenMenu}
        aria-label={t('nav.openMenu')}
      >
        <PiListBold size={22} />
        <span>{t('nav.menu')}</span>
      </button>
    </nav>
  );
};

export default BottomNav;
