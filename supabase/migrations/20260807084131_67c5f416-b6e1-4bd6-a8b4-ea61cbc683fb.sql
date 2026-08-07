-- =============== ENUMS ===============
CREATE TYPE public.app_role AS ENUM ('admin', 'viewer');
CREATE TYPE public.api_version_status AS ENUM ('active', 'deprecated', 'disabled');
CREATE TYPE public.api_key_status AS ENUM ('active', 'suspended', 'revoked', 'expired');
CREATE TYPE public.api_user_status AS ENUM ('active', 'suspended', 'pending', 'blocked', 'deleted');
CREATE TYPE public.api_log_level AS ENUM ('info', 'warning', 'error', 'critical');

-- =============== SHARED ===============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =============== PROFILES ===============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== INTERNAL ROLES ===============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bootstrap: first authenticated user to sign up becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_count int;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN admin_count = 0 THEN 'admin'::public.app_role ELSE 'viewer'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============== API VERSIONS ===============
CREATE TABLE public.api_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  status public.api_version_status NOT NULL DEFAULT 'active',
  sunset_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_versions TO authenticated;
GRANT ALL ON public.api_versions TO service_role;
ALTER TABLE public.api_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_versions_read" ON public.api_versions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "api_versions_admin" ON public.api_versions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER api_versions_updated_at BEFORE UPDATE ON public.api_versions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== PERMISSIONS ===============
CREATE TABLE public.api_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  module text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_permissions TO authenticated;
GRANT ALL ON public.api_permissions TO service_role;
ALTER TABLE public.api_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_permissions_read" ON public.api_permissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "api_permissions_admin" ON public.api_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =============== API ROLES ===============
CREATE TABLE public.api_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_roles TO authenticated;
GRANT ALL ON public.api_roles TO service_role;
ALTER TABLE public.api_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_roles_read" ON public.api_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "api_roles_admin" ON public.api_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER api_roles_updated_at BEFORE UPDATE ON public.api_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.api_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.api_roles(id) ON DELETE CASCADE,
  permission_code text NOT NULL REFERENCES public.api_permissions(code) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_id, permission_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_role_permissions TO authenticated;
GRANT ALL ON public.api_role_permissions TO service_role;
ALTER TABLE public.api_role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_role_perms_read" ON public.api_role_permissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "api_role_perms_admin" ON public.api_role_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =============== API KEYS ===============
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  application_name text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  contact_person text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  key_prefix text NOT NULL,
  key_last4 text NOT NULL DEFAULT '',
  key_hash text NOT NULL,
  status public.api_key_status NOT NULL DEFAULT 'active',
  permissions text[] NOT NULL DEFAULT '{}',
  allowed_versions text[] NOT NULL DEFAULT '{}',
  rate_limit_per_minute integer NOT NULL DEFAULT 60,
  rate_limit_per_hour integer NOT NULL DEFAULT 1000,
  rate_limit_per_day integer NOT NULL DEFAULT 10000,
  expires_at timestamptz,
  last_used_at timestamptz,
  suspended_reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX api_keys_key_hash_idx ON public.api_keys(key_hash);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_read" ON public.api_keys FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "api_keys_admin" ON public.api_keys FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER api_keys_updated_at BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== API-MANAGED USERS ===============
CREATE TABLE public.api_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  status public.api_user_status NOT NULL DEFAULT 'pending',
  external_id text,
  phone text,
  metadata jsonb NOT NULL DEFAULT '{}',
  status_reason text,
  suspended_until timestamptz,
  deleted_at timestamptz,
  created_by_api_key uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX api_users_email_idx ON public.api_users(lower(email)) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_users TO authenticated;
GRANT ALL ON public.api_users TO service_role;
ALTER TABLE public.api_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_users_read" ON public.api_users FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "api_users_admin" ON public.api_users FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER api_users_updated_at BEFORE UPDATE ON public.api_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.api_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_user_id uuid NOT NULL REFERENCES public.api_users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.api_roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (api_user_id, role_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_user_roles TO authenticated;
GRANT ALL ON public.api_user_roles TO service_role;
ALTER TABLE public.api_user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_user_roles_read" ON public.api_user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "api_user_roles_admin" ON public.api_user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =============== REQUEST LOGS ===============
CREATE TABLE public.api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  endpoint text NOT NULL,
  api_version text,
  http_method text NOT NULL,
  application_name text,
  api_key_id uuid,
  api_key_prefix text,
  api_user_id uuid,
  source_ip text,
  duration_ms integer,
  status_code integer,
  outcome text,
  message text,
  request_bytes integer,
  response_bytes integer,
  level public.api_log_level NOT NULL DEFAULT 'info'
);
CREATE INDEX api_request_logs_occurred_idx ON public.api_request_logs(occurred_at DESC);
CREATE INDEX api_request_logs_key_idx ON public.api_request_logs(api_key_id);
GRANT SELECT ON public.api_request_logs TO authenticated;
GRANT ALL ON public.api_request_logs TO service_role;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_request_logs_read" ON public.api_request_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'viewer'));

-- =============== AUDIT (immutable) ===============
CREATE TABLE public.api_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_type text NOT NULL,
  actor_id text,
  actor_label text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  reason text,
  application_name text,
  api_version text,
  request_id text
);
CREATE INDEX api_audit_logs_occurred_idx ON public.api_audit_logs(occurred_at DESC);
GRANT SELECT ON public.api_audit_logs TO authenticated;
GRANT SELECT, INSERT ON public.api_audit_logs TO service_role;
ALTER TABLE public.api_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_audit_logs_read" ON public.api_audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'viewer'));

