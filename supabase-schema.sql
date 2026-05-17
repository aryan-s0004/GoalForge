-- GOALFORGE - Complete Database Schema (Supabase & Local PostgreSQL)
-- Matches schema.prisma exactly to ensure full runtime compatibility.

-- 1. Setup Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Custom Types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
        CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GoalStatus') THEN
        CREATE TYPE "GoalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CheckinStatus') THEN
        CREATE TYPE "CheckinStatus" AS ENUM ('NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'COMPLETED');
    END IF;
END $$;

-- 3. Create Users Table
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
  "department" TEXT NOT NULL DEFAULT 'General',
  "manager_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- 4. Create Goals Table
CREATE TABLE IF NOT EXISTS "goals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "thrust_area" TEXT NOT NULL DEFAULT 'General',
  "uom_type" TEXT NOT NULL DEFAULT 'numeric',
  "target" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "weightage" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "GoalStatus" NOT NULL DEFAULT 'DRAFT',
  "locked" BOOLEAN NOT NULL DEFAULT false,
  "quarter" TEXT NOT NULL DEFAULT 'Q2-2026',
  "manager_feedback" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- 5. Create Checkins Table
CREATE TABLE IF NOT EXISTS "checkins" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "goal_id" UUID NOT NULL REFERENCES "goals"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "quarter" TEXT NOT NULL,
  "achievement" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "manager_comment" TEXT,
  "status" "CheckinStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- 6. Create Shared Goals Table
CREATE TABLE IF NOT EXISTS "shared_goals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "target" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "department" TEXT NOT NULL DEFAULT 'General',
  "assigned_to" TEXT[] DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- 7. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "action" TEXT NOT NULL,
  "performed_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "entity_type" TEXT NOT NULL DEFAULT 'goal',
  "entity_id" UUID REFERENCES "goals"("id") ON DELETE SET NULL,
  "old_data" JSONB,
  "new_data" JSONB,
  "notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- 8. Create Notifications Table
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- 9. Create Escalations Table
CREATE TABLE IF NOT EXISTS "escalations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "goal_id" UUID REFERENCES "goals"("id") ON DELETE CASCADE,
  "employee_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "manager_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- 8. Seed Default Realistic Enterprise Users
-- Default password: "password123" (hashed via bcryptjs)
INSERT INTO "users" ("id", "name", "email", "password_hash", "role", "department", "manager_id") VALUES
  ('admin-1111-1111-1111-111111111111', 'Rajesh Kumar', 'admin@goalforge.com', '$2a$10$wKzPZ6KUp.Jj2eG1q.G1uO6XGq0qF1H8G7.G5BqZ.hJ3o3VqG1u5W', 'ADMIN', 'HR', NULL),
  ('mgr-1111-1111-1111-111111111111', 'Kavita Nair', 'manager@goalforge.com', '$2a$10$wKzPZ6KUp.Jj2eG1q.G1uO6XGq0qF1H8G7.G5BqZ.hJ3o3VqG1u5W', 'MANAGER', 'Engineering', NULL),
  ('mgr-2222-2222-2222-222222222222', 'Deepak Joshi', 'deepak.joshi@goalforge.com', '$2a$10$wKzPZ6KUp.Jj2eG1q.G1uO6XGq0qF1H8G7.G5BqZ.hJ3o3VqG1u5W', 'MANAGER', 'Sales', NULL),
  ('emp-1111-1111-1111-111111111111', 'Arjun Mehta', 'employee@goalforge.com', '$2a$10$wKzPZ6KUp.Jj2eG1q.G1uO6XGq0qF1H8G7.G5BqZ.hJ3o3VqG1u5W', 'EMPLOYEE', 'Engineering', 'mgr-1111-1111-1111-111111111111'),
  ('emp-2222-2222-2222-222222222222', 'Priya Sharma', 'priya.sharma@goalforge.com', '$2a$10$wKzPZ6KUp.Jj2eG1q.G1uO6XGq0qF1H8G7.G5BqZ.hJ3o3VqG1u5W', 'EMPLOYEE', 'Engineering', 'mgr-1111-1111-1111-111111111111'),
  ('emp-3333-3333-3333-333333333333', 'Rohit Kapoor', 'rohit.kapoor@goalforge.com', '$2a$10$wKzPZ6KUp.Jj2eG1q.G1uO6XGq0qF1H8G7.G5BqZ.hJ3o3VqG1u5W', 'EMPLOYEE', 'Sales', 'mgr-2222-2222-2222-222222222222'),
  ('emp-4444-4444-4444-444444444444', 'Sneha Patel', 'sneha.patel@goalforge.com', '$2a$10$wKzPZ6KUp.Jj2eG1q.G1uO6XGq0qF1H8G7.G5BqZ.hJ3o3VqG1u5W', 'EMPLOYEE', 'Product', 'mgr-1111-1111-1111-111111111111'),
  ('emp-5555-5555-5555-555555555555', 'Vikram Singh', 'vikram.singh@goalforge.com', '$2a$10$wKzPZ6KUp.Jj2eG1q.G1uO6XGq0qF1H8G7.G5BqZ.hJ3o3VqG1u5W', 'EMPLOYEE', 'Sales', 'mgr-2222-2222-2222-222222222222')
ON CONFLICT (email) DO NOTHING;
