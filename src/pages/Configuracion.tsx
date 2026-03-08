import { useRef, useState } from 'react';
import {
  PiDownloadSimpleBold,
  PiUploadSimpleBold,
  PiFileBold,
  PiCheckCircleBold,
  PiWarningBold,
  PiXBold,
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

const Configuracion = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [importResult, setImportResult] = useState<{ clientes: number; productos: number; pedidos: number; etiquetas: number; omitidos: number } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

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

  return (
    <MainLayout>
      <div className="configuracion">
        <h1 className="configuracion__page-title">Configuración</h1>

        <div className="configuracion__grid">
          {/* Exportar */}
          <div className="configuracion__card">
            <div className="configuracion__card-icon configuracion__card-icon--export">
              <PiDownloadSimpleBold size={24} />
            </div>
            <div className="configuracion__card-body">
              <h2 className="configuracion__card-title">Exportar datos</h2>
              <p className="configuracion__card-desc">
                Descarga un archivo con todos tus clientes, productos, pedidos y etiquetas. Úsalo como respaldo o para migrar a otra cuenta.
              </p>
              <p className="configuracion__card-note">
                Las fotos de clientes y productos no se incluyen en el respaldo.
              </p>
            </div>
            <button
              className="btn btn--primary configuracion__card-btn"
              onClick={handleExport}
              disabled={exporting}
            >
              <PiDownloadSimpleBold size={16} />
              {exporting ? 'Generando...' : 'Descargar respaldo'}
            </button>
          </div>

          {/* Importar */}
          <div className="configuracion__card">
            <div className="configuracion__card-icon configuracion__card-icon--import">
              <PiUploadSimpleBold size={24} />
            </div>
            <div className="configuracion__card-body">
              <h2 className="configuracion__card-title">Importar datos</h2>
              <p className="configuracion__card-desc">
                Carga un archivo de respaldo para restaurar tus datos en esta cuenta. Los datos existentes no se eliminan.
              </p>
              <p className="configuracion__card-note">
                Solo se aceptan archivos generados por Orderly (.json).
              </p>
            </div>

            {importStep === 'idle' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="configuracion__file-input"
                  onChange={handleFileChange}
                />
                <button
                  className="btn btn--outline configuracion__card-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PiFileBold size={16} />
                  Seleccionar archivo
                </button>
                {fileError && (
                  <div className="configuracion__file-error">
                    <PiWarningBold size={14} />
                    {fileError}
                  </div>
                )}
              </>
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
                  <button className="btn btn--ghost" onClick={handleReset}>
                    <PiXBold size={14} />
                    Cancelar
                  </button>
                  <button className="btn btn--primary" onClick={handleImport}>
                    <PiUploadSimpleBold size={14} />
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
                <PiCheckCircleBold size={32} className="configuracion__done-icon" />
                <p className="configuracion__done-title">¡Importación completada!</p>
                <p className="configuracion__done-desc">
                  Se importaron {importResult.clientes} clientes, {importResult.productos} productos, {importResult.pedidos} pedidos y {importResult.etiquetas} etiquetas.
                  {importResult.omitidos > 0 && (
                    <> {importResult.omitidos} {importResult.omitidos === 1 ? 'registro omitido por' : 'registros omitidos por'} duplicado.</>
                  )}
                </p>
                <button className="btn btn--outline configuracion__card-btn" onClick={handleReset}>
                  Aceptar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Configuracion;
