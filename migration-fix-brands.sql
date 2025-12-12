-- Migration script to fix existing brands with null categoryId
-- Run this script in your PostgreSQL database before starting the application

-- Step 1: Make categoryId nullable temporarily (if not already)
ALTER TABLE brands ALTER COLUMN "categoryId" DROP NOT NULL;

-- Step 2: Set a default categoryId for existing brands (choose one option):

-- Option A: If you have at least one category, assign all brands to the first category
-- UPDATE brands SET "categoryId" = (SELECT id FROM categories ORDER BY id LIMIT 1) WHERE "categoryId" IS NULL;

-- Option B: Delete all brands that don't have a categoryId
-- DELETE FROM brands WHERE "categoryId" IS NULL;

-- Option C: Create a default category and assign all brands to it
-- INSERT INTO categories ("nameRu", "nameEn", "images", "createdAt", "updatedAt")
-- VALUES ('Default Category', 'Default Category', ARRAY[]::text[], NOW(), NOW())
-- ON CONFLICT DO NOTHING;
-- UPDATE brands SET "categoryId" = (SELECT id FROM categories WHERE "nameRu" = 'Default Category' LIMIT 1) WHERE "categoryId" IS NULL;

-- Step 3: After fixing data, make categoryId NOT NULL again (uncomment when ready)
-- ALTER TABLE brands ALTER COLUMN "categoryId" SET NOT NULL;

