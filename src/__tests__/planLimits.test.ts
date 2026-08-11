import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS, getPlanLimits, checkPlanLimit } from '../constants/planLimits';

// ── getPlanLimits ─────────────────────────────────────────────────────────────

describe('getPlanLimits', () => {
  it('returns free limits for "free"', () => {
    const limits = getPlanLimits('free');
    expect(limits).toEqual(PLAN_LIMITS.free);
  });

  it('returns pro limits for "pro"', () => {
    const limits = getPlanLimits('pro');
    expect(limits).toEqual(PLAN_LIMITS.pro);
  });

  it('returns enterprise limits for "enterprise"', () => {
    const limits = getPlanLimits('enterprise');
    expect(limits.ordersPerMonth).toBe(Infinity);
    expect(limits.clients).toBe(Infinity);
  });

  it('falls back to free when plan is undefined', () => {
    expect(getPlanLimits(undefined)).toEqual(PLAN_LIMITS.free);
  });

  it('falls back to free for an unknown plan string', () => {
    expect(getPlanLimits('unknown_plan')).toEqual(PLAN_LIMITS.free);
  });

  it('pro limits are higher than free limits', () => {
    const free = getPlanLimits('free');
    const pro = getPlanLimits('pro');
    expect(pro.ordersPerMonth).toBeGreaterThan(free.ordersPerMonth);
    expect(pro.clients).toBeGreaterThan(free.clients);
    expect(pro.products).toBeGreaterThan(free.products);
  });
});

// ── checkPlanLimit ────────────────────────────────────────────────────────────

describe('checkPlanLimit', () => {
  it('does not throw when count is below the limit', () => {
    expect(() => checkPlanLimit(5, 10, 'clients')).not.toThrow();
  });

  it('throws when count equals the limit', () => {
    expect(() => checkPlanLimit(10, 10, 'clients')).toThrow();
  });

  it('throws when count exceeds the limit', () => {
    expect(() => checkPlanLimit(11, 10, 'clients')).toThrow();
  });

  it('error message includes the limit and resource name', () => {
    expect(() => checkPlanLimit(120, 120, 'clients')).toThrow(
      /120.*clients/
    );
  });

  it('never throws when limit is Infinity (enterprise)', () => {
    expect(() => checkPlanLimit(999999, Infinity, 'orders')).not.toThrow();
  });

  it('does not throw at count zero', () => {
    expect(() => checkPlanLimit(0, 10, 'products')).not.toThrow();
  });
});
