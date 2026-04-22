# CLAUDE.md — Concavo Micro-ERP

> Documento de contexto maestro para el proyecto. Leer completo antes de escribir código.
> Este archivo es la fuente de verdad. Si algo en el código contradice este documento, este documento manda (y se actualiza después).

---

## 1. Resumen del proyecto

**Qué es:** un Micro-ERP / EPM a medida para **Concavo**, una carpintería industrial de ~10 empleados ubicada en **Guadalajara, Jalisco, México**. Reemplaza el ecosistema actual basado en un único archivo Excel (con múltiples hojas) por una aplicación web unificada.

**Por qué existe:** el cliente empezó a organizar con Excels cuando se asoció con el dueño original (que manejaba todo "en la cabeza"). Al crecer el volumen de trabajo, mantener ese Excel dejó de ser viable. Probó evaluar ERPs comerciales (Odoo, Global Shop Solutions) pero los descartó: Odoo no modela producción real, y GSS cuesta USD 42.850 + mantenimiento anual — inviable para una pyme.

**Qué NO es:** no es un clon de Global Shop Solutions. La referencia de GSS sirve para entender vocabulario de la industria (WIP, APS, Job Costing, Shop Floor Data Collection), pero el producto que construimos es deliberadamente más chico, más simple y adaptado al flujo real de Concavo.

**Ventaja competitiva del producto:** simplicidad, costo cero de licencia, y modelo de datos que refleja exactamente cómo Concavo trabaja hoy (no cómo "debería" trabajar según un manual de ERP).

**Contexto regional:** México, moneda principal MXN, timezone `America/Mexico_City` (Jalisco no observa horario de verano desde 2022). Régimen fiscal SAT / CFDI 4.0. IVA estándar 16%. Ver sección 2 para el análisis competitivo local.

**Entorno de desarrollo:** el código se escribe con Google Antigravity + extensión de Claude. Este archivo está pensado para que cualquier agente IA en ese entorno tenga todo el contexto necesario.

---

## 2. Análisis competitivo en México

Entender qué hacen bien y mal los productos que compiten — especialmente los que tienen presencia real en México — ayuda a no caer en sus trampas y a explotar nuestras ventajas.

### Global Shop Solutions (GSS)

**Presencia en México:** tiene oficinas en Monterrey y Querétaro, y vende activamente al mercado mexicano. Los PDFs comerciales que nos pasó el cliente al inicio del proyecto son de su filial mexicana, con propuestas en USD apuntadas a pymes mexicanas.

**Hace bien:** tracking de WIP con recolectores en piso, costeo real de mano de obra, trazabilidad "puerta a puerta", reportería muy rica, 49 años en la industria, configuración de CFDI, Comercio Exterior, Complemento de Pago, Anexo 24 incluida.

**Hace mal para una pyme:** curva de aprendizaje brutal (4 meses de implementación formal), costo prohibitivo (USD 42.850 licencias + USD 3.490/año mantenimiento + USD 300/año CFDI), requiere consultor externo, requiere hardware específico (recolectores, kioscos, scanners), UI densa pero anticuada, pensado para manufactura en serie más que a medida.

**Señal fuerte:** el cliente ya evaluó GSS y lo rechazó por precio. No es una referencia teórica, es un competidor real que perdió en este caso.

**Nuestra ventaja:** arranca en días, no meses. Cero hardware. UI moderna. Modelo de datos adaptado al taller real del cliente. Costo orden de magnitud menor.

### Odoo Manufacturing

**Hace bien:** modular, open source, buen CRM, comunidad grande, tiene módulo CFDI mexicano.

**Hace mal:** la manufactura de Odoo está pensada para producción en serie con BOMs fijos y rutas de trabajo predefinidas. Un taller de muebles a medida NO es eso. Cada proyecto es único, los muebles cambian, las "rutas" son siempre los mismos 4 procesos (HABILITADO → ARMADO → PULIDO → LACA) pero los tiempos y operadores varían por mueble. Odoo obliga a modelar "productos" con BOMs, que en una carpintería a medida es absurdo.

**Nuestra ventaja:** modelo de datos pensado para proyectos únicos, no productos replicables.

### ERPs mexicanos populares en el segmento pyme (Aspel, Contpaq, Bind ERP, Microsip)

**Presencia:** muy extendidos. Aspel SAE/COI/NOI es prácticamente el estándar contable en pymes mexicanas. Contpaq es similar, más orientado a contabilidad. Bind ERP es cloud y mexicano.

**Hacen bien:** contabilidad fiscal, integración SAT/CFDI nativa, nómina con reglas mexicanas (SAT, IMSS, INFONAVIT), precio razonable.

**Hacen mal:** son **contables con maquillaje operativo**, no productivos. No modelan producción a medida ni WIP. No tienen Gantt. No tienen control de procesos de taller. El dueño termina llevando la operación en Excel igual que hoy, y el ERP sirve solo para facturar y cerrar mes.

**Nuestra ventaja:** el wedge es inverso — somos **operativos primero, con ganchos fiscales**. El Master Administrativo integra lo que el dueño ya calcula a mano, y deja la facturación CFDI como conector opcional a un PAC externo cuando haga falta.

### Monday / ClickUp / Asana con templates de manufactura

**Hacen bien:** UX moderna, colaboración, mobile first.

**Hacen mal:** no tienen finanzas. No calculan utilidad por proyecto. No tienen nómina. Son gestores de tareas con maquillaje.

**Nuestra ventaja:** el Master Administrativo integrado (cierre mensual con utilidad real) es lo que más duele al cliente y lo que ningún gestor de tareas resuelve.

### Fishbowl / JobBOSS / E2 Shop System

Competidores directos de GSS en el mid-market, todos estadounidenses. Poca presencia real en pymes mexicanas excepto filiales de empresas americanas.

### Conclusión estratégica

El wedge es: **productos existentes son o muy grandes y caros (GSS, Fishbowl), o contables primero (Aspel, Contpaq), o muy livianos sin finanzas (Monday), o mal ajustados al dominio real (Odoo).** Nuestro espacio es el producto chico que SÍ modela el dominio real de una carpintería a medida mexicana, SÍ tiene finanzas integradas con distinción entre ingresos facturados y en efectivo, y se conecta opcionalmente con un PAC para CFDI cuando el cliente lo necesita.

---

## 3. Fuente de datos actual del cliente

El cliente trabaja con **un único archivo Excel** que contiene varias hojas. Conocer estas hojas es fundamental porque el sistema replica y supera su funcionalidad.

### Hojas conocidas del Excel actual

