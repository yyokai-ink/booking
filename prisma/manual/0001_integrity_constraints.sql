-- Integrity rules Prisma cannot express. Idempotent: safe to run many times.
-- Run AFTER `prisma migrate dev|deploy`:   npm run db:constraints

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1) Double-booking protection at the database level (race-condition proof).
--    Two ACTIVE bookings of the same master can never overlap in time.
--    endsAt of one booking == startsAt of the next one is allowed ('[)' ranges).
--    Prisma DateTime = timestamp WITHOUT time zone, always UTC => tsrange (immutable, valid in an index).
ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS booking_no_overlap;
ALTER TABLE "Booking" ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist (
    "masterId" WITH =,
    tsrange("startsAt", "endsAt", '[)') WITH &&
  ) WHERE ("status" IN ('PENDING'::"BookingStatus", 'CONFIRMED'::"BookingStatus"));

ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS booking_time_order;
ALTER TABLE "Booking" ADD CONSTRAINT booking_time_order CHECK ("endsAt" > "startsAt");

-- 2) A service belongs to exactly one provider: a master XOR a studio.
ALTER TABLE "Service" DROP CONSTRAINT IF EXISTS service_single_owner;
ALTER TABLE "Service" ADD CONSTRAINT service_single_owner
  CHECK (("masterId" IS NOT NULL) <> ("studioId" IS NOT NULL));

-- 3) A favorite points to exactly one target.
ALTER TABLE "Favorite" DROP CONSTRAINT IF EXISTS favorite_single_target;
ALTER TABLE "Favorite" ADD CONSTRAINT favorite_single_target
  CHECK (("masterId" IS NOT NULL) <> ("studioId" IS NOT NULL));

-- 4) A subscription belongs to exactly one subscriber, matching ownerType.
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS subscription_single_owner;
ALTER TABLE "Subscription" ADD CONSTRAINT subscription_single_owner CHECK (
  ("ownerType" = 'USER'::"SubscriberType"   AND "userId" IS NOT NULL AND "studioId" IS NULL) OR
  ("ownerType" = 'STUDIO'::"SubscriberType" AND "studioId" IS NOT NULL AND "userId" IS NULL)
);

-- 5) Only one live subscription per subscriber.
DROP INDEX IF EXISTS subscription_one_live_per_user;
CREATE UNIQUE INDEX subscription_one_live_per_user ON "Subscription" ("userId")
  WHERE "userId" IS NOT NULL AND "status" IN ('INCOMPLETE'::"SubscriptionStatus",'ACTIVE'::"SubscriptionStatus",'PAST_DUE'::"SubscriptionStatus",'GRACE'::"SubscriptionStatus");
DROP INDEX IF EXISTS subscription_one_live_per_studio;
CREATE UNIQUE INDEX subscription_one_live_per_studio ON "Subscription" ("studioId")
  WHERE "studioId" IS NOT NULL AND "status" IN ('INCOMPLETE'::"SubscriptionStatus",'ACTIVE'::"SubscriptionStatus",'PAST_DUE'::"SubscriptionStatus",'GRACE'::"SubscriptionStatus");

-- 6) Value ranges.
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS review_rating_range;
ALTER TABLE "Review" ADD CONSTRAINT review_rating_range CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "WorkingHours" DROP CONSTRAINT IF EXISTS working_hours_range;
ALTER TABLE "WorkingHours" ADD CONSTRAINT working_hours_range CHECK (
  "weekday" BETWEEN 0 AND 6 AND "startMinute" >= 0 AND "endMinute" <= 1440 AND "endMinute" > "startMinute");

ALTER TABLE "Service" DROP CONSTRAINT IF EXISTS service_duration_positive;
ALTER TABLE "Service" ADD CONSTRAINT service_duration_positive CHECK ("durationMin" > 0 AND "bufferMin" >= 0);

ALTER TABLE "ServicePrice" DROP CONSTRAINT IF EXISTS service_price_nonneg;
ALTER TABLE "ServicePrice" ADD CONSTRAINT service_price_nonneg CHECK ("amountMinor" >= 0);

ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS payment_amount_positive;
ALTER TABLE "Payment" ADD CONSTRAINT payment_amount_positive CHECK ("amountMinor" > 0);
