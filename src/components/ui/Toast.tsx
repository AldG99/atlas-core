import { useEffect } from 'react';
import { PiCheckBold, PiXBold, PiWarningBold, PiInfoBold } from 'react-icons/pi';
import { useToast } from '../../hooks/useToast';
import './Toast.scss';

const ICONS = {
  success: <PiCheckBold size={16} />,
  error: <PiXBold size={16} />,
  warning: <PiWarningBold size={16} />,
  info: <PiInfoBold size={16} />,
};

const Toast = () => {
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
            aria-label="Cerrar notificación"
          >
            <PiXBold size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
