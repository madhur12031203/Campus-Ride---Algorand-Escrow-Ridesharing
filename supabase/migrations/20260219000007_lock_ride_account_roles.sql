-- Assign a role through the server once, then keep it fixed for the account.
CREATE OR REPLACE FUNCTION public.enforce_fixed_ride_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF current_user IN ('anon', 'authenticated') AND OLD.role IS NOT NULL THEN
      RAISE EXCEPTION 'An assigned ride profile cannot be removed by a client' USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
      RETURN NEW;
    END IF;
    IF OLD.role IS NOT NULL THEN
      RAISE EXCEPTION 'Your account role is already set' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NEW.role IS NOT NULL AND current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'Ride roles must be assigned during account setup' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_fixed_ride_role ON public.users;
CREATE TRIGGER enforce_fixed_ride_role
BEFORE INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.enforce_fixed_ride_role();

CREATE OR REPLACE FUNCTION public.account_has_ride_role(expected_role text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = expected_role
  );
$$;

REVOKE ALL ON FUNCTION public.account_has_ride_role(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.account_has_ride_role(text) TO authenticated;

DROP POLICY IF EXISTS "Passenger can insert own rides" ON public.ride_bookings;
CREATE POLICY "Passenger can insert own rides"
ON public.ride_bookings FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = passenger_id AND public.account_has_ride_role('passenger')
  AND status = 'waiting' AND driver_id IS NULL
);

DROP POLICY IF EXISTS "Anyone can read waiting rides" ON public.ride_bookings;
CREATE POLICY "Drivers can read waiting rides"
ON public.ride_bookings FOR SELECT TO authenticated
USING (status = 'waiting' AND public.account_has_ride_role('driver'));

DROP POLICY IF EXISTS "Drivers can accept waiting rides" ON public.ride_bookings;
CREATE POLICY "Drivers can accept waiting rides"
ON public.ride_bookings FOR UPDATE TO authenticated
USING (
  status = 'waiting' AND passenger_id <> auth.uid()
  AND public.account_has_ride_role('driver')
)
WITH CHECK (status = 'accepted' AND driver_id = auth.uid() AND passenger_id <> auth.uid());
