-- Create function to automatically set cancellation_effective_date
CREATE OR REPLACE FUNCTION public.set_cancellation_effective_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set when cancellation_requested_at is newly set and effective_date is null
  IF NEW.cancellation_requested_at IS NOT NULL 
     AND OLD.cancellation_requested_at IS NULL 
     AND NEW.cancellation_effective_date IS NULL THEN
    NEW.cancellation_effective_date := COALESCE(
      NEW.current_period_end, 
      (NOW() + INTERVAL '1 month')::timestamp with time zone
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-setting cancellation effective date
CREATE TRIGGER trigger_set_cancellation_effective_date
BEFORE UPDATE ON public.merchant_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_cancellation_effective_date();