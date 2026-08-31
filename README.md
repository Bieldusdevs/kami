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

## 3. Deploy na Vercel

### Opção A — pelo painel da Vercel
1. Suba esta pasta para um repositório no GitHub (ou GitLab/Bitbucket).
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. A Vercel detecta Next.js automaticamente — não precisa mudar build command.
4. Em **Environment Variables**, adicione:
   - `DATABASE_URL` — sua connection string do Postgres
   - `JWT_SECRET` — um valor aleatório forte
5. Clique em **Deploy**.
6. Depois do primeiro deploy, rode `npx prisma db push` **uma vez** apontando
   para o banco de produção (pode ser da sua máquina local, usando a mesma
   `DATABASE_URL` de produção no seu `.env`) para criar as tabelas.

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
  layout.js                  Layout raiz + fontes + provedor de sessão
  page.js                    Monta a página inteira
  globals.css                Estilos globais (grid de fundo, kanji animado)

components/                  Header, Hero, FarmSection, ChatSection,
                              MembersSection, AuthModal, Footer, Logo
context/UserContext.js       Estado de sessão do usuário (client-side)
lib/
  prisma.js                  Cliente Prisma singleton
  auth.js                    Hash de senha, JWT, cookies de sessão
  validation.js               Schemas Zod
  rateLimit.js                Rate limit em memória
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
