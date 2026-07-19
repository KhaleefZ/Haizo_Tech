-- Additive only: adds an index, changes no data and no column.
--
-- The notification bell reads "my unread, newest first" on every page load, which
-- without this index is a sequential scan over the whole table. CONCURRENTLY so it
-- can be applied to production without locking writes on Notification.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Notification_userId_isRead_createdAt_idx"
  ON "Notification" ("userId", "isRead", "createdAt");
