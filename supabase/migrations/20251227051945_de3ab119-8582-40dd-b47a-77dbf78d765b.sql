-- Create function to update unit status when contract is fully signed
CREATE OR REPLACE FUNCTION public.update_unit_status_on_contract_sign()
RETURNS TRIGGER AS $$
BEGIN
  -- When contract becomes fully signed, mark unit as occupied
  IF NEW.signature_status = 'fully_signed' AND (OLD.signature_status IS NULL OR OLD.signature_status != 'fully_signed') THEN
    UPDATE public.units 
    SET status = 'occupied', updated_at = now()
    WHERE id = NEW.unit_id;
    
    -- Also update contract status to active if it was draft
    IF NEW.status = 'draft' OR NEW.status = 'pending_signature' THEN
      NEW.status := 'active';
    END IF;
  END IF;
  
  -- When contract is terminated or expired, mark unit as available (if no other active contract)
  IF NEW.status IN ('terminated', 'expired') AND OLD.status NOT IN ('terminated', 'expired') THEN
    -- Check if there are other active contracts for this unit
    IF NOT EXISTS (
      SELECT 1 FROM public.contracts 
      WHERE unit_id = NEW.unit_id 
      AND id != NEW.id 
      AND status = 'active'
    ) THEN
      UPDATE public.units 
      SET status = 'available', updated_at = now()
      WHERE id = NEW.unit_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for contract signature status changes
DROP TRIGGER IF EXISTS trigger_update_unit_on_contract_sign ON public.contracts;
CREATE TRIGGER trigger_update_unit_on_contract_sign
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_unit_status_on_contract_sign();