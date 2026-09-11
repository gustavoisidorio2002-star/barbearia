-- ==============================================================================
-- SCRIPT SQL PARA O SUPABASE (Barbearia)
-- Execute no SQL Editor do seu projeto Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. TABELA DE SERVIÇOS
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  category TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE AGENDAMENTOS
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  service_id TEXT REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  service_price NUMERIC(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE CONFIGURAÇÕES (Perfil e horários da barbearia)
CREATE TABLE IF NOT EXISTS public.barbershop_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_settings ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE ACESSO (PERMISSÕES PÚBLICAS PARA AGENDAMENTO WEB)
DROP POLICY IF EXISTS "Permitir serviços" ON public.services;
CREATE POLICY "Permitir serviços" ON public.services FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir agendamentos" ON public.appointments;
CREATE POLICY "Permitir agendamentos" ON public.appointments FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir configurações" ON public.barbershop_settings;
CREATE POLICY "Permitir configurações" ON public.barbershop_settings FOR ALL USING (true);

-- 6. HABILITAR REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
