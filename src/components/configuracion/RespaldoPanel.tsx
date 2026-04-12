import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PiDownloadSimpleBold,
  PiUploadSimpleBold,
  PiFileBold,
  PiCheckCircleBold,
  PiWarningBold,
  PiXBold,
} from 'react-icons/pi';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import {
  exportBackup,
  parseBackupFile,
  importBackup,
  type BackupData,
} from '../../services/backupService';

type ImportStep = 'idle' | 'preview' | 'importing' | 'done';

const RespaldoPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const planPermiteRespaldo = user?.plan === 'pro' || user?.plan === 'enterprise';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [importResult, setImportResult] = useState<{
    clientes: number; productos: number; pedidos: number; etiquetas: number; omitidos: number;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      await exportBackup(user.uid);
      showToast(t('settings.backup.exportSuccess'), 'success');
    } catch {
      showToast(t('settings.backup.exportError'), 'error');
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
      setFileError(err instanceof Error ? err.message : t('settings.backup.importError'));
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
      showToast(t('settings.backup.importError'), 'error');
      setImportStep('preview');
    }
  };

  const handleReset = () => {
    setImportStep('idle');
    setBackupData(null);
    setImportResult(null);
    setFileError(null);
  };

  return (
    <div className="configuracion__backup-blocks">
      {/* Exportar */}
      <div className="configuracion__backup-block">
        <p className="configuracion__backup-title">{t('settings.backup.exportTitle')}</p>
        <p className="configuracion__desc">{t('settings.backup.exportDesc')}</p>
        <p className="configuracion__note">{t('settings.backup.exportNote')}</p>
        <div className="configuracion__actions">
          <button
            className="btn btn--primary btn--sm"
            onClick={handleExport}
            disabled={exporting || !planPermiteRespaldo}
            title={!planPermiteRespaldo ? t('settings.backup.upgradePlanToUse') : undefined}
          >
            <PiDownloadSimpleBold size={15} />
            {exporting ? t('settings.backup.exporting') : t('settings.backup.exportButton')}
          </button>
        </div>
      </div>

      {/* Importar */}
      <div className="configuracion__backup-block">
        <p className="configuracion__backup-title">{t('settings.backup.importTitle')}</p>
        <p className="configuracion__desc">{t('settings.backup.importDesc')}</p>
        <p className="configuracion__note">{t('settings.backup.importNote')}</p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="configuracion__file-input"
          onChange={handleFileChange}
        />

        {importStep === 'idle' && (
          <div className="configuracion__actions">
            <button
              className="btn btn--outline btn--sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={!planPermiteRespaldo}
              title={!planPermiteRespaldo ? t('settings.backup.upgradePlanToUse') : undefined}
            >
              <PiFileBold size={15} />
              {t('settings.backup.selectFile')}
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
              {new Date(backupData.exportadoEn).toLocaleDateString(undefined, {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
            <div className="configuracion__preview-summary">
              <div className="configuracion__preview-item">
                <span className="configuracion__preview-count">{backupData.clientes.length}</span>
                <span>{t('nav.clients')}</span>
              </div>
              <div className="configuracion__preview-item">
                <span className="configuracion__preview-count">{backupData.productos.length}</span>
                <span>{t('nav.products')}</span>
              </div>
              <div className="configuracion__preview-item">
                <span className="configuracion__preview-count">{backupData.pedidos.length}</span>
                <span>{t('nav.orders')}</span>
              </div>
              <div className="configuracion__preview-item">
                <span className="configuracion__preview-count">{backupData.etiquetas?.length ?? 0}</span>
                <span>{t('settings.backup.labels')}</span>
              </div>
            </div>
            <div className="configuracion__actions">
              <button className="btn btn--ghost btn--sm" onClick={handleReset}>
                <PiXBold size={13} />
                {t('settings.backup.cancel')}
              </button>
              <button className="btn btn--primary btn--sm" onClick={handleImport}>
                <PiUploadSimpleBold size={13} />
                {t('settings.backup.confirm')}
              </button>
            </div>
          </div>
        )}

        {importStep === 'importing' && (
          <div className="configuracion__importing">
            <div className="configuracion__spinner" />
            <span>{t('settings.backup.importing')}</span>
          </div>
        )}

        {importStep === 'done' && importResult && (
          <div className="configuracion__done">
            <PiCheckCircleBold size={28} className="configuracion__done-icon" />
            <p className="configuracion__done-title">{t('settings.backup.doneTitle')}</p>
            <p className="configuracion__done-desc">
              {t('settings.backup.doneDesc', {
                clients: importResult.clientes,
                products: importResult.productos,
                orders: importResult.pedidos,
                labels: importResult.etiquetas,
              })}
              {importResult.omitidos > 0 && t('settings.backup.doneOmitted', { count: importResult.omitidos })}
            </p>
            <button className="btn btn--outline btn--sm" onClick={handleReset}>
              {t('settings.backup.accept')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RespaldoPanel;
