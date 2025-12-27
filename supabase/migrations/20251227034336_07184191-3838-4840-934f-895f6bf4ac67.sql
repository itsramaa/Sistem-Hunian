-- Fix existing tenant users who are missing profiles, user_roles, or tenants records

-- Fix user 44d23734-e1a1-4625-ac2b-54c7d0d441f3 (tenant@gmail.com)
INSERT INTO profiles (user_id, email, full_name)
SELECT '44d23734-e1a1-4625-ac2b-54c7d0d441f3', 'tenant@gmail.com', 'Tenant'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = '44d23734-e1a1-4625-ac2b-54c7d0d441f3');

INSERT INTO user_roles (user_id, role)
SELECT '44d23734-e1a1-4625-ac2b-54c7d0d441f3', 'tenant'
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = '44d23734-e1a1-4625-ac2b-54c7d0d441f3');

INSERT INTO tenants (user_id, linked_merchant_id)
SELECT '44d23734-e1a1-4625-ac2b-54c7d0d441f3', 'ed59d094-ba2e-4520-bf97-d76444ae45d1'
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE user_id = '44d23734-e1a1-4625-ac2b-54c7d0d441f3');

-- Fix user e647b2f6-2ffb-41da-a468-20d38bbbce81
INSERT INTO profiles (user_id, email, full_name)
SELECT 'e647b2f6-2ffb-41da-a468-20d38bbbce81', 'test-tenant@gmail.com', 'Test Tenant'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = 'e647b2f6-2ffb-41da-a468-20d38bbbce81');

INSERT INTO user_roles (user_id, role)
SELECT 'e647b2f6-2ffb-41da-a468-20d38bbbce81', 'tenant'
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = 'e647b2f6-2ffb-41da-a468-20d38bbbce81');

INSERT INTO tenants (user_id, linked_merchant_id)
SELECT 'e647b2f6-2ffb-41da-a468-20d38bbbce81', 'ed59d094-ba2e-4520-bf97-d76444ae45d1'
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE user_id = 'e647b2f6-2ffb-41da-a468-20d38bbbce81');