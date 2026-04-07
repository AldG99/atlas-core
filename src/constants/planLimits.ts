export const PLAN_LIMITS = {
  gratuito:   { pedidosMes: 360, clientes: 120,      productos: 80,  etiquetas: 6,  miembros: 0 },
  pro:        { pedidosMes: 720, clientes: 240,       productos: 160, etiquetas: 10, miembros: 2 },
  enterprise: { pedidosMes: Infinity, clientes: Infinity, productos: 640, etiquetas: 16, miembros: 6 },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

export const getPlanLimits = (plan?: string) =>
  PLAN_LIMITS[(plan as PlanKey) ?? 'gratuito'] ?? PLAN_LIMITS.gratuito;

export const checkPlanLimit = (count: number, limit: number, resource: string): void => {
  if (limit !== Infinity && count >= limit) {
    throw new Error(`Has alcanzado el límite de ${limit} ${resource} en tu plan. Actualiza tu plan para agregar más.`);
  }
};

export const PLAN_LABEL: Record<PlanKey, string> = {
  gratuito: 'Gratuito',
  pro: 'Pro',
  enterprise: 'Business',
};
