import { useRef, useState, useEffect } from 'react';
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
  PiChatTextBold,
  PiArrowCounterClockwiseBold,
  PiBellBold,
  PiBellSlashBold,
  PiDownloadBold,
  PiUsersThreeBold,
  PiCaretRightBold,
  PiArrowLeftBold,
  PiUserBold,
  PiShieldCheckBold,
  PiGearSixBold,
} from 'react-icons/pi';
import type { User } from '../types/User';
import { usePWA } from '../hooks/usePWA';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useTemplates } from '../hooks/useTemplates';
import { useEquipo } from '../hooks/useEquipo';
import {
  exportBackup,
  parseBackupFile,
  importBackup,
  type BackupData,
} from '../services/backupService';
import { salirDelNegocio, getAdminPorUid, getMiembros } from '../services/equipoService';
import Avatar from '../components/ui/Avatar';
import DangerModal from '../components/configuracion/DangerModal';
import CrearMiembroModal from '../components/configuracion/CrearMiembroModal';
import MiembroPerfilModal from '../components/configuracion/MiembroPerfilModal';
import './Configuracion.scss';

type ImportStep = 'idle' | 'preview' | 'importing' | 'done';
type Section = 'moneda' | 'notificaciones' | 'instalar' | 'plantillas' | 'equipo' | 'respaldo' | 'gestion' | 'membresia';

const SIMBOLOS_MONEDA = ['$', '€', '£', '¥', 'S/', 'R$', 'Q', '₩'];

type NavItem = { id: Section; icon: React.ReactNode; title: string; color: string };
type NavGroup = { label: string; items: NavItem[] };

const getSectionTitle = (section: Section): string => {
  switch (section) {
    case 'moneda':        return 'Moneda';
    case 'notificaciones': return 'Notificaciones';
    case 'instalar':      return 'Instalar aplicación';
    case 'plantillas':    return 'Plantillas de mensajes';
    case 'equipo':        return 'Equipo';
    case 'respaldo':      return 'Respaldo';
    case 'gestion':       return 'Gestionar cuenta';
    case 'membresia':     return 'Equipo';
  }
};

