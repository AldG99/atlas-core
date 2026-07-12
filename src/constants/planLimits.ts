import i18n from '../i18n';

export const PLAN_LIMITS = {
  free:       { ordersPerMonth: 360, clients: 120,      products: 80,  labels: 6,  members: 0 },
  pro:        { ordersPerMonth: 720, clients: 240,       products: 160, labels: 10, members: 2 },
  enterprise: { ordersPerMonth: Infinity, clients: Infinity, products: 640, labels: 16, members: 6 },
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
