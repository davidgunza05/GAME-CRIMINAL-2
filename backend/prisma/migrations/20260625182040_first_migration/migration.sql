-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'organizer', 'player');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('email_verification', 'password_reset', 'refresh');

-- CreateEnum
CREATE TYPE "CaseDifficulty" AS ENUM ('one', 'two', 'three', 'four', 'five');

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('digital', 'physical', 'hybrid');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "OrderItemType" AS ENUM ('digital', 'physical', 'event');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('stripe', 'paypal', 'manual');

-- CreateEnum
CREATE TYPE "ShippingStatus" AS ENUM ('pending', 'preparing', 'shipped', 'delivered', 'returned');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('pending', 'active', 'paused', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('multiplayer', 'solo', 'hybrid');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('invited', 'confirmed', 'playing', 'left');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('document', 'photo', 'video', 'audio', 'object', 'qrcode');

-- CreateEnum
CREATE TYPE "AccusationResult" AS ENUM ('correct', 'incorrect', 'invalid');

-- CreateEnum
CREATE TYPE "BadgeRarity" AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');

-- CreateEnum
CREATE TYPE "CommStatus" AS ENUM ('queued', 'sent', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "CommChannel" AS ENUM ('email', 'whatsapp');

-- CreateEnum
CREATE TYPE "CommType" AS ENUM ('session_invite', 'character_assigned', 'clue_unlocked', 'session_started', 'session_completed', 'accusation_result', 'welcome', 'password_reset');

-- CreateEnum
CREATE TYPE "CaseSubmissionStatus" AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'published');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('submitted', 'approved', 'rejected', 'requested_changes', 'published', 'unpublished');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'player',
    "display_name" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "short_description" TEXT,
    "difficulty" "CaseDifficulty" NOT NULL DEFAULT 'three',
    "type" "CaseType" NOT NULL DEFAULT 'digital',
    "min_players" INTEGER NOT NULL DEFAULT 2,
    "max_players" INTEGER NOT NULL DEFAULT 8,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 120,
    "price_digital" DECIMAL(10,2),
    "price_physical" DECIMAL(10,2),
    "cover_image_url" TEXT,
    "preview_images" TEXT[],
    "tags" TEXT[],
    "author_id" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_percent" DECIMAL(5,2),
    "discount_fixed" DECIMAL(10,2),
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "min_order_amount" DECIMAL(10,2),
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shipping_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "coupon_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "type" "OrderItemType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "external_id" TEXT,
    "external_status" TEXT,
    "provider_response" JSONB,
    "refunded_amount" DECIMAL(10,2),
    "refunded_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_info" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "phone" TEXT,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'PT',
    "status" "ShippingStatus" NOT NULL DEFAULT 'pending',
    "carrier" TEXT,
    "tracking_number" TEXT,
    "tracking_url" TEXT,
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "estimated_delivery" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_stages" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_last" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "backstory" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "secrets" TEXT NOT NULL,
    "alibi" TEXT NOT NULL,
    "is_killer" BOOLEAN NOT NULL DEFAULT false,
    "is_detective" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "stage_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "content_url" TEXT,
    "content_text" TEXT,
    "is_red_herring" BOOLEAN NOT NULL DEFAULT false,
    "qr_code" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'pending',
    "mode" "SessionMode" NOT NULL DEFAULT 'multiplayer',
    "access_code" TEXT NOT NULL,
    "current_stage_id" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "estimated_minutes" INTEGER,
    "location" TEXT,
    "meeting_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "character_id" TEXT,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'invited',
    "guest_name" TEXT,
    "guest_email" TEXT,
    "guest_phone" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_unlocks" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "evidence_id" TEXT NOT NULL,
    "unlocked_by_id" TEXT,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accusations" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "suspect_id" TEXT NOT NULL,
    "motive" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "evidence_cited" TEXT[],
    "result" "AccusationResult" NOT NULL DEFAULT 'invalid',
    "feedback_text" TEXT,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accusations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "session_id" TEXT,
    "case_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "sessions_played" INTEGER NOT NULL DEFAULT 0,
    "sessions_solved" INTEGER NOT NULL DEFAULT 0,
    "total_accusations" INTEGER NOT NULL DEFAULT 0,
    "correct_first" INTEGER NOT NULL DEFAULT 0,
    "evidence_found" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "rarity" "BadgeRarity" NOT NULL DEFAULT 'common',
    "criteria" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" TEXT,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "channel" "CommChannel" NOT NULL,
    "type" "CommType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "status" "CommStatus" NOT NULL DEFAULT 'queued',
    "provider_id" TEXT,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_submissions" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "status" "CaseSubmissionStatus" NOT NULL DEFAULT 'draft',
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "rejection_reason" TEXT,
    "change_requests" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_history" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_reviews" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "order_id" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_token_key" ON "user_tokens"("token");

-- CreateIndex
CREATE INDEX "user_tokens_token_idx" ON "user_tokens"("token");

-- CreateIndex
CREATE INDEX "user_tokens_user_id_idx" ON "user_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cases_slug_key" ON "cases"("slug");

-- CreateIndex
CREATE INDEX "cases_slug_idx" ON "cases"("slug");

-- CreateIndex
CREATE INDEX "cases_is_published_idx" ON "cases"("is_published");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_order_number_idx" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_case_id_idx" ON "order_items"("case_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_external_id_idx" ON "payments"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_info_order_id_key" ON "shipping_info"("order_id");

-- CreateIndex
CREATE INDEX "shipping_info_order_id_idx" ON "shipping_info"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");

-- CreateIndex
CREATE INDEX "game_stages_case_id_idx" ON "game_stages"("case_id");

-- CreateIndex
CREATE INDEX "characters_case_id_idx" ON "characters"("case_id");

-- CreateIndex
CREATE INDEX "evidence_case_id_idx" ON "evidence"("case_id");

-- CreateIndex
CREATE INDEX "evidence_stage_id_idx" ON "evidence"("stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_sessions_access_code_key" ON "game_sessions"("access_code");

-- CreateIndex
CREATE INDEX "game_sessions_access_code_idx" ON "game_sessions"("access_code");

-- CreateIndex
CREATE INDEX "game_sessions_host_id_idx" ON "game_sessions"("host_id");

-- CreateIndex
CREATE INDEX "game_sessions_case_id_idx" ON "game_sessions"("case_id");

-- CreateIndex
CREATE INDEX "participants_session_id_idx" ON "participants"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "participants_session_id_user_id_key" ON "participants"("session_id", "user_id");

-- CreateIndex
CREATE INDEX "evidence_unlocks_session_id_idx" ON "evidence_unlocks"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_unlocks_session_id_evidence_id_key" ON "evidence_unlocks"("session_id", "evidence_id");

-- CreateIndex
CREATE INDEX "accusations_session_id_idx" ON "accusations"("session_id");

-- CreateIndex
CREATE INDEX "accusations_participant_id_idx" ON "accusations"("participant_id");

-- CreateIndex
CREATE INDEX "xp_events_user_id_idx" ON "xp_events"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_profiles_user_id_key" ON "player_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "badges_slug_key" ON "badges"("slug");

-- CreateIndex
CREATE INDEX "user_badges_user_id_idx" ON "user_badges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE INDEX "communication_logs_user_id_idx" ON "communication_logs"("user_id");

-- CreateIndex
CREATE INDEX "communication_logs_session_id_idx" ON "communication_logs"("session_id");

-- CreateIndex
CREATE INDEX "communication_logs_status_idx" ON "communication_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "case_submissions_case_id_key" ON "case_submissions"("case_id");

-- CreateIndex
CREATE INDEX "case_submissions_author_id_idx" ON "case_submissions"("author_id");

-- CreateIndex
CREATE INDEX "case_submissions_status_idx" ON "case_submissions"("status");

-- CreateIndex
CREATE INDEX "moderation_history_submission_id_idx" ON "moderation_history"("submission_id");

-- CreateIndex
CREATE INDEX "case_reviews_case_id_idx" ON "case_reviews"("case_id");

-- CreateIndex
CREATE UNIQUE INDEX "case_reviews_case_id_user_id_key" ON "case_reviews"("case_id", "user_id");

-- CreateIndex
CREATE INDEX "case_access_user_id_idx" ON "case_access"("user_id");

-- CreateIndex
CREATE INDEX "case_access_case_id_idx" ON "case_access"("case_id");

-- CreateIndex
CREATE UNIQUE INDEX "case_access_user_id_case_id_key" ON "case_access"("user_id", "case_id");

-- AddForeignKey
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_info" ADD CONSTRAINT "shipping_info_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_stages" ADD CONSTRAINT "game_stages_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "game_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "game_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_unlocks" ADD CONSTRAINT "evidence_unlocks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_unlocks" ADD CONSTRAINT "evidence_unlocks_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_unlocks" ADD CONSTRAINT "evidence_unlocks_unlocked_by_id_fkey" FOREIGN KEY ("unlocked_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accusations" ADD CONSTRAINT "accusations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accusations" ADD CONSTRAINT "accusations_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accusations" ADD CONSTRAINT "accusations_suspect_id_fkey" FOREIGN KEY ("suspect_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_submissions" ADD CONSTRAINT "case_submissions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_submissions" ADD CONSTRAINT "case_submissions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_submissions" ADD CONSTRAINT "case_submissions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_history" ADD CONSTRAINT "moderation_history_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "case_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_history" ADD CONSTRAINT "moderation_history_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_reviews" ADD CONSTRAINT "case_reviews_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_reviews" ADD CONSTRAINT "case_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_access" ADD CONSTRAINT "case_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_access" ADD CONSTRAINT "case_access_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_access" ADD CONSTRAINT "case_access_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
