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
  PiEyeBold,
  PiEyeSlashBold,
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
  PiPhoneBold,
  PiCalendarBold,
  PiIdentificationBadgeBold,
  PiGearSixBold,
} from 'react-icons/pi';
import type { User } from '../types/User';
import { formatTelefono } from '../utils/formatters';
import { getCodigoPais } from '../data/codigosPais';
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
import PhoneInput from '../components/clientes/PhoneInput';
import './Configuracion.scss';

type ImportStep = 'idle' | 'preview' | 'importing' | 'done';
type DangerModal = null | 'deleteData' | 'deleteAccount';
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
  const [dangerModal, setDangerModal] = useState<DangerModal>(null);
  const [dangerPassword, setDangerPassword] = useState('');
  const [showDangerPwd, setShowDangerPwd] = useState(false);
  const [dangerError, setDangerError] = useState('');
  const [dangerLoading, setDangerLoading] = useState(false);

  // Equipo
  const { miembros, loading: equipoLoading, crearEmpleado, remover, actualizar, actualizarContrasena } = useEquipo();
  const [showCrearEmpleado, setShowCrearEmpleado] = useState(false);
  const [empleadoForm, setEmpleadoForm] = useState({
    nombre: '', apellido: '', fechaNacimiento: '', telefono: '', telefonoCodigoPais: 'MX', password: '', confirmarPassword: ''
  });
  const [creandoEmpleado, setCreandoEmpleado] = useState(false);
  const [empleadoError, setEmpleadoError] = useState('');

  // Perfil de miembro
  const [selectedMiembro, setSelectedMiembro] = useState<User | null>(null);
  const [editingMiembro, setEditingMiembro] = useState(false);
  const [editMiembroForm, setEditMiembroForm] = useState({ nombre: '', apellido: '', telefono: '', telefonoCodigoPais: 'MX', fechaNacimiento: '', password: '', confirmarPassword: '' });
  const [showEditPwd, setShowEditPwd] = useState(false);
  const [showEditConfirmPwd, setShowEditConfirmPwd] = useState(false);
  const [savingMiembro, setSavingMiembro] = useState(false);

  // Membresía (datos del negocio para miembros)
  const [salirLoading, setSalirLoading] = useState(false);
  const [adminNegocio, setAdminNegocio] = useState<User | null>(null);
  const [companeros, setCompaneros] = useState<User[]>([]);

  useEffect(() => {
    if (role !== 'empleado' || !user?.negocioUid) return;
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
  const handleCrearEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpleadoError('');
    if (empleadoForm.password !== empleadoForm.confirmarPassword) {
      setEmpleadoError('Las contraseñas no coinciden');
      return;
    }
    if (!empleadoForm.fechaNacimiento) {
      setEmpleadoError('La fecha de nacimiento es requerida');
      return;
    }
    if (!empleadoForm.telefono || empleadoForm.telefono.length < 10) {
      setEmpleadoError('Ingresa un número de teléfono válido');
      return;
    }
    setCreandoEmpleado(true);
    try {
      await crearEmpleado({
        nombre: empleadoForm.nombre,
        apellido: empleadoForm.apellido,
        fechaNacimiento: empleadoForm.fechaNacimiento,
        telefono: empleadoForm.telefono,
        telefonoCodigoPais: empleadoForm.telefonoCodigoPais,
        password: empleadoForm.password,
      });
      showToast('Miembro creado correctamente', 'success');
      setEmpleadoForm({ nombre: '', apellido: '', fechaNacimiento: '', telefono: '', telefonoCodigoPais: 'MX', password: '', confirmarPassword: '' });
      setShowCrearEmpleado(false);
    } catch (err) {
      setEmpleadoError(err instanceof Error ? err.message : 'Error al crear miembro');
    } finally {
      setCreandoEmpleado(false);
    }
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
  const closeDangerModal = () => {
    setDangerModal(null);
    setDangerPassword('');
    setDangerError('');
    setShowDangerPwd(false);
  };

  const handleDeleteData = async () => {
    setDangerError('');
    if (!dangerPassword) {
      setDangerError('Ingresa tu contraseña para confirmar');
      return;
    }
    setDangerLoading(true);
    try {
      await deleteAllData(dangerPassword);
      showToast('Todos los datos han sido eliminados', 'success');
      closeDangerModal();
    } catch {
      setDangerError('Contraseña incorrecta');
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

  // ── Nav groups ───────────────────────────────────────
  const preferenciasItems: NavItem[] = [
    ...(role !== 'empleado' ? [{ id: 'moneda' as Section, icon: <PiCurrencyDollarBold size={16} />, title: 'Moneda', color: 'yellow' }] : []),
    { id: 'notificaciones', icon: notifPermission === 'granted' ? <PiBellBold size={16} /> : <PiBellSlashBold size={16} />, title: 'Notificaciones', color: notifPermission === 'granted' ? 'green' : 'gray' },
    ...(canInstall ? [{ id: 'instalar' as Section, icon: <PiDownloadBold size={16} />, title: 'Instalar app', color: 'teal' }] : []),
  ];

  const navGroups: NavGroup[] = role === 'empleado'
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
        if (role === 'empleado') return (
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
                      {m.fotoPerfil
                        ? <img src={m.fotoPerfil} alt={m.nombre} />
                        : <span>{(m.nombre?.[0] ?? '?').toUpperCase()}{(m.apellido?.[0] ?? '').toUpperCase()}</span>
                      }
                    </div>
                    <div className="configuracion__equipo-info">
                      <div className="configuracion__equipo-name-row">
                        <span className="configuracion__equipo-name">{m.nombre} {m.apellido}</span>
                        <PiUserBold size={11} color="#2368C4" />
                      </div>
                      <span className="configuracion__equipo-email">{m.username}{m.numeroEmpleado ? ` · Nº ${m.numeroEmpleado}` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button className="btn btn--primary btn--sm" onClick={() => setShowCrearEmpleado(true)}>
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
                    {adminNegocio.fotoPerfil
                      ? <img src={adminNegocio.fotoPerfil} alt={adminNegocio.nombre} />
                      : <span>{(adminNegocio.nombre?.[0] ?? '?').toUpperCase()}{(adminNegocio.apellido?.[0] ?? '').toUpperCase()}</span>
                    }
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
                        {m.fotoPerfil
                          ? <img src={m.fotoPerfil} alt={m.nombre} />
                          : <span>{(m.nombre?.[0] ?? '?').toUpperCase()}{(m.apellido?.[0] ?? '').toUpperCase()}</span>
                        }
                      </div>
                      <div className="configuracion__equipo-info">
                        <div className="configuracion__equipo-name-row">
                          <span className="configuracion__equipo-name">{m.nombre} {m.apellido}</span>
                          <PiUserBold size={11} color="#2368C4" />
                        </div>
                        <span className="configuracion__equipo-email">{m.username}{m.numeroEmpleado ? ` · Nº ${m.numeroEmpleado}` : ''}</span>
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
                <>
                  <p>
                    Se eliminarán permanentemente todos tus <strong>clientes, productos, pedidos y etiquetas</strong>.
                    Tu cuenta seguirá activa. Esta acción <strong>no se puede deshacer</strong>.
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

      {/* Modal nuevo miembro */}
      {showCrearEmpleado && (
        <div className="configuracion__modal-overlay" onClick={() => { setShowCrearEmpleado(false); setEmpleadoError(''); }}>
          <div className="configuracion__modal configuracion__modal--wide" onClick={e => e.stopPropagation()}>
            <div className="configuracion__modal-header">
              <PiUsersThreeBold size={20} className="configuracion__modal-icon" />
              <h3>Nuevo miembro</h3>
              <button className="configuracion__modal-close" onClick={() => { setShowCrearEmpleado(false); setEmpleadoError(''); }}>
                <PiXBold size={16} />
              </button>
            </div>
            <form onSubmit={handleCrearEmpleado}>
              <div className="configuracion__modal-body">
                <div className="configuracion__modal-row">
                  <div className="configuracion__modal-field">
                    <label>Nombre</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Juan"
                      value={empleadoForm.nombre}
                      onChange={e => setEmpleadoForm(f => ({ ...f, nombre: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="configuracion__modal-field">
                    <label>Apellido</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Pérez"
                      value={empleadoForm.apellido}
                      onChange={e => setEmpleadoForm(f => ({ ...f, apellido: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="configuracion__modal-field">
                  <label>Fecha de nacimiento</label>
                  <input
                    type="date"
                    className="input"
                    value={empleadoForm.fechaNacimiento}
                    onChange={e => setEmpleadoForm(f => ({ ...f, fechaNacimiento: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="configuracion__modal-field">
                  <label>Número de teléfono</label>
                  <PhoneInput
                    value={empleadoForm.telefono}
                    codigoPais={empleadoForm.telefonoCodigoPais}
                    onChange={(numero, iso) => setEmpleadoForm(f => ({ ...f, telefono: numero, telefonoCodigoPais: iso }))}
                    placeholder="Número de celular"
                  />
                </div>
                <div className="configuracion__modal-row">
                  <div className="configuracion__modal-field">
                    <label>Contraseña</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="••••••••"
                      value={empleadoForm.password}
                      onChange={e => setEmpleadoForm(f => ({ ...f, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="configuracion__modal-field">
                    <label>Confirmar contraseña</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="••••••••"
                      value={empleadoForm.confirmarPassword}
                      onChange={e => setEmpleadoForm(f => ({ ...f, confirmarPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                {empleadoError && (
                  <div className="configuracion__file-error">
                    <PiWarningBold size={14} />
                    {empleadoError}
                  </div>
                )}
              </div>
              <div className="configuracion__modal-actions">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => { setShowCrearEmpleado(false); setEmpleadoError(''); }}
                  disabled={creandoEmpleado}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={creandoEmpleado}>
                  {creandoEmpleado ? 'Creando...' : 'Crear miembro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal perfil de miembro */}
      {selectedMiembro && (() => {
        const m = selectedMiembro;
        const nombreCompleto = `${m.nombre ?? ''} ${m.apellido ?? ''}`.trim();
        const initials = `${(m.nombre?.[0] ?? '').toUpperCase()}${(m.apellido?.[0] ?? '').toUpperCase()}`;
        const codigoPais = m.telefonoCodigoPais ? getCodigoPais(m.telefonoCodigoPais) : null;
        const telefonoFormateado = m.telefono
          ? `${codigoPais ? `${codigoPais.codigo} ` : ''}${formatTelefono(m.telefono)}`
          : null;
        const fechaNacStr = m.fechaNacimiento
          ? new Date(m.fechaNacimiento + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
          : null;

        const handleStartEdit = () => {
          setEditMiembroForm({
            nombre: m.nombre ?? '',
            apellido: m.apellido ?? '',
            telefono: m.telefono ?? '',
            telefonoCodigoPais: m.telefonoCodigoPais ?? 'MX',
            fechaNacimiento: m.fechaNacimiento ?? '',
            password: '',
            confirmarPassword: '',
          });
          setShowEditPwd(false);
          setShowEditConfirmPwd(false);
          setEditingMiembro(true);
        };

        const handleSaveEdit = async () => {
          if (editMiembroForm.password && editMiembroForm.password !== editMiembroForm.confirmarPassword) {
            showToast('Las contraseñas no coinciden', 'warning');
            return;
          }
          if (editMiembroForm.password && editMiembroForm.password.length < 6) {
            showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
            return;
          }
          setSavingMiembro(true);
          try {
            const { password, confirmarPassword, ...profileData } = editMiembroForm;
            await actualizar(m.uid, profileData);
            if (password) await actualizarContrasena(m.uid, password);
            setSelectedMiembro({ ...m, ...profileData });
            setEditingMiembro(false);
            showToast('Miembro actualizado', 'success');
          } catch {
            showToast('Error al guardar cambios', 'error');
          } finally {
            setSavingMiembro(false);
          }
        };

        return (
          <div className="configuracion__modal-overlay" onClick={() => { setSelectedMiembro(null); setEditingMiembro(false); }}>
            <div className="configuracion__modal configuracion__modal--wide" onClick={e => e.stopPropagation()}>
              <div className="configuracion__modal-header">
                <PiUserBold size={20} className="configuracion__modal-icon--user" />
                <h3>{editingMiembro ? 'Editar miembro' : 'Perfil del miembro'}</h3>
                <button className="configuracion__modal-close" onClick={() => { setSelectedMiembro(null); setEditingMiembro(false); }}>
                  <PiXBold size={16} />
                </button>
              </div>
              <div className="configuracion__modal-body">
                {!editingMiembro ? (
                  <>
                    <div className="configuracion__miembro-profile">
                      <div className="configuracion__miembro-avatar">
                        {m.fotoPerfil
                          ? <img src={m.fotoPerfil} alt={nombreCompleto} />
                          : <span>{initials || '?'}</span>
                        }
                      </div>
                      <div className="configuracion__miembro-name">{nombreCompleto || '—'}</div>
                      {m.numeroEmpleado && (
                        <div className="configuracion__miembro-badge">#{m.numeroEmpleado}</div>
                      )}
                    </div>
                    <div className="configuracion__miembro-fields">
                      <div className="configuracion__miembro-field">
                        <PiIdentificationBadgeBold size={14} className="configuracion__miembro-field-icon" />
                        <div>
                          <p className="configuracion__miembro-field-label">Usuario</p>
                          <p className="configuracion__miembro-field-value">{m.username ?? '—'}</p>
                        </div>
                      </div>
                      {telefonoFormateado && (
                        <div className="configuracion__miembro-field">
                          <PiPhoneBold size={14} className="configuracion__miembro-field-icon" />
                          <div>
                            <p className="configuracion__miembro-field-label">Teléfono</p>
                            <p className="configuracion__miembro-field-value">{telefonoFormateado}</p>
                          </div>
                        </div>
                      )}
                      {fechaNacStr && (
                        <div className="configuracion__miembro-field">
                          <PiCalendarBold size={14} className="configuracion__miembro-field-icon" />
                          <div>
                            <p className="configuracion__miembro-field-label">Fecha de nacimiento</p>
                            <p className="configuracion__miembro-field-value">{fechaNacStr}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="configuracion__modal-row" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="configuracion__modal-row">
                      <div className="configuracion__modal-field">
                        <label>Nombre</label>
                        <input type="text" className="input" value={editMiembroForm.nombre} onChange={e => setEditMiembroForm(f => ({ ...f, nombre: e.target.value }))} />
                      </div>
                      <div className="configuracion__modal-field">
                        <label>Apellido</label>
                        <input type="text" className="input" value={editMiembroForm.apellido} onChange={e => setEditMiembroForm(f => ({ ...f, apellido: e.target.value }))} />
                      </div>
                    </div>
                    <div className="configuracion__modal-field">
                      <label>Teléfono</label>
                      <PhoneInput
                        value={editMiembroForm.telefono}
                        codigoPais={editMiembroForm.telefonoCodigoPais}
                        onChange={(val, cod) => setEditMiembroForm(f => ({ ...f, telefono: val, telefonoCodigoPais: cod }))}
                      />
                    </div>
                    <div className="configuracion__modal-field">
                      <label>Fecha de nacimiento</label>
                      <input type="date" className="input" value={editMiembroForm.fechaNacimiento} onChange={e => setEditMiembroForm(f => ({ ...f, fechaNacimiento: e.target.value }))} />
                    </div>
                    <div className="configuracion__modal-field">
                      <label>Nueva contraseña <span className="configuracion__modal-optional">(opcional)</span></label>
                      <div className="configuracion__modal-pwd">
                        <input
                          type={showEditPwd ? 'text' : 'password'}
                          className="input"
                          placeholder="••••••••"
                          value={editMiembroForm.password}
                          onChange={e => setEditMiembroForm(f => ({ ...f, password: e.target.value }))}
                        />
                        <button type="button" onClick={() => setShowEditPwd(v => !v)}>
                          {showEditPwd ? <PiEyeSlashBold size={16} /> : <PiEyeBold size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="configuracion__modal-field">
                      <label>Confirmar contraseña</label>
                      <div className="configuracion__modal-pwd">
                        <input
                          type={showEditConfirmPwd ? 'text' : 'password'}
                          className="input"
                          placeholder="••••••••"
                          value={editMiembroForm.confirmarPassword}
                          onChange={e => setEditMiembroForm(f => ({ ...f, confirmarPassword: e.target.value }))}
                        />
                        <button type="button" onClick={() => setShowEditConfirmPwd(v => !v)}>
                          {showEditConfirmPwd ? <PiEyeSlashBold size={16} /> : <PiEyeBold size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="configuracion__modal-actions">
                {!editingMiembro ? (
                  <>
                    <button className="btn btn--danger btn--sm" onClick={() => { remover(m.uid); setSelectedMiembro(null); }}>
                      Remover
                    </button>
                    <button className="btn btn--outline btn--sm" onClick={() => { setSelectedMiembro(null); }}>
                      Cerrar
                    </button>
                    <button className="btn btn--primary btn--sm" onClick={handleStartEdit}>
                      Editar
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn--outline btn--sm" onClick={() => setEditingMiembro(false)} disabled={savingMiembro}>
                      Cancelar
                    </button>
                    <button className="btn btn--primary btn--sm" onClick={handleSaveEdit} disabled={savingMiembro}>
                      {savingMiembro ? 'Guardando...' : 'Guardar'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </MainLayout>
  );
};

export default Configuracion;
