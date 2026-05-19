create extension if not exists pgcrypto;

create schema if not exists app;

create table if not exists app.schema_migrations (
  id text primary key,
  checksum text not null,
  executed_at timestamptz not null default now()
);

create table if not exists app.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  role text not null default 'user',
  title text,
  avatar_url text,
  bio text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.users(id) on delete cascade,
  refresh_token_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists app.user_follows (
  follower_id uuid not null references app.users(id) on delete cascade,
  following_id uuid not null references app.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists app.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references app.users(id) on delete cascade,
  content text not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references app.posts(id) on delete cascade,
  author_id uuid not null references app.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists app.post_reactions (
  post_id uuid not null references app.posts(id) on delete cascade,
  user_id uuid not null references app.users(id) on delete cascade,
  reaction text not null default 'like',
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists app.post_saves (
  post_id uuid not null references app.posts(id) on delete cascade,
  user_id uuid not null references app.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists app.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references app.users(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists app.story_views (
  story_id uuid not null references app.stories(id) on delete cascade,
  viewer_id uuid not null references app.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create table if not exists app.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct','group','channel')),
  name text,
  description text,
  created_by uuid references app.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.conversation_participants (
  conversation_id uuid not null references app.conversations(id) on delete cascade,
  user_id uuid not null references app.users(id) on delete cascade,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists app.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references app.conversations(id) on delete cascade,
  sender_id uuid not null references app.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists app.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.users(id) on delete cascade,
  title text not null,
  description text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists app.emails (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references app.users(id) on delete cascade,
  to_user_id uuid not null references app.users(id) on delete cascade,
  subject text not null,
  body text not null,
  folder text not null default 'inbox',
  read_at timestamptz,
  starred boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists app.video_calls (
  id uuid primary key default gen_random_uuid(),
  by_user_id uuid not null references app.users(id) on delete cascade,
  with_user_id uuid not null references app.users(id) on delete cascade,
  call_type text not null check (call_type in ('incoming','outgoing','missed')),
  duration_sec int,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_created on app.posts(created_at desc);
create index if not exists idx_comments_post on app.post_comments(post_id, created_at asc);
create index if not exists idx_conv_participant_user on app.conversation_participants(user_id);
create index if not exists idx_messages_conv_created on app.messages(conversation_id, created_at asc);
create index if not exists idx_notifications_user_created on app.notifications(user_id, created_at desc);
