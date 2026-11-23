# Como rodar o NEXUS AUTO (ambiente local)

Guia para colocar o projeto no ar na sua máquina. Os comandos são para PowerShell (Windows). No Linux/macOS, mudam só a ativação do ambiente (`source .venv/bin/activate`) e a cópia do arquivo (`cp .env.example .env`).

## Pré-requisitos

- Git
- Docker Desktop (aberto e rodando)
- Python 3.12 ou superior
- Node 20 ou superior

## 1. Clonar e entrar na branch

```powershell
git clone https://github.com/uzkba/NexusAuto.git
cd nexus-auto
git switch develop
```

Quem já tem o projeto clonado:

```powershell
git fetch origin
git switch develop
git pull
```

## 2. Criar o `.env`

Cada pessoa usa as próprias credenciais. O `.env` **nunca** vai para o Git.

```powershell
Copy-Item .env.example .env
```

Abra o `.env` e preencha:

- `POSTGRES_PASSWORD`: uma senha à sua escolha.
- `DATABASE_URL`: mesmo usuário, senha e banco das variáveis `POSTGRES_*`, na porta 5439:
  ```dotenv
  DATABASE_URL=postgresql+psycopg://nexusauto:SUA_SENHA@localhost:5439/nexus_auto
  ```
- `JWT_SECRET`: gere com
  ```powershell
  python -c "import secrets; print(secrets.token_urlsafe(64))"
  ```

Evite os caracteres `@ : / # % ?` na senha, pois quebram a URL. Os campos de bucket e e-mail podem ficar vazios por enquanto.

## 3. Subir o banco (Docker)

```powershell
docker compose up -d
docker compose ps
```

Espere o status `healthy` e a porta `0.0.0.0:5439->5432/tcp`. Se a 5439 já estiver em uso na sua máquina, troque a porta nos **dois** lugares do `.env` (`POSTGRES_PORT` e `DATABASE_URL`).

## 4. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
alembic upgrade head
pytest
uvicorn app.main:app --reload
```

Verifique:

- http://localhost:8000/health deve devolver `{"status":"ok"}`
- http://localhost:8000/docs abre o Swagger

## 5. Frontend (em outro terminal)

```powershell
cd frontend
npm install
npm run dev
```

Abre em http://localhost:5173.

## Depois de cada `git pull`

```powershell
cd backend
.venv\Scripts\activate
pip install -r requirements-dev.txt
alembic upgrade head
cd ..\frontend
npm install
```

Isso instala dependências novas e aplica migrações novas. Sem o `alembic upgrade head`, aparecem erros de tabela ou coluna inexistente.

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| Erro de autenticação no banco | O volume foi criado com outra senha. Sem dados a perder, rode `docker compose down -v` e depois `docker compose up -d`. |
| Erro do Postgres em português | Há um PostgreSQL instalado no Windows respondendo na mesma porta. Troque a porta do container no `.env`. |
| `ModuleNotFoundError: No module named 'app'` | Rode `pytest` e `uvicorn` de dentro da pasta `backend`. |
| `alembic`: `No 'script_location' key found` | Rode o `alembic` de dentro da pasta `backend`. |
| `POSTGRES_PASSWORD` obrigatório ao subir o Docker | Defina a senha no `.env` e rode `docker compose` na raiz do projeto. |

## O que não vai para o Git

`.env`, `.venv/`, `node_modules/`, `dist/`, caches (`__pycache__/`, `.pytest_cache/`, `.ruff_cache/`) e `pgdata/`. Nunca commite credenciais.