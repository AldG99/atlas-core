import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

const Configuracion = () => {
  const { t } = useTranslation();
  const { user, updateProfile, deleteAllData, deleteAccount, role } = useAuth();

  const getSectionTitle = (section: Section): string => {
    switch (section) {
      case 'moneda':        return t('settings.sections.currency');
      case 'notificaciones': return t('settings.sections.notifications');
      case 'instalar':      return t('settings.sections.install');
      case 'plantillas':    return t('settings.sections.templates');
      case 'equipo':        return t('settings.sections.team');
      case 'respaldo':      return t('settings.sections.backup');
      case 'gestion':       return t('settings.sections.manage');
      case 'membresia':     return t('settings.sections.membership');
    }
  };
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
    sendNotification(t('settings.notifications.testTitle'), { body: t('settings.notifications.testBody') });
  };

  // Plantillas
  const { draft: plantillas, setDraft: setPlantillas, saving: savingPlantillas, isDirty: plantillasDirty, save: savePlantillas, reset: resetPlantillas, resetToDefaults } = useTemplates();
  type PlantillaKey = 'confirmacion' | 'preparacion' | 'entrega';
  const [plantillaTab, setPlantillaTab] = useState<PlantillaKey>('confirmacion');

  const PLANTILLA_TABS: { key: PlantillaKey; label: string }[] = [
    { key: 'confirmacion', label: t('settings.templates.tabConfirmation') },
    { key: 'preparacion',  label: t('settings.templates.tabPreparation') },
    { key: 'entrega',      label: t('settings.templates.tabDelivery') },
  ];

  const VARIABLES_INFO = t('settings.templates.variables');

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

  // ── Moneda ──────────────────────────────────────────
  const handleSaveMoneda = async () => {
    setSavingMoneda(true);
    try {
      await updateProfile({ moneda });
      showToast(t('settings.currency.saveSuccess'), 'success');
    } catch {
      showToast(t('settings.currency.saveError'), 'error');
    } finally {
      setSavingMoneda(false);
    }
  };

  // ── Equipo ──────────────────────────────────────────
  const handleCrearMiembro = async (form: { nombre: string; apellido: string; fechaNacimiento: string; telefono: string; telefonoCodigoPais: string; password: string }) => {
    await crearMiembro(form);
    showToast(t('settings.team.created'), 'success');
  };

  // ── Membresía ────────────────────────────────────────
  const handleSalirNegocio = async () => {
    if (!user) return;
    setSalirLoading(true);
    try {
      await salirDelNegocio(user.uid);
      window.location.reload();
    } catch {
      showToast(t('settings.membership.leaveError'), 'error');
      setSalirLoading(false);
    }
  };

  // ── Zona de peligro ─────────────────────────────────
  const handleDeleteData = async (password: string) => {
    await deleteAllData(password);
    showToast(t('settings.dangerModal.deleteDataSuccess'), 'success');
    setDangerModal(null);
  };

  const handleDeleteAccount = async (password: string) => {
    await deleteAccount(password);
  };

  // ── Nav groups ───────────────────────────────────────
  const preferenciasItems: NavItem[] = [
    ...(role !== 'miembro' ? [{ id: 'moneda' as Section, icon: <PiCurrencyDollarBold size={16} />, title: t('settings.sections.currency'), color: 'yellow' }] : []),
    { id: 'notificaciones', icon: notifPermission === 'granted' ? <PiBellBold size={16} /> : <PiBellSlashBold size={16} />, title: t('settings.sections.notifications'), color: notifPermission === 'granted' ? 'green' : 'gray' },
    ...(canInstall ? [{ id: 'instalar' as Section, icon: <PiDownloadBold size={16} />, title: t('settings.sections.install'), color: 'teal' }] : []),
  ];

  const navGroups: NavGroup[] = role === 'miembro'
    ? [
        { label: t('settings.groups.preferences'), items: preferenciasItems },
        { label: t('settings.groups.business'), items: [{ id: 'plantillas', icon: <PiChatTextBold size={16} />, title: t('settings.sections.templates'), color: 'purple' }] },
        { label: t('settings.groups.account'), items: [{ id: 'membresia', icon: <PiUsersThreeBold size={16} />, title: t('settings.sections.membership'), color: 'blue' }] },
      ]
    : [
        { label: t('settings.groups.preferences'), items: preferenciasItems },
        {
          label: t('settings.groups.business'),
          items: [
            { id: 'plantillas', icon: <PiChatTextBold size={16} />, title: t('settings.sections.templates'), color: 'purple' },
            { id: 'equipo', icon: <PiUsersThreeBold size={16} />, title: t('settings.sections.team'), color: 'blue' },
          ],
        },
        { label: t('settings.groups.data'), items: [{ id: 'respaldo', icon: <PiDownloadSimpleBold size={16} />, title: t('settings.sections.backup'), color: 'teal' }] },
        { label: t('settings.groups.account'), items: [{ id: 'gestion', icon: <PiWarningBold size={16} />, title: t('settings.sections.manage'), color: 'gray' }] },
      ];

  // ── Panel renderer ───────────────────────────────────
  const renderPanel = () => {
    switch (activeSection) {
      case 'moneda':
        if (role === 'miembro') return (
          <p className="configuracion__desc">{t('settings.currency.adminOnly')}</p>
        );
        return (
          <>
            <p className="configuracion__desc">
              {t('settings.currency.desc')}
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
                {savingMoneda ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </>
        );

      case 'notificaciones':
        return (
          <>
            <p className="configuracion__desc">
              {t('settings.notifications.desc')}
            </p>
            {!('Notification' in window) ? (
              <p className="configuracion__note">{t('settings.notifications.unsupported')}</p>
            ) : notifPermission === 'denied' ? (
              <p className="configuracion__notif-denied">
                {t('settings.notifications.blocked')}
              </p>
            ) : notifPermission === 'granted' ? (
              <div className="configuracion__actions">
                <span className="configuracion__notif-status configuracion__notif-status--on">
                  <PiBellBold size={13} /> {t('settings.notifications.active')}
                </span>
                <button className="btn btn--outline btn--sm" onClick={handleTestNotif}>
                  {t('settings.notifications.test')}
                </button>
              </div>
            ) : (
              <div className="configuracion__actions">
                <button className="btn btn--primary btn--sm" onClick={requestNotifPermission}>
                  <PiBellBold size={15} />
                  {t('settings.notifications.activate')}
                </button>
              </div>
            )}
          </>
        );

      case 'instalar':
        return (
          <>
            <p className="configuracion__desc">
              {t('settings.install.desc')}
            </p>
            <div className="configuracion__actions">
              <button className="btn btn--primary btn--sm" onClick={promptInstall}>
                <PiDownloadBold size={15} />
                {t('settings.install.button')}
              </button>
            </div>
          </>
        );

      case 'plantillas':
        return (
          <div className="configuracion__plantillas-panel">
            <p className="configuracion__desc">
              {t('settings.templates.desc')}
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
              placeholder={t('settings.templates.placeholder')}
            />
            <div className="configuracion__actions">
              <button
                className="btn btn--outline btn--sm"
                onClick={resetToDefaults}
                title={t('settings.templates.restore')}
              >
                <PiArrowCounterClockwiseBold size={14} />
                {t('settings.templates.restore')}
              </button>
              <button
                className="btn btn--outline btn--sm"
                onClick={resetPlantillas}
                disabled={!plantillasDirty}
              >
                {t('settings.templates.cancel')}
              </button>
              <button
                className="btn btn--primary btn--sm"
                onClick={savePlantillas}
                disabled={savingPlantillas || !plantillasDirty}
              >
                {savingPlantillas ? t('settings.templates.saving') : t('settings.templates.save')}
              </button>
            </div>
          </div>
        );

      case 'equipo':
        return (
          <>
            <p className="configuracion__desc">
              {t('settings.team.desc')}
            </p>

            {/* Member list */}
            {equipoLoading ? (
              <p className="configuracion__desc">{t('settings.team.loading')}</p>
            ) : miembros.length === 0 ? (
              <p className="configuracion__empty-list">{t('settings.team.empty')}</p>
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
              {t('settings.team.newMember')}
            </button>
          </>
        );

      case 'respaldo':
        return (
          <div className="configuracion__backup-blocks">
            {/* Exportar */}
            <div className="configuracion__backup-block">
              <p className="configuracion__backup-title">{t('settings.backup.exportTitle')}</p>
              <p className="configuracion__desc">
                {t('settings.backup.exportDesc')}
              </p>
              <p className="configuracion__note">
                {t('settings.backup.exportNote')}
              </p>
              <div className="configuracion__actions">
                <button
                  className="btn btn--primary btn--sm"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  <PiDownloadSimpleBold size={15} />
                  {exporting ? t('settings.backup.exporting') : t('settings.backup.exportButton')}
                </button>
              </div>
            </div>

            {/* Importar */}
            <div className="configuracion__backup-block">
              <p className="configuracion__backup-title">{t('settings.backup.importTitle')}</p>
              <p className="configuracion__desc">
                {t('settings.backup.importDesc')}
              </p>
              <p className="configuracion__note">
                {t('settings.backup.importNote')}
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
                    {new Date(backupData.exportadoEn).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}
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
                    {t('settings.backup.doneDesc', { clients: importResult.clientes, products: importResult.productos, orders: importResult.pedidos, labels: importResult.etiquetas })}
                    {importResult.omitidos > 0 && t('settings.backup.doneOmitted', { count: importResult.omitidos })}
                  </p>
                  <button className="btn btn--outline btn--sm" onClick={handleReset}>{t('settings.backup.accept')}</button>
                </div>
              )}
            </div>
          </div>
        );

      case 'gestion':
        return (
          <div className="configuracion__backup-blocks">
            <div className="configuracion__backup-block">
              <p className="configuracion__backup-title">{t('settings.manage.deleteDataTitle')}</p>
              <p className="configuracion__desc">
                {t('settings.manage.deleteDataDesc')}
              </p>
              <div className="configuracion__actions">
                <button className="btn btn--danger btn--sm" onClick={() => setDangerModal('deleteData')}>
                  <PiTrashBold size={14} />
                  {t('settings.manage.deleteDataButton')}
                </button>
              </div>
            </div>
            <div className="configuracion__backup-block">
              <p className="configuracion__backup-title">{t('settings.manage.deleteAccountTitle')}</p>
              <p className="configuracion__desc">
                {t('settings.manage.deleteAccountDesc')}
              </p>
              <div className="configuracion__actions">
                <button className="btn btn--danger btn--sm" onClick={() => setDangerModal('deleteAccount')}>
                  <PiUserMinusBold size={14} />
                  {t('settings.manage.deleteAccountButton')}
                </button>
              </div>
            </div>
          </div>
        );

      case 'membresia':
        return (
          <>
            <p className="configuracion__desc">
              {t('settings.membership.desc')}
            </p>

            {adminNegocio && (
              <div className="configuracion__membresia-section">
                <p className="configuracion__membresia-label">{t('settings.membership.admin')}</p>
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
                <p className="configuracion__membresia-label">{t('settings.membership.teammates')}</p>
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
                {salirLoading ? t('settings.membership.leaving') : t('settings.membership.leave')}
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
          <p className="configuracion__nav-title">{t('settings.title')}</p>
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
            {t('settings.back')}
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
              <p className="configuracion__placeholder-title">{t('settings.title')}</p>
              <p className="configuracion__placeholder-desc">{t('settings.selectOption')}</p>
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
