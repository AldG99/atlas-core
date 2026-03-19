export const PLAN_LIMITS = {
  gratuito:   { pedidosMes: 180, clientes: 60,       productos: 40,  etiquetas: 6,  miembros: 0 },
  pro:        { pedidosMes: 450, clientes: 160,       productos: 120, etiquetas: 10, miembros: 2 },
  enterprise: { pedidosMes: Infinity, clientes: Infinity, productos: 420, etiquetas: 16, miembros: 6 },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

export const getPlanLimits = (plan?: string) =>
  PLAN_LIMITS[(plan as PlanKey) ?? 'gratuito'] ?? PLAN_LIMITS.gratuito;

export const PLAN_LABEL: Record<PlanKey, string> = {
  gratuito: 'Gratuito',
  pro: 'Pro',
  enterprise: 'Max',
};
