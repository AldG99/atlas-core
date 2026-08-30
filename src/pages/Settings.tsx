import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  DownloadCloud,
  DollarSign,
  Trash2,
  UserMinus,
  TriangleAlert,
  MessageSquareText,
  Bell,
  BellOff,
  Download,
  ChevronRight,
  ArrowLeft,
  Settings2,
  Languages,
} from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { ROUTES } from '../config/routes';
import { hasRecentBackup } from '../utils/backupReminder';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import DangerModal from '../components/settings/DangerModal';
import BackupPanel from '../components/settings/BackupPanel';
import TemplatesPanel from '../components/settings/TemplatesPanel';
import './Settings.scss';

type Section = 'currency' | 'notifications' | 'install' | 'templates' | 'backup' | 'deleteData' | 'deleteAccount' | 'language';

const CURRENCY_SYMBOLS = ['$', '€', '£', '¥', 'S/', 'R$', 'Q', '₩'];

type NavItem = { id: Section; icon: React.ReactNode; title: string; color: string };
type NavGroup = { label: string; items: NavItem[] };

const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateProfile, deleteAllData, deleteAccount } = useAuth();

  const getSectionTitle = (section: Section): string => {
    switch (section) {
      case 'currency':        return t('settings.sections.currency');
      case 'notifications': return t('settings.sections.notifications');
      case 'install':      return t('settings.sections.install');
      case 'templates':    return t('settings.sections.templates');
      case 'backup':      return t('settings.sections.backup');
      case 'deleteData':   return t('settings.manage.deleteDataTitle');
      case 'deleteAccount': return t('settings.manage.deleteAccountTitle');
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

  // ── Zona de peligro ─────────────────────────────────
  const handleDeleteData = async (password: string) => {
    await deleteAllData(password);
    // Recarga dura: los contextos (Orders/Clients/Products) siguen en memoria
    // con los datos ya borrados; volver al Dashboard desde cero los rehidrata
    // vacíos. Cualquier throw se propaga a DangerModal (no llegamos aquí).
    window.location.assign(ROUTES.DASHBOARD);
  };

  const handleDeleteAccount = async (password: string) => {
    await deleteAccount(password);
  };

  // Gate de respaldo: si el plan permite backup, no se puede borrar datos ni
  // cuenta sin un respaldo reciente (últimos 7 días, por dispositivo). Los planes
  // sin backup no pueden cumplirlo, así que ahí solo aplica el password del modal.
  const canBackup = user?.plan === 'pro' || user?.plan === 'enterprise';
  const backupGateOk = !canBackup || hasRecentBackup();
  const backupGateShortcut = canBackup && !backupGateOk && (
    <div className="settings__actions">
      <button className="btn btn--outline btn--sm" onClick={() => setActiveSection('backup')}>
        <DownloadCloud size={14} />
        {t('settings.sections.backup')}
      </button>
    </div>
  );

  // ── Nav groups ───────────────────────────────────────
  const preferencesItems: NavItem[] = [
    { id: 'currency' as Section, icon: <DollarSign size={16} />, title: t('settings.sections.currency'), color: 'yellow' },
    { id: 'notifications' as Section, icon: notifPermission === 'granted' ? <Bell size={16} /> : <BellOff size={16} />, title: t('settings.sections.notifications'), color: notifPermission === 'granted' ? 'green' : 'gray' },
    { id: 'language' as Section, icon: <Languages size={16} />, title: t('settings.sections.language'), color: 'blue' },
    ...(canInstall ? [{ id: 'install' as Section, icon: <Download size={16} />, title: t('settings.sections.install'), color: 'teal' }] : []),
  ];

  const navGroups: NavGroup[] = [
    { label: t('settings.groups.preferences'), items: preferencesItems },
    {
      label: t('settings.groups.business'),
      items: [
        { id: 'templates', icon: <MessageSquareText size={16} />, title: t('settings.sections.templates'), color: 'purple' },
      ],
    },
    {
      label: t('settings.groups.data'),
      items: [
        { id: 'backup', icon: <DownloadCloud size={16} />, title: t('settings.sections.backup'), color: 'teal' },
        { id: 'deleteData', icon: <Trash2 size={16} />, title: t('settings.manage.deleteDataTitle'), color: 'gray' },
      ],
    },
    { label: t('settings.groups.account'), items: [{ id: 'deleteAccount', icon: <TriangleAlert size={16} />, title: t('settings.manage.deleteAccountTitle'), color: 'gray' }] },
  ];

  // ── Panel renderer ───────────────────────────────────
  const renderPanel = () => {
    switch (activeSection) {
      case 'currency':
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
                  <Bell size={13} /> {t('settings.notifications.active')}
                </span>
                <button className="btn btn--outline btn--sm" onClick={handleTestNotif}>
                  {t('settings.notifications.test')}
                </button>
              </div>
            ) : (
              <div className="settings__actions">
                <button className="btn btn--primary btn--sm" onClick={requestNotifPermission}>
                  <Bell size={15} />
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
                <Download size={15} />
                {t('settings.install.button')}
              </button>
            </div>
          </>
        );

      case 'templates':
        return <TemplatesPanel />;

      case 'backup':
        return <BackupPanel />;

      case 'deleteData':
        return (
          <div className="settings__backup-blocks">
            <div className="settings__backup-block">
              <p className="settings__desc">{t('settings.manage.deleteDataDesc')}</p>
              {backupGateShortcut}
              <div className="settings__actions">
                <button
                  className="btn btn--danger btn--sm"
                  onClick={() => setDangerModal('deleteData')}
                  disabled={!backupGateOk}
                >
                  <Trash2 size={14} />
                  {t('settings.manage.deleteDataButton')}
                </button>
              </div>
            </div>
          </div>
        );

      case 'deleteAccount':
        return (
          <div className="settings__backup-blocks">
            <div className="settings__backup-block">
              <p className="settings__desc">{t('settings.manage.deleteAccountDesc')}</p>
              <p className="settings__note">{t('settings.dangerModal.deleteAccountText')}</p>
              {backupGateShortcut}
              <div className="settings__actions">
                <button
                  className="btn btn--danger btn--sm"
                  onClick={() => setDangerModal('deleteAccount')}
                  disabled={!backupGateOk}
                >
                  <UserMinus size={14} />
                  {t('settings.manage.deleteAccountButton')}
                </button>
              </div>
            </div>
          </div>
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
              <ArrowLeft size={20} />
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
                  <ChevronRight size={12} className="settings__row-chevron" />
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
                <ArrowLeft size={15} />
                {t('settings.back')}
              </button>
              <h2 className="settings__detail-title">{getSectionTitle(activeSection)}</h2>
            </div>
          )}
          <div className="settings__detail-inner">
            {activeSection ? renderPanel() : (
              <div className="settings__placeholder">
                <Settings2 size={36} className="settings__placeholder-icon" />
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
    </div>
  );
};

export default Settings;
