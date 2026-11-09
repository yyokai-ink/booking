/**
 * Single source of truth for authorization. Every API route / server action MUST call
 * `assertCan` (or `can`) — hiding buttons in the UI is never a security measure.
 *
 * Roles:
 *  - Platform roles (UserRole table): CLIENT, MASTER, STUDIO_OWNER, SUPER_ADMIN — what kind of account it is.
 *  - Studio roles (StudioMember table): OWNER, ADMIN, MASTER — authority INSIDE one studio.
 *    Studio authority comes ONLY from an ACTIVE StudioMember row, never from the platform role label.
 *  - SUPER_ADMIN gets admin:* only. It does not silently become a studio owner or a master.
 *  - Studio staff never own a master's personal profile: they get scoped, revocable access while the
 *    membership is ACTIVE (ENDED membership => access gone; profile, portfolio and reviews stay with the master).
 */
export type PlatformRole = 'CLIENT' | 'MASTER' | 'STUDIO_OWNER' | 'SUPER_ADMIN';
export type StudioRole = 'OWNER' | 'ADMIN' | 'MASTER';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'DELETED';

export interface StudioMembershipCtx { studioId: string; role: StudioRole; status: 'ACTIVE' | 'ENDED' }

export interface Actor {
  userId: string;
  status: UserStatus;
  emailVerified: boolean;
  platformRoles: PlatformRole[];
  studioMemberships: StudioMembershipCtx[];
}

export type StudioPermission =
  | 'studio:dashboard:view' | 'studio:profile:edit' | 'studio:branches:manage'
  | 'studio:team:invite' | 'studio:team:remove' | 'studio:team:manage_roles'
  | 'studio:services:manage' | 'studio:schedule:manage'
  | 'studio:bookings:view_all' | 'studio:bookings:manage' | 'studio:analytics:view'
  | 'studio:billing:view' | 'studio:billing:manage'
  | 'studio:master_profile:manage' | 'studio:master_portfolio:upload';

export type AdminPermission =
  | 'admin:access' | 'admin:users:manage' | 'admin:moderation' | 'admin:catalog:manage'
  | 'admin:plans:manage' | 'admin:payments:view' | 'admin:analytics:view'
  | 'admin:content:manage' | 'admin:settings:manage';

export type OwnPermission =
  | 'booking:create' | 'booking:manage_own' | 'review:create' | 'favorite:manage'
  | 'master:profile:edit' | 'master:bookings:manage';

export type Permission = StudioPermission | AdminPermission | OwnPermission;

export interface ResourceCtx {
  studioId?: string;
  /** studio:team:remove — role of the member being removed */
  targetRole?: StudioRole;
  /** master:* — owner user of the master profile */
  masterUserId?: string;
  /** studio:master_profile:manage / master_portfolio:upload — studios where the target master is ACTIVE */
  masterActiveStudioIds?: string[];
  /** studio:master_portfolio:upload — master allowed the studio to upload to their portfolio */
  portfolioConsent?: boolean;
  /** booking:manage_own / review:create — the client of the booking */
  clientUserId?: string;
  /** review:create — verified server-side from the DB */
  bookingCompleted?: boolean;
}

const STUDIO_ROLE_PERMISSIONS: Record<StudioRole, ReadonlySet<StudioPermission>> = {
  OWNER: new Set<StudioPermission>([
    'studio:dashboard:view', 'studio:profile:edit', 'studio:branches:manage',
    'studio:team:invite', 'studio:team:remove', 'studio:team:manage_roles',
    'studio:services:manage', 'studio:schedule:manage',
    'studio:bookings:view_all', 'studio:bookings:manage', 'studio:analytics:view',
    'studio:billing:view', 'studio:billing:manage',
    'studio:master_profile:manage', 'studio:master_portfolio:upload',
  ]),
  ADMIN: new Set<StudioPermission>([
    'studio:dashboard:view', 'studio:profile:edit',
    'studio:team:invite', 'studio:team:remove',
    'studio:services:manage', 'studio:schedule:manage',
    'studio:bookings:view_all', 'studio:bookings:manage', 'studio:analytics:view',
    'studio:master_profile:manage', 'studio:master_portfolio:upload',
  ]),
  MASTER: new Set<StudioPermission>(['studio:dashboard:view']),
};

const ADMIN_PERMISSIONS: ReadonlySet<Permission> = new Set<AdminPermission>([
  'admin:access', 'admin:users:manage', 'admin:moderation', 'admin:catalog:manage',
  'admin:plans:manage', 'admin:payments:view', 'admin:analytics:view',
  'admin:content:manage', 'admin:settings:manage',
]);

export function activeStudioRole(actor: Actor, studioId: string | undefined): StudioRole | null {
  if (!studioId) return null;
  const m = actor.studioMemberships.find((x) => x.studioId === studioId && x.status === 'ACTIVE');
  return m ? m.role : null;
}

/** Pure decision function — deny by default. */
export function can(actor: Actor | null | undefined, permission: Permission, ctx: ResourceCtx = {}): boolean {
  if (!actor || actor.status !== 'ACTIVE') return false;

  if (permission.startsWith('admin:')) {
    return actor.emailVerified && actor.platformRoles.includes('SUPER_ADMIN') && ADMIN_PERMISSIONS.has(permission);
  }

  if (permission.startsWith('studio:')) {
    if (!actor.emailVerified) return false;
    const role = activeStudioRole(actor, ctx.studioId);
    if (!role) return false;
    const perm = permission as StudioPermission;
    if (!STUDIO_ROLE_PERMISSIONS[role].has(perm)) return false;

    if (perm === 'studio:team:remove') {
      if (ctx.targetRole === undefined || ctx.targetRole === 'OWNER') return false; // owner can't be removed
      if (role === 'ADMIN' && ctx.targetRole !== 'MASTER') return false; // admins only remove masters
    }
    if (perm === 'studio:master_profile:manage' || perm === 'studio:master_portfolio:upload') {
      if (!ctx.studioId || !ctx.masterActiveStudioIds?.includes(ctx.studioId)) return false; // collaboration must be ACTIVE
    }
    if (perm === 'studio:master_portfolio:upload' && ctx.portfolioConsent !== true) return false;
    return true;
  }

  switch (permission as OwnPermission) {
    case 'booking:create':
      return actor.emailVerified;
    case 'favorite:manage':
      return true;
    case 'booking:manage_own':
      return ctx.clientUserId === actor.userId;
    case 'review:create':
      return ctx.clientUserId === actor.userId && ctx.bookingCompleted === true;
    case 'master:profile:edit':
    case 'master:bookings:manage':
      return ctx.masterUserId === actor.userId && actor.platformRoles.includes('MASTER');
    default:
      return false;
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(public readonly permission: Permission) {
    super(`Forbidden: ${permission}`);
    this.name = 'ForbiddenError';
  }
}

export function assertCan(actor: Actor | null | undefined, permission: Permission, ctx: ResourceCtx = {}): asserts actor is Actor {
  if (!can(actor, permission, ctx)) throw new ForbiddenError(permission);
}
