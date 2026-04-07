import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PiDownloadSimpleBold,
  PiCurrencyDollarBold,
  PiTrashBold,
  PiUserMinusBold,
  PiWarningBold,
  PiChatTextBold,
  PiBellBold,
  PiBellSlashBold,
  PiDownloadBold,
  PiUsersThreeBold,
  PiCaretRightBold,
  PiArrowLeftBold,
  PiUserBold,
  PiShieldCheckBold,
  PiGearSixBold,
  PiTranslateBold,
} from 'react-icons/pi';
import type { User } from '../types/User';
import { usePWA } from '../hooks/usePWA';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useEquipo } from '../hooks/useEquipo';
import { salirDelNegocio, getAdminPorUid, getMiembros } from '../services/equipoService';
import Avatar from '../components/ui/Avatar';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import DangerModal from '../components/configuracion/DangerModal';
import CrearMiembroModal from '../components/configuracion/CrearMiembroModal';
import MiembroPerfilModal from '../components/configuracion/MiembroPerfilModal';
import RespaldoPanel from '../components/configuracion/RespaldoPanel';
import PlantillasPanel from '../components/configuracion/PlantillasPanel';
import './Configuracion.scss';

type Section = 'moneda' | 'notificaciones' | 'instalar' | 'plantillas' | 'equipo' | 'respaldo' | 'gestion' | 'membresia' | 'idioma';

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
      case 'idioma':        return t('settings.sections.language');
    }
  };
  const { showToast } = useToast();

  // Active section
  const [activeSection, setActiveSection] = useState<Section | null>(null);

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
    { id: 'notificaciones' as Section, icon: notifPermission === 'granted' ? <PiBellBold size={16} /> : <PiBellSlashBold size={16} />, title: t('settings.sections.notifications'), color: notifPermission === 'granted' ? 'green' : 'gray' },
    { id: 'idioma' as Section, icon: <PiTranslateBold size={16} />, title: t('settings.sections.language'), color: 'blue' },
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
        return <PlantillasPanel />;

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
        return <RespaldoPanel />;

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

      case 'idioma':
        return (
          <>
            <p className="configuracion__desc">
              {t('settings.language.desc')}
            </p>
            <LanguageSwitcher />
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
