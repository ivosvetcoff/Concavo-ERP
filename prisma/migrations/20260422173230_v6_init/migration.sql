-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ENCARGADO');

-- CreateEnum
CREATE TYPE "EspecialidadEmpleado" AS ENUM ('HABILITADOR', 'ARMADOR', 'PULIDOR', 'LAQUEADOR', 'ADMINISTRATIVO');

-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('COTIZACION', 'EN_ESPERA', 'EN_COMPRAS', 'LISTA_DE_COMPRAS', 'MATERIAL_EN_PISO', 'DESPIECE', 'FABRICACION', 'POR_EMPACAR', 'ENTREGADO', 'PAUSA', 'CANCELADO');

-- CreateEnum
CREATE TYPE "Semaforo" AS ENUM ('EN_TIEMPO', 'PRECAUCION', 'ATRASADO', 'CRITICO', 'PAUSA');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('MXN', 'USD');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('PUE', 'PPD');

-- CreateEnum
CREATE TYPE "Estructura" AS ENUM ('MDF', 'PTR', 'NA');

-- CreateEnum
CREATE TYPE "EstadoItem" AS ENUM ('ESPERA', 'FABRICACION', 'REPROCESO', 'PAUSA', 'CANCELADO', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "ProcesoTecnico" AS ENUM ('HABILITADO', 'ARMADO', 'PULIDO', 'LACA', 'EXTERNO', 'COMPLEMENTOS', 'EMPAQUE', 'LISTO_PARA_ENTREGA', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "TipoTercero" AS ENUM ('TAPICERIA', 'PIEL', 'ACCESORIOS', 'HERRERIA', 'MARMOL', 'ESPEJO', 'TEJIDO', 'OTROS');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('CAMBIO_ESTADO', 'CAMBIO_MONTO', 'MUEBLE_AGREGADO', 'MUEBLE_ELIMINADO', 'CAMBIO_PROCESO', 'ANTICIPO_RECIBIDO', 'PAGO_RECIBIDO', 'COMPRA_REGISTRADA', 'FACTURADO', 'COMENTARIO', 'OTRO');

-- CreateEnum
CREATE TYPE "CategoriaCompra" AS ENUM ('MDF', 'SOLIDO', 'COMPLEMENTOS', 'ENVIOS');

-- CreateEnum
CREATE TYPE "TipoCompra" AS ENUM ('INICIAL', 'ADICIONAL');

-- CreateEnum
CREATE TYPE "UnidadCompra" AS ENUM ('HOJA', 'PIE_TABLA', 'PIEZA', 'METRO', 'PEDIDO', 'ENVIO', 'KILOGRAMO', 'LITRO', 'PAQUETE', 'JUEGO', 'GALON', 'CAJA', 'CM', 'ROLLO', 'RECOLECCION', 'GRUPO');

-- CreateEnum
CREATE TYPE "ConceptoGastoFijo" AS ENUM ('RENTA', 'LUZ', 'AGUA', 'MANTENIMIENTO', 'INTERNET', 'GASOLINA', 'GASTOS_VARIOS', 'IMSS', 'CONTADOR', 'IMPUESTOS', 'MAQUINARIA_Y_EQUIPO', 'OTROS');

-- CreateEnum
CREATE TYPE "EstatusPago" AS ENUM ('PENDIENTE', 'LIQUIDADO', 'CANCELADO');

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
    "especialidad" "EspecialidadEmpleado" NOT NULL,
    "tarifaHoraTO" DECIMAL(10,2) NOT NULL,
    "tarifaHoraTE" DECIMAL(10,2) NOT NULL,
    "sueldoSemanal" DECIMAL(12,2),
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
CREATE TABLE "HistorialTarifa" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "tarifaHoraTO" DECIMAL(10,2) NOT NULL,
    "tarifaHoraTE" DECIMAL(10,2) NOT NULL,
    "vigenteDesde" TIMESTAMP(3) NOT NULL,
    "vigenteHasta" TIMESTAMP(3),

    CONSTRAINT "HistorialTarifa_pkey" PRIMARY KEY ("id")
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
    "ivaIncluido" BOOLEAN NOT NULL DEFAULT true,
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
CREATE TABLE "Mueble" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "orden" TEXT,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "madera" TEXT,
    "estructura" "Estructura",
    "monto" DECIMAL(12,2),
    "descripcionLarga" TEXT,
    "terceros" "TipoTercero"[],
    "notasTerceros" TEXT,
    "estadoItem" "EstadoItem" NOT NULL DEFAULT 'ESPERA',
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
    "estadoAnterior" "EstadoItem",
    "estadoNuevo" "EstadoItem",
    "cambiadoPorId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MuebleProcesoLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostoExterno" (
    "id" TEXT NOT NULL,
    "muebleId" TEXT NOT NULL,
    "tipo" "TipoTercero" NOT NULL,
    "proveedor" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "ivaIncluido" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL,
    "comprobante" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostoExterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarea" (
    "id" TEXT NOT NULL,
    "muebleId" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "asignadoPorId" TEXT,
    "proceso" "ProcesoTecnico" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFinEst" TIMESTAMP(3) NOT NULL,
    "fechaFinReal" TIMESTAMP(3),
    "horasEstimadas" DECIMAL(6,2),
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroProduccion" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "muebleId" TEXT NOT NULL,
    "proceso" "ProcesoTecnico" NOT NULL,
    "semana" TIMESTAMP(3) NOT NULL,
    "horasTO" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "horasTE" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroProduccion_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Compra" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "categoria" "CategoriaCompra" NOT NULL,
    "tipo" "TipoCompra" NOT NULL,
    "clienteRelacionado" TEXT,
    "proyectoId" TEXT,
    "muebleNombre" TEXT,
    "descripcion" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "idFactura" TEXT,
    "qty" DECIMAL(10,3) NOT NULL,
    "unidad" "UnidadCompra" NOT NULL,
    "importe" DECIMAL(12,2) NOT NULL,
    "iva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "numeroCFDIRecibido" TEXT,
    "rfcProveedor" TEXT,
    "comprobante" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insumo" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "idFactura" TEXT,
    "qty" DECIMAL(10,3) NOT NULL,
    "unidad" "UnidadCompra" NOT NULL,
    "importe" DECIMAL(12,2) NOT NULL,
    "iva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "categoria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GastoFijo" (
    "id" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "concepto" "ConceptoGastoFijo" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPago" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GastoFijo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anticipo" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "porcentaje" DECIMAL(5,2),
    "fecha" TIMESTAMP(3) NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "cfdiEmitido" BOOLEAN NOT NULL DEFAULT false,
    "numeroCFDI" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anticipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoProyecto" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "estatus" "EstatusPago" NOT NULL DEFAULT 'PENDIENTE',
    "cfdiEmitido" BOOLEAN NOT NULL DEFAULT false,
    "numeroCFDI" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoProyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoNomina" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "semana" TIMESTAMP(3) NOT NULL,
    "sueldoBase" DECIMAL(12,2) NOT NULL,
    "horasExtras" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "montoExtras" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deducciones" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPago" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoNomina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CierreMensual" (
    "id" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "cerrado" BOOLEAN NOT NULL DEFAULT false,
    "fechaCierre" TIMESTAMP(3),
    "cerradoPorId" TEXT,
    "totalProyectosEntregados" INTEGER NOT NULL DEFAULT 0,
    "totalItemsEntregados" INTEGER NOT NULL DEFAULT 0,
    "totalIngresosFacturados" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalIngresosEfectivo" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalIngresos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalInsumos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalMOI" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalGastosFijos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalUtilidadProyectos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "utilidadNetaMes" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "snapshotProyectos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CierreMensual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoCambio" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "mxnUsd" DECIMAL(12,4) NOT NULL,
    "fuente" TEXT,

    CONSTRAINT "TipoCambio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "HistorialTarifa_empleadoId_vigenteDesde_idx" ON "HistorialTarifa"("empleadoId", "vigenteDesde");

-- CreateIndex
CREATE INDEX "Cliente_rfc_idx" ON "Cliente"("rfc");

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_codigo_key" ON "Proyecto"("codigo");

-- CreateIndex
CREATE INDEX "Proyecto_estado_idx" ON "Proyecto"("estado");

-- CreateIndex
CREATE INDEX "Proyecto_clienteId_idx" ON "Proyecto"("clienteId");

-- CreateIndex
CREATE INDEX "Proyecto_fechaCompromiso_idx" ON "Proyecto"("fechaCompromiso");

-- CreateIndex
CREATE INDEX "Proyecto_fechaEntrega_idx" ON "Proyecto"("fechaEntrega");

-- CreateIndex
CREATE INDEX "Proyecto_facturado_idx" ON "Proyecto"("facturado");

-- CreateIndex
CREATE INDEX "Mueble_proyectoId_idx" ON "Mueble"("proyectoId");

-- CreateIndex
CREATE INDEX "Mueble_estadoItem_idx" ON "Mueble"("estadoItem");

-- CreateIndex
CREATE INDEX "Mueble_procesoActual_idx" ON "Mueble"("procesoActual");

-- CreateIndex
CREATE INDEX "MuebleProcesoLog_muebleId_idx" ON "MuebleProcesoLog"("muebleId");

-- CreateIndex
CREATE INDEX "CostoExterno_muebleId_idx" ON "CostoExterno"("muebleId");

-- CreateIndex
CREATE INDEX "CostoExterno_tipo_idx" ON "CostoExterno"("tipo");

-- CreateIndex
CREATE INDEX "Tarea_empleadoId_fechaInicio_idx" ON "Tarea"("empleadoId", "fechaInicio");

-- CreateIndex
CREATE INDEX "Tarea_muebleId_idx" ON "Tarea"("muebleId");

-- CreateIndex
CREATE INDEX "RegistroProduccion_semana_idx" ON "RegistroProduccion"("semana");

-- CreateIndex
CREATE INDEX "RegistroProduccion_muebleId_idx" ON "RegistroProduccion"("muebleId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroProduccion_empleadoId_muebleId_proceso_semana_key" ON "RegistroProduccion"("empleadoId", "muebleId", "proceso", "semana");

-- CreateIndex
CREATE INDEX "ProyectoRevision_proyectoId_idx" ON "ProyectoRevision"("proyectoId");

-- CreateIndex
CREATE INDEX "EventoProyecto_proyectoId_fecha_idx" ON "EventoProyecto"("proyectoId", "fecha");

-- CreateIndex
CREATE INDEX "EventoProyecto_tipo_idx" ON "EventoProyecto"("tipo");

-- CreateIndex
CREATE INDEX "Compra_proyectoId_idx" ON "Compra"("proyectoId");

-- CreateIndex
CREATE INDEX "Compra_fecha_idx" ON "Compra"("fecha");

-- CreateIndex
CREATE INDEX "Compra_categoria_idx" ON "Compra"("categoria");

-- CreateIndex
CREATE INDEX "Compra_tipo_idx" ON "Compra"("tipo");

-- CreateIndex
CREATE INDEX "Insumo_fecha_idx" ON "Insumo"("fecha");

-- CreateIndex
CREATE INDEX "GastoFijo_anio_mes_idx" ON "GastoFijo"("anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "GastoFijo_mes_anio_concepto_key" ON "GastoFijo"("mes", "anio", "concepto");

-- CreateIndex
CREATE INDEX "Anticipo_proyectoId_idx" ON "Anticipo"("proyectoId");

-- CreateIndex
CREATE INDEX "Anticipo_fecha_idx" ON "Anticipo"("fecha");

-- CreateIndex
CREATE INDEX "PagoProyecto_proyectoId_idx" ON "PagoProyecto"("proyectoId");

-- CreateIndex
CREATE INDEX "PagoProyecto_estatus_idx" ON "PagoProyecto"("estatus");

-- CreateIndex
CREATE INDEX "PagoNomina_semana_idx" ON "PagoNomina"("semana");

-- CreateIndex
CREATE UNIQUE INDEX "PagoNomina_empleadoId_semana_key" ON "PagoNomina"("empleadoId", "semana");

-- CreateIndex
CREATE UNIQUE INDEX "CierreMensual_mes_anio_key" ON "CierreMensual"("mes", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "TipoCambio_fecha_key" ON "TipoCambio"("fecha");

-- CreateIndex
CREATE INDEX "TipoCambio_fecha_idx" ON "TipoCambio"("fecha");

-- AddForeignKey
ALTER TABLE "HistorialTarifa" ADD CONSTRAINT "HistorialTarifa_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mueble" ADD CONSTRAINT "Mueble_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuebleProcesoLog" ADD CONSTRAINT "MuebleProcesoLog_muebleId_fkey" FOREIGN KEY ("muebleId") REFERENCES "Mueble"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostoExterno" ADD CONSTRAINT "CostoExterno_muebleId_fkey" FOREIGN KEY ("muebleId") REFERENCES "Mueble"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_muebleId_fkey" FOREIGN KEY ("muebleId") REFERENCES "Mueble"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_asignadoPorId_fkey" FOREIGN KEY ("asignadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroProduccion" ADD CONSTRAINT "RegistroProduccion_muebleId_fkey" FOREIGN KEY ("muebleId") REFERENCES "Mueble"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoRevision" ADD CONSTRAINT "ProyectoRevision_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoRevision" ADD CONSTRAINT "ProyectoRevision_cambiadoPorId_fkey" FOREIGN KEY ("cambiadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoProyecto" ADD CONSTRAINT "EventoProyecto_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoProyecto" ADD CONSTRAINT "EventoProyecto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anticipo" ADD CONSTRAINT "Anticipo_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoProyecto" ADD CONSTRAINT "PagoProyecto_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoNomina" ADD CONSTRAINT "PagoNomina_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
