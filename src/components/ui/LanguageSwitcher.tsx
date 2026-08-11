import { Fragment, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { PiXBold } from 'react-icons/pi';
import './LanguageSwitcher.scss';

const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-419', label: 'Español' },
  { code: 'es-ES', label: 'Español (ES)' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
];

// En la vista compacta (login) estos dos se ocultan detrás de "Más idiomas...".
const SECONDARY_CODES = ['en-GB', 'es-ES'];

interface Props {
  className?: string;
  vertical?: boolean;
}

export default function LanguageSwitcher({ className, vertical }: Props) {
  const { t, i18n } = useTranslation();
  const [showMore, setShowMore] = useState(false);

  const current =
    LANGUAGES.find(({ code }) => code === i18n.language)?.code
    ?? (i18n.language?.startsWith('es') ? 'es-419' : 'en-US');

  const mainLanguages = vertical
    ? LANGUAGES
    : LANGUAGES.filter(({ code }) => !SECONDARY_CODES.includes(code));
  const moreLanguages = LANGUAGES.filter(({ code }) => SECONDARY_CODES.includes(code));

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    setShowMore(false);
  };

  return (
    <div className={`lang-switcher ${vertical ? 'lang-switcher--vertical' : ''} ${className ?? ''}`}>
      {mainLanguages.map(({ code, label }, index) => (
        <Fragment key={code}>
          {!vertical && index > 0 && <span className="lang-switcher__sep" aria-hidden="true">·</span>}
          <button
            className={`lang-switcher__item${current === code ? ' lang-switcher__item--active' : ''}`}
            onClick={() => handleSelect(code)}
            disabled={current === code}
          >
            {label}
          </button>
        </Fragment>
      ))}

      {!vertical && moreLanguages.length > 0 && (
        <>
          <span className="lang-switcher__sep" aria-hidden="true">·</span>
          <button
            type="button"
            className="lang-switcher__item"
            onClick={() => setShowMore(true)}
          >
            {t('common.moreLanguages')}
          </button>
        </>
      )}

      {showMore && createPortal(
        <div className="modal-overlay" onClick={() => setShowMore(false)}>
          <div className="modal lang-switcher__modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{t('common.moreLanguages')}</h2>
              <button className="modal__close" onClick={() => setShowMore(false)}>
                <PiXBold size={18} />
              </button>
            </div>
            <div className="modal__body">
              <div className="lang-switcher lang-switcher--vertical">
                {moreLanguages.map(({ code, label }) => (
                  <button
                    key={code}
                    className={`lang-switcher__item${current === code ? ' lang-switcher__item--active' : ''}`}
                    onClick={() => handleSelect(code)}
                    disabled={current === code}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
