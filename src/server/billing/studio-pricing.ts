/**
 * Studio price = base + (active billable masters × seat price). The one-time connection fee is separate.
 * All values are integer minor units. Prices come from SubscriptionPlan rows (admin-editable), never constants.
 */
export interface StudioPrices { baseMinor: number; seatMinor: number; connectionFeeMinor: number; currency: string }

export interface MemberBilling {
  userId: string;
  status: 'ACTIVE' | 'ENDED';
  countsAsSeat: boolean;
  /** Set once, on first paid connection. Re-invites re-use the same StudioMember row, so it stays set. */
  connectionFeePaidAt: Date | null;
}

export interface LineItem { code: 'studio_base' | 'studio_seats'; quantity: number; unitMinor: number; totalMinor: number }

export interface StudioMonthlyQuote { currency: string; seatCount: number; lineItems: LineItem[]; totalMinor: number }

function assertMoney(n: number, name: string) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`${name} must be a non-negative integer (minor units)`);
}

export function isBillableSeat(m: MemberBilling): boolean {
  return m.status === 'ACTIVE' && m.countsAsSeat;
}

export function countBillableSeats(members: MemberBilling[]): number {
  // Count distinct users: a user can never be billed twice in the same studio.
  return new Set(members.filter(isBillableSeat).map((m) => m.userId)).size;
}

export function calculateStudioMonthly(prices: StudioPrices, members: MemberBilling[]): StudioMonthlyQuote {
  assertMoney(prices.baseMinor, 'baseMinor');
  assertMoney(prices.seatMinor, 'seatMinor');
  const seatCount = countBillableSeats(members);
  const seatsTotal = seatCount * prices.seatMinor;
  const lineItems: LineItem[] = [
    { code: 'studio_base', quantity: 1, unitMinor: prices.baseMinor, totalMinor: prices.baseMinor },
    { code: 'studio_seats', quantity: seatCount, unitMinor: prices.seatMinor, totalMinor: seatsTotal },
  ];
  return { currency: prices.currency, seatCount, lineItems, totalMinor: prices.baseMinor + seatsTotal };
}

export interface PendingConnectionFees { userIds: string[]; totalMinor: number }

/** Masters that are ACTIVE seats but whose one-time fee was never paid. Previously-paid re-joiners cost 0. */
export function pendingConnectionFees(prices: StudioPrices, members: MemberBilling[]): PendingConnectionFees {
  assertMoney(prices.connectionFeeMinor, 'connectionFeeMinor');
  const userIds = [...new Set(members.filter((m) => isBillableSeat(m) && m.connectionFeePaidAt === null).map((m) => m.userId))];
  return { userIds, totalMinor: userIds.length * prices.connectionFeeMinor };
}