1. **Master de Proyectos** — tabla resumen con todos los proyectos del año. Columnas observadas: `#PROYECTO`, `CLIENTE`, `QTY. ITEMS`, `P.O.`, `FECHA P.O.`, `FECHA COMPROMISO`, `FECHA ENTREGA`, `ESTATUS`, `EN TIEMPO` (semáforo), `HC` (sí/no), `COMENTARIOS`. Códigos de proyecto formato `017`, `058`. Clientes observados: AAGNES, TRRA, SYG, RTS, RDN, PAOLA VALDÉS, ROSE SANCHEZ, DANI GONVEL, DAVID ANAYA, ROBERTO IBERRI.
2. **Hoja de Control por proyecto** — detalle agrupado por operador. Columnas: `ÁREA/OPERADOR` (PEPE, MARISOL, CRISTIAN, BETO, CHAVA), estado de tarea (OK, EN PROCESO, RE TRABAJO, RETRABAJO, PAUSA), y una columna `POR PROYECTO Y/O MUEBLE` con formato `CLIENTE - PROYECTO/ENTREGA - MUEBLE (cantidad)`. Los colores codifican el proyecto. La última columna es el **proceso técnico** del mueble.
3. **Gantt operativo** — calendario por operador (filas = empleados), columnas = días. Cada barra coloreada representa un proyecto/mueble asignado a ese operador en esas fechas. Los colores coinciden con los de la Hoja de Control.
4. **Detalle por proyecto (tabla gris)** — lista de ítems: `No.`, `ORDEN`, `ITEM` (descripción con materiales entre paréntesis), `QTY`, `TOTAL` (monto en MXN), `FECHA P/O`, `FECHA COMPROMISO`, `MADERA` (ROSAMORADA, PAROTA, NOGAL, TECA), `3ROS` (terceros: TAPICERÍA, PIEL, ACCS, combinaciones), `ESTÁTUS` (ESPERA, FABRICACIÓN). Los montos pueden ser TBD.
5. **Compras por proyecto** (por confirmar).
6. **Compras generales** (por confirmar).
7. **Master Administrativo** (por confirmar) — cierre mensual, ingresos, egresos, utilidad.
8. **Nómina** (por confirmar).

### Observación crítica: entregas parciales

En la Hoja de Control se observan filas como `SYG - ENTREGA 6 ABRIL (7)`, `SYG - ENTREGA 13 ABRIL (9)`, `SYG - ENTREGA 20 ABRIL (9)`, `SYG - ENTREGA 27 ABRIL (9)`, `SYG - ENTREGA 4 MAYO (4)`. Esto sugiere fuertemente que **un proyecto puede tener múltiples entregas programadas** con fechas y cantidades distintas.

Esto es **bloqueante para Fase 0**. Ver sección 6 (Modelo) y sección 16 (Decisiones abiertas, punto 1).

### Observación crítica: facturación parcial

El cliente confirmó que **emite CFDI pero NO al 100% de sus clientes** — algunos pagan en efectivo sin factura. Esto tiene dos implicaciones importantes:
- El modelo debe distinguir proyectos facturados (con CFDI) de no facturados.
- El cierre mensual debe mostrar dos totales separados: **ingresos facturados** (los que ve el contador) e **ingresos reales** (todos, para la utilidad real).

### Implicancias para el modelo

- Los **4 procesos técnicos** son fijos y secuenciales: **HABILITADO → ARMADO → PULIDO → LACA**. No hay más.
- Los **estados de tarea** del operador son independientes del proceso técnico: `OK`, `EN_PROCESO`, `PAUSA`, `RETRABAJO`, `RE_TRABAJO`.
- El **Gantt es por operador**, no por proyecto. Filas = empleados, columnas = tiempo.
- El campo **3ROS (terceros)** no es un booleano: es una lista de tipos de tercero.
- Moneda principal **MXN**. Multi-moneda no va en MVP; el schema lo deja preparado para activar cuando haga falta.

---

## 4. Usuarios y roles

Tres a cinco usuarios totales. No más.

| Rol | Quiénes | Qué ven y hacen |
|---|---|---|
| `OWNER` | Dueño y socio (2 personas) | Todo. Única vista con finanzas, utilidad por proyecto, nómina, sueldos, montos vendidos, distinción facturado vs efectivo. |
| `ENCARGADO` | Líderes de producción (1-3 personas) | Operación: proyectos, muebles, estados técnicos, compras (cargar sí, totales consolidados no), asignación de tareas. **No ven** finanzas, montos vendidos, utilidades, nómina, sueldos. |

**Los 10 carpinteros NO son usuarios del sistema en Fase 1 ni Fase 2.** Los encargados cargan los avances por ellos.

**Importante:** los "operadores" del Gantt (PEPE, MARISOL, CRISTIAN, BETO, CHAVA) son **empleados** (entidad `Empleado`), no usuarios del sistema. No tienen login.

---

## 5. Stack técnico

Decisión guiada por una restricción: **un solo dev programa todo**. Cada pieza extra del stack multiplica el costo de mantenimiento.

### Stack elegido

- **Frontend + Backend:** Next.js 15 (App Router) con **Server Actions** para mutaciones y **Route Handlers** cuando se necesite endpoint HTTP estable. Un solo repo, un solo lenguaje (TypeScript).
- **UI:** Tailwind CSS + shadcn/ui.
- **DB:** PostgreSQL.
- **ORM:** Prisma.
- **Auth:** Clerk (recomendado) o Auth.js. No armar auth a mano.
- **Validación:** Zod en frontend y backend (shared schemas).
- **Forms:** react-hook-form + zod resolver.
- **Tablas:** shadcn `DataTable` (sobre TanStack Table).
- **Command palette (cmd+K):** shadcn `Command`.
- **Fechas:** date-fns + date-fns-tz (timezone: `America/Mexico_City`).
- **Dinero:** Prisma `Decimal` en DB, nunca floats. En frontend, manipular como string o con `decimal.js`.
- **Gantt:** `frappe-gantt` o `dhtmlx-gantt` (community). No construir desde cero.
- **Exportes:** `exceljs` para Excel, `@react-pdf/renderer` o `pdf-lib` para PDFs.
- **Email:** Resend (para alertas Fase 2).
- **Deploy:** Vercel + Neon (Postgres serverless) como default. Alternativa: VPS con Docker + Coolify.
- **Storage de archivos:** Vercel Blob o UploadThing. Fase 2+.

### Stack rechazado y por qué

- **FastAPI / Python backend separado:** rechazado. Duplica deploy, auth, validación, tipos.
- **App nativa (React Native / Flutter):** rechazada. PWA sobre Next.js si hace falta.
- **Odoo customizado:** evaluado y rechazado por el cliente.
- **GraphQL / tRPC:** innecesarios. Server Actions alcanzan.
- **Microservicios:** no. Monolito modular.

### Estructura de carpetas esperada

```
/
├── CLAUDE.md
├── README.md
├── .env.example
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   ├── proyectos/[id]/
│   │   │   ├── muebles/
│   │   │   ├── compras/
│   │   │   ├── gantt/
│   │   │   ├── empleados/
│   │   │   ├── catalogo/        # modelos de mueble
│   │   │   ├── cierre/
│   │   │   └── nomina/
│   │   └── api/
│   ├── components/
│   │   ├── ui/                  # shadcn
│   │   ├── features/
│   │   └── command-palette/     # cmd+K
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── money.ts
│   │   ├── dates.ts             # wrappers con TZ Mexico_City
│   │   └── status-colors.ts
│   ├── server/
│   │   ├── actions/
│   │   ├── queries/
│   │   └── jobs/                # emails diarios (Fase 2)
│   ├── schemas/
│   └── exports/
│       └── templates/           # plantillas Excel fieles al Master
└── docs/
    ├── excel-original/
    └── decisiones/
```

---

## 6. Modelo de dominio

Esta sección es **normativa**: es el vocabulario y el modelo que se usa en código, en UI, y en conversaciones con el cliente. No inventar sinónimos.

### Entidades principales

**Proyecto** — unidad de venta. Un proyecto puede tener uno o varios muebles. Tiene un cliente, fechas, monto vendido, estado macro, y datos de facturación (puede ser facturado con CFDI o en efectivo sin factura).

