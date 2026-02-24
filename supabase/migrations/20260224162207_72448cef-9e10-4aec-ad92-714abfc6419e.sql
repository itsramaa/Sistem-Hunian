ALTER TABLE maintenance_requests 
ADD CONSTRAINT maintenance_requests_tenant_user_id_fkey 
FOREIGN KEY (tenant_user_id) REFERENCES profiles(user_id);