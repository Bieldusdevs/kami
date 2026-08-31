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
    health/route.js          GET  — diagnóstico: env, conexão e tabelas
  layout.js                  Layout raiz + fontes + provedor de sessão
  page.js                    Monta a página inteira
  globals.css                Estilos globais (grid de fundo, kanji animado)

components/                  Header, Hero, FarmSection, ChatSection,
                              MembersSection, AuthModal, Footer, Logo
context/UserContext.js       Estado de sessão do usuário (client-side)
lib/
  prisma.js                  Cliente Prisma singleton (falha com mensagem clara)
  prismaMemory.js            Banco em memória p/ demonstração (KAMI_DEMO_DB=1)
  auth.js                    Hash de senha, JWT, cookies de sessão
  validation.js               Schemas Zod
  rateLimit.js                Rate limit em memória
  apiErrors.js                Traduz erros de banco/config em respostas JSON
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
