
-- Update v_properties_with_addresses view to include active_tenant_count and monthly_revenue
CREATE OR REPLACE VIEW public.v_properties_with_addresses AS
SELECT
  p.id,
  p.merchant_id,
  p.name,
  p.property_type,
  p.description,
  p.amenities,
  p.total_units,
  p.occupied_units,
  p.status,
  p.created_at,
  p.updated_at,
  p.images,
  p.guardian_name,
  p.guardian_phone,
  p.marketing_cost,
  p.construction_year,
  p.floor_count,
  p.building_condition,
  p.land_ownership,
  p.nearby_facilities,
  p.construction_cost,
  p.renovation_cost,
  p.funding_source,
  p.monthly_amortization,
  p.monthly_maintenance_cost,
  p.avg_annual_unexpected_cost,
  p.security_score,
  p.disaster_risk_level,
  p.property_code,
  p.address_id,
  a.street_address AS resolved_address,
  a.city AS resolved_city,
  a.province AS resolved_province,
  a.postal_code AS resolved_postal_code,
  a.latitude AS resolved_latitude,
  a.longitude AS resolved_longitude,
  COALESCE(tc.active_tenant_count, 0) AS active_tenant_count,
  COALESCE(rev.monthly_revenue, 0) AS monthly_revenue
FROM properties p
LEFT JOIN addresses a ON p.address_id = a.id
LEFT JOIN LATERAL (
  SELECT COUNT(DISTINCT c.tenant_user_id)::int AS active_tenant_count
  FROM units u
  JOIN contracts c ON c.unit_id = u.id AND c.status = 'active'
  WHERE u.property_id = p.id
) tc ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(pay.amount), 0)::numeric AS monthly_revenue
  FROM units u
  JOIN contracts c ON c.unit_id = u.id
  JOIN payments pay ON pay.contract_id = c.id
    AND pay.status = 'paid'
    AND pay.paid_at >= date_trunc('month', now())
    AND pay.paid_at < date_trunc('month', now()) + interval '1 month'
  WHERE u.property_id = p.id
) rev ON true;

-- Create server-side search function for 100+ properties
CREATE OR REPLACE FUNCTION public.search_properties_server(
  p_merchant_id uuid,
  p_search text DEFAULT '',
  p_type text DEFAULT 'all',
  p_status text DEFAULT 'all',
  p_sort text DEFAULT 'newest',
  p_limit int DEFAULT 25,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  merchant_id uuid,
  name text,
  property_type text,
  description text,
  amenities text[],
  total_units int,
  occupied_units int,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  images text[],
  property_code text,
  resolved_address text,
  resolved_city text,
  resolved_province text,
  resolved_postal_code text,
  resolved_latitude double precision,
  resolved_longitude double precision,
  active_tenant_count int,
  monthly_revenue numeric,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT
      v.*,
      COUNT(*) OVER() AS total_count
    FROM v_properties_with_addresses v
    WHERE v.merchant_id = p_merchant_id
      AND (p_search = '' OR v.name ILIKE '%' || p_search || '%' OR v.resolved_city ILIKE '%' || p_search || '%' OR v.property_code ILIKE '%' || p_search || '%')
      AND (p_type = 'all' OR v.property_type = p_type)
      AND (p_status = 'all' OR v.status = p_status)
    ORDER BY
      CASE WHEN p_sort = 'newest' THEN v.created_at END DESC NULLS LAST,
      CASE WHEN p_sort = 'oldest' THEN v.created_at END ASC NULLS LAST,
      CASE WHEN p_sort = 'name-asc' THEN v.name END ASC NULLS LAST,
      CASE WHEN p_sort = 'name-desc' THEN v.name END DESC NULLS LAST,
      CASE WHEN p_sort = 'occupancy-high' THEN CASE WHEN v.total_units > 0 THEN v.occupied_units::numeric / v.total_units ELSE 0 END END DESC NULLS LAST,
      CASE WHEN p_sort = 'occupancy-low' THEN CASE WHEN v.total_units > 0 THEN v.occupied_units::numeric / v.total_units ELSE 0 END END ASC NULLS LAST,
      v.created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT
    f.id,
    f.merchant_id,
    f.name,
    f.property_type,
    f.description,
    f.amenities,
    f.total_units,
    f.occupied_units,
    f.status,
    f.created_at,
    f.updated_at,
    f.images,
    f.property_code,
    f.resolved_address,
    f.resolved_city,
    f.resolved_province,
    f.resolved_postal_code,
    f.resolved_latitude,
    f.resolved_longitude,
    f.active_tenant_count,
    f.monthly_revenue,
    f.total_count
  FROM filtered f;
$$;