const Configuracion = () => {
  const { user, updateProfile, deleteAllData, deleteAccount, role } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active section
  const [activeSection, setActiveSection] = useState<Section | null>(null);

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

  // PWA
  const { canInstall, promptInstall, notifPermission, requestNotifPermission, sendNotification } = usePWA();

  const handleTestNotif = () => {
    sendNotification('Orderly', { body: '¡Las notificaciones están activadas correctamente!' });
  };

  // Plantillas
  const { draft: plantillas, setDraft: setPlantillas, saving: savingPlantillas, isDirty: plantillasDirty, save: savePlantillas, reset: resetPlantillas, resetToDefaults } = useTemplates();
  type PlantillaKey = 'confirmacion' | 'preparacion' | 'entrega';
  const [plantillaTab, setPlantillaTab] = useState<PlantillaKey>('confirmacion');

  const PLANTILLA_TABS: { key: PlantillaKey; label: string }[] = [
    { key: 'confirmacion', label: 'Confirmación' },
    { key: 'preparacion',  label: 'Preparación' },
    { key: 'entrega',      label: 'Entrega' },
  ];

  const VARIABLES_INFO = '{{nombre}} · {{folio}} · {{total}} · {{pagado}} · {{restante}} · {{productos}} · {{notas}} · {{negocio}}';

  // Zona de peligro
  const [dangerModal, setDangerModal] = useState<'deleteData' | 'deleteAccount' | null>(null);

  // Equipo
  const { miembros, loading: equipoLoading, crearMiembro, remover, actualizar, actualizarContrasena } = useEquipo();
  const [showCrearMiembro, setShowCrearMiembro] = useState(false);

  // Perfil de miembro
  const [selectedMiembro, setSelectedMiembro] = useState<User | null>(null);

  // Membresía (datos del negocio para miembros)
  const [salirLoading, setSalirLoading] = useState(false);
  const [adminNegocio, setAdminNegocio] = useState<User | null>(null);
  const [companeros, setCompaneros] = useState<User[]>([]);

  useEffect(() => {
    if (role !== 'miembro' || !user?.negocioUid) return;
    getAdminPorUid(user.negocioUid).then(setAdminNegocio);
    getMiembros(user.negocioUid).then(data =>
      setCompaneros(data.filter(m => m.uid !== user.uid))
    );
  }, [role, user?.negocioUid, user?.uid]);

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

  // ── Equipo ──────────────────────────────────────────
  const handleCrearMiembro = async (form: { nombre: string; apellido: string; fechaNacimiento: string; telefono: string; telefonoCodigoPais: string; password: string }) => {
    await crearMiembro(form);
    showToast('Miembro creado correctamente', 'success');
  };

  // ── Membresía ────────────────────────────────────────
  const handleSalirNegocio = async () => {
    if (!user) return;
    setSalirLoading(true);
    try {
      await salirDelNegocio(user.uid);
      window.location.reload();
    } catch {
      showToast('Error al salir del negocio', 'error');
      setSalirLoading(false);
    }
  };

  // ── Zona de peligro ─────────────────────────────────
  const handleDeleteData = async (password: string) => {
    await deleteAllData(password);
    showToast('Todos los datos han sido eliminados', 'success');
    setDangerModal(null);
  };

  const handleDeleteAccount = async (password: string) => {
    await deleteAccount(password);
  };

  // ── Nav groups ───────────────────────────────────────
  const preferenciasItems: NavItem[] = [
    ...(role !== 'miembro' ? [{ id: 'moneda' as Section, icon: <PiCurrencyDollarBold size={16} />, title: 'Moneda', color: 'yellow' }] : []),
    { id: 'notificaciones', icon: notifPermission === 'granted' ? <PiBellBold size={16} /> : <PiBellSlashBold size={16} />, title: 'Notificaciones', color: notifPermission === 'granted' ? 'green' : 'gray' },
    ...(canInstall ? [{ id: 'instalar' as Section, icon: <PiDownloadBold size={16} />, title: 'Instalar app', color: 'teal' }] : []),
  ];

  const navGroups: NavGroup[] = role === 'miembro'
    ? [
        { label: 'Preferencias', items: preferenciasItems },
        { label: 'Negocio', items: [{ id: 'plantillas', icon: <PiChatTextBold size={16} />, title: 'Plantillas', color: 'purple' }] },
        { label: 'Cuenta', items: [{ id: 'membresia', icon: <PiUsersThreeBold size={16} />, title: 'Equipo', color: 'blue' }] },
      ]
    : [
        { label: 'Preferencias', items: preferenciasItems },
        {
          label: 'Negocio',
          items: [
            { id: 'plantillas', icon: <PiChatTextBold size={16} />, title: 'Plantillas', color: 'purple' },
            { id: 'equipo', icon: <PiUsersThreeBold size={16} />, title: 'Equipo', color: 'blue' },
          ],
        },
        { label: 'Datos', items: [{ id: 'respaldo', icon: <PiDownloadSimpleBold size={16} />, title: 'Respaldo', color: 'teal' }] },
        { label: 'Cuenta', items: [{ id: 'gestion', icon: <PiWarningBold size={16} />, title: 'Gestionar cuenta', color: 'gray' }] },
      ];

  // ── Panel renderer ───────────────────────────────────
  const renderPanel = () => {
    switch (activeSection) {
      case 'moneda':
        if (role === 'miembro') return (
          <p className="configuracion__desc">Solo el administrador puede cambiar la moneda.</p>
        );
        return (
          <>
            <p className="configuracion__desc">
              Elige el símbolo de moneda a mostrar en precios y reportes.
            </p>
            <div className="configuracion__field-row">
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
          </>
        );

      case 'notificaciones':
        return (
          <>
            <p className="configuracion__desc">
              Recibe alertas del sistema cuando haya pedidos pendientes, stock bajo o descuentos por vencer.
            </p>
            {!('Notification' in window) ? (
              <p className="configuracion__note">Tu navegador no soporta notificaciones.</p>
            ) : notifPermission === 'denied' ? (
              <p className="configuracion__notif-denied">
                Notificaciones bloqueadas. Actívalas desde la configuración de tu navegador.
              </p>
            ) : notifPermission === 'granted' ? (
              <div className="configuracion__actions">
                <span className="configuracion__notif-status configuracion__notif-status--on">
                  <PiBellBold size={13} /> Activadas
                </span>
                <button className="btn btn--outline btn--sm" onClick={handleTestNotif}>
                  Probar
                </button>
              </div>
            ) : (
              <div className="configuracion__actions">
                <button className="btn btn--primary btn--sm" onClick={requestNotifPermission}>
                  <PiBellBold size={15} />
                  Activar notificaciones
                </button>
              </div>
            )}
          </>
        );

      case 'instalar':
        return (
          <>
            <p className="configuracion__desc">
              Instala Orderly en tu dispositivo para acceder más rápido y usarla sin conexión.
            </p>
            <div className="configuracion__actions">
              <button className="btn btn--primary btn--sm" onClick={promptInstall}>
                <PiDownloadBold size={15} />
                Instalar Orderly
              </button>
            </div>
          </>
        );

      case 'plantillas':
        return (
          <div className="configuracion__plantillas-panel">
            <p className="configuracion__desc">
              Personaliza el mensaje que se envía por WhatsApp según el estado del pedido.
            </p>
            <p className="configuracion__note">{VARIABLES_INFO}</p>
            <div className="configuracion__tabs">
              {PLANTILLA_TABS.map(tab => (
                <button
                  key={tab.key}
                  className={`configuracion__tab${plantillaTab === tab.key ? ' configuracion__tab--active' : ''}`}
                  onClick={() => setPlantillaTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <textarea
              className="configuracion__textarea configuracion__textarea--grow"
              value={plantillas[plantillaTab]}
              onChange={e => setPlantillas(prev => ({ ...prev, [plantillaTab]: e.target.value }))}
              placeholder="Escribe tu plantilla..."
            />
            <div className="configuracion__actions">
              <button
                className="btn btn--outline btn--sm"
                onClick={resetToDefaults}
                title="Restaurar valores por defecto"
              >
                <PiArrowCounterClockwiseBold size={14} />
                Restaurar
              </button>
              <button
                className="btn btn--outline btn--sm"
                onClick={resetPlantillas}
                disabled={!plantillasDirty}
              >
                Cancelar
              </button>
              <button
                className="btn btn--primary btn--sm"
                onClick={savePlantillas}
                disabled={savingPlantillas || !plantillasDirty}
              >
                {savingPlantillas ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        );

      case 'equipo':
        return (
          <>
            <p className="configuracion__desc">
              Crea cuentas para los miembros de tu equipo. Entran con su usuario o correo y contraseña.
            </p>

            {/* Member list */}
            {equipoLoading ? (
              <p className="configuracion__desc">Cargando...</p>
            ) : miembros.length === 0 ? (
              <p className="configuracion__empty-list">No hay miembros todavía.</p>
            ) : (
              <div className="configuracion__equipo-list">
                {miembros.map(m => (
                  <div
                    key={m.uid}
                    className="configuracion__equipo-item configuracion__equipo-item--clickable"
                    onClick={() => setSelectedMiembro(m)}
                  >
                    <div className="configuracion__equipo-avatar">
                      <Avatar
                        src={m.fotoPerfil}
                        initials={`${(m.nombre?.[0] ?? '?').toUpperCase()}${(m.apellido?.[0] ?? '').toUpperCase()}`}
                        alt={m.nombre}
                      />
                    </div>
                    <div className="configuracion__equipo-info">
                      <div className="configuracion__equipo-name-row">
                        <span className="configuracion__equipo-name">{m.nombre} {m.apellido}</span>
                        <PiUserBold size={11} color="#2368C4" />
                      </div>
                      <span className="configuracion__equipo-email">{m.username}{m.numeroMiembro ? ` · Nº ${m.numeroMiembro}` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button className="btn btn--primary btn--sm" onClick={() => setShowCrearMiembro(true)}>
              + Nuevo miembro
            </button>
          </>
        );

      case 'respaldo':
        return (
          <div className="configuracion__backup-blocks">
            {/* Exportar */}
            <div className="configuracion__backup-block">
              <p className="configuracion__backup-title">Exportar</p>
              <p className="configuracion__desc">
                Descarga un archivo con todos tus clientes, productos, pedidos y etiquetas. Úsalo como respaldo o para migrar a otra cuenta.
              </p>
              <p className="configuracion__note">
                Las fotos de clientes y productos no se incluyen en el respaldo.
              </p>
              <div className="configuracion__actions">
                <button
                  className="btn btn--primary btn--sm"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  <PiDownloadSimpleBold size={15} />
                  {exporting ? 'Generando...' : 'Descargar respaldo'}
                </button>
              </div>
            </div>

            {/* Importar */}
            <div className="configuracion__backup-block">
              <p className="configuracion__backup-title">Importar</p>
              <p className="configuracion__desc">
                Carga un archivo de respaldo para restaurar tus datos en esta cuenta. Los datos existentes no se eliminan.
              </p>
              <p className="configuracion__note">
                Solo se aceptan archivos generados por Orderly (.json).
              </p>

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
                  <div className="configuracion__actions">
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
          </div>
        );

      case 'gestion':
        return (
          <div className="configuracion__backup-blocks">
            <div className="configuracion__backup-block">
              <p className="configuracion__backup-title">Eliminar todos los datos</p>
              <p className="configuracion__desc">
                Borra permanentemente todos tus clientes, productos, pedidos y etiquetas. Tu cuenta permanece activa.
              </p>
              <div className="configuracion__actions">
                <button className="btn btn--danger btn--sm" onClick={() => setDangerModal('deleteData')}>
                  <PiTrashBold size={14} />
                  Eliminar datos
                </button>
              </div>
            </div>
            <div className="configuracion__backup-block">
              <p className="configuracion__backup-title">Eliminar cuenta</p>
              <p className="configuracion__desc">
                Elimina permanentemente tu cuenta y todos los datos asociados. Esta acción no se puede deshacer.
              </p>
              <div className="configuracion__actions">
                <button className="btn btn--danger btn--sm" onClick={() => setDangerModal('deleteAccount')}>
                  <PiUserMinusBold size={14} />
                  Eliminar cuenta
                </button>
              </div>
            </div>
          </div>
        );

      case 'membresia':
        return (
          <>
            <p className="configuracion__desc">
              Eres miembro de este negocio. Contacta con el administrador para cambios en la cuenta.
            </p>

            {adminNegocio && (
              <div className="configuracion__membresia-section">
                <p className="configuracion__membresia-label">Administrador</p>
                <div className="configuracion__equipo-item">
                  <div className="configuracion__equipo-avatar">
                    <Avatar
                      src={adminNegocio.fotoPerfil}
                      initials={`${(adminNegocio.nombre?.[0] ?? '?').toUpperCase()}${(adminNegocio.apellido?.[0] ?? '').toUpperCase()}`}
                      alt={adminNegocio.nombre}
                    />
                  </div>
                  <div className="configuracion__equipo-info">
                    <div className="configuracion__equipo-name-row">
                      <span className="configuracion__equipo-name">{adminNegocio.nombre} {adminNegocio.apellido}</span>
                      <PiShieldCheckBold size={11} color="#F8A800" />
                    </div>
                    <span className="configuracion__equipo-email">{adminNegocio.nombreNegocio}</span>
                  </div>
                </div>
              </div>
            )}

            {companeros.length > 0 && (
              <div className="configuracion__membresia-section">
                <p className="configuracion__membresia-label">Compañeros</p>
                <div className="configuracion__equipo-list">
                  {companeros.map(m => (
                    <div key={m.uid} className="configuracion__equipo-item">
                      <div className="configuracion__equipo-avatar">
                        <Avatar
                          src={m.fotoPerfil}
                          initials={`${(m.nombre?.[0] ?? '?').toUpperCase()}${(m.apellido?.[0] ?? '').toUpperCase()}`}
                          alt={m.nombre}
                        />
                      </div>
                      <div className="configuracion__equipo-info">
                        <div className="configuracion__equipo-name-row">
                          <span className="configuracion__equipo-name">{m.nombre} {m.apellido}</span>
                          <PiUserBold size={11} color="#2368C4" />
                        </div>
                        <span className="configuracion__equipo-email">{m.username}{m.numeroMiembro ? ` · Nº ${m.numeroMiembro}` : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="configuracion__actions">
              <button
                className="btn btn--danger btn--sm"
                onClick={handleSalirNegocio}
                disabled={salirLoading}
              >
                <PiUserMinusBold size={15} />
                {salirLoading ? 'Saliendo...' : 'Salir del negocio'}
              </button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="configuracion">
        {/* Nav */}
        <nav className={`configuracion__nav${activeSection ? ' configuracion__nav--hidden' : ''}`}>
          <p className="configuracion__nav-title">Configuración</p>
          {navGroups.map(group => (
            <div key={group.label} className="configuracion__group">
              <p className="configuracion__group-label">{group.label}</p>
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`configuracion__row${activeSection === item.id ? ' configuracion__row--active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <span className={`configuracion__row-icon configuracion__row-icon--${item.color}`}>
                    {item.icon}
                  </span>
                  <span className="configuracion__row-title">{item.title}</span>
                  <PiCaretRightBold size={12} className="configuracion__row-chevron" />
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Detail panel */}
        <div className={`configuracion__detail${!activeSection ? ' configuracion__detail--hidden' : ''}`}>
          <button className="configuracion__back" onClick={() => setActiveSection(null)}>
            <PiArrowLeftBold size={14} />
            Configuración
          </button>
          {activeSection ? (
            <div className="configuracion__detail-inner">
              <h2 className="configuracion__detail-title">{getSectionTitle(activeSection)}</h2>
              {renderPanel()}
            </div>
          ) : (
            <div className="configuracion__placeholder">
              <div className="configuracion__placeholder-icon">
                <PiGearSixBold size={56} />
              </div>
              <p className="configuracion__placeholder-title">Configuración</p>
              <p className="configuracion__placeholder-desc">Selecciona una opción del menú para comenzar</p>
            </div>
          )}
        </div>
      </div>

      {dangerModal && (
        <DangerModal
          type={dangerModal}
          onClose={() => setDangerModal(null)}
          onDeleteData={handleDeleteData}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {showCrearMiembro && (
        <CrearMiembroModal
          onClose={() => setShowCrearMiembro(false)}
          onSubmit={handleCrearMiembro}
        />
      )}

      {selectedMiembro && (
        <MiembroPerfilModal
          miembro={selectedMiembro}
          onClose={() => setSelectedMiembro(null)}
          onRemover={(uid) => { remover(uid); setSelectedMiembro(null); }}
          onActualizar={actualizar}
          onActualizarContrasena={actualizarContrasena}
        />
      )}
    </MainLayout>
  );
};

export default Configuracion;
