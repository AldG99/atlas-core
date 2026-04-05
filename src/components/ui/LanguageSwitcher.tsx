import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'es', label: 'ES', flag: 'x' },
  { code: 'en', label: 'EN', flag: 'x' },
];

interface Props {
  className?: string;
}

export default function LanguageSwitcher({ className }: Props) {
  const { i18n } = useTranslation();
  const current = i18n.language?.slice(0, 2) ?? 'es';

  return (
    <div className={`lang-switcher ${className ?? ''}`}>
      {LANGUAGES.map(({ code, label, flag }) => (
        <button
          key={code}
          className={`lang-switcher__btn${current === code ? ' lang-switcher__btn--active' : ''}`}
          onClick={() => i18n.changeLanguage(code)}
          aria-pressed={current === code}
          title={label}
        >
          <span className="lang-switcher__flag">{flag}</span>
          <span className="lang-switcher__label">{label}</span>
        </button>
      ))}
    </div>
  );
}
