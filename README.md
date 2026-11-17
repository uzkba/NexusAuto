# NEXUS AUTO

Plataforma web responsiva que conecta **alunos** a **instrutores autônomos de direção** (categorias A e B), com busca por filtros, perfil detalhado, comprovante de credenciamento analisado pela plataforma, contato por WhatsApp e avaliações.

Projeto da disciplina **Engenharia de Software II** (UEPB). Este README resume as decisões de tecnologia e arquitetura; a especificação completa está em `Especificacao-Projeto-ESII-NEXUS-AUTO-v0.1.pdf`.

> **Status:** planejamento concluído, desenvolvimento ainda não iniciado. Seções marcadas com *(a definir)* dependem de decisões em aberto (ver [Decisões em aberto](#decisões-em-aberto)).

---

## Sumário

1. [Stack](#stack)
2. [Arquitetura](#arquitetura)
3. [Estrutura do repositório](#estrutura-do-repositório)
4. [Banco de dados](#banco-de-dados)
5. [Autenticação e segurança](#autenticação-e-segurança)
6. [Arquivos, e-mail e notificações](#arquivos-e-mail-e-notificações)
7. [Testes, CI e fluxo da equipe](#testes-ci-e-fluxo-da-equipe)
8. [Rastreabilidade: backlog e tecnologia](#rastreabilidade-backlog-e-tecnologia)
9. [Tecnologias descartadas](#tecnologias-descartadas)
10. [Decisões em aberto](#decisões-em-aberto)
11. [Limitações conhecidas](#limitações-conhecidas)
12. [Ordem de implementação](#ordem-de-implementação)
13. [Como rodar](#como-rodar-a-definir)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Front-end | React + Vite + TypeScript, mobile first, instalável como PWA |
| Roteamento, dados e formulários | React Router, TanStack Query, React Hook Form + Zod |
| Estilo | Tailwind CSS |
| Backend | FastAPI (Python), Pydantic, Uvicorn |
| Banco | PostgreSQL + SQLAlchemy 2 + Alembic |
| Autenticação | JWT (access + refresh), argon2, `slowapi` |
| Arquivos | Bucket privado compatível com S3 (Cloudflare R2 ou Supabase Storage), URL assinada de curta duração |
| Imagens | Redução no navegador antes do envio e Pillow no servidor |
| E-mail | Resend ou SMTP |
| Notificações | Tabela `notifications` + `BackgroundTasks` |
| Testes e CI | pytest, Vitest + Testing Library, GitHub Actions |
| Qualidade | Ruff (Python), ESLint + Prettier, TypeScript |
| Ambiente local | Docker Compose com PostgreSQL |

### Front-end

Aplicação web responsiva, desenhada primeiro para celular. Atende ao RNF09 (uso em celular, com conexão limitada).

| Necessidade | Tecnologia | Requisitos |
|---|---|---|
| Framework e build | React + Vite | RNF09 |
| Linguagem | TypeScript | RNF14 |
| Roteamento | React Router | RNF10 |
| Dados da API, cache e paginação | TanStack Query | RNF12, RNF09 |
| Formulários e validação | React Hook Form + Zod | BL01, BL07, RNF10 |
| Estilo responsivo | Tailwind CSS | RNF09, RNF11 |
| Sessão | Token de acesso em memória + refresh token em cookie `httpOnly` | RNF01, RNF02 |
| Foto e comprovante | Campo de arquivo do navegador; foto reduzida antes do envio | BL04, RNF03, RNF13 |
| Contato por WhatsApp | Link `https://wa.me` com texto pré-preenchido | BL09, RF14 |
| Instalação na tela inicial | `vite-plugin-pwa` | RNF09 (opcional) |

**Sessão.** Guardar tokens em `localStorage` expõe o token a qualquer falha de XSS. Com o refresh token em cookie `httpOnly`, o JavaScript do front nunca lê o token de longa duração. Em troca, a API precisa configurar CORS e o atributo `SameSite` do cookie.

**Acessibilidade (RNF11).** Rótulos nos campos, contraste adequado e navegação por teclado.

**O que se perde por ser web.** Não há loja de aplicativos nem push nativo. É aceitável: as notificações dentro da aplicação cumprem o BL08.

**RNF15 precisa ser reescrito.** Hoje fala em sistema operacional Android. Redação sugerida: *"Funcionar nas duas últimas versões do Chrome para Android e do Chrome para desktop, com layout adaptado a telas de celular."*

### Backend

API REST em FastAPI. A documentação OpenAPI/Swagger sai automaticamente do código, o que cobre o RNF14.

| Necessidade | Tecnologia | Requisitos |
|---|---|---|
| Framework da API | FastAPI | RNF12, RNF14 |
| Validação de entrada e saída | Pydantic | Critérios de aceite de BL01, BL07, BL11 |
| Acesso ao banco | SQLAlchemy 2 | RNF12 |
| Migrações do schema | Alembic | Trabalho em equipe |
| Servidor | Uvicorn | RNF17 |
| Configuração | pydantic-settings, variáveis de ambiente | RNF01 |
| Documentação | Swagger UI em `/docs` | RNF14 |

---

## Arquitetura

Sistema simples em camadas: uma aplicação web, uma única API e um banco PostgreSQL, com um bucket privado para os comprovantes.

```text
                                        ┌──────────────────────┐
                                   ┌───▶│ PostgreSQL           │
┌────────────────────┐   HTTPS     │    │ 17 tabelas, Alembic  │
│ Aplicação web      │◀──────────▶ ┌────┴───┐ └──────────────────────┘
│ (PWA)              │             │ API    │ ┌──────────────────────┐
│ React + Vite + TS  │             │ REST   ├▶│ Bucket privado       │
└─────────┬──────────┘             │FastAPI │ │ comprovantes, fotos  │
          │ link wa.me             └────┬───┘ └──────────────────────┘
          ▼                             │     ┌──────────────────────┐
┌────────────────────┐                  └────▶│ E-mail (Resend/SMTP) │
│ WhatsApp (externo) │                        └──────────────────────┘
└────────────────────┘
```

O front fala com a API por HTTPS. A API confere o perfil de cada requisição, consulta o banco, guarda arquivos no bucket e envia e-mails. O contato com o instrutor sai da aplicação direto para o WhatsApp, fora do sistema (BL09).

### Princípios

1. **Poucas peças.** Cinco pessoas e um semestre: cada tecnologia extra precisa justificar o custo de aprender e manter.
2. **Regras no servidor.** Autorização, verificação e restrições de dados ficam na API e no banco, não só na interface.
3. **Backlog testável.** Cada critério de aceite vira um teste automatizado.

---

## Estrutura do repositório

Estrutura planejada do backend. A organização do front *(a definir)* segue as convenções do Vite.

```text
backend/
  app/
    main.py
    core/        configuração, segurança, dependências de autorização
    models/      tabelas (SQLAlchemy)
    schemas/     contratos de entrada e saída (Pydantic)
    routers/     auth, alunos, instrutores, veículos, credenciamento,
                 busca, contato, avaliações, admin, notificações
    services/    regras de negócio (aprovação, busca, avaliação)
  alembic/       migrações
  tests/         um teste por critério de aceite do backlog
```

**Regra de projeto.** Os routers ficam finos: recebem a requisição, chamam um service e devolvem a resposta. As regras de negócio (por exemplo, "só avalia quem clicou no contato") ficam nos services, onde podem ser testadas sem subir a API.

---

## Banco de dados

PostgreSQL como único banco, com modelo relacional de 17 tabelas. Os filtros do RF11 (cidade, categoria, veículo, terreno e disponibilidade) viram junções entre tabelas indexadas, o que basta para a meta de 2 segundos com até 1.000 instrutores (RNF12).

| Grupo | Tabelas | Atende |
|---|---|---|
| Referência | `cities` (código IBGE), `terrain_types` | RF11 |
| Contas | `users`, `password_reset_tokens` | BL07, RF01 a RF03 |
| Aluno | `students`, `student_goals` | BL02, RF09 |
| Instrutor | `instructors`, `instructor_categories`, `instructor_cities`, `instructor_terrains`, `instructor_availability`, `vehicles` | BL01, BL11, RF04, RF05 |
| Credenciamento | `accreditation_submissions` | BL04, BL10, RF06 a RF08 |
| Contato e avaliação | `contact_clicks`, `reviews`, `review_reports` | BL09, BL05, RF14, RF16 a RF18 |
| Notificações | `notifications` | BL08, RF19 |

### Esquema (rascunho)

Esboço para orientar os models SQLAlchemy e a primeira migração. Tipos e nomes podem mudar na implementação.

```sql
-- Referência
cities (ibge_code int PK, name text, uf char(2))          -- carregar da base do IBGE
terrain_types (id smallint PK, code text unique)          -- urbano, rodovia, estrada_terra

-- Usuários
users (
  id uuid PK, email citext UNIQUE, password_hash text,
  display_name text, role text CHECK (role IN ('aluno','instrutor','admin')),
  terms_accepted_at timestamptz, terms_version text,
  created_at timestamptz, deleted_at timestamptz
)
password_reset_tokens (id, user_id FK, token_hash text, expires_at, used_at)

-- Aluno
students (user_id PK/FK, city_ibge int FK, vehicle_interest text)
student_goals (student_id FK, goal text CHECK (goal IN ('primeira_habilitacao','rodovia','retomada')),
               PRIMARY KEY (student_id, goal))

-- Instrutor
instructors (
  user_id PK/FK, photo_key text, experience text, training_structure text,
  phone text, verification_status text DEFAULT 'pendente'   -- cópia para a busca
)
instructor_categories (instructor_id FK, category char(1) CHECK IN ('A','B'), PK(both))
instructor_cities     (instructor_id FK, city_ibge FK, PK(both))
instructor_terrains   (instructor_id FK, terrain_id FK, PK(both))
instructor_availability (instructor_id FK, weekday smallint CHECK 0-6,
                         period text CHECK IN ('manha','tarde','noite'),
                         PK(instructor_id, weekday, period))
vehicles (id, instructor_id FK, type text, brand_model text, year smallint,
          transmission text CHECK IN ('manual','automatico'),
          dual_control boolean, category char(1))

-- Verificação (histórico, não só o status atual)
accreditation_submissions (
  id, instructor_id FK, accreditation_number text, file_key text,
  status text CHECK IN ('pendente','aprovado','rejeitado'),
  rejection_reason text, reviewed_by FK users, reviewed_at, submitted_at
)

-- Contato e avaliação
contact_clicks (id, student_id FK, instructor_id FK, clicked_at)
reviews (id, student_id FK, instructor_id FK, rating smallint CHECK 1-5,
         comment text, hidden boolean DEFAULT false, created_at, updated_at,
         UNIQUE (student_id, instructor_id))
review_reports (id, review_id FK, reporter_id FK, reason text, created_at,
                resolved_at, UNIQUE (review_id, reporter_id))

-- Notificações
notifications (id, user_id FK, type text, payload jsonb, read_at, created_at)
```

### Índices para a busca

```sql
CREATE INDEX ON instructors (verification_status);
CREATE INDEX ON instructor_cities (city_ibge, instructor_id);
CREATE INDEX ON instructor_terrains (terrain_id, instructor_id);
CREATE INDEX ON vehicles (type, instructor_id);
CREATE INDEX ON reviews (instructor_id) WHERE hidden = false;
```

### Decisões de modelagem

1. **Cidade pelo código IBGE, não por texto livre.** Com texto livre, "Patos", "patos-pb" e "Patos PB" quebram o filtro. A tabela `cities` é carregada uma vez a partir da base do IBGE.
2. **Credenciamento em tabela própria, com histórico.** O BL04 exige status com motivo de rejeição e o BL10 exige responsável e data. Uma coluna de status não guarda reenvios. `instructors.verification_status` é só uma cópia para acelerar a busca, atualizada na mesma transação da aprovação (RNF07).
3. **Atributos do instrutor em tabelas de junção.** Categorias, cidades, terrenos e disponibilidade ficam em tabelas próprias, o que permite combinar filtros com índices em vez de buscar em texto.
4. **Regras de aceite também no banco.** `CHECK` e `UNIQUE` garantem, por exemplo, uma avaliação por aluno para cada instrutor (BL05) e nota entre 1 e 5, mesmo se a API tiver um erro.
5. **E-mail único sem diferenciar maiúsculas.** Tipo `citext` (extensão do PostgreSQL) em `users.email`.
6. **Média de avaliações calculada na consulta** com `AVG()` e `COUNT()`. Só se denormaliza se o teste de desempenho do RNF12 falhar.

---

## Autenticação e segurança

A autenticação usa JWT com senhas protegidas por argon2. Toda regra de acesso é validada no servidor, nunca apenas escondida na interface.

| Requisito | Solução | Observação |
|---|---|---|
| RNF01: senhas e HTTPS | Hash com argon2; HTTPS pela hospedagem | Nenhuma senha ou segredo em texto no repositório |
| RF02, RNF02: login e perfis | JWT de acesso de curta duração + refresh token; uma dependência do FastAPI por perfil (aluno, instrutor, admin) em cada rota | Front guarda o token de acesso em memória e o refresh em cookie `httpOnly` (a API configura CORS e `SameSite`) |
| RF03: recuperação de senha | Token de uso único, validade curta, guardado só como hash em `password_reset_tokens` | Envio por e-mail |
| RNF04: tentativas de login | `slowapi`, com limite por IP e por e-mail | Também protege a recuperação de senha |
| RNF04: textos livres | Sanitização no servidor para experiência e comentários | O React escapa texto por padrão, mas a sanitização protege qualquer outro cliente, como o painel do admin |
| RNF05: LGPD | Aceite dos termos registrado com data e versão; coleta mínima de dados | Fluxo de exclusão de conta a definir |
| RNF06: telefone do instrutor | Retornado apenas em rotas autenticadas | Ver limitação abaixo |

**Limitação do RNF06.** Qualquer pessoa cria uma conta em duas etapas, então "visível só para autenticados" não impede a coleta de vários telefones. Mitigação: limite de requisições nas rotas de perfil e de contato, e registrar a limitação.

**Selo de verificado.** Não há integração com o Detran: o administrador analisa um comprovante enviado pelo próprio instrutor. A interface e a documentação devem dizer **"comprovante analisado pela plataforma"**, e não validação oficial.

---

## Arquivos, e-mail e notificações

Os comprovantes ficam em bucket privado e nunca são servidos como arquivo público. E-mail e notificações rodam em segundo plano, para que uma falha de envio não derrube a operação que a originou (RNF08).

| Função | Tecnologia | Requisitos |
|---|---|---|
| Comprovantes (PDF, JPG, PNG, até 5 MB) | Bucket privado S3-compatível; URL assinada de curta duração, só para o instrutor dono e o administrador | BL04, RNF03 |
| Validação do upload | No servidor: tipo conferido pelo conteúdo e limite de 5 MB | RNF03 |
| Fotos de perfil | Redimensionadas no navegador e novamente no servidor com Pillow | RNF13 |
| E-mail de recuperação de senha | Resend ou SMTP | BL07, RF03 |
| Notificações | Tabela `notifications` + `BackgroundTasks`; a aplicação consulta ao abrir | BL08, RF19, RNF08 |

**Fora desta versão.** Web Push. O RF19 tem prioridade baixa e as notificações dentro da aplicação já cumprem o BL08.

**Limitação.** `BackgroundTasks` roda no mesmo processo da API e não reenvia sozinho. Para o escopo acadêmico basta registrar a falha em log.

---

## Testes, CI e fluxo da equipe

Cada critério de aceite do backlog vira pelo menos um teste automatizado, e o GitHub Actions executa os testes em todo pull request.

| Prática | Ferramenta | Observação |
|---|---|---|
| Testes da API | pytest + cliente de teste do FastAPI, contra um PostgreSQL de teste | Nomear com o ID do item, ex.: `test_bl04_perfil_pendente_nao_aparece_na_busca` |
| Testes do front | Vitest + Testing Library | Só nas telas críticas: cadastro, login e busca |
| Integração contínua | GitHub Actions com PostgreSQL como serviço | Testes e lint a cada pull request |
| Qualidade de código | Ruff, ESLint + Prettier, verificação de tipos | Mesmas regras para as 5 pessoas |
| Ambiente local | Docker Compose com PostgreSQL | |
| Gestão do trabalho | GitHub + GitHub Projects | Um branch por issue; pull request revisado por pelo menos uma pessoa antes do merge |

**Testes de maior valor** (protegem as regras de confiança): perfil não aprovado fora da busca (RNF07), avaliação só após contato (BL05), rota de administrador negada a outros perfis (RNF02) e telefone oculto para quem não está logado (RNF06).

---

## Rastreabilidade: backlog e tecnologia

| Item | Requisitos | Como é atendido |
|---|---|---|
| BL01 Portfólio do instrutor | RF04 | React Hook Form + Zod; `instructors` e tabelas de junção; obrigatórios validados no Pydantic |
| BL02 Objetivos do aluno | RF09 | `students` e `student_goals`; cidade/UF como região padrão da tela principal |
| BL03 Busca com filtros | RF10, RF11, RF12 | Rota de busca com junções e índices; paginação com TanStack Query; só instrutores aprovados |
| BL04 Comprovante e selo | RF06, RF08, RNF03, RNF07 | Bucket privado, URL assinada e `accreditation_submissions`; `verification_status` atualizado na aprovação |
| BL05 Avaliações | RF16, RF17, RF18 | `reviews` com `UNIQUE (student_id, instructor_id)` e `review_reports`; o service confere `contact_clicks` |
| BL06 Sugestões por objetivo | RF15 | Pontuação simples de compatibilidade (objetivo, veículo, cidade) no service, com os motivos devolvidos |
| BL07 Contas e login | RF01, RF02, RF03, RNF01, RNF02, RNF04 | JWT, argon2, `slowapi`, `password_reset_tokens`, e-mail de recuperação |
| BL08 Notificações | RF19, RNF08 | `notifications` + `BackgroundTasks` |
| BL09 Contato por WhatsApp | RF14, RNF06 | Botão com link `wa.me`; registro em `contact_clicks`; telefone só em rota autenticada |
| BL10 Administração | RF07, RF18 | Rotas restritas ao perfil admin; interface a definir |
| BL11 Veículos | RF05 | Tabela `vehicles`; compatibilidade entre categoria e veículo validada no service |

Requisitos transversais: usabilidade em celular (RNF09, RNF10), desempenho (RNF12, RNF13), compatibilidade com navegadores móveis (RNF15, redação a ajustar) e interface em português (RNF16). Backup e meta de disponibilidade do RNF17 dependem da hospedagem, ainda em aberto.

---

## Tecnologias descartadas

| Tecnologia | Por que não agora | Quando reconsiderar |
|---|---|---|
| React Native + Expo | Exigiria build nativo e APK para cinco pessoas; a aplicação web responsiva atende ao escopo | Exigência de loja de aplicativos ou push nativo |
| Elasticsearch ou Meilisearch | Os filtros do RF11 são exatos e o PostgreSQL com índices atende o RNF12 | Busca livre por texto em volume grande |
| PostGIS e busca por raio | O filtro é por cidade, não por distância | Requisito de "instrutores a até X km" |
| Microserviços | Cinco pessoas e um semestre: uma API única por módulos é mais simples de testar e publicar | Times independentes por módulo |
| MongoDB ou outro NoSQL | Dados muito relacionados e dependentes de restrições de unicidade | Dados sem estrutura fixa |
| Backend pronto (Firebase e similares) | O RNF14 pede API documentada e critérios de aceite testados; no backend próprio as regras ficam em código versionado | Se o prazo ficar crítico |
| Fila de tarefas (Celery e Redis) | Notificações simples cabem em `BackgroundTasks` | Reenvio garantido ou volume alto de e-mails |
| Notificação push | O RF19 tem prioridade baixa e as notificações internas cumprem o BL08 | Depois do restante do backlog |

---

## Decisões em aberto

- [ ] **RNF15.** Decidido: aplicação web responsiva. Falta guardar a confirmação da professora Rebeca (mensagem ou e-mail) e reescrever o RNF15, que ainda cita Android.
- [ ] **Interface do administrador (BL10).** Telas restritas dentro da aplicação ou painel web separado? O protótipo atual não tem tela de administrador.
- [ ] **Quem é o administrador e como analisa o comprovante.** Hoje é uma análise manual de um arquivo enviado pelo instrutor. Não foi verificado se existe forma oficial de consultar o credenciamento no Detran.
- [ ] **Hospedagem, custos e backup (RNF17).** Limites e preços dos planos gratuitos de API, banco e bucket não foram verificados.
- [ ] **Exclusão de conta (RNF05).** Apagar ou anonimizar? As avaliações escritas pelo aluno precisam de um destino definido.

## Limitações conhecidas

- **Selo de verificado.** Indica "comprovante analisado pela plataforma", não validação oficial. A checagem final da carteira do instrutor continua com o aluno.
- **Contato por WhatsApp.** O clique registrado não prova que houve conversa, e o BL05 libera a avaliação após o clique. Qualquer conta pode clicar e avaliar.
- **Disponibilidade.** É um padrão semanal informado pelo instrutor, não uma agenda real. A interface deve rotular como "disponibilidade informada".
- **Telefone visível.** Exigir login reduz, mas não impede, a coleta em massa de números.

---

## Ordem de implementação

São 11 itens de backlog para 5 pessoas em um semestre. Se o tempo apertar, os primeiros a sair são **BL06** (sugestões) e **BL08** (notificações), de menor prioridade.

1. **BL07**: autenticação e perfis (tudo depende disso)
2. **BL01, BL11 e BL04**: portfólio, veículos e envio de comprovante
3. **BL10**: aprovação pelo administrador, que libera perfis na busca
4. **BL02 e BL03**: perfil do aluno e busca
5. **BL09**: contato por WhatsApp
6. **BL05**, depois **BL06** e **BL08**, se sobrar tempo

Se alguém da equipe nunca usou React ou FastAPI, reserve a primeira semana para aprendizado e para um fluxo de ponta a ponta simples (cadastro, login e uma tela protegida).

---

## Como rodar *(a definir)*

O código ainda não existe. Esta seção deve ser preenchida quando o esqueleto do projeto for criado. Pontos a documentar:

- Pré-requisitos (Python, Node, Docker)
- Subir o PostgreSQL com Docker Compose
- Variáveis de ambiente (`.env.example`, sem segredos no repositório)
- Rodar migrações (`alembic upgrade head`)
- Iniciar a API (Uvicorn) e abrir o Swagger em `/docs`
- Iniciar o front (Vite)
- Rodar os testes (pytest e Vitest)
