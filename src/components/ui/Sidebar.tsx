import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { PiListBold, PiXBold, PiClipboardTextBold, PiUsersBold, PiPackageBold, PiChartBarBold, PiGearBold, PiLifebuoyBold } from 'react-icons/pi';
import { ROUTES } from '../../config/routes';
import './Sidebar.scss';

const Sidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={toggleMobile}>
        {isMobileOpen ? <PiXBold size={24} /> : <PiListBold size={24} />}
      </button>

      {isMobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

      <aside className={`sidebar ${isMobileOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__header">
          <img
            src="/logo-orderly.svg"
            alt="Orderly"
            className="sidebar__logo"
          />
        </div>

        <nav className="sidebar__nav">
          <NavLink
            to={ROUTES.DASHBOARD}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={closeMobile}
          >
            <span className="sidebar__link-icon"><PiClipboardTextBold size={20} /></span>
            <span className="sidebar__link-text">Pedidos</span>
          </NavLink>

          <NavLink
            to={ROUTES.CLIENTES}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={closeMobile}
          >
            <span className="sidebar__link-icon"><PiUsersBold size={20} /></span>
            <span className="sidebar__link-text">Clientes</span>
          </NavLink>

          <NavLink
            to={ROUTES.PRODUCTOS}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={closeMobile}
          >
            <span className="sidebar__link-icon"><PiPackageBold size={20} /></span>
            <span className="sidebar__link-text">Productos</span>
          </NavLink>

          <NavLink
            to={ROUTES.REPORTES}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={closeMobile}
          >
            <span className="sidebar__link-icon"><PiChartBarBold size={20} /></span>
            <span className="sidebar__link-text">Reportes</span>
          </NavLink>

        </nav>

        <div className="sidebar__footer">
          <NavLink
            to={ROUTES.CONFIGURACION}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={closeMobile}
          >
            <span className="sidebar__link-icon"><PiGearBold size={20} /></span>
            <span className="sidebar__link-text">Configuración</span>
          </NavLink>

          <NavLink
            to={ROUTES.SOPORTE}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={closeMobile}
          >
            <span className="sidebar__link-icon"><PiLifebuoyBold size={20} /></span>
            <span className="sidebar__link-text">Soporte</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
