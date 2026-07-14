-- Baseline inferred from the application's existing SQL usage.
-- Before marking this migration applied to an existing database, compare it
-- with `prisma db pull` against a verified database clone.

CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_" TEXT NOT NULL,
    "number" VARCHAR(30),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "profile_pics" (
    "profile_id" SERIAL NOT NULL,
    "profile_url" TEXT NOT NULL,
    "user_ref" INTEGER NOT NULL,
    CONSTRAINT "profile_pics_pkey" PRIMARY KEY ("profile_id")
);

CREATE TABLE "contacts" (
    "user_id" INTEGER NOT NULL,
    "contact_id" INTEGER NOT NULL,
    CONSTRAINT "contacts_pkey" PRIMARY KEY ("user_id", "contact_id")
);

CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "content" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE INDEX "profile_pics_user_ref_profile_id_idx" ON "profile_pics"("user_ref", "profile_id" DESC);
CREATE INDEX "messages_sender_receiver_created_idx" ON "messages"("sender_id", "receiver_id", "created_at" DESC);
CREATE INDEX "messages_receiver_sender_created_idx" ON "messages"("receiver_id", "sender_id", "created_at" DESC);

ALTER TABLE "profile_pics" ADD CONSTRAINT "profile_pics_user_ref_fkey" FOREIGN KEY ("user_ref") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
