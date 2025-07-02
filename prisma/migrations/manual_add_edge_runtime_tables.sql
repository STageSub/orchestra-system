-- Add Customer table
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "databaseUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "contactEmail" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'small',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on subdomain
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_subdomain_key" ON "Customer"("subdomain");

-- Add Orchestra table
CREATE TABLE IF NOT EXISTS "Orchestra" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "databaseUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Orchestra_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on subdomain
CREATE UNIQUE INDEX IF NOT EXISTS "Orchestra_subdomain_key" ON "Orchestra"("subdomain");

-- Add FileStorage table
CREATE TABLE IF NOT EXISTS "FileStorage" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "projectId" INTEGER,
    "needId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileStorage_pkey" PRIMARY KEY ("id")
);

-- Add foreign key to Project
ALTER TABLE "FileStorage" 
ADD CONSTRAINT "FileStorage_projectId_fkey" 
FOREIGN KEY ("projectId") REFERENCES "Project"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add trigger to update updatedAt timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for Customer
DROP TRIGGER IF EXISTS update_Customer_updated_at ON "Customer";
CREATE TRIGGER update_Customer_updated_at BEFORE UPDATE ON "Customer"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for Orchestra
DROP TRIGGER IF EXISTS update_Orchestra_updated_at ON "Orchestra";
CREATE TRIGGER update_Orchestra_updated_at BEFORE UPDATE ON "Orchestra"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();