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

const PLANES_CONFIG = [
  {
    id: 'gratuito',
    tier: 'free',
    precio: null,
    stripePrice: null,
    icono: <PiStorefrontBold size={22} />,
    incluidos: [true, true, true, true, true, false, false],
  },
  {
    id: 'pro',
    tier: 'pro',
    precio: '$4',
    stripePrice: STRIPE_PRICES.pro,
    icono: <PiDiamondBold size={22} />,
    destacado: true,
    incluidos: [true, true, true, true, true, true, true],
  },
  {
    id: 'enterprise',
    tier: 'business',
    precio: '$6',
    stripePrice: STRIPE_PRICES.enterprise,
    icono: <PiDiamondsFourBold size={22} />,
    incluidos: [true, true, true, true, true, true, true],
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

  const handlePlanAction = (plan: (typeof PLANES_CONFIG)[number]) => {
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
          {PLANES_CONFIG.map(plan => {
            const esActual = planActual === plan.id;
            const nombre = t(`plans.tiers.${plan.tier}.name`);
            const descripcion = t(`plans.tiers.${plan.tier}.description`);
            const features = t(`plans.tiers.${plan.tier}.features`, { returnObjects: true }) as string[];
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
                  <h2 className="planes__card-nombre">{nombre}</h2>
                  <div
                    className="planes__card-precio"
                    aria-label={plan.precio ? `${plan.precio} USD / ${t('plans.perMonth')}` : t('plans.free')}
                  >
                    {plan.precio ? (
                      <>
                        <span className="planes__precio-monto" aria-hidden="true">{plan.precio}</span>
                        <span className="planes__precio-periodo" aria-hidden="true">USD / {t('plans.perMonth')}</span>
                      </>
                    ) : (
                      <span className="planes__precio-monto" aria-hidden="true">{t('plans.free')}</span>
                    )}
                  </div>
                  <p className="planes__card-desc">{descripcion}</p>
                </div>

                <ul className="planes__features">
                  {features.map((texto, i) => (
                    <li
                      key={i}
                      className={`planes__feature${plan.incluidos[i] ? '' : ' planes__feature--no'}`}
                    >
                      <span className="planes__feature-icon" aria-hidden="true">
                        {plan.incluidos[i] ? <PiCheckBold size={14} /> : <PiXBold size={14} />}
                      </span>
                      <span>{texto}</span>
                    </li>
                  ))}
                </ul>

                <div className="planes__card-footer">
                  {esActual ? (
                    <button className="btn btn--outline btn--sm planes__btn" disabled>
                      {t('plans.currentPlan')}
                    </button>
                  ) : plan.id === 'gratuito' ? (
                    <button
                      className="btn btn--outline btn--sm planes__btn"
                      onClick={manage}
                      disabled={loading || !tienePlanPago}
                    >
                      {loading ? <PiSpinnerBold size={14} className="spin" aria-hidden="true" /> : null}
                      {tienePlanPago ? `${t('plans.changeTo')} ${nombre}` : t('plans.free')}
                    </button>
                  ) : (
                    <button
                      className="btn btn--primary btn--sm planes__btn"
                      onClick={() => handlePlanAction(plan)}
                      disabled={loading}
                    >
                      {loading ? <PiSpinnerBold size={14} className="spin" aria-hidden="true" /> : null}
                      {tienePlanPago ? `${t('plans.changeTo')} ${nombre}` : `${t('plans.subscribe')} ${nombre}`}
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
