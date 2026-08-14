# Finalização do ELEVE_ENGINE — o que falta

Etapas 1 a 5 estão implementadas (backend, shell/tema, tempo real, marketplace/afiliação/campanhas/CRM, financeiro, comunidade e /admin). Restam quatro lacunas reais, verificadas no código.

## 1. Campanhas — drill-down completo (Etapa 4)

Hoje `/campanhas` lista todas as campanhas em sequência, sem navegação por produto → plataforma, sem séries temporais e sem métricas de assinatura.

- Navegação em três níveis: produtos afiliados → abas de plataforma (Facebook, Instagram, TikTok, Kwai) → campanhas e anúncios.
- Seletor de período 7d/30d/90d/12m alimentado por `campaign_metrics_daily`, com gráfico de investimento x receita e linha de ROAS.
- Blocos de assinatura (LTV, MRR, assinaturas ativas, churn, renovações) apenas quando o produto tem `is_subscription`.
- Detalhe do anúncio: criativo, formato, qualidade, entrega e breakdowns (idade, gênero, posicionamento, dispositivo).

## 2. Páginas ainda vazias

`/eleve-ia`, `/treinamentos` e `/agenda` são hoje apenas título + estado vazio.

- **Eleve IA**: chat funcional (gerador de copy, criativos e ângulos de campanha) usando a IA nativa da plataforma, com respostas em streaming e histórico na sessão.
- **Treinamentos**: trilhas com módulos, progresso e aulas em cards.
- **Agenda**: lista e calendário simples de lançamentos, mentorias e eventos.

## 3. Sino de notificações

O dropdown lista as notificações, mas não marca como lida nem mostra contador de não lidas de forma persistente.

- Badge com contagem de não lidas, "marcar todas como lidas" e clique individual marcando `read`.

## 4. Passagem final de qualidade

- Revisão mobile-first de todas as telas (tabelas com scroll, cards empilhados, sidebar em drawer).
- Conferir que nenhum texto visível ao usuário final menciona demonstração (o selo fica só em `/admin`).
- Verificação de tipos e teste do fluxo completo no navegador: login → afiliação → campanha → venda ao vivo (som + chuva de notas + atualização dos cards).

## Detalhes técnicos

Sem mudanças de esquema, exceto para Treinamentos e Agenda, que precisam de tabelas próprias (`trainings`/`training_lessons`, `events`) com RLS de leitura para autenticados, escrita apenas admin, GRANTs explícitos e seed inicial na mesma migração. O chat da Eleve IA roda em `createServerFn` com a IA nativa, sem persistência. Leituras seguem o padrão atual (TanStack Query + cliente Supabase autenticado) e as séries temporais de campanha viram uma query agregada em `campaign_metrics_daily` por dia/plataforma.

## Ordem de execução

1. Campanhas com drill-down e séries temporais
2. Eleve IA
3. Treinamentos e Agenda (migração + telas)
4. Notificações lidas + passagem de qualidade mobile e verificação no navegador
