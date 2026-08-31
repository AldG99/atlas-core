import { useState, useRef, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useProducts } from '../../hooks/useProducts';
import type { Product } from '../../types/Product';

interface ProductDeleteModalProps {
  product: Product;
  onClose: () => void;
  onDeleted: () => void;
}

const CODE_LENGTH = 10;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateDeleteCode = () =>
  Array.from(
    { length: CODE_LENGTH },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  ).join('');

const ProductDeleteModal = ({ product, onClose, onDeleted }: ProductDeleteModalProps) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { removeProduct } = useProducts();
  const [deleteCode] = useState(generateDeleteCode);
  const [chars, setChars] = useState<string[]>(() => Array<string>(CODE_LENGTH).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const isMatch = chars.join('') === deleteCode;

  const focusCell = (i: number) => {
    const el = inputsRef.current[i];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const setCharAt = (i: number, value: string) =>
    setChars(prev => {
      const next = [...prev];
      next[i] = value;
      return next;
    });

  const handleConfirm = async () => {
    if (!isMatch) return;
    onClose();
    try {
      await removeProduct(product.id);
      showToast(t('products.detail.deleteSuccess'), 'success');
      onDeleted();
    } catch {
      showToast(t('products.detail.deleteError'), 'error');
    }
  };

  const handleChange = (i: number, raw: string) => {
    const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!cleaned) {
      setCharAt(i, '');
      return;
    }
    // Toma el último carácter por si el navegador dejó dos en el input antes
    // de disparar onChange (celda ya llena sin seleccionar).
    setCharAt(i, cleaned[cleaned.length - 1]);
    if (i < CODE_LENGTH - 1) focusCell(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (chars[i]) {
        setCharAt(i, '');
      } else if (i > 0) {
        setCharAt(i - 1, '');
        focusCell(i - 1);
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      focusCell(i - 1);
    } else if (e.key === 'ArrowRight' && i < CODE_LENGTH - 1) {
      e.preventDefault();
      focusCell(i + 1);
    } else if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!pasted) return;
    setChars(prev => {
      const next = [...prev];
      for (let k = 0; k < pasted.length && i + k < CODE_LENGTH; k++) {
        next[i + k] = pasted[k];
      }
      return next;
    });
    focusCell(Math.min(i + pasted.length, CODE_LENGTH - 1));
  };

  return (
    <div className="product-detail__modal-overlay" onClick={onClose}>
      <div className="product-detail__modal" onClick={e => e.stopPropagation()}>
        <div className="product-detail__modal-header">
          <h3>{t('products.detail.deleteModal.title')}</h3>
          <button className="product-detail__modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="product-detail__modal-body">
          <p>{t('products.detail.deleteModal.warning')}</p>
          <p className="product-detail__delete-label">
            {t('products.detail.deleteModal.instruction')}
          </p>
          <code
            className="product-detail__delete-code"
            onCopy={e => e.preventDefault()}
            onContextMenu={e => e.preventDefault()}
          >
            {deleteCode}
          </code>
          <div
            className="product-detail__code-cells"
            role="group"
            aria-label={t('products.detail.deleteModal.placeholder')}
          >
            {chars.map((c, i) => (
              <input
                key={i}
                ref={el => { inputsRef.current[i] = el; }}
                className="product-detail__code-cell"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={1}
                value={c}
                aria-label={`${i + 1}`}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={e => handlePaste(i, e)}
                onFocus={e => e.target.select()}
              />
            ))}
          </div>
        </div>
        <div className="product-detail__modal-footer">
          <button className="btn btn--secondary btn--sm" onClick={onClose}>
            {t('products.detail.deleteModal.cancel')}
          </button>
          <button
            className="btn btn--danger btn--sm"
            onClick={handleConfirm}
            disabled={!isMatch}
          >
            {t('products.detail.deleteModal.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDeleteModal;
