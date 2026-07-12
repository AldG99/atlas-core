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
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../hooks/useToast';
import { STRIPE_PRICES } from '../services/stripeService';
import './Plans.scss';

const PLANS_CONFIG = [
  {
    id: 'free',
    tier: 'free',
    price: null,
    stripePrice: null,
    icon: <PiStorefrontBold size={22} />,
    included: [true, true, true, true, true, false, false],
  },
  {
    id: 'pro',
    tier: 'pro',
    price: '$4',
    stripePrice: STRIPE_PRICES.pro,
    icon: <PiDiamondBold size={22} />,
    featured: true,
    included: [true, true, true, true, true, true, true],
  },
  {
    id: 'enterprise',
    tier: 'business',
    price: '$6',
    stripePrice: STRIPE_PRICES.enterprise,
    icon: <PiDiamondsFourBold size={22} />,
    included: [true, true, true, true, true, true, true],
  },
];

const Plans = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { subscribe, manage, loading } = useSubscription();
  const { showToast } = useToast();

  const currentPlan = user?.plan ?? 'free';
  const hasPaidPlan = currentPlan !== 'free';

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

  const handlePlanAction = (plan: (typeof PLANS_CONFIG)[number]) => {
    if (plan.id === 'free' || !plan.stripePrice) return;
    // Si ya tiene suscripción de pago, el cambio se hace desde el portal de Stripe
    if (hasPaidPlan) {
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

        {hasPaidPlan && (
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
          {PLANS_CONFIG.map(plan => {
            const isCurrent = currentPlan === plan.id;
            const name = t(`plans.tiers.${plan.tier}.name`);
            const description = t(`plans.tiers.${plan.tier}.description`);
            const features = t(`plans.tiers.${plan.tier}.features`, { returnObjects: true }) as string[];
            return (
              <div
                key={plan.id}
                className={`planes__card${plan.featured ? ' planes__card--destacado' : ''}${isCurrent ? ' planes__card--actual' : ''}`}
              >
                {isCurrent && (
                  <div className="planes__badge planes__badge--actual">
                    {t('plans.currentPlan')}
                  </div>
                )}

                <div className="planes__card-header">
                  <div className="planes__card-icon">{plan.icon}</div>
                  <h2 className="planes__card-nombre">{name}</h2>
                  <div
                    className="planes__card-precio"
                    aria-label={plan.price ? `${plan.price} USD / ${t('plans.perMonth')}` : t('plans.free')}
                  >
                    {plan.price ? (
                      <>
                        <span className="planes__precio-monto" aria-hidden="true">{plan.price}</span>
                        <span className="planes__precio-periodo" aria-hidden="true">USD / {t('plans.perMonth')}</span>
                      </>
                    ) : (
                      <span className="planes__precio-monto" aria-hidden="true">{t('plans.free')}</span>
                    )}
                  </div>
                  <p className="planes__card-desc">{description}</p>
                </div>

                <ul className="planes__features">
                  {features.map((text, i) => (
                    <li
                      key={i}
                      className={`planes__feature${plan.included[i] ? '' : ' planes__feature--no'}`}
                    >
                      <span className="planes__feature-icon" aria-hidden="true">
                        {plan.included[i] ? <PiCheckBold size={14} /> : <PiXBold size={14} />}
                      </span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>

                <div className="planes__card-footer">
                  {isCurrent ? (
                    <button className="btn btn--outline btn--sm planes__btn" disabled>
                      {t('plans.currentPlan')}
                    </button>
                  ) : plan.id === 'free' ? (
                    <button
                      className="btn btn--outline btn--sm planes__btn"
                      onClick={manage}
                      disabled={loading || !hasPaidPlan}
                    >
                      {loading ? <PiSpinnerBold size={14} className="spin" aria-hidden="true" /> : null}
                      {hasPaidPlan ? `${t('plans.changeTo')} ${name}` : t('plans.free')}
                    </button>
                  ) : (
                    <button
                      className="btn btn--primary btn--sm planes__btn"
                      onClick={() => handlePlanAction(plan)}
                      disabled={loading}
                    >
                      {loading ? <PiSpinnerBold size={14} className="spin" aria-hidden="true" /> : null}
                      {hasPaidPlan ? `${t('plans.changeTo')} ${name}` : `${t('plans.subscribe')} ${name}`}
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

export default Plans;
