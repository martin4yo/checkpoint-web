-- CreateTable
CREATE TABLE "legajo_field_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requiredFields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legajo_field_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legajo_field_configs_tenantId_key" ON "legajo_field_configs"("tenantId");

-- AddForeignKey
ALTER TABLE "legajo_field_configs" ADD CONSTRAINT "legajo_field_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
