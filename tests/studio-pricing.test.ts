import { describe, it, expect } from 'vitest';
import { calculateStudioMonthly, countBillableSeats, pendingConnectionFees, type MemberBilling, type StudioPrices } from '@/server/billing/studio-pricing';

const prices: StudioPrices = { baseMinor: 49900, seatMinor: 14900, connectionFeeMinor: 9900, currency: 'UAH' };
const paid = new Date('2026-01-01');
const m = (userId: string, over: Partial<MemberBilling> = {}): MemberBilling => ({ userId, status: 'ACTIVE', countsAsSeat: true, connectionFeePaidAt: paid, ...over });

describe('calculateStudioMonthly', () => {
  it('= base + seats × seat price (spec formula)', () => {
    const q = calculateStudioMonthly(prices, [m('a'), m('b'), m('c')]);
    expect(q.seatCount).toBe(3);
    expect(q.totalMinor).toBe(49900 + 3 * 14900); // 94 600 minor = 946 UAH
    expect(q.lineItems.map((l) => l.totalMinor)).toEqual([49900, 44700]);
  });
  it('studio without masters pays only the base plan', () => {
    expect(calculateStudioMonthly(prices, []).totalMinor).toBe(49900);
  });
  it('does not bill ENDED members or non-seat members (owner)', () => {
    const q = calculateStudioMonthly(prices, [m('a'), m('b', { status: 'ENDED' }), m('owner', { countsAsSeat: false })]);
    expect(q.seatCount).toBe(1);
    expect(q.totalMinor).toBe(49900 + 14900);
  });
  it('never bills the same user twice', () => {
    expect(countBillableSeats([m('a'), m('a')])).toBe(1);
  });
  it('rejects non-integer or negative money', () => {
    expect(() => calculateStudioMonthly({ ...prices, seatMinor: 149.5 }, [])).toThrow(RangeError);
    expect(() => calculateStudioMonthly({ ...prices, baseMinor: -1 }, [])).toThrow(RangeError);
  });
});

describe('pendingConnectionFees', () => {
  it('charges 99 UAH once per newly connected master', () => {
    const r = pendingConnectionFees(prices, [m('a', { connectionFeePaidAt: null }), m('b', { connectionFeePaidAt: null }), m('c')]);
    expect(r.userIds).toEqual(['a', 'b']);
    expect(r.totalMinor).toBe(2 * 9900);
  });
  it('re-invited master (fee already paid on the same row) costs nothing', () => {
    expect(pendingConnectionFees(prices, [m('a', { status: 'ACTIVE', connectionFeePaidAt: paid })]).totalMinor).toBe(0);
  });
  it('does not charge for members who are not active seats', () => {
    expect(pendingConnectionFees(prices, [m('a', { status: 'ENDED', connectionFeePaidAt: null }), m('o', { countsAsSeat: false, connectionFeePaidAt: null })]).totalMinor).toBe(0);
  });
});
