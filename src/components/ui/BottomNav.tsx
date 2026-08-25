import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  Users,
  Warehouse,
  ChartBar,
  List,
} from 'lucide-react';
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
        <ClipboardList size={22} />
        <span>{t('nav.orders')}</span>
      </NavLink>

      <NavLink
        to={ROUTES.CLIENTS}
        className={({ isActive }) =>
          `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
        }
      >
        <Users size={22} />
        <span>{t('nav.clients')}</span>
      </NavLink>

      <NavLink
        to={ROUTES.INVENTORY}
        className={({ isActive }) =>
          `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
        }
      >
        <Warehouse size={22} />
        <span>{t('nav.inventory')}</span>
      </NavLink>

      <NavLink
        to={ROUTES.REPORTS}
        className={({ isActive }) =>
          `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
        }
      >
        <ChartBar size={22} />
        <span>{t('nav.reports')}</span>
      </NavLink>

      <button
        className="bottom-nav__item bottom-nav__item--menu"
        onClick={onOpenMenu}
        aria-label={t('nav.openMenu')}
      >
        <List size={22} />
        <span>{t('nav.menu')}</span>
      </button>
    </nav>
  );
};

export default BottomNav;
