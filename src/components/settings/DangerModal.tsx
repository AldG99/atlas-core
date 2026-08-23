import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TriangleAlert, X, Eye, EyeOff } from 'lucide-react';

interface DangerModalProps {
  type: 'deleteData' | 'deleteAccount';
  onClose: () => void;
  onDeleteData: (password: string) => Promise<void>;
  onDeleteAccount: (password: string) => Promise<void>;
}

const DangerModal = ({ type, onClose, onDeleteData, onDeleteAccount }: DangerModalProps) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setError('');
    if (!password) {
      setError(t('settings.dangerModal.passwordRequired'));
      return;
    }
    setLoading(true);
    try {
      if (type === 'deleteData') {
        await onDeleteData(password);
      } else {
        await onDeleteAccount(password);
      }
    } catch {
      setError(t('settings.dangerModal.wrongPassword'));
      setLoading(false);
    }
  };

  return (
    <div className="settings__modal-overlay" onClick={onClose}>
      <div className="settings__modal" onClick={e => e.stopPropagation()}>
        <div className="settings__modal-header">
          <TriangleAlert size={20} className="settings__modal-icon" />
          <h3>
            {type === 'deleteData' ? t('settings.dangerModal.deleteDataTitle') : t('settings.dangerModal.deleteAccountTitle')}
          </h3>
          <button className="settings__modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="settings__modal-body">
          <p>
            {type === 'deleteData'
              ? t('settings.dangerModal.deleteDataText')
              : t('settings.dangerModal.deleteAccountText')}
          </p>
          <div className="settings__modal-field">
            <label>{t('settings.dangerModal.confirmPassword')}</label>
            <div className="settings__modal-pwd">
              <input
                type={showPwd ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="settings__file-error">
              <TriangleAlert size={14} />
              {error}
            </div>
          )}
        </div>
        <div className="settings__modal-actions">
          <button className="btn btn--outline btn--sm" onClick={onClose} disabled={loading}>
            {t('settings.dangerModal.cancel')}
          </button>
          <button
            className="btn btn--danger btn--sm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading
              ? t('settings.dangerModal.deleting')
              : type === 'deleteData'
                ? t('settings.dangerModal.confirmDeleteData')
                : t('settings.dangerModal.confirmDeleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DangerModal;
