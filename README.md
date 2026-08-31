```
███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
```

# KAMIKAZE 神風 — Site da equipe (full stack)

Site completo da equipe Kamikaze com backend real: cadastro/login com senha
criptografada, chat do esquadrão, sistema de membros e entrega de farm.
Construído com **Next.js 14 (App Router)**, **Prisma + PostgreSQL** e
**Tailwind CSS**, pronto para publicar na **Vercel**.

## Stack

- **Frontend**: Next.js (React), Tailwind CSS, fontes Zen Kaku Gothic New / Inter / Noto Sans JP
- **Backend**: API Routes do Next.js (Node.js runtime), rodando na Vercel como funções serverless
- **Banco de dados**: PostgreSQL via Prisma ORM
- **Autenticação**: senha com hash bcrypt (12 rounds), sessão em JWT dentro de cookie `httpOnly` + `secure` + `sameSite=lax`
- **Proteções**: validação de entrada com Zod, rate limiting básico em login/cadastro/chat/pedidos, mensagens de erro genéricas no login (não revelam se o erro foi usuário ou senha)

## 1. Banco de dados

Você precisa de um banco Postgres. Qualquer um destes funciona bem com a Vercel:

- **Vercel Postgres** (dentro do próprio painel da Vercel → Storage → Create Database)
- **Neon** (neon.tech, tem plano gratuito)
- **Supabase** (supabase.com, tem plano gratuito)

Depois de criar, copie a "connection string" (formato `postgresql://usuario:senha@host/banco?sslmode=require`).

## 2. Rodando localmente

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env
# edite o .env e cole sua DATABASE_URL e um JWT_SECRET forte
# (gere um com: openssl rand -base64 48)

# 3. Crie as tabelas no banco
npx prisma db push

# 4. Rode o site
npm run dev
```

Acesse `http://localhost:3000`.

Se algo der errado no login/cadastro, rode `npm run check` e veja a seção
"[7. Solução de problemas](#7-solução-de-problemas-login-e-cadastro)".

## 3. Deploy na Vercel

### Checklist obrigatório (é o que faz login/cadastro funcionarem)

O site publica sozinho a cada push, mas **sem as etapas 1 a 3 o login sempre
falha**. Faça nesta ordem:

**1) Criar o banco (Neon é o mais simples e tem plano grátis)**
1. Acesse [neon.tech](https://neon.tech) → *Create a project* (região: a mais
   próxima, ex. `AWS - São Paulo` ou `Frankfurt`).
2. No painel do projeto, copie a **Connection string** (a versão "pooled"
   também serve). Ela vem assim:
   `postgresql://usuario:senha@ep-xxx.neon.tech/neondb`
3. Deixe-a com SSL no final: `...neondb?sslmode=require`
   (Supabase exige `?sslmode=require`; se usar o *pooler* do Supabase, use
   `?sslmode=require&pgbouncer=true&connection_limit=1`).

**2) Adicionar as variáveis na Vercel**
1. Vercel → seu projeto **kami** → **Settings** → **Environment Variables**.
2. Adicione as duas abaixo marcando **Production**, **Preview** e **Development**:

   | Nome | Valor |
   | --- | --- |
   | `DATABASE_URL` | a connection string do passo 1 (com `?sslmode=require`) |
   | `JWT_SECRET` | um texto aleatório longo — gere com `openssl rand -base64 48` |

3. **Salve e faça um Redeploy**: variável de ambiente só vale para deploys
   novos (Deployments → ⋯ → **Redeploy**).

**3) Criar as tabelas no banco (só uma vez)**

Opção fácil, sem instalar nada: no seu computador, com Node instalado:

```bash
npx prisma db push
# quando perguntar, ou se preferir direto:
DATABASE_URL="postgresql://usuario:senha@ep-xxx.neon.tech/neondb?sslmode=require" npx prisma db push
```

> Alternativa sem terminal: Vercel → **Settings** → **Build & Development
> Settings** → *Build Command* → `npx prisma db push && npm run build`, faça o
> deploy e depois **volte o Build Command para o padrão**.

**4) Conferir**

Abra `https://SEU-DOMINIO/api/health`. Deve responder:

```json
{ "ok": true, "checks": { "DATABASE_URL": "ok", "JWT_SECRET": "ok", "conexao": "ok", "tabelas": "ok", "sessao": "ok" } }
```

