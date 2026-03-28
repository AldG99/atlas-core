import { Link } from 'react-router-dom';
import { PiArrowLeftBold, PiMagnifyingGlassBold } from 'react-icons/pi';
import { ROUTES } from '../config/routes';
import './NotFound.scss';

const NotFound = () => {
  return (
    <div className="not-found">
      <div className="not-found__content">
        <span className="not-found__code">404</span>
        <h1 className="not-found__title">Página no encontrada</h1>
        <p className="not-found__desc">
          La dirección que buscas no existe o fue movida.
        </p>
        <div className="not-found__actions">
          <Link to={ROUTES.DASHBOARD} className="btn btn--primary">
            <PiArrowLeftBold size={16} />
            Ir al inicio
          </Link>
          <Link to={ROUTES.SOPORTE} className="btn btn--outline">
            <PiMagnifyingGlassBold size={16} />
            Soporte
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
