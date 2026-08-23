import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, TriangleAlert, Info } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import './Toast.scss';

const ICONS = {
  success: <Check size={16} />,
  error: <X size={16} />,
  warning: <TriangleAlert size={16} />,
  info: <Info size={16} />,
};

const Toast = () => {
  const { t } = useTranslation();
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toasts.length > 0) {
        removeToast(toasts[toasts.length - 1].id);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          role="alert"
        >
          <span className="toast__icon" aria-hidden="true">
            {ICONS[toast.type]}
          </span>
          <span className="toast__message">{toast.message}</span>
          <button
            className="toast__close"
            onClick={() => removeToast(toast.id)}
            aria-label={t('common.closeNotification')}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
