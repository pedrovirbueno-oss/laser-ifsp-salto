# NEXO Production — Plataforma B2B para Digitalização e Monitoramento da Produção Industrial

NEXO Production é uma plataforma web B2B de ponta a ponta desenvolvida pela **NEXO Soluções Industriais e Automação S/A** para digitalizar o apontamento de chão de fábrica, acompanhar OEE em tempo real e preparar empresas industriais para a Indústria 4.0.

---

## 🛠️ Stack Tecnológica
- **Core**: Next.js 14 (App Router) + TypeScript Strict
- **Estilização**: Tailwind CSS + Design System B2B Industrial
- **Banco de Dados & Autenticação**: Supabase (PostgreSQL + RLS + Auth + Realtime + SSR)
- **Visualização**: Recharts
- **Relatórios**: jsPDF + jspdf-autotable
- **Exportação/Importação**: PapaParse

---

## 🚀 Arquitetura & Repository Pattern
A aplicação possui dois modos de execução controlados estritamente pela variável de ambiente:
`NEXT_PUBLIC_DEMO_MODE`

- **Demo Mode (`NEXT_PUBLIC_DEMO_MODE=true`)**:
  - Utiliza o **Demo Repository** pré-populado com dados realistas da "Metalúrgica Vale Industrial" (12 máquinas, 20 produtos, 30 operadores, 50 OPs, 60 dias de histórico).
  - Habilita o **Demo Role Switcher** no topo da interface.
- **Production Mode (`NEXT_PUBLIC_DEMO_MODE=false`)**:
  - Conecta-se diretamente ao banco PostgreSQL do Supabase via RLS.
  - Remove completamente o Role Switcher.

---

## 📋 Production Deployment Checklist (20-Step Protocol)
Antes de homologar e entregar a plataforma para uso em produção em um novo cliente:

1. [ ] Provisionar instância PostgreSQL no Supabase Cloud.
2. [ ] Executar script de migração [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor para criar 15 tabelas multi-tenant.
3. [ ] Executar [`supabase/seed.sql`](supabase/seed.sql) para popular categorias de parada e parâmetros base.
4. [ ] Validar Habilitação de RLS (Row Level Security) e policies em todas as tabelas.
5. [ ] Configurar projeto de produção no Vercel vinculado ao repositório Git.
6. [ ] Configurar a variável `NEXT_PUBLIC_DEMO_MODE=false` no ambiente Vercel.
7. [ ] Configurar a variável `NEXT_PUBLIC_SUPABASE_URL` no ambiente Vercel.
8. [ ] Configurar a variável `NEXT_PUBLIC_SUPABASE_ANON_KEY` no ambiente Vercel.
9. [ ] Configurar a variável restrita `SUPABASE_SERVICE_ROLE_KEY` exclusivamente no servidor Vercel.
10. [ ] Executar compilação local e checagem de tipos sem erros (`npx tsc --noEmit` & `npm run build`).
11. [ ] Realizar primeiro deploy de produção no Vercel.
12. [ ] Cadastrar a conta primária de Administrador via Supabase Auth / `/login`.
13. [ ] Acessar `/setup` com o perfil `ADMIN` para iniciar o Wizard Onboarding Idempotente.
14. [ ] Etapa 1 do Wizard: Inserir dados corporativos da planta industrial (CNPJ, Razão Social, Fuso).
15. [ ] Etapa 2 do Wizard: Cadastrar máquinas, códigos de identificação e setores fabris.
16. [ ] Etapa 3 do Wizard: Cadastrar catálogo de produtos, tempos de ciclo alvo e metas de refugo.
17. [ ] Etapas 4 e 5 do Wizard: Validar turnos de trabalho e motivos de parada padrão.
18. [ ] Etapas 6 e 7 do Wizard: Cadastrar operador inicial de chão de fábrica e concluir ativação.
19. [ ] Gerar chave de API de telemetria em `/settings` (exibida apenas uma única vez) para gateways IoT/CLP.
20. [ ] Executar a suíte de Smoke Test de 20 passos e verificar logs de auditoria append-only em `/audit`.

---

## 📁 Estrutura de Documentação
- [`docs/deploy.md`](docs/deploy.md) — Guia passo a passo para deploy em produção.
- [`docs/architecture.md`](docs/architecture.md) — Especificação técnica da arquitetura multi-tenant.
- [`docs/database.md`](docs/database.md) — Schema do banco PostgreSQL, tabelas e RLS policies.
- [`docs/oee.md`](docs/oee.md) — Modelo matemático de OEE, Disponibilidade, Performance e Qualidade.
- [`docs/demo-mode.md`](docs/demo-mode.md) — Separação rigorosa entre Demo e Produção.
- [`docs/security.md`](docs/security.md) — RLS, perfis de acesso, API keys e auditoria append-only.
- [`docs/api.md`](docs/api.md) — Documentação da REST API para integração com CLPs, ESP32 e gateways IoT.

---

## ⚡ Instalação e Execução Local

```bash
# 1. Instalar dependências
npm install

# 2. Executar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.