Se algum item vier diferente de `ok`, a tabela da
[seção 7](#7-solução-de-problemas-login-e-cadastro) diz o que fazer.

### Opção A — pelo painel da Vercel
1. Suba esta pasta para um repositório no GitHub (ou GitLab/Bitbucket).
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. A Vercel detecta Next.js automaticamente — não precisa mudar build command.
4. Em **Environment Variables**, adicione:
   - `DATABASE_URL` — sua connection string do Postgres
   - `JWT_SECRET` — um valor aleatório forte
5. Clique em **Deploy**.
6. Faça o passo **3** do checklist acima para criar as tabelas.

### Opção B — pela CLI da Vercel
```bash
npm i -g vercel
vercel login
vercel link
vercel env add DATABASE_URL
vercel env add JWT_SECRET
npx prisma db push   # com a DATABASE_URL de produção no seu .env local
vercel --prod
```

## 4. Estrutura do projeto

```
app/
  api/
    auth/register/route.js   POST — cria conta (hash da senha, seta cookie de sessão)
    auth/login/route.js      POST — login (verifica hash, seta cookie de sessão)
    auth/logout/route.js     POST — limpa o cookie de sessão
    auth/me/route.js         GET  — retorna o usuário logado (ou null)
    chat/route.js            GET/POST — lista e envia mensagens do chat
    orders/route.js          GET/POST — lista e cria pedidos de entrega de farm
    orders/[id]/route.js     PATCH — atualiza o status de um pedido
    members/route.js         GET  — lista os membros cadastrados
    commands/route.js        GET/POST — comandos do FiveM
    commands/[id]/route.js   PATCH/DELETE — editar/apagar comando (gerência)
    files/route.js           GET (membros) / POST (gerência) — citizen, mod som
    files/[id]/route.js      PATCH/DELETE — editar/apagar arquivo (gerência)
    settings/route.js        GET (público) / PUT (gerência) — textos e jogos do site
    admin/orders/route.js    GET  — todos os pedidos (gerência)
    admin/orders/[id]/route.js  PATCH/DELETE — status e remoção (gerência)
    admin/members/route.js   GET  — membros + cargos (gerência)
    admin/members/[id]/route.js  PATCH — mudar cargo (só Dono)
    admin/upload/route.js    POST — upload p/ Vercel Blob (se configurado)
    health/route.js          GET  — diagnóstico: env, conexão e tabelas
  layout.js                  Layout raiz + fontes + provedor de sessão
  page.js                    Monta a página inteira
  globals.css                Estilos globais (grid de fundo, kanji animado)

components/                  Header, Hero, FarmSection, ChatSection,
                              MembersSection, AuthModal, Footer, Logo,
                              AnnouncementBar, CommandsBoard, FilesBoard,
                              admin/ (AdminPanel, OrdersTab, MembersTab)
context/UserContext.js       Estado de sessão do usuário (client-side)
lib/
  prisma.js                  Cliente Prisma singleton (falha com mensagem clara)
  prismaMemory.js            Banco em memória p/ demonstração (KAMI_DEMO_DB=1)
  auth.js                    Hash de senha, JWT, cookies de sessão
  validation.js               Schemas Zod
  rateLimit.js                Rate limit em memória
  apiErrors.js                Traduz erros de banco/config em respostas JSON
  apiAuth.js                  Permissões das rotas (requireUser/Staff/Dono)
  roles.js                    Cargos: Dono, Subdono, Gerente, Membro
  settings.js                 Configurações do site editáveis pelo painel
  clientApi.js                fetch seguro usado pelos componentes
scripts/check-env.mjs        `npm run check` — diagnóstico do ambiente
prisma/schema.prisma         Modelos User, Message, Order
```

## 5. Sobre a segurança

- Senhas nunca são salvas em texto puro: usamos **bcrypt** com 12 rounds.
- A sessão é um **JWT em cookie httpOnly** — inacessível a JavaScript no
  navegador, o que reduz o risco de roubo de sessão via XSS.
- As respostas de login não dizem se o erro foi o usuário ou a senha,
  dificultando a enumeração de contas.
- Há **rate limiting** básico contra força bruta em login, cadastro, chat e
  pedidos. Ele é em memória por instância — para um limite realmente robusto
  em produção de alto tráfego, considere adicionar Upstash Redis.
- Toda entrada da API passa por validação com **Zod** antes de tocar o banco.
- O React escapa automaticamente o conteúdo das mensagens de chat, o que
  protege contra XSS refletido nas mensagens.

Nenhum sistema é 100% inatingível — revise as variáveis de ambiente, mantenha
as dependências atualizadas (`npm audit`) e considere adicionar 2FA e logs de
auditoria se o time crescer.

## 6. Próximos passos possíveis

- Papel de **Admin** (o campo `role` já existe no modelo `User`) para
  moderar pedidos e mensagens.
- Notificações em tempo real via WebSocket/Pusher (hoje o chat e os pedidos
  usam polling, o que já funciona bem em serverless).
- Upload de avatar dos membros.

## 7. Solução de problemas (login e cadastro)

Quase todo "erro ao entrar / ao cadastrar" vem de uma destas causas — abra
`/api/health` no navegador ou rode `npm run check` no terminal para saber qual:

| Sintoma | Causa | Como resolver |
| --- | --- | --- |
| `Banco de dados não configurado no servidor` (`DB_NOT_CONFIGURED`) | falta `DATABASE_URL` | crie o `.env` (ou a variável na Vercel) com a connection string do Postgres |
| `O cliente do banco não está pronto` (`DB_NOT_GENERATED`) | `prisma generate` não rodou | `npx prisma generate` e reinicie o servidor |
| `As tabelas do banco não existem` (`DB_SCHEMA_MISSING`) | o banco nunca recebeu o schema | `npx prisma db push` (ou `npm run db:push`) **uma vez** apontando para esse banco |
| `Não foi possível falar com o banco de dados` (`DB_UNAVAILABLE`) | host/porta/senha errados, SSL faltando ou IP não liberado | confira a `DATABASE_URL` (Neon/Supabase/Vercel exigem `?sslmode=require`) |
| `Usuário ou senha incorretos` | dados diferentes do cadastro | o login aceita **usuário ou e-mail**; senhas têm no mínimo 6 caracteres |
| `Muitas tentativas. Aguarde um minuto` (`RATE_LIMIT`) | mais de 10 logins (ou 5 cadastros) por minuto no mesmo IP | espere 1 minuto e tente de novo |
| Entra, mas volta para deslogado | cookie de sessão com `Secure` em site HTTP | sirva o site em HTTPS ou defina `KAMI_COOKIE_SECURE=0` |
| O botão "Painel" não aparece | seu cargo ainda é Membro | defina `OWNER_USERNAME` com seu usuário e faça Redeploy (ou `npm run set-role -- seu_usuario Dono`) |
| Painel abre mas não salva nada | tabelas novas (`Command`, `DownloadFile`, `Setting`) não criadas | rode `npx prisma db push` de novo |
| `Upload desativado` ao enviar arquivo | Vercel Blob não ativado | ative em Vercel → Storage → Blob, ou cadastre o arquivo por link |

Comandos úteis:

```bash
npm run check        # diagnóstico: variáveis, conexão e tabelas
npm run db:push      # cria/atualiza as tabelas no banco
npm run db:studio    # abre o Prisma Studio para ver os dados
```

O endpoint `GET /api/health` responde um JSON assim:

```json
{
  "ok": true,
  "modo": "normal",
  "checks": { "DATABASE_URL": "ok", "JWT_SECRET": "ok", "conexao": "ok", "tabelas": "ok", "sessao": "ok" },
  "dicas": []
}
```

Se quiser esconder esse diagnóstico do público, defina `HEALTH_TOKEN` e acesse
`/api/health?t=SEU_TOKEN`.

### Modo demonstração (sem banco)

Para testar só a interface, você pode rodar com um banco em memória:

```bash
KAMI_DEMO_DB=1 npm run dev
```

Nesse modo os dados vivem apenas na memória do processo e **somem quando o
servidor reinicia**. Não use em produção — o site em produção deve ter
`DATABASE_URL` apontando para um Postgres de verdade.

## 8. Painel admin, cargos, comandos e arquivos

### Cargos e permissões

| Cargo | O que pode fazer |
| --- | --- |
| **Dono** | Tudo, inclusive promover/rebaixar cargos |
| **Subdono** | Tudo, menos mexer em cargos |
| **Gerente** | Pedidos de farm, comandos, arquivos e textos do site |
| **Membro** | Usar o site: pedir farm, baixar arquivos, conversar no chat |

Quem é Gerente ou acima vê o botão **Painel** no topo e acessa `/admin`.

### Como virar Dono na primeira vez

Defina `OWNER_USERNAME` com o **seu usuário** (Vercel → Settings → Environment
Variables) e faça um **Redeploy**. Ao entrar, sua conta vira Dono na hora.

```bash
OWNER_USERNAME="novak"
```

Alternativa pelo terminal (precisa da `DATABASE_URL` no `.env`):

```bash
npm run set-role -- novak Dono
```

### O que dá para fazer no painel (`/admin`)

- **Pedidos de farm**: ver todos, filtrar por status, mudar
  `pendente → andamento → concluido` e apagar
- **Jogos e site**: trocar a lista de jogos do formulário de farm, o aviso do
  topo, o texto de abertura, o link do Discord e os recados das seções
- **Comandos FiveM**: cadastrar, editar e apagar comandos (com categoria)
- **Arquivos**: publicar citizen, mod de som e outros — por link ou upload
- **Cargos**: promover/rebaixar membros (somente Dono)

### Páginas novas

| Página | Quem vê | Para que serve |
| --- | --- | --- |
| `/comandos` | Todos | Lista de comandos do FiveM, com busca e categorias |
| `/arquivos` | **Só membros logados** | Downloads de citizen, mod de som e outros |
| `/admin` | Gerente, Subdono e Dono | Painel de administração |

### Upload de arquivos

O cadastro por **link** (Google Drive, Discord, MediaFire) funciona sempre.
Para enviar o arquivo direto pelo painel, ative o **Vercel Blob** no projeto
(Vercel → Storage → Create → Blob): a `BLOB_READ_WRITE_TOKEN` entra sozinha nas
variáveis e o botão de upload passa a funcionar. Limite: ~4,5 MB por arquivo
nas funções da Vercel — para arquivos maiores, use links.

### Novas tabelas

Esta versão adicionou `Command`, `DownloadFile` e `Setting`. Depois de
atualizar o código, rode mais uma vez:

```bash
npx prisma db push
```

(sem isso, o `/api/health` acusa `Tabelas pendentes` e o painel não salva nada)
