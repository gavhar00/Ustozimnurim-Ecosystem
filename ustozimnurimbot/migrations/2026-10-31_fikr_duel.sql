-- Bir marta ishga tushiriladi:
-- npx wrangler d1 execute ustozim-quiz-db --remote --file=migrations/2026-10-31_fikr_duel.sql
ALTER TABLE murojaat ADD COLUMN ochiq INTEGER NOT NULL DEFAULT 0;
ALTER TABLE murojaat ADD COLUMN ish TEXT;

-- Do'st bilan duel: ikki kishi bir xil 5 savolga javob beradi.
-- a/b — ikki ishtirokchi (b — do'st havola orqali kirgach to'ladi).
-- *_ok — to'g'ri javoblar, *_ms — butun duelga ketgan vaqt, *_done — tugatganmi.
-- bitdi — natija ikkala tomonga yuborilgani (takror yuborilmasligi uchun).
CREATE TABLE IF NOT EXISTS duel (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  a        TEXT NOT NULL,
  b        TEXT,
  at       TEXT NOT NULL DEFAULT (datetime('now')),
  a_start  INTEGER, a_ok INTEGER NOT NULL DEFAULT 0, a_ms INTEGER, a_done INTEGER NOT NULL DEFAULT 0,
  b_start  INTEGER, b_ok INTEGER NOT NULL DEFAULT 0, b_ms INTEGER, b_done INTEGER NOT NULL DEFAULT 0,
  bitdi    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_duel_a ON duel(a, at);
