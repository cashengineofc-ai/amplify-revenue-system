CREATE TABLE public.trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  level text NOT NULL DEFAULT 'Iniciante',
  cover_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trainings TO authenticated;
GRANT ALL ON public.trainings TO service_role;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY trainings_read ON public.trainings FOR SELECT TO authenticated USING (true);
CREATE POLICY trainings_admin_write ON public.trainings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER t_trainings_updated BEFORE UPDATE ON public.trainings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.training_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  duration_min int NOT NULL DEFAULT 10,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.training_lessons TO authenticated;
GRANT ALL ON public.training_lessons TO service_role;
ALTER TABLE public.training_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY training_lessons_read ON public.training_lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY training_lessons_admin_write ON public.training_lessons FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER t_training_lessons_updated BEFORE UPDATE ON public.training_lessons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.training_lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_progress TO authenticated;
GRANT ALL ON public.training_progress TO service_role;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY training_progress_own ON public.training_progress FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  kind text NOT NULL DEFAULT 'mentoria',
  starts_at timestamptz NOT NULL,
  duration_min int NOT NULL DEFAULT 60,
  link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_read ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY events_admin_write ON public.events FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER t_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.trainings (slug, title, description, level, sort_order) VALUES
 ('fundamentos-afiliacao','Fundamentos da Afiliação','Do zero à primeira comissão: escolha de produto, oferta e estrutura de venda.','Iniciante',1),
 ('trafego-meta','Tráfego Pago no Meta Ads','Estrutura de campanhas, públicos, criativos e escala no Facebook e Instagram.','Intermediário',2),
 ('tiktok-kwai','TikTok e Kwai para Afiliados','Criativos nativos, testes rápidos e CPA baixo nas plataformas de vídeo curto.','Intermediário',3),
 ('escala-gestao','Escala e Gestão de Caixa','ROI, reinvestimento, controle de reembolso e previsibilidade de faturamento.','Avançado',4);

INSERT INTO public.training_lessons (training_id, title, description, duration_min, sort_order)
SELECT t.id, l.title, l.description, l.duration, l.ord FROM public.trainings t
JOIN (VALUES
 ('fundamentos-afiliacao','Como escolher o produto certo','Critérios de EPC, temperatura e reembolso.',14,1),
 ('fundamentos-afiliacao','Entendendo a comissão','Percentual, ticket e recorrência na prática.',11,2),
 ('fundamentos-afiliacao','Seu primeiro link','Gerando links com UTMs por plataforma.',9,3),
 ('fundamentos-afiliacao','Primeira venda em 7 dias','Plano de ação semanal.',18,4),
 ('trafego-meta','Estrutura de conta','Campanha, conjunto e anúncio sem desperdício.',16,1),
 ('trafego-meta','Públicos que convertem','Amplo, interesses e lookalike.',15,2),
 ('trafego-meta','Criativos de alta performance','Ganchos, provas e chamadas.',20,3),
 ('trafego-meta','Escala vertical e horizontal','Quando duplicar e quando aumentar orçamento.',17,4),
 ('tiktok-kwai','Criativo nativo','Roteiro de vídeo que não parece anúncio.',13,1),
 ('tiktok-kwai','Testes rápidos','Ciclo de validação em 72 horas.',12,2),
 ('tiktok-kwai','Otimização de CPA','Leitura de métricas e cortes.',15,3),
 ('escala-gestao','Leitura de ROI real','Reembolso, chargeback e margem.',14,1),
 ('escala-gestao','Reinvestimento inteligente','Quanto do caixa volta para tráfego.',12,2),
 ('escala-gestao','Previsibilidade de faturamento','Metas, projeção e controle.',16,3)
) AS l(slug,title,description,duration,ord) ON l.slug = t.slug;

INSERT INTO public.events (title, description, kind, starts_at, duration_min) VALUES
 ('Mentoria ao vivo: escala no Meta Ads','Análise de contas e ajustes de campanha em tempo real.','mentoria', now() + interval '2 days', 90),
 ('Lançamento: nova oferta do marketplace','Apresentação da oferta, comissões e materiais.','lancamento', now() + interval '6 days', 60),
 ('Workshop de criativos para TikTok','Produção de 5 criativos em uma sessão.','workshop', now() + interval '11 days', 120),
 ('Plantão de dúvidas da comunidade','Perguntas abertas sobre campanhas e caixa.','plantao', now() + interval '17 days', 60),
 ('Imersão: gestão de caixa do afiliado','Planejamento financeiro e reinvestimento.','imersao', now() + interval '24 days', 180);