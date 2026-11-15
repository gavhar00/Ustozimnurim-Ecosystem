-- npx wrangler d1 execute ustozim-quiz-db --remote --file=migrations/2026-11-03_ketish_log.sql

-- Botni to'xtatgan (bloklagan) va qaytgan foydalanuvchilar tarixi.
-- kun = ro'yxatdan necha kun o'tgan, javob = shu paytgacha nechta savolga javob bergan.
CREATE TABLE IF NOT EXISTS ketish_log (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  uid    TEXT NOT NULL,
  holat  TEXT NOT NULL,                      -- ketdi | qaytdi
  at     TEXT NOT NULL DEFAULT (datetime('now')),
  kun    INTEGER,
  javob  INTEGER,
  streak INTEGER
);
CREATE INDEX IF NOT EXISTS idx_ketish_at ON ketish_log(at);
