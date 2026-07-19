-- Additive slug for Work and Blog (Phase 4b).
-- Nullable first, then backfilled from the title, then a unique index. Postgres
-- permits multiple NULLs under a unique index, so this is safe to run against a
-- live table; a later migration will tighten the column to NOT NULL.

-- AlterTable
ALTER TABLE "Work" ADD COLUMN "slug" TEXT;
ALTER TABLE "Blog" ADD COLUMN "slug" TEXT;

-- Backfill: slugify the title and append a short id fragment so two rows that
-- slugify to the same string can't collide when the unique index is built.
UPDATE "Work"
SET "slug" = trim(BOTH '-' FROM regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g'))
             || '-' || substring("id" FROM 1 FOR 4)
WHERE "slug" IS NULL;

UPDATE "Blog"
SET "slug" = trim(BOTH '-' FROM regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g'))
             || '-' || substring("id" FROM 1 FOR 4)
WHERE "slug" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Work_slug_key" ON "Work"("slug");
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");
