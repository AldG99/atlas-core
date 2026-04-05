import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PiCheckBold,
  PiXBold,
  PiDiamondBold,
  PiDiamondsFourBold,
  PiStorefrontBold,
  PiArrowLeftBold,
  PiEnvelopeBold,
  PiHeadsetBold,
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
    precio: '$7',
    periodo: 'mes',
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
  const planActual = user?.plan ?? 'gratuito';
  const [modalPlan, setModalPlan] = useState<(typeof PLANES)[number] | null>(
    null
  );
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Cerrar con Escape + trampa de foco
  useEffect(() => {
    if (!modalPlan) return;

    const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, a, [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        return;
      }
      if (e.key !== 'Tab' || !focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalPlan]);

  const closeModal = () => {
    setModalPlan(null);
    triggerRef.current?.focus();
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
                        <span
                          className="planes__precio-monto"
                          aria-hidden="true"
                        >
                          {plan.precio}
                        </span>
                        <span
                          className="planes__precio-periodo"
                          aria-hidden="true"
                        >
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
                  ) : (
                    <button
                      className="btn btn--primary btn--sm planes__btn"
                      onClick={e => {
                        triggerRef.current = e.currentTarget;
                        setModalPlan(plan);
                      }}
                    >
                      {plan.id === 'gratuito'
                        ? 'Cambiar a Gratuito'
                        : `Contratar ${plan.nombre}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de contratación */}
      {modalPlan && (
        <div
          className="planes__modal-overlay"
          onClick={closeModal}
          aria-hidden="true"
        />
      )}
      {modalPlan && (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="planes-modal-title"
          className="planes__modal-wrapper"
        >
          <div className="planes__modal">
            <button
              className="planes__modal-close"
              onClick={closeModal}
              aria-label={t('common.close')}
            >
              <PiXBold size={16} aria-hidden="true" />
            </button>
            <h3 id="planes-modal-title" className="planes__modal-title">
              {modalPlan.nombre}
            </h3>
            <p className="planes__modal-body">{t('plans.betaNotice')}</p>
            {modalPlan.precio && (
              <p
                className="planes__modal-price"
                aria-label={`${modalPlan.precio} dólares USD por ${modalPlan.periodo}`}
              >
                <span aria-hidden="true">
                  {modalPlan.precio} USD / {modalPlan.periodo}
                </span>
              </p>
            )}
            <div className="planes__modal-actions">
              <button
                className="btn btn--primary btn--sm"
                onClick={() => {
                  closeModal();
                  navigate('/soporte');
                }}
              >
                <PiHeadsetBold size={15} aria-hidden="true" />
                {t('plans.goToSupport')}
              </button>
              <a
                className="btn btn--outline btn--sm"
                href="mailto:orderly.vault@gmail.com"
              >
                <PiEnvelopeBold size={15} aria-hidden="true" />
                {t('plans.sendEmail')}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planes;
