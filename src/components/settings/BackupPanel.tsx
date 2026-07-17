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
  type ImportSummary,
} from '../../services/backupService';

type ImportStep = 'idle' | 'preview' | 'importing' | 'done';

const BackupPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const planAllowsBackup = user?.plan === 'pro' || user?.plan === 'enterprise';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
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
    <div className="settings__backup-blocks">
      {/* Exportar */}
      <div className="settings__backup-block">
        <p className="settings__backup-title">{t('settings.backup.exportTitle')}</p>
        <p className="settings__desc">{t('settings.backup.exportDesc')}</p>
        <p className="settings__note">{t('settings.backup.exportNote')}</p>
        <div className="settings__actions">
          <button
            className="btn btn--primary btn--sm"
            onClick={handleExport}
            disabled={exporting || !planAllowsBackup}
            title={!planAllowsBackup ? t('settings.backup.upgradePlanToUse') : undefined}
          >
            <PiDownloadSimpleBold size={15} />
            {exporting ? t('settings.backup.exporting') : t('settings.backup.exportButton')}
          </button>
        </div>
      </div>

      {/* Importar */}
      <div className="settings__backup-block">
        <p className="settings__backup-title">{t('settings.backup.importTitle')}</p>
        <p className="settings__desc">{t('settings.backup.importDesc')}</p>
        <p className="settings__note">{t('settings.backup.importNote')}</p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="settings__file-input"
          onChange={handleFileChange}
        />

        {importStep === 'idle' && (
          <div className="settings__actions">
            <button
              className="btn btn--outline btn--sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={!planAllowsBackup}
              title={!planAllowsBackup ? t('settings.backup.upgradePlanToUse') : undefined}
            >
              <PiFileBold size={15} />
              {t('settings.backup.selectFile')}
            </button>
            {fileError && (
              <div className="settings__file-error">
                <PiWarningBold size={13} />
                {fileError}
              </div>
            )}
          </div>
        )}

        {importStep === 'preview' && backupData && (
          <div className="settings__preview">
            <p className="settings__preview-date">
              {new Date(backupData.exportedAt).toLocaleDateString(undefined, {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
            <div className="settings__preview-summary">
              <div className="settings__preview-item">
                <span className="settings__preview-count">{backupData.clients.length}</span>
                <span>{t('nav.clients')}</span>
              </div>
              <div className="settings__preview-item">
                <span className="settings__preview-count">{backupData.products.length}</span>
                <span>{t('nav.products')}</span>
              </div>
              <div className="settings__preview-item">
                <span className="settings__preview-count">{backupData.orders.length}</span>
                <span>{t('nav.orders')}</span>
              </div>
              <div className="settings__preview-item">
                <span className="settings__preview-count">{backupData.labels?.length ?? 0}</span>
                <span>{t('settings.backup.labels')}</span>
              </div>
            </div>
            <div className="settings__actions">
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
          <div className="settings__importing">
            <div className="settings__spinner" />
            <span>{t('settings.backup.importing')}</span>
          </div>
        )}

        {importStep === 'done' && importResult && (
          <div className="settings__done">
            <PiCheckCircleBold size={28} className="settings__done-icon" />
            <p className="settings__done-title">{t('settings.backup.doneTitle')}</p>
            <p className="settings__done-desc">
              {t('settings.backup.doneDesc', {
                clients: importResult.clients,
                products: importResult.products,
                orders: importResult.orders,
                labels: importResult.labels,
              })}
              {importResult.skipped > 0 && t('settings.backup.doneOmitted', { count: importResult.skipped })}
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

export default BackupPanel;
