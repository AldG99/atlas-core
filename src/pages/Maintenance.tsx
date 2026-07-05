import { PiWrenchBold } from 'react-icons/pi';
import './Maintenance.scss';

const Maintenance = () => {
  return (
    <div className="maintenance">
      <img src="/logo-skytla.svg" alt="Skytla" className="maintenance__logo" draggable={false} />
      <div className="maintenance__center">
        <div className="maintenance__content">
          <div className="maintenance__icon">
            <PiWrenchBold size={40} />
          </div>
          <h1 className="maintenance__title">Mantenimiento en progreso</h1>
          <p className="maintenance__desc">
            Estamos optimizando el sistema para mejorar el rendimiento{' '}
            y reforzando la infraestructura para garantizar mayor estabilidad.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
