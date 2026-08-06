-- assistant_conversations: one row per chat exchange (user message + assistant
-- reply), logged by netlify/functions/chat-sales.js (mode='sales', anonymous —
-- user_id null) and netlify/functions/explain-result.js (mode='result',
-- authenticated). Written to over the next weeks to review which advice is
-- missing or wrong (see MVP support-bot plan) — not read by the app itself.
create table if not exists assistant_conversations (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  user_id         uuid        references auth.users(id) on delete set null,
  mode            text        not null check (mode in ('sales', 'result')),
  brand_name      text,
  scan_snapshot   jsonb,
  user_message    text        not null,
  assistant_reply text        not null,
  flagged         boolean     not null default false
);

create index if not exists assistant_conversations_user_id_idx on assistant_conversations(user_id);
create index if not exists assistant_conversations_created_at_idx on assistant_conversations(created_at desc);

-- Only the service role (used by both chat functions) ever inserts, so no
-- insert policy is needed for regular users. Signed-in users can read their
-- own conversation history; anonymous sales-chat rows (user_id null) aren't
-- readable by anyone through the API — dashboard/SQL-editor only.
alter table assistant_conversations enable row level security;

create policy "User can view their own assistant conversations" on assistant_conversations
  for select
  to authenticated
  using (user_id = auth.uid());