**Entrega** (pendiente confirmación Fase 0) — sub-división de un proyecto con fecha de compromiso propia y un subconjunto de muebles. Un proyecto puede tener 1 o N entregas.

**Mueble** — unidad de producción. Pertenece a un proyecto y, si aplica, a una entrega. **Acá vive el WIP real.**

**ModeloMueble** (catálogo) — plantilla reutilizable de mueble. "CAMA VILNA 25 KS" existe una vez como modelo, y cuando un proyecto nuevo lo incluye, se instancia un Mueble a partir del modelo.

**Cliente** — quien contrata el proyecto. Puede ser persona física o moral (relevante para CFDI). Tiene RFC opcional.

**Empleado** (operador) — quien ejecuta trabajo. No tiene login.

**Tarea** — asignación de trabajo: une un mueble + empleado + proceso técnico + fechas. Alimenta el Gantt.

**Compra** — egreso de dinero. Puede estar asociada a un proyecto o ser general. Puede tener CFDI recibido o no.

**GastoOperativo** — gastos del taller no asignables (alquiler, luz, IMSS patronal).

**PagoNomina** — registro mensual de pago a cada empleado.

**ProyectoRevision** — histórico de cambios del monto vendido / alcance del proyecto.

**EventoProyecto** — timeline de eventos.

**TipoCambio** — histórico de cotización USD/MXN por fecha (latente, para activar multi-moneda si se necesita).

### Los 4 procesos técnicos (FIJOS y SECUENCIALES)

Declaración directa del cliente: *"con mis 4 procesos, habilitado → armado → pulido → laca, tiene que ser en ese orden"*.

```
HABILITADO    # materiales cortados/preparados
ARMADO        # estructura ensamblada
PULIDO        # lijado, preparado para laca
LACA          # con laca aplicada (etapa final de fabricación)
```

**Reglas estrictas:**
- Un mueble no puede saltar procesos. De HABILITADO debe pasar a ARMADO, no directo a PULIDO.
- Puede retroceder (retrabajo).
- Un mueble recién creado sin trabajo todavía **NO está en ningún proceso**: `procesoActual = null`.
- Cuando termina LACA, el mueble se considera "listo de fabricación". Empaque/entrega se trackea a nivel Proyecto/Entrega.

### Estados de Tarea

```
PENDIENTE    # asignada pero no iniciada
EN_PROCESO   # el operador la está trabajando
PAUSA        # pausada
OK           # terminada correctamente
RETRABAJO    # marcada como necesita retrabajo
RE_TRABAJO   # siendo retrabajada (a confirmar con cliente si es redundante)
```

### Estados del Proyecto

```
COTIZACION          # fase comercial, no confirmado aún
EN_ESPERA           # confirmado pero sin poder arrancar
EN_COMPRAS          # comprando materiales
LISTA_DE_COMPRAS    # compras listas, esperando material
MATERIAL_EN_PISO    # material recibido
DESPIECE            # cortes iniciales
FABRICACION         # en producción activa
POR_EMPACAR         # muebles terminados, listo para entregar
ENTREGADO           # cerrado
PAUSA               # suspendido temporalmente
CANCELADO           # baja definitiva
```

Estados no secuenciales — cualquier transición permitida.

### Semáforo de tiempo

```
EN_TIEMPO     # verde
PRECAUCION    # amarillo
ATRASADO      # rojo
CRITICO       # rojo oscuro
PAUSA         # gris
```

Calculado por defecto, overridable manualmente.

### Terceros (3ROS)

Array de enum:

```
TAPICERIA
PIEL
ACCESORIOS
HERRERIA
```

Permite combinaciones como `[TAPICERIA, PIEL]`.

### Maderas

String libre con autocomplete basado en histórico. Valores conocidos: ROSAMORADA, PAROTA, NOGAL, TECA.

### Facturación CFDI (México)

El cliente emite CFDI a algunos proyectos, no a todos (otros son en efectivo). El modelo refleja esto:

- Cada `Proyecto` tiene un flag `facturado: boolean` (default false).
- Campos opcionales: `numeroCFDI` (UUID o folio del CFDI emitido), `rfcCliente`, `usoCFDI` (clave SAT: G03, P01, etc.), `metodoPago` (PUE/PPD), `formaPago` (01 efectivo, 03 transferencia, 04 tarjeta crédito, etc.).
- En esta fase **no se emite CFDI desde el sistema** — solo se registra si el proyecto fue facturado por fuera, y sus datos. La emisión automática vía PAC está en backlog (B4).
- Para el `Cliente` también se guarda `rfc` opcional y `usoCFDIDefault`.
- Las `Compras` también pueden tener `numeroCFDIRecibido` y `rfcProveedor` opcionales (para deducción fiscal).

### Reglas de negocio

1. Código de proyecto: correlativo numérico con padding (`017`, `058`).
2. Un proyecto no se puede `ENTREGADO` si tiene muebles que no terminaron `LACA` (soft warning).
3. Compra `PROYECTO` requiere `proyectoId`. `GENERAL` lo deja null.
4. `montoVendido`, sueldos y campos fiscales detallados solo visibles para OWNER.
5. En cierre mensual, proyecto se cuenta en mes de `fechaEntrega` real.
6. Mueble con proceso LACA + tarea OK queda "listo de fábrica".
7. Gantt: filas = empleados, barras = tareas, color = proyecto.
8. Cambios de `montoVendido` crean registro en `ProyectoRevision` (con motivo y autor).
9. El cierre mensual distingue **ingresos facturados** (proyectos con `facturado = true`) de **ingresos en efectivo** (`facturado = false`). Se muestran ambos totales y el consolidado.

---

## 7. Esquema Prisma (draft inicial)

> Esquema draft. Se valida y ajusta al terminar Fase 0 con el Excel completo. El modelo de **Entrega** depende de la confirmación del cliente (decisión abierta 1).

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ===== USUARIOS Y AUTH =====

model User {
  id              String             @id @default(cuid())
  email           String             @unique
  name            String
  role            Role               @default(ENCARGADO)
  tareasAsignadas Tarea[]            @relation("AsignadoPor")
  revisionesProy  ProyectoRevision[]
  eventosProy     EventoProyecto[]
  createdAt       DateTime           @default(now())
}

enum Role {
  OWNER
  ENCARGADO
}

// ===== PERSONAS =====

model Empleado {
  id            String       @id @default(cuid())
  nombre        String
  apellido      String?
  puesto        String?
  tarifaHora    Decimal?     @db.Decimal(10, 2)
  sueldoMensual Decimal?     @db.Decimal(12, 2)
  fechaIngreso  DateTime?
  activo        Boolean      @default(true)
  color         String?                                // hex para Gantt
  rfc           String?                                // para recibos de nómina / CFDI de nómina (futuro)
  nss           String?                                // Número de Seguro Social (IMSS)
  tareas        Tarea[]
  pagosNomina   PagoNomina[]
  createdAt     DateTime     @default(now())
}

model Cliente {
  id              String     @id @default(cuid())
  nombre          String
  contacto        String?
  telefono        String?
  email           String?
  rfc             String?                                // opcional: algunos clientes pagan en efectivo sin RFC
  razonSocial     String?                                // si factura a persona moral
  usoCFDIDefault  String?                                // clave SAT: G03, P01, etc.
  notas           String?
  proyectos       Proyecto[]
  createdAt       DateTime   @default(now())

  @@index([rfc])
}

// ===== CATÁLOGO DE MODELOS DE MUEBLE =====

