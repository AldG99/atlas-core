import i18n from '../i18n';

export const PLAN_LIMITS = {
  free:       { ordersPerMonth: 460, clients: 180,      products: 240,  labels: 6 },
  pro:        { ordersPerMonth: 720, clients: 240,       products: 480, labels: 10 },
  enterprise: { ordersPerMonth: Infinity, clients: Infinity, products: 1260, labels: 16 },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

export const getPlanLimits = (plan?: string) =>
  PLAN_LIMITS[(plan as PlanKey) ?? 'free'] ?? PLAN_LIMITS.free;

export const checkPlanLimit = (count: number, limit: number, resource: string): void => {
  if (limit !== Infinity && count >= limit) {
    throw new Error(i18n.t('errors.planLimitReached', { limit, resource }));
  }
};

export const PLAN_LABEL: Record<PlanKey, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  enterprise: 'Business',
};
