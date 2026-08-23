import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { List, X, ClipboardList, Users, Package, ChartBar, Archive, LifeBuoy, Settings2 } from 'lucide-react';
import { ROUTES } from '../../config/routes';
import './Sidebar.scss';

interface SidebarProps {
  isMobileOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const Sidebar = ({ isMobileOpen, onToggle, onClose }: SidebarProps) => {
  const { t } = useTranslation();

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label={isMobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
        aria-expanded={isMobileOpen}
        aria-controls="sidebar"
      >
        {isMobileOpen ? <X size={24} /> : <List size={24} />}
      </button>

      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />
      )}

      <aside id="sidebar" className={`sidebar ${isMobileOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__header">
          <img
            src="/logo-skytla.svg"
            alt="Skytla"
            className="sidebar__logo"
            draggable={false}
            onContextMenu={e => e.preventDefault()}
          />
        </div>

        <nav className="sidebar__nav">
          <NavLink
            to={ROUTES.DASHBOARD}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar__link-icon"><ClipboardList size={22} /></span>
            <span className="sidebar__link-text">{t('nav.orders')}</span>
          </NavLink>

          <NavLink
            to={ROUTES.CLIENTS}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar__link-icon"><Users size={22} /></span>
            <span className="sidebar__link-text">{t('nav.clients')}</span>
          </NavLink>

          <NavLink
            to={ROUTES.PRODUCTS}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar__link-icon"><Package size={22} /></span>
            <span className="sidebar__link-text">{t('nav.products')}</span>
          </NavLink>

          <NavLink
            to={ROUTES.REPORTS}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar__link-icon"><ChartBar size={22} /></span>
            <span className="sidebar__link-text">{t('nav.reports')}</span>
          </NavLink>

          <NavLink
            to={ROUTES.ARCHIVE}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar__link-icon"><Archive size={22} /></span>
            <span className="sidebar__link-text">{t('nav.archived')}</span>
          </NavLink>

        </nav>

        <div className="sidebar__footer">
          <NavLink
            to={ROUTES.SETTINGS}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar__link-icon"><Settings2 size={22} /></span>
            <span className="sidebar__link-text">{t('nav.settings')}</span>
          </NavLink>

          <NavLink
            to={ROUTES.SUPPORT}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar__link-icon"><LifeBuoy size={22} /></span>
            <span className="sidebar__link-text">{t('nav.support')}</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
