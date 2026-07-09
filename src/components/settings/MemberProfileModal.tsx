import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PiUserBold, PiXBold, PiIdentificationBadgeBold,
  PiPhoneBold, PiCalendarBold, PiEyeBold, PiEyeSlashBold,
} from 'react-icons/pi';
import type { User } from '../../types/User';
import { formatPhone } from '../../utils/formatters';
import { getCountryCode } from '../../data/countryCodes';
import PhoneInput from '../clients/PhoneInput';
import Avatar from '../ui/Avatar';
import { useToast } from '../../hooks/useToast';

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountryCode: string;
  birthDate: string;
}

interface MemberProfileModalProps {
  member: User;
  onClose: () => void;
  onRemove: (uid: string) => void;
  onUpdate: (uid: string, data: ProfileData) => Promise<void>;
  onUpdatePassword: (uid: string, password: string) => Promise<void>;
}

const MemberProfileModal = ({
  member,
  onClose,
  onRemove,
  onUpdate,
  onUpdatePassword,
}: MemberProfileModalProps) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<ProfileData & { password: string; confirmPassword: string }>({
    firstName: member.firstName ?? '',
    lastName: member.lastName ?? '',
    phone: member.phone ?? '',
    phoneCountryCode: member.phoneCountryCode ?? 'MX',
    birthDate: member.birthDate ?? '',
    password: '',
    confirmPassword: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
  const initials = `${(member.firstName?.[0] ?? '').toUpperCase()}${(member.lastName?.[0] ?? '').toUpperCase()}`;
  const countryCode = member.phoneCountryCode ? getCountryCode(member.phoneCountryCode) : null;
  const formattedPhone = member.phone
    ? `${countryCode ? `${countryCode.code} ` : ''}${formatPhone(member.phone)}`
    : null;
  const birthDateStr = member.birthDate
    ? new Date(member.birthDate + 'T12:00:00').toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

  const handleStartEdit = () => {
    setEditForm({
      firstName: member.firstName ?? '',
      lastName: member.lastName ?? '',
      phone: member.phone ?? '',
      phoneCountryCode: member.phoneCountryCode ?? 'MX',
      birthDate: member.birthDate ?? '',
      password: '',
      confirmPassword: '',
    });
    setShowPwd(false);
    setShowConfirmPwd(false);
    setEditing(true);
  };

  const handleSave = async () => {
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      showToast(t('settings.team.profileModal.passwordMismatch'), 'warning');
      return;
    }
    if (editForm.password && editForm.password.length < 6) {
      showToast(t('settings.team.profileModal.passwordShort'), 'warning');
      return;
    }
    setSaving(true);
    try {
      const profileData: ProfileData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        phoneCountryCode: editForm.phoneCountryCode,
        birthDate: editForm.birthDate,
      };
      const { password } = editForm;
      await onUpdate(member.uid, profileData);
      if (password) await onUpdatePassword(member.uid, password);
      setEditing(false);
      showToast(t('settings.team.updated'), 'success');
    } catch {
      showToast(t('settings.team.updateError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="configuracion__modal-overlay" onClick={onClose}>
      <div className="configuracion__modal configuracion__modal--wide" onClick={e => e.stopPropagation()}>
        <div className="configuracion__modal-header">
          <PiUserBold size={20} className="configuracion__modal-icon--user" />
          <h3>{editing ? t('settings.team.profileModal.editTitle') : t('settings.team.profileModal.viewTitle')}</h3>
          <button className="configuracion__modal-close" onClick={onClose}>
            <PiXBold size={16} />
          </button>
        </div>
        <div className="configuracion__modal-body">
          {!editing ? (
            <>
              <div className="configuracion__miembro-profile">
                <div className="configuracion__miembro-avatar">
                  <Avatar src={member.profilePhoto} initials={initials || '?'} alt={fullName} />
                </div>
                <div className="configuracion__miembro-name">{fullName || '—'}</div>
                {member.memberNumber && (
                  <div className="configuracion__miembro-badge">#{member.memberNumber}</div>
                )}
              </div>
              <div className="configuracion__miembro-fields">
                <div className="configuracion__miembro-field">
                  <PiIdentificationBadgeBold size={14} className="configuracion__miembro-field-icon" />
                  <div>
                    <p className="configuracion__miembro-field-label">{t('settings.team.profileModal.username')}</p>
                    <p className="configuracion__miembro-field-value">{member.username ?? '—'}</p>
                  </div>
                </div>
                {formattedPhone && (
                  <div className="configuracion__miembro-field">
                    <PiPhoneBold size={14} className="configuracion__miembro-field-icon" />
                    <div>
                      <p className="configuracion__miembro-field-label">{t('settings.team.profileModal.phone')}</p>
                      <p className="configuracion__miembro-field-value">{formattedPhone}</p>
                    </div>
                  </div>
                )}
                {birthDateStr && (
                  <div className="configuracion__miembro-field">
                    <PiCalendarBold size={14} className="configuracion__miembro-field-icon" />
                    <div>
                      <p className="configuracion__miembro-field-label">{t('settings.team.profileModal.dob')}</p>
                      <p className="configuracion__miembro-field-value">{birthDateStr}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="configuracion__modal-row" style={{ gridTemplateColumns: '1fr' }}>
              <div className="configuracion__modal-row">
                <div className="configuracion__modal-field">
                  <label>{t('settings.team.createModal.firstName')}</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.firstName}
                    onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                    maxLength={40}
                  />
                </div>
                <div className="configuracion__modal-field">
                  <label>{t('settings.team.createModal.lastName')}</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.lastName}
                    onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                    maxLength={40}
                  />
                </div>
              </div>
              <div className="configuracion__modal-field">
                <label>{t('settings.team.profileModal.phone')}</label>
                <PhoneInput
                  value={editForm.phone}
                  countryCode={editForm.phoneCountryCode}
                  onChange={(val, cod) => setEditForm(f => ({ ...f, phone: val, phoneCountryCode: cod }))}
                />
              </div>
              <div className="configuracion__modal-field">
                <label>{t('settings.team.profileModal.dob')}</label>
                <input
                  type="date"
                  className="input"
                  value={editForm.birthDate}
                  onChange={e => setEditForm(f => ({ ...f, birthDate: e.target.value }))}
                />
              </div>
              <div className="configuracion__modal-field">
                <label>{t('settings.team.profileModal.newPassword')} <span className="configuracion__modal-optional">{t('common.optional')}</span></label>
                <div className="configuracion__modal-pwd">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="input"
                    placeholder="••••••••"
                    value={editForm.password}
                    onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                    maxLength={32}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? <PiEyeSlashBold size={16} /> : <PiEyeBold size={16} />}
                  </button>
                </div>
              </div>
              <div className="configuracion__modal-field">
                <label>{t('settings.team.profileModal.confirmPassword')}</label>
                <div className="configuracion__modal-pwd">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    className="input"
                    placeholder="••••••••"
                    value={editForm.confirmPassword}
                    onChange={e => setEditForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    maxLength={32}
                  />
                  <button type="button" onClick={() => setShowConfirmPwd(v => !v)}>
                    {showConfirmPwd ? <PiEyeSlashBold size={16} /> : <PiEyeBold size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="configuracion__modal-actions">
          {!editing ? (
            <>
              <button className="btn btn--danger btn--sm" onClick={() => { onRemove(member.uid); onClose(); }}>
                {t('settings.team.profileModal.remove')}
              </button>
              <button className="btn btn--outline btn--sm" onClick={onClose}>
                {t('settings.team.profileModal.close')}
              </button>
              <button className="btn btn--primary btn--sm" onClick={handleStartEdit}>
                {t('settings.team.profileModal.edit')}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn--outline btn--sm" onClick={() => setEditing(false)} disabled={saving}>
                {t('settings.team.profileModal.cancel')}
              </button>
              <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving}>
                {saving ? t('settings.team.profileModal.saving') : t('settings.team.profileModal.save')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberProfileModal;
