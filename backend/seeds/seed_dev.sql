-- Seed file for development — dummy users with bcrypt-hashed password "password123" (cost 10)
-- Run AFTER migration 00002_users_auth.sql

INSERT INTO users (email, password_hash, role, full_name, phone_number, created_at, updated_at)
VALUES
  ('admin@dev.local',    '$2a$10$yMj8giN2BQRsd2ZODVH/O.0yQ896zpR631CVv7JVuuhOu1qKUIJGq', 'admin',    'Dev Admin',    '081200000001', NOW(), NOW()),
  ('merchant@dev.local', '$2a$10$yMj8giN2BQRsd2ZODVH/O.0yQ896zpR631CVv7JVuuhOu1qKUIJGq', 'merchant', 'Dev Merchant',  '081200000002', NOW(), NOW()),
  ('tenant@dev.local',   '$2a$10$yMj8giN2BQRsd2ZODVH/O.0yQ896zpR631CVv7JVuuhOu1qKUIJGq', 'tenant',   'Dev Tenant',    '081200000003', NOW(), NOW()),
  ('vendor@dev.local',   '$2a$10$yMj8giN2BQRsd2ZODVH/O.0yQ896zpR631CVv7JVuuhOu1qKUIJGq', 'vendor',   'Dev Vendor',    '081200000004', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
