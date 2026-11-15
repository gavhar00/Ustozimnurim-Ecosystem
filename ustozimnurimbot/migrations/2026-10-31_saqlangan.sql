-- npx wrangler d1 execute ustozim-quiz-db --remote --file=migrations/2026-10-31_saqlangan.sql

-- Saqlangan savollar (🔖). Bir foydalanuvchi bir savolni bir marta saqlaydi.
CREATE TABLE IF NOT EXISTS saqlangan (
  uid  TEXT NOT NULL,
  qid  TEXT NOT NULL,
  at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (uid, qid)
);
