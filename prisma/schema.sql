-- ---------------------------------------------------------------------------
-- KAMIKAZE 神風 — SQL equivalente ao prisma/schema.prisma
--
-- Use SOMENTE se você não puder rodar `npx prisma db push` no terminal.
-- Cole este conteúdo no SQL Editor do Neon/Supabase/Railway e execute uma vez.
-- Pode rodar mais de uma vez sem quebrar (é idempotente).
--
-- Preferência: no terminal, com o .env preenchido, rode:
--   npx prisma db push
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "usernameLower" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Membro',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_usernameLower_key" ON "User"("usernameLower");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_usernameLower_idx" ON "User"("usernameLower");

CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt");

ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_userId_fkey";
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "qty" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_userId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
