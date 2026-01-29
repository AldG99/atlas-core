import { PiGearBold } from 'react-icons/pi';
import MainLayout from '../layouts/MainLayout';
import './Configuracion.scss';

const Configuracion = () => {
  return (
    <MainLayout>
      <div className="configuracion">
        <div className="configuracion__icon">
          <PiGearBold size={64} />
        </div>
        <h1 className="configuracion__title">Configuración</h1>
        <p className="configuracion__description">
          Esta sección estará disponible próximamente.
        </p>
      </div>
    </MainLayout>
  );
};

export default Configuracion;
