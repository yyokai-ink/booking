import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { slugify } from '@/lib/slug';
import { formatMoney } from '@/lib/money';

describe('slugify', () => {
  it('transliterates Ukrainian names for SEO URLs', () => {
    expect(slugify('Олена Коваль')).toBe('olena-koval');
    expect(slugify('Христина Данилюк')).toBe('khrystyna-danyliuk');
    expect(slugify('Ink & Ember Tattoo Studio')).toBe('ink-ember-tattoo-studio');
    expect(slugify("Лук'янівка")).toBe('lukianivka');
  });
});

describe('formatMoney', () => {
  it('formats integer minor units', () => {
    expect(formatMoney(29900, 'UAH', 'en-GB')).toContain('299');
    expect(formatMoney(29900, 'UAH', 'uk-UA')).toContain('299');
  });
});

describe('database schema covers the required entities', () => {
  const schema = readFileSync(path.join(__dirname, '../prisma/schema.prisma'), 'utf8');
  const required = [
    'User', 'UserRole', 'MasterProfile', 'StudioProfile', 'StudioBranch', 'StudioMember', 'StudioInvitation',
    'Category', 'Subcategory', 'Service', 'ServicePrice', 'PortfolioItem', 'Review', 'Booking', 'Availability',
    'WorkingHours', 'Subscription', 'SubscriptionPlan', 'Payment', 'PaymentMethod', 'Favorite', 'Notification',
    'Country', 'City', 'Address', 'Translation',
  ];
  for (const model of required) {
    it(`defines model ${model}`, () => {
      expect(new RegExp(`^model ${model} \\{`, 'm').test(schema)).toBe(true);
    });
  }
  it('keeps the double-booking exclusion constraint in the manual SQL', () => {
    const sql = readFileSync(path.join(__dirname, '../prisma/manual/0001_integrity_constraints.sql'), 'utf8');
    expect(sql.includes('EXCLUDE USING gist')).toBe(true);
    expect(sql.includes('"masterId" WITH =')).toBe(true);
  });
});
