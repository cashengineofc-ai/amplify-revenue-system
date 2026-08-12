
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TYPE public.platform AS ENUM ('meta_facebook','meta_instagram','tiktok','kwai');
CREATE TYPE public.sale_status AS ENUM ('aprovada','pendente','reembolsada','chargeback');
CREATE TYPE public.tx_type AS ENUM ('comissao','saque','pix','ajuste','bonus');
CREATE TYPE public.tx_status AS ENUM ('concluida','pendente','recusada');
CREATE TYPE public.withdrawal_status AS ENUM ('em_analise','aprovado','recusado','pago');
CREATE TYPE public.lead_stage AS ENUM ('novo','contato','qualificado','negociacao','ganho','perdido');

-- UPDATED AT
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  pix_key text,
  pix_key_type text,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  onboarding_done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "user_roles_admin_write" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- NEW USER TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
          NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN lower(NEW.email) = 'okelvinempreendedor@gmail.com' THEN 'admin'::public.app_role ELSE 'user'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  description text,
  category text NOT NULL DEFAULT 'Negócios',
  cover_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ticket numeric(12,2) NOT NULL DEFAULT 0,
  commission_pct numeric(5,2) NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'ativo',
  is_subscription boolean NOT NULL DEFAULT false,
  audience text,
  funnel text,
  commission_rules text,
  materials jsonb NOT NULL DEFAULT '[]'::jsonb,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_read_all" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_admin_write" ON public.products FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.product_metrics (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  epc numeric(10,2) NOT NULL DEFAULT 0,
  conversion_rate numeric(6,2) NOT NULL DEFAULT 0,
  temperature int NOT NULL DEFAULT 50,
  stars numeric(3,2) NOT NULL DEFAULT 4.5,
  affiliates_count int NOT NULL DEFAULT 0,
  sales_30d int NOT NULL DEFAULT 0,
  refund_rate numeric(5,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_metrics TO authenticated;
GRANT ALL ON public.product_metrics TO service_role;
ALTER TABLE public.product_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_metrics_read_all" ON public.product_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_metrics_admin_write" ON public.product_metrics FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- AFFILIATIONS
CREATE TABLE public.affiliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  links jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliations TO authenticated;
GRANT ALL ON public.affiliations TO service_role;
ALTER TABLE public.affiliations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliations_own_or_admin" ON public.affiliations FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- SALES
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  commission numeric(12,2) NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1,
  method text NOT NULL DEFAULT 'pix',
  status public.sale_status NOT NULL DEFAULT 'aprovada',
  buyer_name text,
  platform public.platform,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_own_or_admin" ON public.sales FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.tx_type NOT NULL,
  amount numeric(12,2) NOT NULL,
  description text,
  status public.tx_status NOT NULL DEFAULT 'concluida',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_own_or_admin" ON public.transactions FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- WITHDRAWALS
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL,
  pix_key text NOT NULL,
  pix_key_type text NOT NULL DEFAULT 'email',
  status public.withdrawal_status NOT NULL DEFAULT 'em_analise',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "withdrawals_own_or_admin" ON public.withdrawals FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  kind text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own_or_admin" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- CAMPAIGNS
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  platform public.platform NOT NULL,
  name text NOT NULL,
  objective text NOT NULL DEFAULT 'Conversões',
  status text NOT NULL DEFAULT 'ativa',
  daily_budget numeric(12,2) NOT NULL DEFAULT 100,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_own_or_admin" ON public.campaigns FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.campaign_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  adset text NOT NULL DEFAULT 'Conjunto 01',
  name text NOT NULL,
  creative text,
  format text NOT NULL DEFAULT 'video',
  status text NOT NULL DEFAULT 'ativo',
  quality text NOT NULL DEFAULT 'Acima da média',
  delivery text NOT NULL DEFAULT 'Veiculando',
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  breakdowns jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_ads TO authenticated;
GRANT ALL ON public.campaign_ads TO service_role;
ALTER TABLE public.campaign_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_ads_own_or_admin" ON public.campaign_ads FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.campaign_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  ad_id uuid REFERENCES public.campaign_ads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  day date NOT NULL DEFAULT CURRENT_DATE,
  spend numeric(12,2) NOT NULL DEFAULT 0,
  revenue numeric(12,2) NOT NULL DEFAULT 0,
  sales int NOT NULL DEFAULT 0,
  clicks int NOT NULL DEFAULT 0,
  impressions int NOT NULL DEFAULT 0,
  leads int NOT NULL DEFAULT 0,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cmd_campaign_day ON public.campaign_metrics_daily(campaign_id, day);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_metrics_daily TO authenticated;
GRANT ALL ON public.campaign_metrics_daily TO service_role;
ALTER TABLE public.campaign_metrics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cmd_own_or_admin" ON public.campaign_metrics_daily FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- LEADS
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  stage public.lead_stage NOT NULL DEFAULT 'novo',
  source text NOT NULL DEFAULT 'meta_facebook',
  value numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_own_or_admin" ON public.leads FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- FEEDBACKS
CREATE TABLE public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  author_name text,
  content text NOT NULL,
  rating int NOT NULL DEFAULT 5,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedbacks TO authenticated;
GRANT ALL ON public.feedbacks TO service_role;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedbacks_select" ON public.feedbacks FOR SELECT TO authenticated
  USING (approved OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "feedbacks_insert_own" ON public.feedbacks FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "feedbacks_admin_write" ON public.feedbacks FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "feedbacks_admin_delete" ON public.feedbacks FOR DELETE TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

-- APP SETTINGS
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_read" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_settings_admin_write" ON public.app_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- UPDATED AT TRIGGERS
CREATE TRIGGER t_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_ads_updated BEFORE UPDATE ON public.campaign_ads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_withdrawals_updated BEFORE UPDATE ON public.withdrawals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- REALTIME
ALTER TABLE public.sales REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.withdrawals REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.campaigns REPLICA IDENTITY FULL;
ALTER TABLE public.campaign_ads REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_ads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- SEED PRODUTOS
INSERT INTO public.products (slug,name,tagline,description,category,ticket,commission_pct,is_subscription,audience,funnel,commission_rules,featured,materials) VALUES
('cash-engine','Cash Engine','O motor de vendas para afiliados de alto desempenho','Método completo de tráfego pago e escala para afiliados que querem sair do zero e construir uma operação previsível de vendas diárias.','Negócios',497.00,60,false,'Afiliados iniciantes e intermediários que já rodam tráfego','VSL + Checkout direto','60% na venda principal e 40% nos order bumps. Cookie de 60 dias.',true,'["Criativos em vídeo","Copies prontas","Estrutura de campanha","Páginas de captura"]'),
('eleve-studio','Eleve Studio','Criativos que vendem, em escala','Studio de criativos com templates, roteiros e estrutura de produção para gerar anúncios validados em minutos.','Marketing',297.00,50,false,'Gestores de tráfego e produtores de conteúdo','Isca + Webinário','50% na venda principal. Cookie de 45 dias.',false,'["Templates editáveis","Roteiros de hook","Banco de trilhas"]'),
('eleve-link','Eleve Link','Sua central de links e rastreamento','Ferramenta de links inteligentes com UTMs automáticas, redirecionamento e rastreamento de conversão por plataforma.','Ferramentas',97.00,40,true,'Afiliados e infoprodutores que precisam rastrear tudo','Trial + Assinatura','40% recorrente enquanto a assinatura estiver ativa.',false,'["Guia de UTMs","Integrações","Pixel helper"]'),
('mentoria-high-ticket','Mentoria High-Ticket','Do primeiro contato ao contrato assinado','Programa de mentoria para estruturar oferta, funil e time comercial de produtos acima de R$ 2.000.','Mentoria',2497.00,30,false,'Consultores e donos de negócio digital','Aplicação + Call de vendas','30% na venda aprovada após período de garantia de 7 dias.',false,'["Scripts de call","Planilha de pipeline","Modelos de proposta"]'),
('trafego-absoluto','Tráfego Absoluto','Domine Meta, TikTok e Kwai','Treinamento avançado de mídia paga multiplataforma com estruturas de campanha, escala vertical e horizontal.','Marketing',697.00,55,false,'Gestores de tráfego profissionais','VSL longa + Remarketing','55% na venda principal e 30% no upsell.',false,'["Estruturas de campanha","Planilha de escala","Checklists"]'),
('assinatura-eleve-pro','Eleve Pro','Comunidade e ferramentas todo mês','Assinatura mensal com atualizações, comunidade fechada, lives semanais e acesso às ferramentas Eleve.','Assinatura',197.00,45,true,'Toda a base de afiliados da plataforma','Trial 7 dias + Assinatura','45% recorrente por até 12 meses.',false,'["Kit de lançamento","Convites","Materiais de remarketing"]');

INSERT INTO public.product_metrics (product_id, epc, conversion_rate, temperature, stars, affiliates_count, sales_30d, refund_rate)
SELECT id,
  CASE slug WHEN 'cash-engine' THEN 4.82 WHEN 'eleve-studio' THEN 3.15 WHEN 'eleve-link' THEN 1.94 WHEN 'mentoria-high-ticket' THEN 9.60 WHEN 'trafego-absoluto' THEN 5.27 ELSE 2.41 END,
  CASE slug WHEN 'cash-engine' THEN 2.80 WHEN 'eleve-studio' THEN 2.10 WHEN 'eleve-link' THEN 3.40 WHEN 'mentoria-high-ticket' THEN 0.90 WHEN 'trafego-absoluto' THEN 2.35 ELSE 3.10 END,
  CASE slug WHEN 'cash-engine' THEN 96 WHEN 'eleve-studio' THEN 78 WHEN 'eleve-link' THEN 64 WHEN 'mentoria-high-ticket' THEN 71 WHEN 'trafego-absoluto' THEN 88 ELSE 59 END,
  CASE slug WHEN 'cash-engine' THEN 4.90 WHEN 'eleve-studio' THEN 4.70 WHEN 'eleve-link' THEN 4.40 WHEN 'mentoria-high-ticket' THEN 4.80 WHEN 'trafego-absoluto' THEN 4.60 ELSE 4.30 END,
  CASE slug WHEN 'cash-engine' THEN 1284 WHEN 'eleve-studio' THEN 742 WHEN 'eleve-link' THEN 511 WHEN 'mentoria-high-ticket' THEN 196 WHEN 'trafego-absoluto' THEN 903 ELSE 348 END,
  CASE slug WHEN 'cash-engine' THEN 3120 WHEN 'eleve-studio' THEN 1480 WHEN 'eleve-link' THEN 2210 WHEN 'mentoria-high-ticket' THEN 84 WHEN 'trafego-absoluto' THEN 1760 ELSE 940 END,
  CASE slug WHEN 'cash-engine' THEN 3.20 WHEN 'eleve-studio' THEN 4.10 WHEN 'eleve-link' THEN 2.60 WHEN 'mentoria-high-ticket' THEN 6.40 WHEN 'trafego-absoluto' THEN 3.70 ELSE 5.10 END
FROM public.products;

INSERT INTO public.app_settings (key, value) VALUES
('featured_product', '{"slug":"cash-engine"}'),
('live_automation', '{"running":false,"interval_ms":10000}');
