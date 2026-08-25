-- Phase Two / Shannon's vision — remove charging from the platform entirely.
--
-- The network is free and peer-to-peer: nobody ever charges to gather. The UI for
-- registration fees and payment tracking is gone (fee inputs, the RSVP fee gate and
-- its Venmo hand-off, the attendee "Mark paid / Waive" controls), so the columns
-- behind them are dropped too — leaving them invites the feature back in by accident.
--
-- What deliberately stays: shared-cost *splitting* among friends (event_expenses,
-- expense_splits, profile Venmo handles) and offerings.cost_note. Chipping in on
-- groceries is peers sharing a cost, not a gate on the door.

-- Audit trail — the values this drop destroys, captured 2026-08-25 before running.
-- rsvps.payment_status: no rows were ever set to anything but 'unpaid'.
-- events.registration_fee (all three already in the past; none upcoming):
--   'Floating on Jordenelle'  the-floaters-salt-lake-city  2026-08-22  confirmed  10.00
--   'Test 4'                  the-floaters-salt-lake-city  2026-04-25  confirmed  20.00
--   'etestset'                warriors-on-the-way          2026-05-30  cancelled  20.00

alter table public.events  drop column if exists registration_fee;
alter table public.rsvps   drop column if exists payment_status;

-- The organizer-only guard on rsvps still reads new.payment_status. Postgres does
-- not dependency-check plpgsql bodies, so dropping the column above leaves the
-- trigger to fail at runtime with `record "new" has no field "payment_status"` on
-- every authenticated RSVP. Recreate it guarding check-in alone.
CREATE OR REPLACE FUNCTION public.guard_rsvp_protected_fields()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(auth.role(), 'service_role') <> 'authenticated' THEN
    RETURN new;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF new.checked_in_at IS NOT NULL THEN
      RAISE EXCEPTION 'Check-in can only be set by an organizer.';
    END IF;
  ELSE
    IF new.checked_in_at IS DISTINCT FROM old.checked_in_at THEN
      RAISE EXCEPTION 'Check-in can only be changed by an organizer.';
    END IF;
  END IF;

  RETURN new;
END;
$$;
