-- Allow mode='assistant' in assistant_conversations (see 20240113_assistant_conversations.sql).
-- New netlify/functions/assistant.js (the dashboard-wide "AI Assistant"
-- sidebar, previously a non-functional mockup) logs with mode='assistant';
-- the original check constraint only allowed 'sales' and 'result'.
alter table assistant_conversations drop constraint if exists assistant_conversations_mode_check;
alter table assistant_conversations add constraint assistant_conversations_mode_check
  check (mode in ('sales', 'result', 'assistant'));
