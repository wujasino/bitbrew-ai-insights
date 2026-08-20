# Hand-composed Supabase client, minus realtime-js

**Why:** `createClient()` from `@supabase/supabase-js` always instantiates a
`RealtimeClient` internally, unconditionally shipping its WebSocket/Phoenix-protocol
code to every visitor of every page — even though this app never calls
`.channel()`/`.removeChannel()` or subscribes to `postgres_changes` anywhere
(confirmed via grep across `src/`). Because the Navbar checks session state on
every route, that dead weight loaded even on pages with no login form in sight,
including the anonymous-traffic Landing page.

**Fix (`src/lib/supabase.ts`):** replaced `createClient()` with the same
sub-packages it wires together internally, minus `@supabase/realtime-js`:

- `AuthClient` from `@supabase/auth-js`, used completely unmodified — Supabase's
  own `SupabaseAuthClient` is a zero-override subclass of it, so this carries no
  extra behavioral risk over what was already running.
- `PostgrestClient` from `@supabase/postgrest-js` for `.from()`.
- `StorageClient` from `@supabase/storage-js` for `.storage` — its own doc comment
  calls this exact standalone-import pattern out as the supported way to use it
  "for bundle-sensitive environments".
- The same `fetchWithAuth` header-injection logic (`apikey` + `Authorization:
  Bearer <token, falling back to the anon key>`), copied verbatim from
  supabase-js's source.
- The same default `storageKey` derivation, so an existing session saved by the
  old client is still read correctly — nobody gets silently signed out.

Only `.auth`, `.from()` and `.storage` are used anywhere in this codebase (checked
via grep) — no `.rpc()`, `.schema()` or `.functions` — so that's all the new client
exposes. If a future feature needs realtime, rpc, or functions, either add the
specific sub-package needed or switch back to `createClient()`.

**Result:** `supabase` chunk 197KB → 134KB raw (50.5KB → 32.3KB gzip), on every
single page load.

**A false lead worth remembering:** while bisecting *when* this bloat appeared,
comparing builds across commits in a scratch git worktree without a `.env` file
made the `supabase` chunk look artificially small (~100KB) — because a missing
`VITE_SUPABASE_URL` makes `src/lib/supabase.ts`'s `if (!supabaseUrl...) throw`
statically unconditional, so the bundler proves everything after it (the whole
`createClient()` call and its dependency tree) is dead code and strips it. Always
copy the real `.env` into a comparison build before trusting its bundle sizes.
