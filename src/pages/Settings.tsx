import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useTeam } from '../hooks/useTeam';
import { leaveBusiness, getAdminByUid, getMembers } from '../services/teamService';
import Avatar from '../components/ui/Avatar';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import DangerModal from '../components/settings/DangerModal';
import CreateMemberModal from '../components/settings/CreateMemberModal';
import MemberProfileModal from '../components/settings/MemberProfileModal';
import BackupPanel from '../components/settings/BackupPanel';
import TemplatesPanel from '../components/settings/TemplatesPanel';
import { getPlanLimits } from '../constants/planLimits';
import './Settings.scss';

type Section = 'moneda' | 'notificaciones' | 'instalar' | 'plantillas' | 'equipo' | 'respaldo' | 'gestion' | 'membresia' | 'idioma';

const SIMBOLOS_MONEDA = ['$', '€', '£', '¥', 'S/', 'R$', 'Q', '₩'];

type NavItem = { id: Section; icon: React.ReactNode; title: string; color: string };
type NavGroup = { label: string; items: NavItem[] };

const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const rawCurrency = user?.currency ?? '$';
  const [currency, setCurrency] = useState(LEGACY_MAP[rawCurrency] ?? rawCurrency);
  const [savingCurrency, setSavingCurrency] = useState(false);

  // PWA
  const { canInstall, promptInstall, notifPermission, requestNotifPermission, sendNotification } = usePWA();

  const handleTestNotif = () => {
    sendNotification(t('settings.notifications.testTitle'), { body: t('settings.notifications.testBody') });
  };

  // Zona de peligro
  const [dangerModal, setDangerModal] = useState<'deleteData' | 'deleteAccount' | null>(null);

  // Equipo
  const { members, loading: teamLoading, createMember, remove, update, updatePassword } = useTeam();
  const [showCreateMember, setShowCreateMember] = useState(false);
  const planAllowsMembers = getPlanLimits(user?.plan).members > 0;

  // Perfil de miembro
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  // Membresía (datos del negocio para miembros)
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [businessAdmin, setBusinessAdmin] = useState<User | null>(null);
  const [teammates, setTeammates] = useState<User[]>([]);

  useEffect(() => {
    if (role !== 'member' || !user?.businessUid) return;
    getAdminByUid(user.businessUid).then(setBusinessAdmin);
    getMembers(user.businessUid).then(data =>
      setTeammates(data.filter(m => m.uid !== user.uid))
    );
  }, [role, user?.businessUid, user?.uid]);

  // ── Moneda ──────────────────────────────────────────
  const handleSaveCurrency = async () => {
    setSavingCurrency(true);
    try {
      await updateProfile({ currency });
      showToast(t('settings.currency.saveSuccess'), 'success');
    } catch {
      showToast(t('settings.currency.saveError'), 'error');
    } finally {
      setSavingCurrency(false);
    }
  };

  // ── Equipo ──────────────────────────────────────────
  const handleCreateMember = async (form: { firstName: string; lastName: string; birthDate: string; phone: string; phoneCountryCode: string; password: string }) => {
    await createMember(form);
    showToast(t('settings.team.created'), 'success');
  };

  // ── Membresía ────────────────────────────────────────
  const handleLeaveBusiness = async () => {
    if (!user) return;
    setLeaveLoading(true);
    try {
      await leaveBusiness(user.uid);
      window.location.reload();
    } catch {
      showToast(t('settings.membership.leaveError'), 'error');
      setLeaveLoading(false);
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
    ...(role !== 'member' ? [{ id: 'moneda' as Section, icon: <PiCurrencyDollarBold size={16} />, title: t('settings.sections.currency'), color: 'yellow' }] : []),
    { id: 'notificaciones' as Section, icon: notifPermission === 'granted' ? <PiBellBold size={16} /> : <PiBellSlashBold size={16} />, title: t('settings.sections.notifications'), color: notifPermission === 'granted' ? 'green' : 'gray' },
    { id: 'idioma' as Section, icon: <PiTranslateBold size={16} />, title: t('settings.sections.language'), color: 'blue' },
    ...(canInstall ? [{ id: 'instalar' as Section, icon: <PiDownloadBold size={16} />, title: t('settings.sections.install'), color: 'teal' }] : []),
  ];

  const navGroups: NavGroup[] = role === 'member'
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
        if (role === 'member') return (
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
                value={currency}
                onChange={e => setCurrency(e.target.value)}
              >
                {SIMBOLOS_MONEDA.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                className="btn btn--primary btn--sm"
                onClick={handleSaveCurrency}
                disabled={savingCurrency || currency === (LEGACY_MAP[rawCurrency] ?? rawCurrency)}
              >
                {savingCurrency ? t('common.saving') : t('common.save')}
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
        return <TemplatesPanel />;

      case 'equipo':
        return (
          <>
            <p className="configuracion__desc">
              {t('settings.team.desc')}
            </p>

            {/* Member list */}
            {teamLoading ? (
              <p className="configuracion__desc">{t('settings.team.loading')}</p>
            ) : members.length === 0 ? (
              <p className="configuracion__empty-list">{t('settings.team.empty')}</p>
            ) : (
              <div className="configuracion__equipo-list">
                {members.map(m => (
                  <div
                    key={m.uid}
                    className="configuracion__equipo-item configuracion__equipo-item--clickable"
                    onClick={() => setSelectedMember(m)}
                  >
                    <div className="configuracion__equipo-avatar">
                      <Avatar
                        src={m.profilePhoto}
                        initials={`${(m.firstName?.[0] ?? '?').toUpperCase()}${(m.lastName?.[0] ?? '').toUpperCase()}`}
                        alt={m.firstName}
                      />
                    </div>
                    <div className="configuracion__equipo-info">
                      <div className="configuracion__equipo-name-row">
                        <span className="configuracion__equipo-name">{m.firstName} {m.lastName}</span>
                        <PiUserBold size={11} color="#2368C4" />
                      </div>
                      <span className="configuracion__equipo-email">{m.username}{m.memberNumber ? ` · Nº ${m.memberNumber}` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              className="btn btn--primary btn--sm"
              onClick={() => setShowCreateMember(true)}
              disabled={!planAllowsMembers}
              title={!planAllowsMembers ? t('settings.team.upgradePlanToAdd') : undefined}
            >
              {t('settings.team.newMember')}
            </button>
          </>
        );

      case 'respaldo':
        return <BackupPanel />;

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

            {businessAdmin && (
              <div className="configuracion__membresia-section">
                <p className="configuracion__membresia-label">{t('settings.membership.admin')}</p>
                <div className="configuracion__equipo-item">
                  <div className="configuracion__equipo-avatar">
                    <Avatar
                      src={businessAdmin.profilePhoto}
                      initials={`${(businessAdmin.firstName?.[0] ?? '?').toUpperCase()}${(businessAdmin.lastName?.[0] ?? '').toUpperCase()}`}
                      alt={businessAdmin.firstName}
                    />
                  </div>
                  <div className="configuracion__equipo-info">
                    <div className="configuracion__equipo-name-row">
                      <span className="configuracion__equipo-name">{businessAdmin.firstName} {businessAdmin.lastName}</span>
                      <PiShieldCheckBold size={11} color="#F8A800" />
                    </div>
                    <span className="configuracion__equipo-email">{businessAdmin.businessName}</span>
                  </div>
                </div>
              </div>
            )}

            {teammates.length > 0 && (
              <div className="configuracion__membresia-section">
                <p className="configuracion__membresia-label">{t('settings.membership.teammates')}</p>
                <div className="configuracion__equipo-list">
                  {teammates.map(m => (
                    <div key={m.uid} className="configuracion__equipo-item">
                      <div className="configuracion__equipo-avatar">
                        <Avatar
                          src={m.profilePhoto}
                          initials={`${(m.firstName?.[0] ?? '?').toUpperCase()}${(m.lastName?.[0] ?? '').toUpperCase()}`}
                          alt={m.firstName}
                        />
                      </div>
                      <div className="configuracion__equipo-info">
                        <div className="configuracion__equipo-name-row">
                          <span className="configuracion__equipo-name">{m.firstName} {m.lastName}</span>
                          <PiUserBold size={11} color="#2368C4" />
                        </div>
                        <span className="configuracion__equipo-email">{m.username}{m.memberNumber ? ` · Nº ${m.memberNumber}` : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="configuracion__actions">
              <button
                className="btn btn--danger btn--sm"
                onClick={handleLeaveBusiness}
                disabled={leaveLoading}
              >
                <PiUserMinusBold size={15} />
                {leaveLoading ? t('settings.membership.leaving') : t('settings.membership.leave')}
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
            <LanguageSwitcher vertical />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="configuracion-page">
      <div className="configuracion">
        {/* Nav */}
        <nav className={`configuracion__nav${activeSection ? ' configuracion__nav--hidden' : ''}`}>
          <div className="configuracion__nav-header">
            <button className="configuracion__back-btn" onClick={() => navigate(-1)}>
              <PiArrowLeftBold size={20} />
            </button>
            <p className="configuracion__nav-title">{t('settings.title')}</p>
          </div>
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
          {activeSection && (
            <div className="configuracion__detail-header">
              <button className="configuracion__back" onClick={() => setActiveSection(null)}>
                <PiArrowLeftBold size={15} />
                {t('settings.back')}
              </button>
              <h2 className="configuracion__detail-title">{getSectionTitle(activeSection)}</h2>
            </div>
          )}
          <div className="configuracion__detail-inner">
            {activeSection ? renderPanel() : (
              <div className="configuracion__placeholder">
                <PiGearSixBold size={36} className="configuracion__placeholder-icon" />
                <p className="configuracion__placeholder-title">{t('settings.title')}</p>
                <p className="configuracion__placeholder-desc">{t('settings.selectOption')}</p>
              </div>
            )}
          </div>
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

      {showCreateMember && (
        <CreateMemberModal
          onClose={() => setShowCreateMember(false)}
          onSubmit={handleCreateMember}
        />
      )}

      {selectedMember && (
        <MemberProfileModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onRemove={(uid) => { remove(uid); setSelectedMember(null); }}
          onUpdate={update}
          onUpdatePassword={updatePassword}
        />
      )}
    </div>
  );
};

export default Settings;
