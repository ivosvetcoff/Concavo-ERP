-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ENCARGADO');

-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('COTIZACION', 'EN_ESPERA', 'EN_COMPRAS', 'LISTA_DE_COMPRAS', 'MATERIAL_EN_PISO', 'DESPIECE', 'FABRICACION', 'POR_EMPACAR', 'ENTREGADO', 'PAUSA', 'CANCELADO');

-- CreateEnum
CREATE TYPE "Semaforo" AS ENUM ('EN_TIEMPO', 'PRECAUCION', 'ATRASADO', 'CRITICO', 'PAUSA');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('MXN', 'USD');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('PUE', 'PPD');

-- CreateEnum
CREATE TYPE "ProcesoTecnico" AS ENUM ('HABILITADO', 'ARMADO', 'PULIDO', 'LACA');

-- CreateEnum
CREATE TYPE "TipoTercero" AS ENUM ('TAPICERIA', 'PIEL', 'ACCESORIOS', 'HERRERIA');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('CAMBIO_ESTADO', 'CAMBIO_MONTO', 'MUEBLE_AGREGADO', 'MUEBLE_ELIMINADO', 'ENTREGA_AGREGADA', 'COMPRA_REGISTRADA', 'FACTURADO', 'COMENTARIO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'PAUSA', 'OK', 'RETRABAJO', 'RE_TRABAJO');

-- CreateEnum
CREATE TYPE "TipoCompra" AS ENUM ('PROYECTO', 'GENERAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ENCARGADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empleado" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "puesto" TEXT,
    "tarifaHora" DECIMAL(10,2),
    "sueldoMensual" DECIMAL(12,2),
    "fechaIngreso" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "rfc" TEXT,
    "nss" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "rfc" TEXT,
    "razonSocial" TEXT,
    "usoCFDIDefault" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeloMueble" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "linea" TEXT,
    "descripcionBase" TEXT,
    "maderaTipica" TEXT,
    "horasEstimadas" DECIMAL(6,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeloMueble_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proyecto" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "po" TEXT,
    "clienteId" TEXT NOT NULL,
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'COTIZACION',
    "semaforo" "Semaforo" NOT NULL DEFAULT 'EN_TIEMPO',
    "semaforoManual" BOOLEAN NOT NULL DEFAULT false,
    "fechaPO" TIMESTAMP(3),
    "fechaCompromiso" TIMESTAMP(3),
    "fechaEntrega" TIMESTAMP(3),
    "qtyItems" INTEGER NOT NULL DEFAULT 0,
    "montoVendido" DECIMAL(12,2) NOT NULL,
    "anticipo" DECIMAL(12,2),
    "moneda" "Moneda" NOT NULL DEFAULT 'MXN',
    "tipoCambioVenta" DECIMAL(12,4),
    "tieneHC" BOOLEAN NOT NULL DEFAULT false,
    "comentarios" TEXT,
    "facturado" BOOLEAN NOT NULL DEFAULT false,
    "numeroCFDI" TEXT,
    "rfcCliente" TEXT,
    "usoCFDI" TEXT,
    "metodoPago" "MetodoPago",
    "formaPago" TEXT,
    "fechaFacturacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrega" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaCompromiso" TIMESTAMP(3) NOT NULL,
    "fechaEntrega" TIMESTAMP(3),
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'FABRICACION',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mueble" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "entregaId" TEXT,
    "modeloId" TEXT,
    "orden" TEXT,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "madera" TEXT,
    "descripcionLarga" TEXT,
    "terceros" "TipoTercero"[],
    "notasTerceros" TEXT,
    "procesoActual" "ProcesoTecnico",
    "especificaciones" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mueble_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuebleProcesoLog" (
    "id" TEXT NOT NULL,
    "muebleId" TEXT NOT NULL,
    "procesoAnterior" "ProcesoTecnico",
    "procesoNuevo" "ProcesoTecnico",
    "cambiadoPorId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MuebleProcesoLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProyectoRevision" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "montoAnterior" DECIMAL(12,2) NOT NULL,
    "montoNuevo" DECIMAL(12,2) NOT NULL,
    "motivo" TEXT NOT NULL,
    "cambiadoPorId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProyectoRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoProyecto" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "metadata" JSONB,
    "usuarioId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoProyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoCambio" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "mxnUsd" DECIMAL(12,4) NOT NULL,
    "fuente" TEXT,

    CONSTRAINT "TipoCambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarea" (
    "id" TEXT NOT NULL,
    "muebleId" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "asignadoPorId" TEXT,
    "proceso" "ProcesoTecnico" NOT NULL,
    "estado" "EstadoTarea" NOT NULL DEFAULT 'PENDIENTE',
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFinEst" TIMESTAMP(3) NOT NULL,
    "fechaFinReal" TIMESTAMP(3),
    "horasEstimadas" DECIMAL(6,2),
    "horasReales" DECIMAL(6,2),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "proveedor" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'MXN',
    "tipoCambio" DECIMAL(12,4),
    "tipo" "TipoCompra" NOT NULL,
    "proyectoId" TEXT,
    "categoria" TEXT,
    "comprobante" TEXT,
    "numeroCFDIRecibido" TEXT,
    "rfcProveedor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GastoOperativo" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'MXN',
    "categoria" TEXT NOT NULL,
    "recurrente" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GastoOperativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoNomina" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPago" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagoNomina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "Cliente_rfc_idx" ON "Cliente"("rfc");

-- CreateIndex
CREATE UNIQUE INDEX "ModeloMueble_codigo_key" ON "ModeloMueble"("codigo");

-- CreateIndex
CREATE INDEX "ModeloMueble_linea_idx" ON "ModeloMueble"("linea");

-- CreateIndex
CREATE INDEX "ModeloMueble_activo_idx" ON "ModeloMueble"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_codigo_key" ON "Proyecto"("codigo");

-- CreateIndex
CREATE INDEX "Proyecto_estado_idx" ON "Proyecto"("estado");

-- CreateIndex
CREATE INDEX "Proyecto_clienteId_idx" ON "Proyecto"("clienteId");

-- CreateIndex
CREATE INDEX "Proyecto_fechaCompromiso_idx" ON "Proyecto"("fechaCompromiso");

-- CreateIndex
CREATE INDEX "Proyecto_facturado_idx" ON "Proyecto"("facturado");

-- CreateIndex
CREATE INDEX "Entrega_proyectoId_idx" ON "Entrega"("proyectoId");

-- CreateIndex
CREATE INDEX "Entrega_fechaCompromiso_idx" ON "Entrega"("fechaCompromiso");

-- CreateIndex
CREATE INDEX "Mueble_proyectoId_idx" ON "Mueble"("proyectoId");

-- CreateIndex
CREATE INDEX "Mueble_entregaId_idx" ON "Mueble"("entregaId");

-- CreateIndex
CREATE INDEX "Mueble_procesoActual_idx" ON "Mueble"("procesoActual");

-- CreateIndex
CREATE INDEX "Mueble_modeloId_idx" ON "Mueble"("modeloId");

-- CreateIndex
CREATE INDEX "MuebleProcesoLog_muebleId_idx" ON "MuebleProcesoLog"("muebleId");

-- CreateIndex
CREATE INDEX "ProyectoRevision_proyectoId_idx" ON "ProyectoRevision"("proyectoId");

-- CreateIndex
CREATE INDEX "EventoProyecto_proyectoId_fecha_idx" ON "EventoProyecto"("proyectoId", "fecha");

-- CreateIndex
CREATE INDEX "EventoProyecto_tipo_idx" ON "EventoProyecto"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "TipoCambio_fecha_key" ON "TipoCambio"("fecha");

-- CreateIndex
CREATE INDEX "TipoCambio_fecha_idx" ON "TipoCambio"("fecha");

-- CreateIndex
CREATE INDEX "Tarea_empleadoId_fechaInicio_idx" ON "Tarea"("empleadoId", "fechaInicio");

-- CreateIndex
CREATE INDEX "Tarea_muebleId_idx" ON "Tarea"("muebleId");

-- CreateIndex
CREATE INDEX "Tarea_estado_idx" ON "Tarea"("estado");

-- CreateIndex
CREATE INDEX "Compra_proyectoId_idx" ON "Compra"("proyectoId");

-- CreateIndex
CREATE INDEX "Compra_fecha_idx" ON "Compra"("fecha");

-- CreateIndex
CREATE INDEX "Compra_tipo_idx" ON "Compra"("tipo");

-- CreateIndex
CREATE INDEX "GastoOperativo_fecha_idx" ON "GastoOperativo"("fecha");

-- CreateIndex
CREATE INDEX "PagoNomina_anio_mes_idx" ON "PagoNomina"("anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "PagoNomina_empleadoId_mes_anio_key" ON "PagoNomina"("empleadoId", "mes", "anio");

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mueble" ADD CONSTRAINT "Mueble_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mueble" ADD CONSTRAINT "Mueble_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "Entrega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mueble" ADD CONSTRAINT "Mueble_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "ModeloMueble"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuebleProcesoLog" ADD CONSTRAINT "MuebleProcesoLog_muebleId_fkey" FOREIGN KEY ("muebleId") REFERENCES "Mueble"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoRevision" ADD CONSTRAINT "ProyectoRevision_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoRevision" ADD CONSTRAINT "ProyectoRevision_cambiadoPorId_fkey" FOREIGN KEY ("cambiadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoProyecto" ADD CONSTRAINT "EventoProyecto_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoProyecto" ADD CONSTRAINT "EventoProyecto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_muebleId_fkey" FOREIGN KEY ("muebleId") REFERENCES "Mueble"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_asignadoPorId_fkey" FOREIGN KEY ("asignadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoNomina" ADD CONSTRAINT "PagoNomina_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
