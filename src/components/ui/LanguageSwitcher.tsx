import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.scss';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

interface Props {
  className?: string;
}

export default function LanguageSwitcher({ className }: Props) {
  const { i18n } = useTranslation();
  const current = i18n.language?.slice(0, 2) ?? 'en';

  return (
    <div className={`lang-switcher ${className ?? ''}`}>
      {LANGUAGES.map(({ code, label }, index) => (
        <span key={code}>
          {index > 0 && <span className="lang-switcher__sep">·</span>}
          <button
            className={`lang-switcher__item${current === code ? ' lang-switcher__item--active' : ''}`}
            onClick={() => i18n.changeLanguage(code)}
            disabled={current === code}
          >
            {label}
          </button>
        </span>
      ))}
    </div>
  );
}
