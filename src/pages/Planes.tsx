import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PiCheckBold,
  PiXBold,
  PiDiamondBold,
  PiDiamondsFourBold,
  PiStorefrontBold,
  PiArrowLeftBold,
  PiGearBold,
  PiSpinnerBold,
} from 'react-icons/pi';
import { useAuth } from '../hooks/useAuth';
import { useSubscripcion } from '../hooks/useSubscripcion';
import { useToast } from '../hooks/useToast';
import { STRIPE_PRICES } from '../services/stripeService';
import './Planes.scss';

const PLANES = [
  {
    id: 'gratuito',
    nombre: 'Gratuito',
    precio: null,
    stripePrice: null,
    descripcion: 'Para empezar a gestionar tu negocio sin costo.',
    icono: <PiStorefrontBold size={22} />,
    caracteristicas: [
      { texto: 'Hasta 360 pedidos al mes', incluido: true },
      { texto: 'Hasta 120 clientes', incluido: true },
      { texto: 'Hasta 80 productos', incluido: true },
      { texto: 'Hasta 6 etiquetas', incluido: true },
      { texto: 'Exportar CSV', incluido: true },
      { texto: 'Exportar e importar datos', incluido: false },
      { texto: 'Miembros del equipo', incluido: false },
    ],
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: '$4',
    periodo: 'mes',
    stripePrice: STRIPE_PRICES.pro,
    descripcion: 'Para negocios en crecimiento que necesitan más capacidad.',
    icono: <PiDiamondBold size={22} />,
    destacado: true,
    caracteristicas: [
      { texto: 'Hasta 720 pedidos al mes', incluido: true },
      { texto: 'Hasta 240 clientes', incluido: true },
      { texto: 'Hasta 160 productos', incluido: true },
      { texto: 'Hasta 10 etiquetas', incluido: true },
      { texto: 'Exportar CSV', incluido: true },
      { texto: 'Exportar e importar datos', incluido: true },
      { texto: 'Hasta 2 miembros en tu negocio', incluido: true },
    ],
  },
  {
    id: 'enterprise',
    nombre: 'Business',
    precio: '$6',
    periodo: 'mes',
    stripePrice: STRIPE_PRICES.enterprise,
    descripcion: 'Para equipos y negocios con operaciones de alto volumen.',
    icono: <PiDiamondsFourBold size={22} />,
    caracteristicas: [
      { texto: 'Pedidos ilimitados', incluido: true },
      { texto: 'Clientes ilimitados', incluido: true },
      { texto: 'Hasta 640 productos', incluido: true },
      { texto: 'Hasta 16 etiquetas', incluido: true },
      { texto: 'Exportar CSV', incluido: true },
      { texto: 'Exportar e importar datos', incluido: true },
      { texto: 'Hasta 6 miembros en tu negocio', incluido: true },
    ],
  },
];

const Planes = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { subscribe, manage, loading } = useSubscripcion();
  const { showToast } = useToast();

  const planActual = user?.plan ?? 'gratuito';
  const tienePlanPago = planActual !== 'gratuito';

  // Resultado de vuelta desde Stripe Checkout
  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (!checkout) return;

    if (checkout === 'success') {
      showToast(t('plans.checkoutSuccess'), 'success');
    } else if (checkout === 'canceled') {
      showToast(t('plans.checkoutCanceled'), 'warning');
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, showToast, t]);

  const handlePlanAction = (plan: (typeof PLANES)[number]) => {
    if (plan.id === 'gratuito' || !plan.stripePrice) return;
    // Si ya tiene suscripción de pago, el cambio se hace desde el portal de Stripe
    if (tienePlanPago) {
      manage();
    } else {
      subscribe(plan.stripePrice);
    }
  };

  return (
    <div className="planes-page">
      <div className="planes">
        <div className="planes__controls">
          <button
            className="planes__back-btn"
            onClick={() => navigate(-1)}
            aria-label="Volver"
          >
            <PiArrowLeftBold size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="planes__header">
          <h1>{t('plans.title')}</h1>
          <p>{t('plans.subtitle')}</p>
        </div>

        {tienePlanPago && (
          <div className="planes__manage-bar">
            <button
              className="btn btn--outline btn--sm"
              onClick={manage}
              disabled={loading}
            >
              {loading ? (
                <PiSpinnerBold size={15} className="spin" aria-hidden="true" />
              ) : (
                <PiGearBold size={15} aria-hidden="true" />
              )}
              {t('plans.manage')}
            </button>
          </div>
        )}

        <div className="planes__grid">
          {PLANES.map(plan => {
            const esActual = planActual === plan.id;
            return (
              <div
                key={plan.id}
                className={`planes__card${plan.destacado ? ' planes__card--destacado' : ''}${esActual ? ' planes__card--actual' : ''}`}
              >
                {esActual && (
                  <div className="planes__badge planes__badge--actual">
                    {t('plans.currentPlan')}
                  </div>
                )}

                <div className="planes__card-header">
                  <div className="planes__card-icon">{plan.icono}</div>
                  <h2 className="planes__card-nombre">{plan.nombre}</h2>
                  <div
                    className="planes__card-precio"
                    aria-label={
                      plan.precio
                        ? `${plan.precio} USD / ${plan.periodo}`
                        : t('plans.free')
                    }
                  >
                    {plan.precio ? (
                      <>
                        <span className="planes__precio-monto" aria-hidden="true">
                          {plan.precio}
                        </span>
                        <span className="planes__precio-periodo" aria-hidden="true">
                          USD / {t('plans.perMonth')}
                        </span>
                      </>
                    ) : (
                      <span className="planes__precio-monto" aria-hidden="true">
                        {t('plans.free')}
                      </span>
                    )}
                  </div>
                  <p className="planes__card-desc">{plan.descripcion}</p>
                </div>

                <ul className="planes__features">
                  {plan.caracteristicas.map((c, i) => (
                    <li
                      key={i}
                      className={`planes__feature${c.incluido ? '' : ' planes__feature--no'}`}
                    >
                      <span className="planes__feature-icon" aria-hidden="true">
                        {c.incluido ? (
                          <PiCheckBold size={14} />
                        ) : (
                          <PiXBold size={14} />
                        )}
                      </span>
                      <span>
                        <span className="sr-only">
                          {c.incluido ? 'Incluido: ' : 'No incluido: '}
                        </span>
                        {c.texto}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="planes__card-footer">
                  {esActual ? (
                    <button
                      className="btn btn--outline btn--sm planes__btn"
                      disabled
                    >
                      {t('plans.currentPlan')}
                    </button>
                  ) : plan.id === 'gratuito' ? (
                    // Gratuito: solo mostrar info, sin acción (se gestiona desde el portal)
                    <button
                      className="btn btn--outline btn--sm planes__btn"
                      onClick={manage}
                      disabled={loading || !tienePlanPago}
                    >
                      {loading ? (
                        <PiSpinnerBold size={14} className="spin" aria-hidden="true" />
                      ) : null}
                      {tienePlanPago ? t('plans.changeTo') + ' Gratuito' : t('plans.free')}
                    </button>
                  ) : (
                    <button
                      className="btn btn--primary btn--sm planes__btn"
                      onClick={() => handlePlanAction(plan)}
                      disabled={loading}
                    >
                      {loading ? (
                        <PiSpinnerBold size={14} className="spin" aria-hidden="true" />
                      ) : null}
                      {tienePlanPago
                        ? `${t('plans.changeTo')} ${plan.nombre}`
                        : `${t('plans.subscribe')} ${plan.nombre}`}
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
