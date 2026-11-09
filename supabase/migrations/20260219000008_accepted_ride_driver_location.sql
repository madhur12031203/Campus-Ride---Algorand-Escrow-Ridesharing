ALTER TABLE public.ride_bookings
  ADD COLUMN IF NOT EXISTS driver_lat double precision,
  ADD COLUMN IF NOT EXISTS driver_lng double precision,
  ADD COLUMN IF NOT EXISTS driver_location_at timestamptz;

ALTER TABLE public.ride_bookings
  ADD CONSTRAINT ride_driver_location_valid CHECK (
    (driver_lat IS NULL AND driver_lng IS NULL AND driver_location_at IS NULL)
    OR (
      driver_lat IS NOT NULL AND driver_lng IS NOT NULL AND driver_location_at IS NOT NULL
      AND driver_lat BETWEEN -90 AND 90 AND driver_lng BETWEEN -180 AND 180
    )
  );

-- Only the assigned driver can publish coordinates. Drop the last position
-- as soon as the driver finishes or the ride is no longer accepted.
CREATE OR REPLACE FUNCTION public.guard_ride_driver_location()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status <> 'accepted' OR NEW.driver_completed THEN
    NEW.driver_lat := NULL;
    NEW.driver_lng := NULL;
    NEW.driver_location_at := NULL;
    RETURN NEW;
  END IF;

  IF NEW.driver_id IS DISTINCT FROM OLD.driver_id
     OR NEW.passenger_id IS DISTINCT FROM OLD.passenger_id THEN
    NEW.driver_lat := NULL;
    NEW.driver_lng := NULL;
    NEW.driver_location_at := NULL;
    RETURN NEW;
  END IF;

  IF ROW(NEW.driver_lat, NEW.driver_lng, NEW.driver_location_at)
     IS DISTINCT FROM ROW(OLD.driver_lat, OLD.driver_lng, OLD.driver_location_at) THEN
    IF OLD.status <> 'accepted' OR NEW.driver_id IS NULL
       OR auth.uid() IS DISTINCT FROM NEW.driver_id THEN
      RAISE EXCEPTION 'Only the assigned driver can share a location for an active ride'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.driver_lat IS NOT NULL AND NEW.driver_lng IS NOT NULL THEN
      NEW.driver_location_at := statement_timestamp();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_ride_driver_location
BEFORE INSERT OR UPDATE ON public.ride_bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_ride_driver_location();
