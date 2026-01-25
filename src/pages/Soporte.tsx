import MainLayout from '../layouts/MainLayout';
import './Soporte.scss';

const IconHelp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const Soporte = () => {
  return (
    <MainLayout>
      <div className="soporte">
        <div className="soporte__icon">
          <IconHelp />
        </div>
        <h1 className="soporte__title">Soporte</h1>
        <p className="soporte__description">
          Esta sección estará disponible próximamente.
        </p>
      </div>
    </MainLayout>
  );
};

export default Soporte;
