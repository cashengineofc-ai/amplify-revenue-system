# Eleve Engine

ELEVE_ENGINE — plataforma de vendas e faturamento

Plataforma SaaS completa (dark principal + tema claro secundário), com dashboard financeiro, marketplace com afiliação, campanhas por plataforma, CRM, comunidade, financeiro/saques, "Minhas vendas", "Meus produtos" e painel admin oculto em /admin. Nenhum texto público menciona demonstração.

Etapa 1 — Backend (Lovable Cloud) e acesso





Ativar Cloud (Postgres + auth). Login com Google direto na tela de entrada, e-mail/senha como alternativa.



Tabelas: profiles, user_roles, products, product_metrics, affiliations, sales, transactions, withdrawals, notifications, campaigns, campaign_ads, campaign_metrics_daily, leads, feedbacks, app_settings.



Papéis em user_roles (enum admin/user) com função has_role. RLS por auth.uid() + admin. GRANTs explícitos em toda tabela.



Primeiro admin: okelvinempreendedor@gmail.com. Admin pode promover outros por e-mail.



Seed inicial: produtos com imagens geradas, campanhas e anúncios variados por plataforma (Meta→Facebook/Instagram, TikTok, Kwai), métricas diárias coerentes.

Etapa 2 — Shell, tema e Dashboard





Sidebar fixa (hambúrguer no mobile), logo, item ativo em vermelho, rodapé com nome/cargo, sino de notificações, alternador de tema.



Tokens semânticos em src/styles.css (oklch): dark #050505/#0B0B0D/#111114, borda #242428, vermelho #E50914/#FF1E2D; claro branco/vermelho com azul de apoio.



/ Dashboard: saudação, 4 cards com contagem animada e variação, gráfico de evolução (7d/30d/90d/12m), vendas recentes, produto em destaque. Sem ações do usuário.

Etapa 3 — Vendas ao vivo, PIX, notificações





Realtime do Cloud: nova venda/PIX/saque atualiza cards, gráfico, listas e sino sem recarregar.



Ao cair uma venda: toast no canto superior direito, som de caixa registradora e animação de notas de dólar subindo pela tela; contagem animada com brilho vermelho.

Etapa 4 — Marketplace, afiliação, campanhas, CRM





/marketplace: grade com capa, categoria, status, ticket, comissão (% e R$), EPC, conversão, temperatura, estrelas, afiliados, vendas 30d, reembolso. Filtros e ordenação.



Página do produto: galeria, descrição, público, materiais, funil, regras de comissão, botão Afiliar-se.



Afiliação gera links por plataforma (Meta Ads – Facebook/Instagram, TikTok, Kwai) com UTMs e cria automaticamente as campanhas do produto para o usuário.



/campanhas: só produtos afiliados; abrir produto → plataformas → campanhas e anúncios com o conjunto completo de métricas (investimento, impressões, alcance, frequência, cliques, CTR/CTR link, CPC, CPM, CPA, CPL, CAC, ROI, ROAS, RPM, resultados, LPV, conversão, receita, lucro, vendas, ticket, ViewContent/AddToCart/InitiateCheckout/Purchase, vídeo 3s/25/50/75/100%, ThruPlays, hook/hold rate, engajamento, comentários, compartilhamentos, salvamentos, seguidores, qualidade, entrega, status). Divisões por conjunto, criativo, idade, gênero, dispositivo, posicionamento, região e hora. Séries temporais 7/30/90d e 12m.



Produtos marcados como assinatura ganham LTV, MRR, assinaturas ativas, churn e renovações.



/crm: leads das campanhas com estágio e origem.



/meus-produtos e /minhas-vendas: desempenho por produto afiliado e lista detalhada de vendas.

Etapa 5 — Financeiro, páginas restantes e /admin





/financeiro: histórico de transações com badges e saques (saldo, solicitar saque, modal com valor, PIX e tipo de chave). Pedido entra como "Em análise".



/eleve-ia, /treinamentos, /comunidade, /agenda funcionais. Comunidade: usuário envia feedback (visível só para admin até aprovação); aprovados aparecem para todos.



/admin (só por URL, só admin): selo discreto de modo demonstração; seleção de usuário; dados financeiros e de perfil; CRUD de produtos com upload de foto e métricas de vitrine; CRUD de campanhas/anúncios por plataforma e todas as métricas; saldo de campanha; registrar venda exata (produto, valor, comissão, quantidade, método) para o usuário escolhido; enviar PIX; lançar/aprovar/recusar saques; notificações avulsas; produto em destaque; automação ao vivo (5s/10s/30s/1min) com ▶ Iniciar / ■ Parar; parâmetros de campanha por usuário (ROAS, CPC, CTR, CPM, conversão, ticket, investimento diário); gestão de afiliados; aprovar feedbacks; adicionar admins por e-mail.



Venda lançada pelo admin sobe faturamento, saldo, vendas, gráfico, histórico e as métricas das campanhas do produto do usuário escolhido.

Detalhes técnicos





TanStack Start + React 19 + TS; rotas privadas sob _authenticated; leitura/escrita via createServerFn com requireSupabaseAuth; TanStack Query com invalidação após cada evento.



Recharts para gráficos, Motion para contadores/toasts/animações; áudio de venda via Web Audio.



Upload de imagens de produto em Storage do Cloud.



Mobile-first em todas as telas; head() próprio por rota com título e descrição específicos.

Observação

Pelo tamanho, entrego nas 5 etapas acima, em sequência, começando pela ativação do Cloud e o esquema com seed. Use os prints que estou te enviando como modelo de design, mas melhore eles em 1000%, me entregue algo EXELENTE!

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://amplify-revenue-system.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d91b4a33-56d6-4f14-9863-f8c3b95db475).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