model ModeloMueble {
  id               String    @id @default(cuid())
  codigo           String    @unique
  nombre           String
  linea            String?                              // "VILNA", "HYGGE", "PEDREGAL"
  descripcionBase  String?
  maderaTipica     String?
  horasEstimadas   Decimal?  @db.Decimal(6, 2)
  activo           Boolean   @default(true)
  muebles          Mueble[]
  createdAt        DateTime  @default(now())

  @@index([linea])
  @@index([activo])
}

// ===== NÚCLEO: PROYECTOS, ENTREGAS Y MUEBLES =====

model Proyecto {
  id                String             @id @default(cuid())
  codigo            String             @unique          // "017", "058"
  nombre            String
  po                String?                             // purchase order del cliente
  clienteId         String
  cliente           Cliente            @relation(fields: [clienteId], references: [id])
  estado            EstadoProyecto     @default(COTIZACION)
  semaforo          Semaforo           @default(EN_TIEMPO)
  semaforoManual    Boolean            @default(false)
  fechaPO           DateTime?
  fechaCompromiso   DateTime?
  fechaEntrega      DateTime?
  qtyItems          Int                @default(0)
  montoVendido      Decimal            @db.Decimal(12, 2)
  anticipo          Decimal?           @db.Decimal(12, 2)
  moneda            Moneda             @default(MXN)
  tipoCambioVenta   Decimal?           @db.Decimal(12, 4)   // latente, solo si moneda != MXN
  tieneHC           Boolean            @default(false)
  comentarios       String?

  // ===== Facturación CFDI =====
  facturado         Boolean            @default(false)  // si se emitió CFDI para este proyecto
  numeroCFDI        String?                             // UUID o folio del CFDI emitido
  rfcCliente        String?                             // RFC usado en el CFDI (puede diferir del del Cliente master)
  usoCFDI           String?                             // clave SAT
  metodoPago        MetodoPago?                         // PUE / PPD
  formaPago         String?                             // clave SAT: 01, 03, 04, etc.
  fechaFacturacion  DateTime?

  entregas          Entrega[]
  muebles           Mueble[]
  compras           Compra[]
  revisiones        ProyectoRevision[]
  eventos           EventoProyecto[]
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  @@index([estado])
  @@index([clienteId])
  @@index([fechaCompromiso])
  @@index([facturado])
}

enum EstadoProyecto {
  COTIZACION
  EN_ESPERA
  EN_COMPRAS
  LISTA_DE_COMPRAS
  MATERIAL_EN_PISO
  DESPIECE
  FABRICACION
  POR_EMPACAR
  ENTREGADO
  PAUSA
  CANCELADO
}

enum Semaforo {
  EN_TIEMPO
  PRECAUCION
  ATRASADO
  CRITICO
  PAUSA
}

enum Moneda {
  MXN
  USD
}

enum MetodoPago {
  PUE   // Pago en Una sola Exhibición
  PPD   // Pago en Parcialidades o Diferido
}

// ===== ENTREGA (pendiente confirmación Fase 0) =====

model Entrega {
  id              String         @id @default(cuid())
  proyectoId      String
  proyecto        Proyecto       @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  nombre          String
  fechaCompromiso DateTime
  fechaEntrega    DateTime?
  estado          EstadoProyecto @default(FABRICACION)
  muebles         Mueble[]
  orden           Int            @default(0)
  createdAt       DateTime       @default(now())

  @@index([proyectoId])
  @@index([fechaCompromiso])
}

model Mueble {
  id               String             @id @default(cuid())
  proyectoId       String
  proyecto         Proyecto           @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  entregaId        String?
  entrega          Entrega?           @relation(fields: [entregaId], references: [id])
  modeloId         String?
  modelo           ModeloMueble?      @relation(fields: [modeloId], references: [id])
  orden            String?
  nombre           String
  cantidad         Int                @default(1)
  madera           String?
  descripcionLarga String?
  terceros         TipoTercero[]
  notasTerceros    String?
  procesoActual    ProcesoTecnico?
  especificaciones Json?
  historialProceso MuebleProcesoLog[]
  tareas           Tarea[]
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  @@index([proyectoId])
  @@index([entregaId])
  @@index([procesoActual])
  @@index([modeloId])
}

enum ProcesoTecnico {
  HABILITADO
  ARMADO
  PULIDO
  LACA
}

enum TipoTercero {
  TAPICERIA
  PIEL
  ACCESORIOS
  HERRERIA
}

model MuebleProcesoLog {
  id               String           @id @default(cuid())
  muebleId         String
  mueble           Mueble           @relation(fields: [muebleId], references: [id], onDelete: Cascade)
  procesoAnterior  ProcesoTecnico?
  procesoNuevo     ProcesoTecnico?
  cambiadoPorId    String?
  fecha            DateTime         @default(now())

  @@index([muebleId])
}

// ===== REVISIONES Y EVENTOS =====

model ProyectoRevision {
  id              String   @id @default(cuid())
  proyectoId      String
  proyecto        Proyecto @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  montoAnterior   Decimal  @db.Decimal(12, 2)
  montoNuevo      Decimal  @db.Decimal(12, 2)
  motivo          String
  cambiadoPorId   String?
  cambiadoPor     User?    @relation(fields: [cambiadoPorId], references: [id])
  fecha           DateTime @default(now())

  @@index([proyectoId])
}

model EventoProyecto {
  id          String     @id @default(cuid())
  proyectoId  String
  proyecto    Proyecto   @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  tipo        TipoEvento
  descripcion String
  metadata    Json?
  usuarioId   String?
  usuario     User?      @relation(fields: [usuarioId], references: [id])
  fecha       DateTime   @default(now())

  @@index([proyectoId, fecha])
  @@index([tipo])
}

enum TipoEvento {
  CAMBIO_ESTADO
  CAMBIO_MONTO
  MUEBLE_AGREGADO
  MUEBLE_ELIMINADO
  ENTREGA_AGREGADA
  COMPRA_REGISTRADA
  FACTURADO                // se emitió CFDI
  COMENTARIO
  OTRO
}

// ===== TIPOS DE CAMBIO (latente, para multi-moneda futura) =====

model TipoCambio {
  id     String   @id @default(cuid())
  fecha  DateTime @unique
  mxnUsd Decimal  @db.Decimal(12, 4)                   // 1 USD = X MXN
  fuente String?                                        // "Banxico FIX", "manual"

  @@index([fecha])
}

// ===== TAREAS =====

model Tarea {
  id             String         @id @default(cuid())
  muebleId       String
  mueble         Mueble         @relation(fields: [muebleId], references: [id], onDelete: Cascade)
  empleadoId     String
  empleado       Empleado       @relation(fields: [empleadoId], references: [id])
  asignadoPorId  String?
  asignadoPor    User?          @relation("AsignadoPor", fields: [asignadoPorId], references: [id])
  proceso        ProcesoTecnico
  estado         EstadoTarea    @default(PENDIENTE)
  fechaInicio    DateTime
  fechaFinEst    DateTime
  fechaFinReal   DateTime?
  horasEstimadas Decimal?       @db.Decimal(6, 2)
  horasReales    Decimal?       @db.Decimal(6, 2)
  notas          String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([empleadoId, fechaInicio])
  @@index([muebleId])
  @@index([estado])
}

enum EstadoTarea {
  PENDIENTE
  EN_PROCESO
  PAUSA
  OK
  RETRABAJO
  RE_TRABAJO
}

