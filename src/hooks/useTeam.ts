import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import type { User } from '../types/User';
import {
  subscribeToMembers,
  createMember as createMemberService,
  deactivateMember,
  updateMember as updateMemberService,
  updateMemberPassword as updateMemberPasswordService,
  type MemberFormData,
} from '../services/teamService';
import { getPlanLimits } from '../constants/planLimits';
import i18n from '../i18n';

export const useTeam = () => {
  const { user, role, businessUid } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || role !== 'admin' || !businessUid) return;
    if (getPlanLimits(user.plan).members === 0) return;

    let active = true;
    setLoading(true);

    const unsub = subscribeToMembers(businessUid, (data) => {
      if (!active) return;
      setMembers(data);
      setLoading(false);
    });

    return () => {
      active = false;
      unsub();
    };
  }, [user, role, businessUid]);

  const createMember = async (data: MemberFormData): Promise<void> => {
    if (!user || !businessUid) throw new Error('No autenticado');

    const limits = getPlanLimits(user.plan);
    if (limits.members === 0) {
      throw new Error(i18n.t('errors.planNoMembers'));
    }
    if (members.length >= limits.members) {
      throw new Error(i18n.t('errors.planLimitReached', { limit: limits.members, resource: i18n.t('common.resources.members') }));
    }

    await createMemberService(data, businessUid, user.businessName);
    // onSnapshot actualizará la lista automáticamente
  };

  const remove = async (uid: string): Promise<void> => {
    await deactivateMember(uid);
  };

  const update = async (
    uid: string,
    data: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'phoneCountryCode' | 'birthDate'>>,
  ): Promise<void> => {
    await updateMemberService(uid, data);
  };

  const updatePassword = async (uid: string, newPassword: string): Promise<void> => {
    await updateMemberPasswordService(uid, newPassword);
  };

  return { members, loading, createMember, remove, update, updatePassword };
};
