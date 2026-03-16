import { useNavigate } from 'react-router-dom';
import {
  PiCheckBold,
  PiXBold,
  PiDiamondBold,
  PiDiamondsFourBold,
  PiStorefrontBold,
  PiArrowLeftBold,
} from 'react-icons/pi';
import { useAuth } from '../hooks/useAuth';
import './Planes.scss';

const PLANES = [
  {
    id: 'gratuito',
    nombre: 'Gratuito',
    precio: null,
    descripcion: 'Para empezar a gestionar tu negocio sin costo.',
    icono: <PiStorefrontBold size={22} />,
    caracteristicas: [
      { texto: 'Hasta 180 pedidos al mes', incluido: true },
      { texto: 'Hasta 60 clientes', incluido: true },
      { texto: 'Hasta 40 productos', incluido: true },
      { texto: 'Hasta 6 etiquetas', incluido: true },
      { texto: 'Exportar CSV', incluido: true },
      { texto: 'Exportar e importar datos', incluido: false },
      { texto: 'Google Drive', incluido: false },
    ],
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: '$4',
    periodo: 'mes',
    descripcion: 'Para negocios en crecimiento que necesitan más capacidad.',
    icono: <PiDiamondBold size={22} />,
    destacado: true,
    caracteristicas: [
      { texto: 'Hasta 400 pedidos al mes', incluido: true },
      { texto: 'Hasta 140 clientes', incluido: true },
      { texto: 'Hasta 100 productos', incluido: true },
      { texto: 'Hasta 12 etiquetas', incluido: true },
      { texto: 'Exportar CSV', incluido: true },
      { texto: 'Exportar e importar datos', incluido: true },
      { texto: 'Google Drive', incluido: true },
    ],
  },
  {
    id: 'enterprise',
    nombre: 'Max',
    precio: '$7',
    periodo: 'mes',
    descripcion: 'Para equipos y negocios con operaciones de alto volumen.',
    icono: <PiDiamondsFourBold size={22} />,
    caracteristicas: [
      { texto: 'Pedidos ilimitados', incluido: true },
      { texto: 'Clientes ilimitados', incluido: true },
      { texto: 'Hasta 400 productos', incluido: true },
      { texto: 'Hasta 20 etiquetas', incluido: true },
      { texto: 'Exportar CSV', incluido: true },
      { texto: 'Exportar e importar datos', incluido: true },
      { texto: 'Google Drive', incluido: true },
    ],
  },
];

const Planes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const planActual = user?.plan ?? 'gratuito';

  return (
    <div className="planes-page">
      <div className="planes">
        <div className="planes__controls">
          <button className="planes__back-btn" onClick={() => navigate(-1)}>
            <PiArrowLeftBold size={20} />
          </button>
        </div>

        <div className="planes__header">
          <h1>Planes</h1>
          <p>Elige el plan que mejor se adapte a tu negocio.</p>
        </div>

        <div className="planes__grid">
          {PLANES.map(plan => {
            const esActual = planActual === plan.id;
            return (
              <div
                key={plan.id}
                className={`planes__card${plan.destacado ? ' planes__card--destacado' : ''}${esActual ? ' planes__card--actual' : ''}`}
              >
                {esActual && (
                  <div className="planes__badge planes__badge--actual">Plan actual</div>
                )}

                <div className="planes__card-header">
                  <div className="planes__card-icon">{plan.icono}</div>
                  <h2 className="planes__card-nombre">{plan.nombre}</h2>
                  <div className="planes__card-precio">
                    {plan.precio ? (
                      <>
                        <span className="planes__precio-monto">{plan.precio}</span>
                        <span className="planes__precio-periodo">USD / {plan.periodo}</span>
                      </>
                    ) : (
                      <span className="planes__precio-monto">Gratis</span>
                    )}
                  </div>
                  <p className="planes__card-desc">{plan.descripcion}</p>
                </div>

                <ul className="planes__features">
                  {plan.caracteristicas.map((c, i) => (
                    <li key={i} className={`planes__feature${c.incluido ? '' : ' planes__feature--no'}`}>
                      <span className="planes__feature-icon">
                        {c.incluido ? <PiCheckBold size={14} /> : <PiXBold size={14} />}
                      </span>
                      {c.texto}
                    </li>
                  ))}
                </ul>

                <div className="planes__card-footer">
                  {esActual ? (
                    <button className="btn btn--outline btn--sm planes__btn" disabled>
                      Plan actual
                    </button>
                  ) : (
                    <button className="btn btn--primary btn--sm planes__btn" disabled>
                      {plan.id === 'gratuito' ? 'Cambiar a Gratuito' : `Contratar ${plan.nombre}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Planes;
