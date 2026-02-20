import { useState, useRef, useEffect } from 'react';
import { CODIGOS_PAIS, getCodigoPais } from '../../data/codigosPais';

interface PhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  codigoPais: string; // ISO code, e.g. 'MX'
  onChange: (numero: string, iso: string) => void;
  hasError?: boolean;
  placeholder?: string;
}

const PhoneInput = ({ id, name, value, codigoPais, onChange, hasError, placeholder }: PhoneInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const pais = getCodigoPais(codigoPais) ?? CODIGOS_PAIS[0];

  const filtered = search.trim()
    ? CODIGOS_PAIS.filter(
        (p) =>
          p.nombre.toLowerCase().includes(search.toLowerCase()) ||
          p.codigo.includes(search)
      )
    : CODIGOS_PAIS;

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
          <span className="phone-input__dial">{pais.codigo}</span>
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
                <li className="phone-input__no-results">Sin resultados</li>
              ) : (
                filtered.map((p) => (
                  <li
                    key={p.iso}
                    className={`phone-input__option ${p.iso === codigoPais ? 'phone-input__option--selected' : ''}`}
                    onClick={() => handleSelect(p.iso)}
                    role="option"
                    aria-selected={p.iso === codigoPais}
                  >
                    <span className="phone-input__option-name">{p.nombre}</span>
                    <span className="phone-input__option-code">{p.codigo}</span>
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
          onChange(digits, codigoPais);
        }}
        className="phone-input__number"
        placeholder={placeholder ?? 'Número de teléfono'}
        maxLength={10}
      />
    </div>
  );
};

export default PhoneInput;
