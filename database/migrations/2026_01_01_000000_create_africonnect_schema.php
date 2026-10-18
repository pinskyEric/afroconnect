<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('name', 80);
            $t->string('username', 30)->unique();
            $t->string('email')->nullable()->unique();
            $t->string('phone', 20)->nullable()->unique();
            $t->timestamp('email_verified_at')->nullable();
            $t->string('password');
            $t->date('birth_date')->nullable();
            $t->string('country', 80)->nullable();
            $t->jsonb('languages')->default('[]');
            $t->jsonb('interests')->default('[]');
            $t->string('bio', 500)->nullable();
            $t->string('photo_key')->nullable();
            $t->boolean('online')->default(false);
            $t->string('role')->default('user');
            $t->string('status')->default('active');
            $t->timestamp('last_seen_at')->nullable();
            $t->softDeletes();
            $t->rememberToken();
            $t->timestamps();
            $t->index(['status', 'online']);
        });
        Schema::create('password_reset_tokens', function (Blueprint $t) {
            $t->string('email')->primary();
            $t->string('token');
            $t->timestamp('created_at')->nullable();
        });
        Schema::create('personal_access_tokens', function (Blueprint $t) {
            $t->id();
            $t->uuidMorphs('tokenable');
            $t->string('name');
            $t->string('token', 64)->unique();
            $t->text('abilities')->nullable();
            $t->timestamp('last_used_at')->nullable();
            $t->timestamp('expires_at')->nullable()->index();
            $t->timestamps();
        });
        Schema::create('friend_requests', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('sender_id')->constrained('users')->cascadeOnDelete();
            $t->foreignUuid('recipient_id')->constrained('users')->cascadeOnDelete();
            $t->string('status')->default('pending');
            $t->timestamps();
            $t->unique(['sender_id', 'recipient_id']);
            $t->index(['recipient_id', 'status']);
        });
        Schema::create('friendships', function (Blueprint $t) {
            $t->id();
            $t->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $t->foreignUuid('friend_id')->constrained('users')->cascadeOnDelete();
            $t->timestamps();
            $t->unique(['user_id', 'friend_id']);
        });
        Schema::create('user_preferences', function (Blueprint $t) {
            $t->foreignUuid('user_id')->primary()->constrained()->cascadeOnDelete();
            $t->jsonb('preferences')->default('{}');
            $t->timestamps();
        });
        Schema::create('favorites', function (Blueprint $t) {
            $t->id();
            $t->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $t->foreignUuid('favorite_id')->constrained('users')->cascadeOnDelete();
            $t->timestamps();
            $t->unique(['user_id', 'favorite_id']);
        });
        Schema::create('blocks', function (Blueprint $t) {
            $t->id();
            $t->foreignUuid('blocker_id')->constrained('users')->cascadeOnDelete();
            $t->foreignUuid('blocked_id')->constrained('users')->cascadeOnDelete();
            $t->timestamps();
            $t->unique(['blocker_id', 'blocked_id']);
        });
        Schema::create('conversations', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->unsignedInteger('channel_generation')->default(1);
            $t->timestamps();
        });
        Schema::create('conversation_participants', function (Blueprint $t) {
            $t->id();
            $t->foreignUuid('conversation_id')->constrained()->cascadeOnDelete();
            $t->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $t->unsignedInteger('unread_count')->default(0);
            $t->timestamp('last_read_at')->nullable();
            $t->timestamps();
            $t->unique(['conversation_id', 'user_id']);
        });
        Schema::create('messages', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('conversation_id')->constrained()->cascadeOnDelete();
            $t->foreignUuid('sender_id')->constrained('users')->cascadeOnDelete();
            $t->uuid('client_message_id');
            $t->text('text');
            $t->timestamp('read_at')->nullable();
            $t->timestamps();
            $t->unique(['conversation_id', 'sender_id', 'client_message_id']);
            $t->index(['conversation_id', 'created_at']);
        });
        Schema::create('match_preferences', function (Blueprint $t) {
            $t->foreignUuid('user_id')->primary()->constrained()->cascadeOnDelete();
            $t->string('mode')->default('video');
            $t->jsonb('countries')->default('[]');
            $t->jsonb('languages')->default('[]');
            $t->jsonb('interests')->default('[]');
            $t->timestamps();
        });
        Schema::create('matches', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('user_one_id')->constrained('users')->cascadeOnDelete();
            $t->foreignUuid('user_two_id')->constrained('users')->cascadeOnDelete();
            $t->string('status')->default('pending');
            $t->timestamp('user_one_accepted_at')->nullable();
            $t->timestamp('user_two_accepted_at')->nullable();
            $t->timestamp('accepted_at')->nullable();
            $t->timestamps();
            $t->index(['status', 'created_at']);
        });
        Schema::create('call_sessions', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('match_id')->constrained()->cascadeOnDelete();
            $t->foreignUuid('created_by')->constrained('users');
            $t->string('status')->default('ringing');
            $t->timestamp('started_at')->nullable();
            $t->timestamp('ended_at')->nullable();
            $t->timestamps();
        });
        Schema::create('notifications', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $t->string('kind');
            $t->string('title');
            $t->text('description')->nullable();
            $t->jsonb('data')->nullable();
            $t->timestamp('read_at')->nullable();
            $t->timestamps();
            $t->index(['user_id', 'read_at']);
        });
        Schema::create('reports', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('reporter_id')->constrained('users');
            $t->foreignUuid('user_id')->constrained('users');
            $t->string('category');
            $t->text('details')->nullable();
            $t->string('status')->default('pending');
            $t->timestamps();
            $t->index(['status', 'created_at']);
        });
        Schema::create('moderation_decisions', function (Blueprint $t) {
            $t->id();
            $t->foreignUuid('report_id')->constrained()->cascadeOnDelete();
            $t->foreignUuid('moderator_id')->constrained('users');
            $t->string('decision');
            $t->text('notes')->nullable();
            $t->timestamps();
        });
        Schema::create('admin_audit_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignUuid('admin_id')->constrained('users');
            $t->string('action');
            $t->string('target_type');
            $t->string('target_id');
            $t->jsonb('metadata')->nullable();
            $t->ipAddress('ip_address')->nullable();
            $t->timestamps();
            $t->index(['target_type', 'target_id']);
        });
    }

    public function down(): void
    {
        foreach (['admin_audit_logs', 'moderation_decisions', 'reports', 'notifications', 'call_sessions', 'matches', 'match_preferences', 'messages', 'conversation_participants', 'conversations', 'blocks', 'favorites', 'friendships', 'friend_requests', 'personal_access_tokens', 'password_reset_tokens', 'user_preferences', 'users'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
