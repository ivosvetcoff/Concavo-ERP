-- CreateEnum
CREATE TYPE "TipoAusencia" AS ENUM ('VACACIONES', 'INCAPACIDAD', 'PERMISO_CON_GOCE', 'PERMISO_SIN_GOCE', 'FALTA', 'DIA_FESTIVO');

-- AlterTable
ALTER TABLE "Insumo" ADD COLUMN     "comprobante" TEXT;

-- CreateTable
CREATE TABLE "Ausencia" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "tipo" "TipoAusencia" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "diasHabiles" INTEGER NOT NULL DEFAULT 1,
    "aprobada" BOOLEAN NOT NULL DEFAULT false,
    "pagada" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ausencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ausencia_empleadoId_idx" ON "Ausencia"("empleadoId");

-- CreateIndex
CREATE INDEX "Ausencia_fechaInicio_idx" ON "Ausencia"("fechaInicio");

-- CreateIndex
CREATE INDEX "Ausencia_tipo_idx" ON "Ausencia"("tipo");

-- AddForeignKey
ALTER TABLE "Ausencia" ADD CONSTRAINT "Ausencia_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
