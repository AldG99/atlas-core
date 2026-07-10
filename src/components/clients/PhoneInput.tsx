import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { COUNTRY_CODES, getCountryCode } from '../../data/countryCodes';

interface PhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  countryCode: string; // ISO code, e.g. 'MX'
  onChange: (number: string, iso: string) => void;
  hasError?: boolean;
  placeholder?: string;
}

const PhoneInput = ({ id, name, value, countryCode, onChange, hasError, placeholder }: PhoneInputProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const country = getCountryCode(countryCode) ?? COUNTRY_CODES[0];

  const filtered = search.trim()
    ? COUNTRY_CODES.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.code.includes(search)
      )
    : COUNTRY_CODES;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (iso: string) => {
    onChange(value, iso);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`phone-input ${hasError ? 'phone-input--error' : ''}`}>
      <div ref={wrapperRef} className="phone-input__code-wrapper">
        <button
          type="button"
          className="phone-input__code-btn"
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Seleccionar código de país"
        >
          <span className="phone-input__dial">{country.code}</span>
          <span className="phone-input__arrow">▾</span>
        </button>

        {isOpen && (
          <div className="phone-input__dropdown">
            <div className="phone-input__search-wrapper">
              <input
                ref={searchRef}
                type="text"
                className="phone-input__search"
                placeholder="Buscar país o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <ul className="phone-input__list" role="listbox">
              {filtered.length === 0 ? (
                <li className="phone-input__no-results">{t('common.noResults')}</li>
              ) : (
                filtered.map((p) => (
                  <li
                    key={p.iso}
                    className={`phone-input__option ${p.iso === countryCode ? 'phone-input__option--selected' : ''}`}
                    onClick={() => handleSelect(p.iso)}
                    role="option"
                    aria-selected={p.iso === countryCode}
                  >
                    <span className="phone-input__option-name">{p.name}</span>
                    <span className="phone-input__option-code">{p.code}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
          onChange(digits, countryCode);
        }}
        className="phone-input__number"
        placeholder={placeholder ?? 'Número de teléfono'}
        maxLength={10}
      />
    </div>
  );
};

export default PhoneInput;
