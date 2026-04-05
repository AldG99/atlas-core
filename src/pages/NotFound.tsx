import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PiArrowLeftBold, PiMagnifyingGlassBold } from 'react-icons/pi';
import { ROUTES } from '../config/routes';
import './NotFound.scss';

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div className="not-found">
      <div className="not-found__content">
        <span className="not-found__code">{t('notFound.code')}</span>
        <h1 className="not-found__title">{t('notFound.title')}</h1>
        <p className="not-found__desc">{t('notFound.description')}</p>
        <div className="not-found__actions">
          <Link to={ROUTES.DASHBOARD} className="btn btn--primary">
            <PiArrowLeftBold size={16} />
            {t('notFound.home')}
          </Link>
          <Link to={ROUTES.SOPORTE} className="btn btn--outline">
            <PiMagnifyingGlassBold size={16} />
            {t('notFound.support')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
