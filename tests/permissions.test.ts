import { describe, it, expect } from 'vitest';
import { can, assertCan, ForbiddenError, type Actor } from '@/server/auth/permissions';

const base = { status: 'ACTIVE', emailVerified: true, platformRoles: [], studioMemberships: [] } as const;
const actor = (over: Partial<Actor> & { userId: string }): Actor => ({ ...base, platformRoles: [], studioMemberships: [], ...over });

const client = actor({ userId: 'c1', platformRoles: ['CLIENT'] });
const master = actor({ userId: 'm1', platformRoles: ['MASTER'] });
const owner = actor({ userId: 'o1', platformRoles: ['STUDIO_OWNER'], studioMemberships: [{ studioId: 's1', role: 'OWNER', status: 'ACTIVE' }] });
const studioAdmin = actor({ userId: 'a1', platformRoles: ['MASTER'], studioMemberships: [{ studioId: 's1', role: 'ADMIN', status: 'ACTIVE' }] });
const studioMaster = actor({ userId: 'm2', platformRoles: ['MASTER'], studioMemberships: [{ studioId: 's1', role: 'MASTER', status: 'ACTIVE' }] });
const superAdmin = actor({ userId: 'x1', platformRoles: ['SUPER_ADMIN'] });

describe('anonymous / blocked / unverified', () => {
  it('denies everything to anonymous', () => {
    expect(can(null, 'booking:create')).toBe(false);
    expect(can(undefined, 'admin:access')).toBe(false);
  });
  it('denies blocked and deleted users even with roles', () => {
    expect(can({ ...superAdmin, status: 'BLOCKED' }, 'admin:access')).toBe(false);
    expect(can({ ...owner, status: 'DELETED' }, 'studio:dashboard:view', { studioId: 's1' })).toBe(false);
  });
  it('requires a verified e-mail for bookings, studio and admin actions', () => {
    expect(can({ ...client, emailVerified: false }, 'booking:create')).toBe(false);
    expect(can({ ...owner, emailVerified: false }, 'studio:dashboard:view', { studioId: 's1' })).toBe(false);
    expect(can({ ...superAdmin, emailVerified: false }, 'admin:access')).toBe(false);
  });
});

describe('client', () => {
  it('can book and manage ONLY own bookings', () => {
    expect(can(client, 'booking:create')).toBe(true);
    expect(can(client, 'booking:manage_own', { clientUserId: 'c1' })).toBe(true);
    expect(can(client, 'booking:manage_own', { clientUserId: 'someone-else' })).toBe(false);
  });
  it('can review only own COMPLETED bookings', () => {
    expect(can(client, 'review:create', { clientUserId: 'c1', bookingCompleted: true })).toBe(true);
    expect(can(client, 'review:create', { clientUserId: 'c1', bookingCompleted: false })).toBe(false);
    expect(can(client, 'review:create', { clientUserId: 'other', bookingCompleted: true })).toBe(false);
  });
  it('has no studio or admin access', () => {
    expect(can(client, 'studio:dashboard:view', { studioId: 's1' })).toBe(false);
    expect(can(client, 'admin:access')).toBe(false);
  });
});

describe('individual master', () => {
  it('edits only their own profile', () => {
    expect(can(master, 'master:profile:edit', { masterUserId: 'm1' })).toBe(true);
    expect(can(master, 'master:profile:edit', { masterUserId: 'm9' })).toBe(false);
    expect(can(client, 'master:profile:edit', { masterUserId: 'c1' })).toBe(false); // needs the MASTER role
  });
  it('has no studio authority from the platform role alone', () => {
    expect(can(master, 'studio:services:manage', { studioId: 's1' })).toBe(false);
  });
});