// ===== FINANZAS =====

model Compra {
  id                  String     @id @default(cuid())
  fecha               DateTime
  proveedor           String
  descripcion         String
  monto               Decimal    @db.Decimal(12, 2)
  moneda              Moneda     @default(MXN)
  tipoCambio          Decimal?   @db.Decimal(12, 4)     // solo si moneda != MXN
  tipo                TipoCompra
  proyectoId          String?
  proyecto            Proyecto?  @relation(fields: [proyectoId], references: [id])
  categoria           String?
  comprobante         String?                           // URL al archivo
  // CFDI recibido (deducción fiscal)
  numeroCFDIRecibido  String?                           // UUID del CFDI emitido por el proveedor
  rfcProveedor        String?
  createdAt           DateTime   @default(now())

  @@index([proyectoId])
  @@index([fecha])
  @@index([tipo])
}

enum TipoCompra {
  PROYECTO
  GENERAL
}

model GastoOperativo {
  id         String   @id @default(cuid())
  fecha      DateTime
  concepto   String
  monto      Decimal  @db.Decimal(12, 2)
  moneda     Moneda   @default(MXN)
  categoria  String
  recurrente Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@index([fecha])
}

model PagoNomina {
  id         String    @id @default(cuid())
  empleadoId String
  empleado   Empleado  @relation(fields: [empleadoId], references: [id])
  mes        Int
  anio       Int
  monto      Decimal   @db.Decimal(12, 2)
  pagado     Boolean   @default(false)
  fechaPago  DateTime?
  notas      String?
  createdAt  DateTime  @default(now())

  @@unique([empleadoId, mes, anio])
  @@index([anio, mes])
}
```

### Cálculos derivados (NO guardar, computar on-demand)

**Avance % del mueble:**
```
null / sin empezar    → 0%
HABILITADO en proceso → 20%
HABILITADO OK         → 30%
ARMADO en proceso     → 45%
ARMADO OK             → 55%
PULIDO en proceso     → 70%
PULIDO OK             → 80%
LACA en proceso       → 90%
LACA OK               → 100%
```

**Avance % del proyecto:** promedio de avance de todos sus muebles.

**Utilidad por proyecto:**
```
utilidadProyecto = proyecto.montoVendido
                 - SUM(compras.monto donde proyectoId = X)
                 - SUM(tareas.horasReales * empleado.tarifaHora donde mueble.proyectoId = X)
                 - prorrateoGastosFijosDelPeriodo
```

**Cierre mensual — dos totales separados (México):**
```
ingresosFacturados = SUM(proyecto.montoVendido) donde facturado = true
                     AND proyecto.fechaEntrega está en el mes

ingresosEnEfectivo = SUM(proyecto.montoVendido) donde facturado = false
                     AND proyecto.fechaEntrega está en el mes

