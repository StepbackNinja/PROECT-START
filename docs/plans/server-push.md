# Background reminders

Use Supabase Postgres for private push subscriptions and a minute cron invoking an Edge Function. Store only a hash of a device capability token, browser subscription, IANA timezone, completion date and deduplication records. No account, task text or XP is uploaded. VAPID private keys and scheduler credential stay in an RLS-protected settings table, never in frontend code.

- [ ] Create private tables and restricted claim RPC.
- [ ] Deploy authenticated device endpoints and scheduler endpoint.
- [ ] Subscribe from a user gesture; test using real remote push; provide unsubscribe.
- [ ] Sync completion on finish and on reconnect; retry while open. Offline completion cannot cancel a server reminder until synced.
- [ ] Handle push and notification clicks in the service worker.
- [ ] Verify server authorization, scheduling in multiple timezones, completion suppression, deduplication and production build. iPhone delivery needs a real device subscription.

Schedule 10:00, 18:00, 23:00 in device timezone. Cron checks each minute with ten-minute retry window. Claim each day/slot once, release claims on transient delivery failure, remove expired subscriptions on HTTP 404/410. All device writes require a high-entropy bearer token; dispatch requires a separate credential. Reject non-push-service destinations to prevent SSRF. Test pushes are rate limited.