CREATE OR REPLACE FUNCTION public.prevent_audit_mutation()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'Audit records are immutable'; END; $$;
CREATE TRIGGER api_audit_logs_immutable BEFORE UPDATE OR DELETE ON public.api_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_mutation();

-- =============== RATE LIMIT COUNTERS ===============
CREATE TABLE public.api_rate_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL,
  window_kind text NOT NULL,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  UNIQUE (api_key_id, window_kind, window_start)
);
GRANT SELECT ON public.api_rate_counters TO authenticated;
GRANT ALL ON public.api_rate_counters TO service_role;
ALTER TABLE public.api_rate_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_rate_counters_read" ON public.api_rate_counters FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.api_register_hit(_api_key_id uuid, _kind text, _window_start timestamptz)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_hits integer;
BEGIN
  INSERT INTO public.api_rate_counters (api_key_id, window_kind, window_start, hits)
  VALUES (_api_key_id, _kind, _window_start, 1)
  ON CONFLICT (api_key_id, window_kind, window_start)
  DO UPDATE SET hits = public.api_rate_counters.hits + 1
  RETURNING hits INTO current_hits;
  RETURN current_hits;
END; $$;
REVOKE ALL ON FUNCTION public.api_register_hit(uuid, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.api_register_hit(uuid, text, timestamptz) TO service_role;

-- =============== SETTINGS ===============
CREATE TABLE public.api_settings (
  id boolean PRIMARY KEY DEFAULT true,
  api_key_ttl_days integer NOT NULL DEFAULT 365,
  jwt_ttl_minutes integer NOT NULL DEFAULT 60,
  default_limit_per_minute integer NOT NULL DEFAULT 60,
  default_limit_per_hour integer NOT NULL DEFAULT 1000,
  default_limit_per_day integer NOT NULL DEFAULT 10000,
  lockout_policy text NOT NULL DEFAULT 'suspend_after_repeated_abuse',
  log_retention_days integer NOT NULL DEFAULT 90,
  audit_retention_days integer NOT NULL DEFAULT 730,
  min_log_level public.api_log_level NOT NULL DEFAULT 'info',
  max_response_ms integer NOT NULL DEFAULT 3000,
  allow_hard_delete_users boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT api_settings_singleton CHECK (id)
);
GRANT SELECT, INSERT, UPDATE ON public.api_settings TO authenticated;
GRANT ALL ON public.api_settings TO service_role;
ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_settings_read" ON public.api_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "api_settings_admin" ON public.api_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER api_settings_updated_at BEFORE UPDATE ON public.api_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.api_settings (id) VALUES (true);

INSERT INTO public.api_versions (code, title, status, notes) VALUES
  ('v1', 'API pública v1', 'active', 'Versión inicial estable.');

INSERT INTO public.api_permissions (code, module, description) VALUES
  ('usuarios.leer','usuarios','Consultar usuarios y su estado'),
  ('usuarios.crear','usuarios','Dar de alta usuarios'),
  ('usuarios.modificar','usuarios','Modificar datos, estado, roles y permisos de usuarios'),
  ('usuarios.eliminar','usuarios','Dar de baja definitiva usuarios'),
  ('roles.leer','roles','Consultar roles'),
  ('roles.gestionar','roles','Crear y modificar roles'),
  ('permisos.leer','permisos','Consultar el catálogo de permisos'),
  ('clientes.leer','clientes','Consultar clientes'),
  ('clientes.crear','clientes','Crear clientes'),
  ('facturas.leer','facturas','Consultar facturas'),
  ('facturas.generar','facturas','Generar facturas'),
  ('configuracion.modificar','configuracion','Modificar la configuración del sistema');

INSERT INTO public.api_roles (name, description, is_system) VALUES
  ('Administrador','Acceso total a todos los permisos', true),
  ('Supervisor','Lectura completa y modificación de usuarios', false),
  ('Empleado','Operaciones habituales de lectura', false),
  ('Cliente','Acceso limitado a sus propios datos', false),
  ('Proveedor','Acceso limitado a facturación', false),
  ('Invitado','Solo lectura básica', false);

INSERT INTO public.api_role_permissions (role_id, permission_code)
SELECT r.id, p.code FROM public.api_roles r CROSS JOIN public.api_permissions p WHERE r.name = 'Administrador';

INSERT INTO public.api_role_permissions (role_id, permission_code)
SELECT r.id, p.code FROM public.api_roles r JOIN public.api_permissions p
  ON p.code IN ('usuarios.leer','usuarios.modificar','roles.leer','permisos.leer','clientes.leer','facturas.leer')
WHERE r.name = 'Supervisor';

INSERT INTO public.api_role_permissions (role_id, permission_code)
SELECT r.id, p.code FROM public.api_roles r JOIN public.api_permissions p
  ON p.code IN ('usuarios.leer','clientes.leer','facturas.leer')
WHERE r.name = 'Empleado';

INSERT INTO public.api_role_permissions (role_id, permission_code)
SELECT r.id, p.code FROM public.api_roles r JOIN public.api_permissions p
  ON p.code IN ('usuarios.leer') WHERE r.name = 'Invitado';