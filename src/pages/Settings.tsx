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

type Section = 'currency' | 'notifications' | 'install' | 'templates' | 'team' | 'backup' | 'manage' | 'membership' | 'language';

const CURRENCY_SYMBOLS = ['$', '€', '£', '¥', 'S/', 'R$', 'Q', '₩'];

type NavItem = { id: Section; icon: React.ReactNode; title: string; color: string };
type NavGroup = { label: string; items: NavItem[] };

const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateProfile, deleteAllData, deleteAccount, role } = useAuth();

  const getSectionTitle = (section: Section): string => {
    switch (section) {
      case 'currency':        return t('settings.sections.currency');
      case 'notifications': return t('settings.sections.notifications');
      case 'install':      return t('settings.sections.install');
      case 'templates':    return t('settings.sections.templates');
      case 'team':        return t('settings.sections.team');
      case 'backup':      return t('settings.sections.backup');
      case 'manage':       return t('settings.sections.manage');
      case 'membership':     return t('settings.sections.membership');
      case 'language':        return t('settings.sections.language');
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
  const preferencesItems: NavItem[] = [
    ...(role !== 'member' ? [{ id: 'currency' as Section, icon: <PiCurrencyDollarBold size={16} />, title: t('settings.sections.currency'), color: 'yellow' }] : []),
    { id: 'notifications' as Section, icon: notifPermission === 'granted' ? <PiBellBold size={16} /> : <PiBellSlashBold size={16} />, title: t('settings.sections.notifications'), color: notifPermission === 'granted' ? 'green' : 'gray' },
    { id: 'language' as Section, icon: <PiTranslateBold size={16} />, title: t('settings.sections.language'), color: 'blue' },
    ...(canInstall ? [{ id: 'install' as Section, icon: <PiDownloadBold size={16} />, title: t('settings.sections.install'), color: 'teal' }] : []),
  ];

  const navGroups: NavGroup[] = role === 'member'
    ? [
        { label: t('settings.groups.preferences'), items: preferencesItems },
        { label: t('settings.groups.business'), items: [{ id: 'templates', icon: <PiChatTextBold size={16} />, title: t('settings.sections.templates'), color: 'purple' }] },
        { label: t('settings.groups.account'), items: [{ id: 'membership', icon: <PiUsersThreeBold size={16} />, title: t('settings.sections.membership'), color: 'blue' }] },
      ]
    : [
        { label: t('settings.groups.preferences'), items: preferencesItems },
        {
          label: t('settings.groups.business'),
          items: [
            { id: 'templates', icon: <PiChatTextBold size={16} />, title: t('settings.sections.templates'), color: 'purple' },
            { id: 'team', icon: <PiUsersThreeBold size={16} />, title: t('settings.sections.team'), color: 'blue' },
          ],
        },
        { label: t('settings.groups.data'), items: [{ id: 'backup', icon: <PiDownloadSimpleBold size={16} />, title: t('settings.sections.backup'), color: 'teal' }] },
        { label: t('settings.groups.account'), items: [{ id: 'manage', icon: <PiWarningBold size={16} />, title: t('settings.sections.manage'), color: 'gray' }] },
      ];

  // ── Panel renderer ───────────────────────────────────
  const renderPanel = () => {
    switch (activeSection) {
      case 'currency':
        if (role === 'member') return (
          <p className="settings__desc">{t('settings.currency.adminOnly')}</p>
        );
        return (
          <>
            <p className="settings__desc">
              {t('settings.currency.desc')}
            </p>
            <div className="settings__field-row">
              <select
                className="settings__select"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
              >
                {CURRENCY_SYMBOLS.map(s => (
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

      case 'notifications':
        return (
          <>
            <p className="settings__desc">
              {t('settings.notifications.desc')}
            </p>
            {!('Notification' in window) ? (
              <p className="settings__note">{t('settings.notifications.unsupported')}</p>
            ) : notifPermission === 'denied' ? (
              <p className="settings__notif-denied">
                {t('settings.notifications.blocked')}
              </p>
            ) : notifPermission === 'granted' ? (
              <div className="settings__actions">
                <span className="settings__notif-status settings__notif-status--on">
                  <PiBellBold size={13} /> {t('settings.notifications.active')}
                </span>
                <button className="btn btn--outline btn--sm" onClick={handleTestNotif}>
                  {t('settings.notifications.test')}
                </button>
              </div>
            ) : (
              <div className="settings__actions">
                <button className="btn btn--primary btn--sm" onClick={requestNotifPermission}>
                  <PiBellBold size={15} />
                  {t('settings.notifications.activate')}
                </button>
              </div>
            )}
          </>
        );

      case 'install':
        return (
          <>
            <p className="settings__desc">
              {t('settings.install.desc')}
            </p>
            <div className="settings__actions">
              <button className="btn btn--primary btn--sm" onClick={promptInstall}>
                <PiDownloadBold size={15} />
                {t('settings.install.button')}
              </button>
            </div>
          </>
        );

      case 'templates':
        return <TemplatesPanel />;

      case 'team':
        return (
          <>
            <p className="settings__desc">
              {t('settings.team.desc')}
            </p>

            {/* Member list */}
            {teamLoading ? (
              <p className="settings__desc">{t('settings.team.loading')}</p>
            ) : members.length === 0 ? (
              <p className="settings__empty-list">{t('settings.team.empty')}</p>
            ) : (
              <div className="settings__team-list">
                {members.map(m => (
                  <div
                    key={m.uid}
                    className="settings__team-item settings__team-item--clickable"
                    onClick={() => setSelectedMember(m)}
                  >
                    <div className="settings__team-avatar">
                      <Avatar
                        src={m.profilePhoto}
                        seed={m.uid}
                        alt={m.firstName}
                      />
                    </div>
                    <div className="settings__team-info">
                      <div className="settings__team-name-row">
                        <span className="settings__team-name">{m.firstName} {m.lastName}</span>
                        <PiUserBold size={11} color="#2368C4" />
                      </div>
                      <span className="settings__team-email">{m.username}{m.memberNumber ? ` · Nº ${m.memberNumber}` : ''}</span>
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

      case 'backup':
        return <BackupPanel />;

      case 'manage':
        return (
          <div className="settings__backup-blocks">
            <div className="settings__backup-block">
              <p className="settings__backup-title">{t('settings.manage.deleteDataTitle')}</p>
              <p className="settings__desc">
                {t('settings.manage.deleteDataDesc')}
              </p>
              <div className="settings__actions">
                <button className="btn btn--danger btn--sm" onClick={() => setDangerModal('deleteData')}>
                  <PiTrashBold size={14} />
                  {t('settings.manage.deleteDataButton')}
                </button>
              </div>
            </div>
            <div className="settings__backup-block">
              <p className="settings__backup-title">{t('settings.manage.deleteAccountTitle')}</p>
              <p className="settings__desc">
                {t('settings.manage.deleteAccountDesc')}
              </p>
              <div className="settings__actions">
                <button className="btn btn--danger btn--sm" onClick={() => setDangerModal('deleteAccount')}>
                  <PiUserMinusBold size={14} />
                  {t('settings.manage.deleteAccountButton')}
                </button>
              </div>
            </div>
          </div>
        );

      case 'membership':
        return (
          <>
            <p className="settings__desc">
              {t('settings.membership.desc')}
            </p>

            {businessAdmin && (
              <div className="settings__membership-section">
                <p className="settings__membership-label">{t('settings.membership.admin')}</p>
                <div className="settings__team-item">
                  <div className="settings__team-avatar">
                    <Avatar
                      src={businessAdmin.profilePhoto}
                      seed={businessAdmin.uid}
                      alt={businessAdmin.firstName}
                    />
                  </div>
                  <div className="settings__team-info">
                    <div className="settings__team-name-row">
                      <span className="settings__team-name">{businessAdmin.firstName} {businessAdmin.lastName}</span>
                      <PiShieldCheckBold size={11} color="#F8A800" />
                    </div>
                    <span className="settings__team-email">{businessAdmin.businessName}</span>
                  </div>
                </div>
              </div>
            )}

            {teammates.length > 0 && (
              <div className="settings__membership-section">
                <p className="settings__membership-label">{t('settings.membership.teammates')}</p>
                <div className="settings__team-list">
                  {teammates.map(m => (
                    <div key={m.uid} className="settings__team-item">
                      <div className="settings__team-avatar">
                        <Avatar
                          src={m.profilePhoto}
                          seed={m.uid}
                          alt={m.firstName}
                        />
                      </div>
                      <div className="settings__team-info">
                        <div className="settings__team-name-row">
                          <span className="settings__team-name">{m.firstName} {m.lastName}</span>
                          <PiUserBold size={11} color="#2368C4" />
                        </div>
                        <span className="settings__team-email">{m.username}{m.memberNumber ? ` · Nº ${m.memberNumber}` : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="settings__actions">
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

      case 'language':
        return (
          <>
            <p className="settings__desc">
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
    <div className="settings-page">
      <div className="settings">
        {/* Nav */}
        <nav className={`settings__nav${activeSection ? ' settings__nav--hidden' : ''}`}>
          <div className="settings__nav-header">
            <button className="settings__back-btn" onClick={() => navigate(-1)}>
              <PiArrowLeftBold size={20} />
            </button>
            <p className="settings__nav-title">{t('settings.title')}</p>
          </div>
          {navGroups.map(group => (
            <div key={group.label} className="settings__group">
              <p className="settings__group-label">{group.label}</p>
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`settings__row${activeSection === item.id ? ' settings__row--active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <span className={`settings__row-icon settings__row-icon--${item.color}`}>
                    {item.icon}
                  </span>
                  <span className="settings__row-title">{item.title}</span>
                  <PiCaretRightBold size={12} className="settings__row-chevron" />
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Detail panel */}
        <div className={`settings__detail${!activeSection ? ' settings__detail--hidden' : ''}`}>
          {activeSection && (
            <div className="settings__detail-header">
              <button className="settings__back" onClick={() => setActiveSection(null)}>
                <PiArrowLeftBold size={15} />
                {t('settings.back')}
              </button>
              <h2 className="settings__detail-title">{getSectionTitle(activeSection)}</h2>
            </div>
          )}
          <div className="settings__detail-inner">
            {activeSection ? renderPanel() : (
              <div className="settings__placeholder">
                <PiGearSixBold size={36} className="settings__placeholder-icon" />
                <p className="settings__placeholder-title">{t('settings.title')}</p>
                <p className="settings__placeholder-desc">{t('settings.selectOption')}</p>
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