describe('studio roles', () => {
  it('owner has billing, branches and role management', () => {
    for (const p of ['studio:billing:manage', 'studio:billing:view', 'studio:branches:manage', 'studio:team:manage_roles'] as const) {
      expect(can(owner, p, { studioId: 's1' })).toBe(true);
    }
  });
  it('studio admin runs operations but not billing, branches or roles', () => {
    expect(can(studioAdmin, 'studio:bookings:manage', { studioId: 's1' })).toBe(true);
    expect(can(studioAdmin, 'studio:team:invite', { studioId: 's1' })).toBe(true);
    expect(can(studioAdmin, 'studio:billing:view', { studioId: 's1' })).toBe(false);
    expect(can(studioAdmin, 'studio:billing:manage', { studioId: 's1' })).toBe(false);
    expect(can(studioAdmin, 'studio:branches:manage', { studioId: 's1' })).toBe(false);
    expect(can(studioAdmin, 'studio:team:manage_roles', { studioId: 's1' })).toBe(false);
  });
  it('studio master sees the dashboard but cannot see all bookings or manage anything', () => {
    expect(can(studioMaster, 'studio:dashboard:view', { studioId: 's1' })).toBe(true);
    expect(can(studioMaster, 'studio:bookings:view_all', { studioId: 's1' })).toBe(false);
    expect(can(studioMaster, 'studio:team:invite', { studioId: 's1' })).toBe(false);
  });
  it('never crosses studios (tenant isolation)', () => {
    expect(can(owner, 'studio:billing:manage', { studioId: 's2' })).toBe(false);
    expect(can(owner, 'studio:dashboard:view', {})).toBe(false);
  });
  it('an ENDED membership grants nothing', () => {
    const ended = actor({ userId: 'm3', platformRoles: ['MASTER'], studioMemberships: [{ studioId: 's1', role: 'ADMIN', status: 'ENDED' }] });
    expect(can(ended, 'studio:dashboard:view', { studioId: 's1' })).toBe(false);
  });
  it('owner cannot be removed; admins remove only masters', () => {
    expect(can(owner, 'studio:team:remove', { studioId: 's1', targetRole: 'OWNER' })).toBe(false);
    expect(can(owner, 'studio:team:remove', { studioId: 's1', targetRole: 'ADMIN' })).toBe(true);
    expect(can(studioAdmin, 'studio:team:remove', { studioId: 's1', targetRole: 'MASTER' })).toBe(true);
    expect(can(studioAdmin, 'studio:team:remove', { studioId: 's1', targetRole: 'ADMIN' })).toBe(false);
    expect(can(studioAdmin, 'studio:team:remove', { studioId: 's1' })).toBe(false); // target unknown => deny
  });
});

describe('studio access to a master’s personal profile', () => {
  it('works only while the collaboration is ACTIVE', () => {
    expect(can(owner, 'studio:master_profile:manage', { studioId: 's1', masterActiveStudioIds: ['s1'] })).toBe(true);
    expect(can(owner, 'studio:master_profile:manage', { studioId: 's1', masterActiveStudioIds: [] })).toBe(false); // master left
    expect(can(owner, 'studio:master_profile:manage', { studioId: 's1', masterActiveStudioIds: ['s2'] })).toBe(false);
  });
  it('portfolio upload additionally needs the master’s consent', () => {
    const ctx = { studioId: 's1', masterActiveStudioIds: ['s1'] };
    expect(can(studioAdmin, 'studio:master_portfolio:upload', { ...ctx, portfolioConsent: true })).toBe(true);
    expect(can(studioAdmin, 'studio:master_portfolio:upload', { ...ctx, portfolioConsent: false })).toBe(false);
    expect(can(studioAdmin, 'studio:master_portfolio:upload', ctx)).toBe(false);
  });
});

describe('super admin', () => {
  it('gets admin permissions only', () => {
    expect(can(superAdmin, 'admin:plans:manage')).toBe(true);
    expect(can(superAdmin, 'admin:users:manage')).toBe(true);
    expect(can(superAdmin, 'studio:billing:manage', { studioId: 's1' })).toBe(false);
  });
  it('nobody else gets admin permissions', () => {
    for (const a of [client, master, owner, studioAdmin]) expect(can(a, 'admin:access')).toBe(false);
  });
});

describe('assertCan', () => {
  it('throws ForbiddenError with status 403', () => {
    expect(() => assertCan(client, 'admin:access')).toThrow(ForbiddenError);
    expect(() => assertCan(superAdmin, 'admin:access')).not.toThrow();
  });
});
