import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.scss';

const LANGUAGES = [
  { code: 'es', name: 'Español', native: 'Spanish' },
  { code: 'en', name: 'English', native: 'Inglés' },
];

interface Props {
  className?: string;
}

export default function LanguageSwitcher({ className }: Props) {
  const { i18n } = useTranslation();
  const current = i18n.language?.slice(0, 2) ?? 'es';

  return (
    <div className={`lang-switcher ${className ?? ''}`}>
      {LANGUAGES.map(({ code, name, native }) => (
        <button
          key={code}
          className={`lang-switcher__option${current === code ? ' lang-switcher__option--active' : ''}`}
          onClick={() => i18n.changeLanguage(code)}
          aria-pressed={current === code}
        >
          <span className="lang-switcher__code">{code.toUpperCase()}</span>
          <div className="lang-switcher__info">
            <span className="lang-switcher__name">{name}</span>
            <span className="lang-switcher__native">{native}</span>
          </div>
          <span className="lang-switcher__check" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
