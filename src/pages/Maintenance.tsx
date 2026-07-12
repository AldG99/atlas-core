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
          <h1 className="maintenance__title">Maintenance in progress</h1>
          <p className="maintenance__desc">
            We are optimizing the system to improve performance{' '}
            and reinforcing the infrastructure to ensure greater stability.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