ingresosTotales = ingresosFacturados + ingresosEnEfectivo
```

El contador típicamente pide `ingresosFacturados`. El dueño quiere ver los tres.

**Prorrateo de gastos fijos:** criterio a confirmar (decisión abierta 3).

---

## 8. Arquitectura de módulos

### Módulo 1 — Proyectos (Fase 1, núcleo)
- Listado con filtros. Export a Excel **replicando fielmente el Master del cliente**.
- Kanban por estado macro.
- Detalle con muebles, compras, margen, timeline de eventos, revisiones de monto, datos de facturación CFDI.
- Server actions: crear, update, cambiar estado, cerrar, ajustar monto (crea `ProyectoRevision`), marcar como facturado (con datos CFDI).

### Módulo 2 — Muebles / WIP (Fase 1)
- Vista "Hoja de Control" por proyecto que replica el Excel.
- Vista transversal "Muebles por proceso" (heatmap de cuellos).
- Avance individual por mueble.
- Log automático de cambios.

### Módulo 3 — Catálogo de Modelos (Fase 1)
- CRUD de `ModeloMueble`.
- Al crear un mueble en un proyecto: opción "partir de modelo".
- Foco: ahorrar carga repetitiva, no imponer uso.

### Módulo 4 — Compras (Fase 1)
- Tabla unificada con filtro `tipo`.
- Crear con toggle PROYECTO/GENERAL + selector de proyecto.
- Campo opcional para CFDI recibido (UUID + RFC proveedor) — útil para la deducción.
- Reporte por proyecto, categoría, período.
- Fase 2: upload de comprobante.

### Módulo 5 — Cierre Mensual / Master Administrativo (Fase 1)
- **Feature estrella.**
- Selector de mes/año → reporte:
  - Proyectos entregados en el mes, con utilidad individual.
  - **Ingresos facturados (CFDI) vs Ingresos en efectivo vs Total** (tres líneas claramente separadas).
  - Egresos por categoría.
  - Utilidad neta consolidada.
  - Comparación con mes anterior y mismo mes año anterior.
- Exportable a PDF y Excel.
- Opción de exportar un reporte "solo para contador" que muestra únicamente ingresos facturados y compras con CFDI recibido.

### Módulo 6 — Command Palette (Fase 1)
- Atajo global cmd+K / ctrl+K.
- Busca: proyectos por código/cliente/nombre, muebles por descripción, clientes, empleados.
- Acciones rápidas: "crear proyecto nuevo", "ir a cierre mensual", "registrar compra".

### Módulo 7 — Empleados (Fase 2)
- CRUD, tarifas, sueldo, color para Gantt. Campos opcionales RFC y NSS.

### Módulo 8 — Tareas + Gantt por operador (Fase 2)
- Crear/asignar tareas.
- Gantt con filas = empleados.
- Drag & drop para mover fechas.
- Estados editables inline.
- **Input de horas liviano:** vista semanal tipo planilla. NO construir cronómetro, NO pedir a operarios que carguen.

### Módulo 9 — Nómina (Fase 2)
- Generar pre-nómina del mes.
- Marcar como pagado.
- Reporte exportable.
- **Nota:** nómina "real" (cálculo de IMSS, ISR, INFONAVIT) es compleja y regulada. En Fase 2 solo es pre-nómina (cuánto se paga bruto). Cálculo fiscal fino queda para integración futura con Aspel NOI u otra herramienta especializada.

### Módulo 10 — Alertas por email (Fase 2)
- Resumen diario al OWNER (ej: 8:00 AM México):
  - Proyectos que entraron en CRÍTICO.
  - Proyectos sin actividad hace X días.
  - Tareas atrasadas.
  - Compras "colgadas" (sin movimiento).
- Resumen semanal más amplio (lunes).
- Solo email (Resend). No Slack, no WhatsApp, no push.
- Configurable por OWNER: opt-out por tipo de alerta, horario, frecuencia.

### Módulo 11 — Timeline de proyecto (Fase 2)
- Tab "Historial" en el detalle de proyecto.
- Feed cronológico de `EventoProyecto`.

### Módulo 12 — RRHH avanzado (Fase 3)
- Vacaciones, ausencias, historial de puestos, prestaciones mexicanas.

---

## 9. Diseño de UI/UX

### Principios rectores

1. **Densidad alta de información**, no minimalismo decorativo.
2. **Edición inline siempre que sea posible.**
3. **Colores consistentes con el Excel actual del cliente.**
4. **Teclado-first en pantallas operativas.** Cmd+K global.
5. **Móvil = responsive del desktop.**
6. **Formato de números mexicano:** miles con coma, decimales con punto, símbolo `$` para MXN. Ejemplo: `$18,562.32`.
7. **Formato de fechas mexicano:** `DD/MM/AAAA` por default.

### Pantallas clave del MVP (Fase 1)

**Dashboard (home)** — 4 zonas:
- KPIs del mes (proyectos activos, entregados, utilidad [OWNER], compras).
- Kanban de proyectos por estado macro.
- Heatmap "Muebles por proceso" con los 4 procesos + "sin iniciar".
- Feed de últimas actualizaciones.

**Listado de Proyectos** — replica visual del Master. DataTable con todas las columnas del Excel. Filtros. Export fiel. Columna opcional "Facturado" con badge.

**Detalle de Proyecto** — pantalla más usada:
- Header con datos + `montoVendido` (solo OWNER) + botón "ajustar monto" que pide motivo + badge "Facturado" / "Sin facturar".
- Tabs: `Muebles` | `Entregas` (si aplica) | `Hoja de Control` | `Compras` | `Finanzas` (OWNER) | `CFDI` (OWNER) | `Historial`.
- Tab CFDI (solo OWNER): toggle "Este proyecto fue facturado", campos opcionales UUID / RFC cliente / uso CFDI / método de pago / fecha facturación. Todo manual en Fase 1 (no se emite, solo se registra).

**Cierre Mensual** — selector de mes + reporte con **tres totales de ingresos claramente diferenciados** (facturado / efectivo / total) + exports. Opción "solo para contador".

**Catálogo de Modelos** — grilla/tabla con búsqueda por línea.

### Pantallas Fase 2

**Gantt por Operador** — filas = empleados, columnas = días, barras = tareas.

**Planilla semanal de horas.**

### Componentes y patrones

- Shadcn `DataTable` para tablas.
- Shadcn `Sheet` (drawer) para edición rápida.
- Shadcn `Dialog` para acciones destructivas.
- Shadcn `Command` para cmd+K.
- Shadcn `Sonner` para toasts.
- `react-hook-form` + zod para forms.
- Colores: `src/lib/status-colors.ts`.

### Lo que NO hacer en UI

- No sobrecargar con iconos.
- No modales anidados.
- No animaciones > 200ms.
- No dark mode en Fase 1.
- No onboarding/tours in-app.
- No construir Gantt desde cero.

---

## 10. Seguridad y RBAC

### Niveles
1. Autenticación: Clerk o Auth.js. No registro público.
2. Autorización: dos roles: `OWNER` y `ENCARGADO`.

### Reglas
- Middleware valida sesión en `(app)/*`.
- Helper `requireRole(role)` en server actions y queries.
- Campos financieros y fiscales filtrados en server según rol. **El RFC del cliente, los datos CFDI, y la distinción facturado/efectivo son OWNER-only.**
- UI oculta condicionalmente como defensa en profundidad.

### Auditoría
- Fase 1: `MuebleProcesoLog`, `ProyectoRevision`, `EventoProyecto`.
- Fase 3: tabla general de auditoría.

### Datos sensibles
- **Datos fiscales (RFC, UUID CFDI) son sensibles** bajo LFPDPPP (Ley Federal de Protección de Datos Personales en Posesión de los Particulares).
- No almacenar datos bancarios.
- Backups automáticos (Neon built-in) o `pg_dump` diario a S3 si self-host.

---

## 11. Roadmap y fases

### Fase 0 — Descubrimiento (1 semana) — BLOQUEANTE
- Reuniones con dueño y socio.
- **Recibir el Excel completo del cliente.**
- **Resolver decisiones abiertas, en particular entregas parciales (sección 16 punto 1).**
- Validar política de facturación CFDI actual (qué % de proyectos, qué clientes, uso CFDI típico).
- Ajustar schema Prisma.
- Entregable: schema validado + wireframes de pantallas clave revisados con cliente.

### Fase 1 — MVP (4-6 semanas)
- Auth + dos roles.
- CRUD Clientes (con RFC opcional), Proyectos (con campos CFDI manuales), Muebles, ModelosMueble.
- Edición inline de procesos técnicos.
- CRUD Compras unificadas con CFDI recibido opcional.
- Dashboard con Kanban y Heatmap.
- Vista Hoja de Control.
- Command Palette (cmd+K).
- **Cierre Mensual con tres totales (facturado / efectivo / total)**, export PDF/Excel.
- Revisiones de monto con motivo.
- (Si se confirma) Entregas parciales.
- Seeds con 2-3 proyectos reales anonimizados.
- Deploy staging + UAT.
- **Objetivo:** reemplazar hojas del Excel del dueño.

### Fase 2 — Operación (4-5 semanas)
- CRUD Empleados (con RFC/NSS opcional).
- Tareas + Gantt por operador.
- Planilla semanal de horas.
- Pre-nómina mensual.
- Costeo real por horas en utilidad.
- Upload de comprobantes.
- Timeline de proyecto.
- Alertas por email (diaria y semanal).

### Fase 3 — Post-validación
- Evaluar según uso real.
- Candidatos: integración con PAC (B4), multi-moneda operativa (B11), OCR, portal operario PWA, integración con Aspel NOI.
- No planificar hasta terminar Fase 2 y tener feedback.

### Cronograma realista (1 dev solo, part-time ~20h/sem)

| Semana | Fase | Entregable |
|---|---|---|
| 1 | 0 | Descubrimiento y schema validado |
| 2-3 | 1 | Auth, CRUD Proyectos/Clientes/Muebles/Modelos, dashboard v1 |
| 4-5 | 1 | Compras, detalle de proyecto, Hoja de Control, command palette |
| 6 | 1 | Cierre mensual (facturado/efectivo/total), exports, revisiones |
| 7 | 1 | UAT + ajustes + deploy |
| 8 | 1 | Capacitación + hotfixes |
| 9-11 | 2 | Empleados, tareas, Gantt, planilla de horas |
| 12 | 2 | Timeline, alertas email |
| 13 | 2 | Pre-nómina + UAT Fase 2 |

Full-time: dividir por 2 aprox.

---

## 12. Backlog documentado (Fase 3+)

Ideas registradas con criterio de activación. **No implementar hasta cumplir el criterio.**

### B1. OCR de tickets y facturas
Carga automática de compras desde foto del ticket o XML del CFDI. La carga automática desde XML CFDI es de hecho más simple y confiable que OCR de fotos — XML es estructurado.

**Criterio de activación:** >50 compras/mes durante 3 meses sostenidos + sistema estable + pedido explícito. Priorizar parser de XML CFDI antes que OCR de imágenes.

### B2. WhatsApp notifications
Alertas por WhatsApp vía Twilio o Meta Business API.

**Criterio de activación:** pedido explícito del cliente con dos casos de uso nombrados.

### B3. Portal del cliente final
Que el cliente de Concavo vea estado de su proyecto.

**Criterio de activación:** 3 clientes distintos lo piden con nombre propio.

### B4. Integración con PAC para emisión automática de CFDI
Integrar con FacturAPI, Facturama, Finkok o similar para emitir CFDI directamente desde el sistema en lugar de registrarlos manualmente.

**Criterio de activación:** >70% de proyectos facturados Y el dueño pide reducir trabajo de facturación manual. Costo del PAC ($0.50-2.00 USD por CFDI emitido) vs tiempo ahorrado.

Cuando se active: FacturAPI es el más dev-friendly (REST API limpia, sandbox completo). Facturama es más establecido. Finkok es barato y confiable. Evaluar al momento de implementar.

### B5. Mobile PWA para operarios
Que operarios marquen avances desde celular.

**Criterio de activación:** WiFi estable en taller + smartphones en operarios + voluntad de capacitación + aprobación del dueño.

### B6. Dashboard de productividad por operador
Horas reales vs estimadas, retrabajos, mueble/hora.

**Criterio de activación:** 6 meses de datos + aprobación del dueño. Sensible laboralmente.

### B7. Predicción de fechas de entrega
Basado en histórico.

**Criterio de activación:** mínimo 12 meses de datos cargados.

### B8. Versionado de precios de materiales
Tracking de precios mes a mes.

**Criterio de activación:** el cliente pide cotizaciones automáticas con precios actuales. **Baja prioridad** en México (inflación controlada vs Argentina).

### B9. Importador masivo de Excel histórico
Migrar años de datos históricos.

**Criterio de activación:** cliente insiste en tener histórico dentro del sistema. Default: empezar limpio.

### B10. Chatbot / consultas en lenguaje natural
"Claude, ¿cuál fue mi utilidad en febrero?"

**Criterio de activación:** NUNCA de forma proactiva. Solo si resuelve consultas que filtros estándar no resuelven.

### B11. Multi-moneda operativa (MXN + USD)
Habilitar operación en USD para clientes de exportación o compras de materiales importados.

**Criterio de activación:** aparece primer cliente/proveedor en USD. El schema ya tiene los campos (`moneda`, `tipoCambio`, tabla `TipoCambio`), solo falta activar UI y lógica de conversión. Fuente del tipo de cambio: Banxico FIX (API pública gratuita) o manual.

### B12. Integración con Aspel NOI o CONTPAQ i Nóminas
Exportar pre-nómina del sistema hacia software especializado en nómina mexicana que maneje IMSS/ISR/INFONAVIT correctamente.

**Criterio de activación:** el dueño decide formalizar nómina completa. Probablemente export CSV a formato estándar antes que integración profunda.

---

## 13. Anti-patrones: lo que NO construir, aunque lo pidan

### AP1. Multi-tenancy "por si después lo vendemos a otras carpinterías"
Solución a medida para Concavo. Multi-tenancy triplica complejidad. Si algún día se transforma en producto, se refactoriza.

### AP2. App nativa iOS/Android
PWA sobre Next.js si hace falta.

### AP3. Optimización automática del Gantt con IA
Con 10 empleados, cualquier algoritmo da peores resultados que el criterio del encargado.

### AP4. GraphQL API pública o tRPC
Server Actions alcanzan.

### AP5. Sistema de permisos granular por campo y por fila
Con 2 roles y 5 usuarios alcanza.

### AP6. Chatbot de IA genérico para consultas
Cada consulta mal respondida mina la confianza.

### AP7. Sistema de comentarios con menciones (@usuario)
Que usen WhatsApp o el campo `comentarios` libre.

### AP8. Dark mode
Nadie lo pidió.

### AP9. Importador genérico "copia-pega cualquier Excel"
Los Excels reales son inconsistentes.

### AP10. Workflow engine configurable
Estados acordados con el cliente. Si quiere cambiar, por release.

### AP11. Event sourcing / CQRS
Overkill. Los logs actuales alcanzan.

### AP12. CRM integrado (embudo de ventas, leads)
Si necesita CRM, que use HubSpot Free.

### AP13. Emitir CFDI desde cero sin PAC
Intentar conectarse directo al SAT sin pasar por un PAC autorizado es ilegal y técnicamente imposible. Cuando se active B4, SIEMPRE vía PAC.

### AP14. Calcular ISR/IMSS/INFONAVIT de nómina desde cero
El cálculo de nómina mexicana tiene reglas regulatorias complejas y cambiantes. No implementar cálculo fiscal fino — solo pre-nómina bruta. Delegar fiscal a Aspel NOI / CONTPAQ i Nóminas / contador.

---

## 14. Convenciones de código

- **TypeScript strict** en todo.
- **Naming:** en español para dominio (Proyecto, Mueble, Entrega, Tarea). En inglés para infraestructura.
- **Server actions:** `src/server/actions/<modulo>.ts`. Validar input con zod, chequear permisos al inicio.
- **Queries de lectura:** `src/server/queries/<modulo>.ts`. Separadas de actions.
- **Zod schemas:** `src/schemas/<entidad>.ts`. Compartidos.
- **Componentes:** `PascalCase.tsx`. Hooks: `useCamelCase.ts`. Utils: `kebab-case.ts`.
- **Commits:** cortos, en español. `feat: agrega kanban`.
- **Branching:** `main` = producción. `dev` = staging.
- **Formato de números/fechas:** `src/lib/format.ts` con helpers `formatMXN(monto)`, `formatDate(fecha, 'DD/MM/YYYY')`. Usar siempre.

---

## 15. Testing

Pragmático.

- **Obligatorio:** tests unitarios para cálculos financieros (utilidad, prorrateo, cierre — especialmente el desglose facturado/efectivo) y cálculos de avance. Vitest.
- **Recomendado:** integración para server actions críticas.
- **Opcional en MVP:** E2E con Playwright para 3 flujos.
- **No:** tests de UI exhaustivos, snapshots.

---

## 16. Decisiones abiertas — resolver en Fase 0

### Bloqueantes — NO arrancar Fase 1 sin resolver

**1. Entregas parciales (CRÍTICO)**
Evidencia: filas como `SYG - ENTREGA 6 ABRIL (7)`, `SYG - ENTREGA 13 ABRIL (9)` en la Hoja de Control.

Preguntas:
- ¿Es un solo proyecto con múltiples entregas, o múltiples proyectos con código común?
- Si son entregas del mismo proyecto, ¿cada entrega tiene su propia fecha de compromiso, subconjunto de muebles, estado?
- ¿Se cobra por entrega o al cierre del proyecto?
- ¿Se factura CFDI por cada entrega parcial o una vez al final?
- ¿La utilidad se calcula por entrega o por proyecto completo?

**2. `RETRABAJO` vs `RE_TRABAJO`**
¿Son estados distintos o sinónimos? Si son sinónimos, consolidar.

### Ajustes — pueden resolverse en paralelo con Fase 1

3. **Prorrateo de gastos fijos:** ¿por cantidad de proyectos, por monto vendido, por días activos?
4. **Anticipos:** ¿se descuentan del monto vendido o se registran aparte? En México los anticipos generalmente requieren un CFDI de anticipo específico.
5. **IVA:** ¿los montos del Master son con o sin IVA (16%)? ¿Se muestra desglose?
6. **CFDI:** ¿qué uso CFDI típico usan los clientes de Concavo? (G03 Gastos en general, P01 Por definir, I08 Construcciones, etc.). ¿Cuáles son los RFCs recurrentes?
7. **Terceros:** ¿guardar proveedor, costo y fecha de entrega por mueble? ¿O solo el tipo?
8. **`TBD` en montos:** ¿campo nullable, estado `A_COTIZAR`, placeholder?
9. **Estados adicionales del Excel:** verificar que la lista de `EstadoProyecto` cubre todo.
10. **HC (Hoja de Control) flag:** ¿solo boolean o hay un documento/PDF asociado?
11. **Multi-usuario simultáneo:** ¿implementar optimistic locking con `updatedAt`?
12. **Avance % del mueble:** validar porcentajes propuestos (sección 7).
13. **Maderas:** ¿lista fija o libre con autocomplete?
14. **Colores de proyecto:** ¿asignados manualmente o generados automáticamente?
15. **Catálogo de modelos:** ¿el cliente quiere un catálogo formal o prefiere copiar muebles proyecto a proyecto?
16. **Migración de datos históricos:** ¿empezar limpio o migrar el Excel actual?
17. **Plantilla del export Excel:** conseguir el archivo real para que el export sea indistinguible del Master.
18. **Política de facturación:** ¿hay criterio para decidir qué proyectos se facturan y cuáles no? ¿Es por tipo de cliente, por monto, por pedido del cliente final?
19. **Días festivos mexicanos:** ¿el Gantt debe marcar días no laborables (festivos oficiales + Jalisco)? ¿Domingos se trabajan?

---

## 17. Riesgos conocidos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cliente cambia criterio en mitad del MVP | Alto | Fase 0 rigurosa. Demos semanales. |
| Entregas parciales mal modeladas | Crítico | Bloqueante Fase 0. No avanzar sin confirmación. |
| Cálculo de utilidad no coincide con el del cliente | Crítico | Documentar fórmula exacta. Mostrar breakdown en UI. Tests unitarios. |
| Totales facturado/efectivo mal calculados | Crítico | Tests unitarios específicos. UI que muestre los tres totales siempre. Contador debe validar. |
| Usuarios no abandonan el Excel | Crítico | UX *mejor* que Excel. Export fiel. Command palette. |
| Performance con volumen creciente | Bajo | Indexes definidos. |
| Dev solo + imprevisto | Alto | Documentación completa, código sin magia. |
| Gantt custom se complica | Medio | Biblioteca existente obligatoria. |
| Alertas email spam | Medio | Límites + opt-out. |
| Revisiones de monto mal usadas | Medio | UI obliga a escribir motivo. |
| Problemas de compliance fiscal SAT | Alto | En Fase 1 NO se emite CFDI. Solo se registra. Integración PAC solo en B4 cuando haya criterio claro. |
| LFPDPPP (protección de datos personales) | Medio | Datos fiscales filtrados por rol. Considerar aviso de privacidad si hay crecimiento. |

---

## 18. Variables de entorno

```
DATABASE_URL=                    # Postgres (Neon o local)
DIRECT_URL=                      # Neon: migraciones
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
BLOB_READ_WRITE_TOKEN=           # Fase 2
RESEND_API_KEY=                  # Fase 2, alertas email
TZ=America/Mexico_City
NEXT_PUBLIC_LOCALE=es-MX
NEXT_PUBLIC_CURRENCY=MXN
```

---

## 19. Para Claude Code / Antigravity (y colaboradores IA)

Leer esta sección antes de cualquier modificación:

- **Este documento manda.** Si una instrucción contradice esto, preguntar antes de ejecutar.
- **Contexto regional: México, Guadalajara/Jalisco.** Timezone `America/Mexico_City`. Moneda default MXN. Fechas `DD/MM/AAAA`. Números con coma decimal anglosajona (`$18,562.32`).
- **Los 4 procesos técnicos (HABILITADO → ARMADO → PULIDO → LACA) son inamovibles.** No agregar, renombrar, reordenar.
- **El Gantt es por operador.** Filas = `Empleado`, barras = `Tarea`.
- **No romper separación OWNER/ENCARGADO.** Campos fiscales (RFC, CFDI, facturado) y financieros son OWNER-only.
- **Nunca usar floats para dinero.** Siempre `Decimal` de Prisma.
- **En el cierre mensual, mostrar SIEMPRE tres totales: facturado, efectivo, total.** No consolidar sin opción de ver separado.
- **En Fase 1 NO se emite CFDI desde el sistema.** Solo se registran datos de CFDIs emitidos por fuera. Integración con PAC es backlog (B4).
- **Cambios de `montoVendido` crean `ProyectoRevision`.** No actualizar sin registro.
- **No inventar estados.** Los enums son cerrados y validados con el cliente.
- **No escribir SQL raw** salvo queries agregadas del cierre mensual.
- **Fechas:** siempre con timezone `America/Mexico_City` explícito.
- **Testing:** cálculos financieros y de avance siempre con tests unitarios.
- **Antes de agregar feature que no esté acá, leer secciones 12 (backlog) y 13 (anti-patrones).** Si entra en 13, rechazar. Si entra en 12, respetar criterio de activación.
- **Vocabulario del cliente es oficial.** "Proyecto", "mueble", "entrega", "operador", "proceso", "hoja de control", "master", "recámara", "CFDI". No sinónimos en inglés ni hispanismos de otras regiones (no "piezas", no "departamento" por "dormitorio").
- **Un solo repo, un solo lenguaje.** No agregar servicios Python, Go, u otros sin discusión.

---

## 20. Glosario mínimo

- **WIP:** trabajo en curso. Muebles con `procesoActual` no null que no llegaron a LACA + OK.
- **Hoja de Control (HC):** vista con desglose de proyecto por operador + proceso técnico.
- **Master:** listado maestro de proyectos.
- **Master Administrativo:** cierre financiero mensual.
- **Los 4 procesos:** HABILITADO, ARMADO, PULIDO, LACA. En ese orden.
- **Operador:** empleado del taller. Sin login.
- **Despiece:** etapa inicial de producción. Estado de **proyecto**, no de mueble.
- **3ROS (terceros):** proveedores externos (tapicería, piel, accesorios, herrería).
- **P.O.:** purchase order del cliente de Concavo.
- **HC (columna Master):** flag sí/no. ¿Ya tiene hoja de control armada?
- **Entrega:** sub-división de un proyecto con fecha y muebles propios. A confirmar en Fase 0.
- **Modelo de mueble:** plantilla reutilizable en el catálogo.
- **Revisión de monto:** cambio registrado en `montoVendido` con motivo y autor.
- **Evento de proyecto:** entrada del timeline.
- **CFDI:** Comprobante Fiscal Digital por Internet. Factura electrónica mexicana. Versión actual 4.0.
- **SAT:** Servicio de Administración Tributaria. Autoridad fiscal de México.
- **PAC:** Proveedor Autorizado de Certificación. Intermediario obligatorio entre contribuyente y SAT para emitir CFDI. Ejemplos: FacturAPI, Facturama, Finkok.
- **RFC:** Registro Federal de Contribuyentes. Identificador fiscal en México (persona física o moral).
- **Uso CFDI:** clave SAT que indica para qué se usará la factura. Ej: G03 "Gastos en general", P01 "Por definir", I08 "Construcciones".
- **Método de pago:** PUE (Una sola Exhibición) o PPD (Parcialidades o Diferido).
- **Forma de pago:** clave SAT de cómo se pagó. 01 efectivo, 03 transferencia, 04 tarjeta de crédito, etc.
- **IVA:** Impuesto al Valor Agregado. 16% estándar en México, 8% en zona fronteriza.
- **IMSS:** Instituto Mexicano del Seguro Social. Seguridad social.
- **INFONAVIT:** Instituto del Fondo Nacional de la Vivienda para los Trabajadores. Retención para vivienda.
- **ISR:** Impuesto Sobre la Renta.
- **NSS:** Número de Seguridad Social.
- **LFPDPPP:** Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
- **Recámara:** dormitorio (uso mexicano, aparece en descripciones de muebles del cliente).
- **Banxico FIX:** tipo de cambio oficial del Banco de México. Fuente recomendada para conversión USD/MXN.
