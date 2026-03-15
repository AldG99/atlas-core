import { useRef, useState } from 'react';
import {
  PiDownloadSimpleBold,
  PiUploadSimpleBold,
  PiFileBold,
  PiCheckCircleBold,
  PiWarningBold,
  PiXBold,
  PiCurrencyDollarBold,
  PiTrashBold,
  PiUserMinusBold,
  PiEyeBold,
  PiEyeSlashBold,
} from 'react-icons/pi';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  exportBackup,
  parseBackupFile,
  importBackup,
  type BackupData,
} from '../services/backupService';
import './Configuracion.scss';

type ImportStep = 'idle' | 'preview' | 'importing' | 'done';
type DangerModal = null | 'deleteData' | 'deleteAccount';

const SIMBOLOS_MONEDA = ['$', '€', '£', '¥', 'S/', 'R$', 'Q', '₩'];

const Configuracion = () => {
  const { user, updateProfile, deleteAllData, deleteAccount } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup
  const [exporting, setExporting] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [importResult, setImportResult] = useState<{ clientes: number; productos: number; pedidos: number; etiquetas: number; omitidos: number } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Moneda — migración de código ISO a símbolo
  const LEGACY_MAP: Record<string, string> = {
    MXN: '$', USD: '$', EUR: '€', COP: '$', ARS: '$', CLP: '$', PEN: 'S/', BRL: 'R$', GTQ: 'Q',
  };
  const rawMoneda = user?.moneda ?? '$';
  const [moneda, setMoneda] = useState(LEGACY_MAP[rawMoneda] ?? rawMoneda);
  const [savingMoneda, setSavingMoneda] = useState(false);

  // Zona de peligro
  const [dangerModal, setDangerModal] = useState<DangerModal>(null);
  const [dangerPassword, setDangerPassword] = useState('');
  const [showDangerPwd, setShowDangerPwd] = useState(false);
  const [dangerError, setDangerError] = useState('');
  const [dangerLoading, setDangerLoading] = useState(false);

  // ── Backup ──────────────────────────────────────────
  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      await exportBackup(user.uid);
      showToast('Respaldo descargado correctamente', 'success');
    } catch {
      showToast('Error al generar el respaldo', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    try {
      const data = await parseBackupFile(file);
      setBackupData(data);
      setImportStep('preview');
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Error al leer el archivo');
    }
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!user || !backupData) return;
    setImportStep('importing');
    try {
      const result = await importBackup(backupData, user.uid);
      setImportResult(result);
      setImportStep('done');
    } catch {
      showToast('Error al importar los datos', 'error');
      setImportStep('preview');
    }
  };

  const handleReset = () => {
    setImportStep('idle');
    setBackupData(null);
    setImportResult(null);
    setFileError(null);
  };

  // ── Moneda ──────────────────────────────────────────
  const handleSaveMoneda = async () => {
    setSavingMoneda(true);
    try {
      await updateProfile({ moneda });
      showToast('Moneda actualizada correctamente', 'success');
    } catch {
      showToast('Error al guardar la moneda', 'error');
    } finally {
      setSavingMoneda(false);
    }
  };

  // ── Zona de peligro ─────────────────────────────────
  const closeDangerModal = () => {
    setDangerModal(null);
    setDangerPassword('');
    setDangerError('');
    setShowDangerPwd(false);
  };

  const handleDeleteData = async () => {
    setDangerError('');
    setDangerLoading(true);
    try {
      await deleteAllData();
      showToast('Todos los datos han sido eliminados', 'success');
      closeDangerModal();
    } catch {
      setDangerError('Ocurrió un error al eliminar los datos');
    } finally {
      setDangerLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDangerError('');
    if (!dangerPassword) {
      setDangerError('Ingresa tu contraseña para confirmar');
      return;
    }
    setDangerLoading(true);
    try {
      await deleteAccount(dangerPassword);
    } catch {
      setDangerError('Contraseña incorrecta');
      setDangerLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="configuracion">
        <h1 className="configuracion__page-title">Configuración</h1>

        <div className="configuracion__layout">

            {/* Exportar */}
            <div className="configuracion__card">
              <div className="configuracion__card-header">
                <div className="configuracion__card-icon configuracion__card-icon--export">
                  <PiDownloadSimpleBold size={18} />
                </div>
                <h2 className="configuracion__card-title">Exportar datos</h2>
              </div>
              <p className="configuracion__card-desc">
                Descarga un archivo con todos tus clientes, productos, pedidos y etiquetas. Úsalo como respaldo o para migrar a otra cuenta.
              </p>
              <p className="configuracion__card-note">
                Las fotos de clientes y productos no se incluyen en el respaldo.
              </p>
              <div className="configuracion__card-footer">
                <button
                  className="btn btn--primary btn--sm configuracion__card-btn"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  <PiDownloadSimpleBold size={15} />
                  {exporting ? 'Generando...' : 'Descargar respaldo'}
                </button>
              </div>
            </div>

            {/* Importar */}
            <div className="configuracion__card">
              <div className="configuracion__card-header">
                <div className="configuracion__card-icon configuracion__card-icon--import">
                  <PiUploadSimpleBold size={18} />
                </div>
                <h2 className="configuracion__card-title">Importar datos</h2>
              </div>
              <p className="configuracion__card-desc">
                Carga un archivo de respaldo para restaurar tus datos en esta cuenta. Los datos existentes no se eliminan.
              </p>
              <p className="configuracion__card-note">
                Solo se aceptan archivos generados por Orderly (.json).
              </p>

              {importStep === 'idle' && (
                <div className="configuracion__card-footer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="configuracion__file-input"
                    onChange={handleFileChange}
                  />
                  <button
                    className="btn btn--outline btn--sm configuracion__card-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PiFileBold size={15} />
                    Seleccionar archivo
                  </button>
                  {fileError && (
                    <div className="configuracion__file-error">
                      <PiWarningBold size={13} />
                      {fileError}
                    </div>
                  )}
                </div>
              )}

              {importStep === 'preview' && backupData && (
                <div className="configuracion__preview">
                  <p className="configuracion__preview-date">
                    Respaldo del {new Date(backupData.exportadoEn).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <div className="configuracion__preview-summary">
                    <div className="configuracion__preview-item">
                      <span className="configuracion__preview-count">{backupData.clientes.length}</span>
                      <span>Clientes</span>
                    </div>
                    <div className="configuracion__preview-item">
                      <span className="configuracion__preview-count">{backupData.productos.length}</span>
                      <span>Productos</span>
                    </div>
                    <div className="configuracion__preview-item">
                      <span className="configuracion__preview-count">{backupData.pedidos.length}</span>
                      <span>Pedidos</span>
                    </div>
                    <div className="configuracion__preview-item">
                      <span className="configuracion__preview-count">{backupData.etiquetas?.length ?? 0}</span>
                      <span>Etiquetas</span>
                    </div>
                  </div>
                  <div className="configuracion__preview-actions">
                    <button className="btn btn--ghost btn--sm" onClick={handleReset}>
                      <PiXBold size={13} />
                      Cancelar
                    </button>
                    <button className="btn btn--primary btn--sm" onClick={handleImport}>
                      <PiUploadSimpleBold size={13} />
                      Confirmar importación
                    </button>
                  </div>
                </div>
              )}

              {importStep === 'importing' && (
                <div className="configuracion__importing">
                  <div className="configuracion__spinner" />
                  <span>Importando datos...</span>
                </div>
              )}

              {importStep === 'done' && importResult && (
                <div className="configuracion__done">
                  <PiCheckCircleBold size={28} className="configuracion__done-icon" />
                  <p className="configuracion__done-title">¡Importación completada!</p>
                  <p className="configuracion__done-desc">
                    Se importaron {importResult.clientes} clientes, {importResult.productos} productos, {importResult.pedidos} pedidos y {importResult.etiquetas} etiquetas.
                    {importResult.omitidos > 0 && (
                      <> {importResult.omitidos} {importResult.omitidos === 1 ? 'registro omitido por' : 'registros omitidos por'} duplicado.</>
                    )}
                  </p>
                  <button className="btn btn--outline btn--sm" onClick={handleReset}>Aceptar</button>
                </div>
              )}
            </div>

            {/* Moneda */}
            <div className="configuracion__card">
              <div className="configuracion__card-header">
                <div className="configuracion__card-icon configuracion__card-icon--moneda">
                  <PiCurrencyDollarBold size={18} />
                </div>
                <h2 className="configuracion__card-title">Moneda</h2>
              </div>
              <p className="configuracion__card-desc">
                Elige el símbolo que se mostrará en precios, totales y reportes.
              </p>
              <div className="configuracion__card-footer configuracion__card-footer--row">
                <select
                  className="configuracion__select"
                  value={moneda}
                  onChange={e => setMoneda(e.target.value)}
                >
                  {SIMBOLOS_MONEDA.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={handleSaveMoneda}
                  disabled={savingMoneda || moneda === (LEGACY_MAP[rawMoneda] ?? rawMoneda)}
                >
                  {savingMoneda ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>

            {/* Zona de peligro */}
            <div className="configuracion__card configuracion__card--danger">
              <div className="configuracion__card-header">
                <div className="configuracion__card-icon configuracion__card-icon--danger">
                  <PiWarningBold size={18} />
                </div>
                <h2 className="configuracion__card-title configuracion__card-title--danger">Zona de peligro</h2>
              </div>

              <div className="configuracion__danger-item">
                <div>
                  <p className="configuracion__danger-label">Eliminar todos los datos</p>
                  <p className="configuracion__card-desc">
                    Borra permanentemente todos tus clientes, productos, pedidos y etiquetas. Tu cuenta permanece activa.
                  </p>
                </div>
                <button className="btn btn--danger btn--sm" onClick={() => setDangerModal('deleteData')}>
                  <PiTrashBold size={14} />
                  Eliminar datos
                </button>
              </div>

              <div className="configuracion__danger-divider" />

              <div className="configuracion__danger-item">
                <div>
                  <p className="configuracion__danger-label">Eliminar cuenta</p>
                  <p className="configuracion__card-desc">
                    Elimina permanentemente tu cuenta y todos los datos asociados. Esta acción no se puede deshacer.
                  </p>
                </div>
                <button className="btn btn--danger btn--sm" onClick={() => setDangerModal('deleteAccount')}>
                  <PiUserMinusBold size={14} />
                  Eliminar cuenta
                </button>
              </div>
            </div>

        </div>
      </div>

      {/* Modal zona de peligro */}
      {dangerModal && (
        <div className="configuracion__modal-overlay" onClick={closeDangerModal}>
          <div className="configuracion__modal" onClick={e => e.stopPropagation()}>
            <div className="configuracion__modal-header">
              <PiWarningBold size={20} className="configuracion__modal-icon" />
              <h3>
                {dangerModal === 'deleteData' ? 'Eliminar todos los datos' : 'Eliminar cuenta'}
              </h3>
              <button className="configuracion__modal-close" onClick={closeDangerModal}>
                <PiXBold size={16} />
              </button>
            </div>
            <div className="configuracion__modal-body">
              {dangerModal === 'deleteData' ? (
                <p>
                  Se eliminarán permanentemente todos tus <strong>clientes, productos, pedidos y etiquetas</strong>.
                  Tu cuenta seguirá activa. Esta acción <strong>no se puede deshacer</strong>.
                </p>
              ) : (
                <>
                  <p>
                    Se eliminará tu cuenta y <strong>todos los datos</strong> de forma permanente.
                    Esta acción <strong>no se puede deshacer</strong>.
                  </p>
                  <div className="configuracion__modal-field">
                    <label>Confirma tu contraseña</label>
                    <div className="configuracion__modal-pwd">
                      <input
                        type={showDangerPwd ? 'text' : 'password'}
                        className="input"
                        placeholder="••••••••"
                        value={dangerPassword}
                        onChange={e => setDangerPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowDangerPwd(v => !v)}>
                        {showDangerPwd ? <PiEyeSlashBold size={16} /> : <PiEyeBold size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}
              {dangerError && (
                <div className="configuracion__file-error">
                  <PiWarningBold size={14} />
                  {dangerError}
                </div>
              )}
            </div>
            <div className="configuracion__modal-actions">
              <button className="btn btn--outline btn--sm" onClick={closeDangerModal} disabled={dangerLoading}>
                Cancelar
              </button>
              <button
                className="btn btn--danger btn--sm"
                onClick={dangerModal === 'deleteData' ? handleDeleteData : handleDeleteAccount}
                disabled={dangerLoading}
              >
                {dangerLoading
                  ? 'Eliminando...'
                  : dangerModal === 'deleteData'
                    ? 'Sí, eliminar datos'
                    : 'Sí, eliminar cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Configuracion;
