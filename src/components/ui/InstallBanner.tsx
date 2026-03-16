import { PiDownloadSimpleBold, PiXBold } from 'react-icons/pi';
import { usePWA } from '../../hooks/usePWA';
import './InstallBanner.scss';

const InstallBanner = () => {
  const { canInstall, promptInstall } = usePWA();

  if (!canInstall) return null;

  return (
    <div className="install-banner">
      <div className="install-banner__content">
        <img src="/favicon.svg" alt="Orderly" className="install-banner__icon" />
        <div className="install-banner__text">
          <span className="install-banner__title">Instalar Orderly</span>
          <span className="install-banner__desc">Accede más rápido desde tu pantalla de inicio</span>
        </div>
      </div>
      <div className="install-banner__actions">
        <button
          className="install-banner__btn install-banner__btn--primary"
          onClick={promptInstall}
        >
          <PiDownloadSimpleBold size={15} />
          Instalar
        </button>
        <button
          className="install-banner__btn install-banner__btn--dismiss"
          onClick={() => {/* el banner desaparece al instalar o al navegar */}}
          aria-label="Cerrar"
        >
          <PiXBold size={14} />
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;
