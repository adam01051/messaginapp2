CREATE TABLE "blocked_users" (
    "blocker_id" INTEGER NOT NULL,
    "blocked_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blocked_users_pkey" PRIMARY KEY ("blocker_id", "blocked_id"),
    CONSTRAINT "blocked_users_no_self_block" CHECK ("blocker_id" <> "blocked_id")
);

ALTER TABLE "messages" ADD COLUMN "image_public_id" TEXT;

CREATE INDEX "blocked_users_blocked_id_idx" ON "blocked_users"("blocked_id");

ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocker_id_fkey"
FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocked_id_fkey"
FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
