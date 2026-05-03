import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import './AuthLayout.scss';

const TOTAL_IMAGES = 5;
const randomImage = () => {
  const last = parseInt(localStorage.getItem('login_last_bg') ?? '0');
  const options = Array.from({ length: TOTAL_IMAGES }, (_, i) => i + 1).filter(n => n !== last);
  const n = options[Math.floor(Math.random() * options.length)];
  localStorage.setItem('login_last_bg', String(n));
  return `/images/login-bg-${n}.jpg`;
};

interface AuthLayoutProps {
  children: ReactNode;
  showSubtitle?: boolean;
  fullWidth?: boolean;
}

const AuthLayout = ({ children, showSubtitle = true, fullWidth = false }: AuthLayoutProps) => {
  const { t, i18n } = useTranslation();
  const [bgImage] = useState(randomImage);
  return (
    <div className={`auth-layout${fullWidth ? ' auth-layout--full' : ''}`}>
      {!fullWidth && (
        <div className="auth-layout__image" style={{ backgroundImage: `url('${bgImage}')` }}>
          <div className="auth-layout__image-overlay">
{showSubtitle && (
              <p className="auth-layout__image-tagline">
                {i18n.language?.startsWith('en') ? (
                  <>
                    Designed to <span className="auth-layout__image-tagline--accent">manage</span> your orders.{' '}
                    Built to <span className="auth-layout__image-tagline--accent">scale</span> your business.
                  </>
                ) : i18n.language?.startsWith('pt') ? (
                  <>
                    Projetado para <span className="auth-layout__image-tagline--accent">gerenciar</span> seus pedidos.{' '}
                    Construído para <span className="auth-layout__image-tagline--accent">escalar</span> seu negócio.
                  </>
                ) : i18n.language?.startsWith('fr') ? (
                  <>
                    Conçu pour <span className="auth-layout__image-tagline--accent">gérer</span> vos commandes.{' '}
                    Construit pour <span className="auth-layout__image-tagline--accent">développer</span> votre activité.
                  </>
                ) : (
                  <>
                    Diseñado para <span className="auth-layout__image-tagline--accent">gestionar</span> tus pedidos.{' '}
                    Construido para <span className="auth-layout__image-tagline--accent">escalar</span> tu negocio.
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="auth-layout__panel">
        <div className="auth-layout__panel-inner">
          <div className="auth-layout__header">
            <img src="/logo-skytla.svg" alt="Skytla" className="auth-layout__logo" draggable={false} onContextMenu={e => e.preventDefault()} />
            <span className="auth-layout__beta">{t('auth.beta')}</span>
          </div>
          <div className="auth-layout__content">{children}</div>
          <LanguageSwitcher className="auth-layout__lang" />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
