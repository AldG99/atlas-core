import { useState } from 'react';
import { PiWarningBold, PiXBold, PiEyeBold, PiEyeSlashBold } from 'react-icons/pi';

interface DangerModalProps {
  type: 'deleteData' | 'deleteAccount';
  onClose: () => void;
  onDeleteData: (password: string) => Promise<void>;
  onDeleteAccount: (password: string) => Promise<void>;
}

const DangerModal = ({ type, onClose, onDeleteData, onDeleteAccount }: DangerModalProps) => {
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setError('');
    if (!password) {
      setError('Ingresa tu contraseña para confirmar');
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
      setError('Contraseña incorrecta');
      setLoading(false);
    }
  };

  return (
    <div className="configuracion__modal-overlay" onClick={onClose}>
      <div className="configuracion__modal" onClick={e => e.stopPropagation()}>
        <div className="configuracion__modal-header">
          <PiWarningBold size={20} className="configuracion__modal-icon" />
          <h3>
            {type === 'deleteData' ? 'Eliminar todos los datos' : 'Eliminar cuenta'}
          </h3>
          <button className="configuracion__modal-close" onClick={onClose}>
            <PiXBold size={16} />
          </button>
        </div>
        <div className="configuracion__modal-body">
          {type === 'deleteData' ? (
            <p>
              Se eliminarán permanentemente todos tus <strong>clientes, productos, pedidos y etiquetas</strong>.
              Tu cuenta seguirá activa. Esta acción <strong>no se puede deshacer</strong>.
            </p>
          ) : (
            <p>
              Se eliminará tu cuenta y <strong>todos los datos</strong> de forma permanente.
              Esta acción <strong>no se puede deshacer</strong>.
            </p>
          )}
          <div className="configuracion__modal-field">
            <label>Confirma tu contraseña</label>
            <div className="configuracion__modal-pwd">
              <input
                type={showPwd ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}>
                {showPwd ? <PiEyeSlashBold size={16} /> : <PiEyeBold size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="configuracion__file-error">
              <PiWarningBold size={14} />
              {error}
            </div>
          )}
        </div>
        <div className="configuracion__modal-actions">
          <button className="btn btn--outline btn--sm" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className="btn btn--danger btn--sm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading
              ? 'Eliminando...'
              : type === 'deleteData'
                ? 'Sí, eliminar datos'
                : 'Sí, eliminar cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DangerModal;
