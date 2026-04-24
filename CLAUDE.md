# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# CLAUDE.md — Concavo Micro-ERP

> Documento de contexto maestro para el proyecto. Leer completo antes de escribir código.
> Este archivo es la fuente de verdad. Si algo en el código contradice este documento, este documento manda (y se actualiza después).
> Versión: 7. Fase 1 completa. Ver sección 20 para estado actual de módulos.

---

## 0. Comandos de desarrollo

```bash
# Desarrollo
npm run dev          # Next.js dev server con Turbopack

# Build y lint
npm run build        # Producción
npm run lint         # ESLint
npx tsc --noEmit     # Type check sin emitir (usar para verificar errores TS)

# Base de datos (Neon PostgreSQL)
npm run db:generate  # prisma generate (tras cambios al schema)
npm run db:migrate   # prisma migrate dev (crea y aplica migración)
npm run db:push      # prisma db push (sin crear archivo de migración)
npm run db:seed      # tsx prisma/seed.ts
npm run db:studio    # Prisma Studio UI

# Tests (Vitest)
npm test             # vitest run (una pasada)
npm run test:watch   # vitest (modo watch)
```

**Prisma + `.env.local`:** Prisma no lee `.env.local` automáticamente. Si las variables de entorno están en `.env.local`, pasar `DATABASE_URL` inline:
```bash
DATABASE_URL="postgresql://..." npx prisma migrate dev
```

Para `migrate reset` desde un agente IA, también se requiere:
```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="<mensaje del usuario>" DATABASE_URL="..." npx prisma migrate reset
```

---

## 1. Resumen del proyecto

**Qué es:** un Micro-ERP / EPM a medida para **Concavo**, una carpintería industrial de ~10 empleados ubicada en **Guadalajara, Jalisco, México**. Reemplaza el ecosistema actual basado en archivos Excel (Master, Hojas de Control por cliente, Producción, Compras, Insumos, Gantt vivo, Master Administrativo) por una aplicación web unificada.

**Por qué existe:** el cliente empezó a organizar con Excels cuando se asoció con el dueño original. Al crecer el volumen, los Excels dejaron de ser viables. Evaluó Odoo (no modela producción a medida) y Global Shop Solutions (USD 42.850 + mantenimiento, inviable para pyme).

**Qué NO es:** no es un clon de Global Shop Solutions. La referencia de GSS sirve solo para vocabulario de industria. El producto que construimos es deliberadamente más chico y adaptado al flujo real de Concavo.

**Ventaja competitiva:** simplicidad, costo cero de licencia, modelo de datos que refleja exactamente cómo Concavo trabaja hoy.

**Contexto regional:** México, moneda principal MXN, timezone `America/Mexico_City` (Jalisco no observa horario de verano desde 2022). Régimen fiscal SAT / CFDI 4.0. IVA estándar 16%.

**Entorno de desarrollo:** Google Antigravity + extensión de Claude. Ver sección 20 para instrucciones específicas al agente IA.

---

## 2. Análisis competitivo en México

### Global Shop Solutions (GSS)
Tiene oficinas en Monterrey y Querétaro. El cliente lo evaluó y rechazó por precio. Implementación de 4 meses, USD 42.850 + USD 3.490/año de mantenimiento. Requiere hardware (recolectores, kioscos, scanners). Orientado a manufactura en serie. Nuestra ventaja: arranca en días, cero hardware, UI moderna, adaptado a carpintería a medida.

### Odoo Manufacturing
Modela producción en serie con BOMs fijos. Un taller de muebles a medida no tiene BOMs fijos — cada proyecto es único. Nuestra ventaja: modelo de datos para proyectos únicos.

### ERPs mexicanos pyme (Aspel, Contpaq, Bind ERP, Microsip)
Muy extendidos. Fuertes en contabilidad fiscal e integración SAT/CFDI. Débiles en operación: no modelan WIP, no tienen Gantt, no tienen control de procesos de taller. El dueño termina usando Excel igual y el ERP solo sirve para facturar. Nuestra ventaja: somos operativos primero, con ganchos fiscales vía PAC externo cuando haga falta.

### Monday / ClickUp / Asana
UX moderna, pero sin finanzas. No calculan utilidad por proyecto. Nuestra ventaja: el Master Administrativo integrado es el corazón del producto.

### Conclusión
Nuestro espacio es el producto chico que modela el dominio real de una carpintería a medida mexicana, con finanzas integradas (facturado + efectivo), a un precio de desarrollo a medida.

---

## 3. Fuente de datos actual del cliente

Archivos Excel reales que el cliente usa hoy. Revisados en detalle. La lógica del sistema debe poder replicar y superar todos estos archivos.

### 3.1 Master de Proyectos (MA_STER_2026.xlsx)

Hoja única "PROYECTOS 2026". Columnas:
```
#PROYECTO | CLIENTE | QTY. ITEMS | P.O. | FECHA P.O. | FECHA COMPROMISO |
FECHA ENTREGA | ESTATUS | EN TIEMPO | HC | COMENTARIOS
```

Códigos de proyecto: correlativo con padding (`001`, `017`, `058`, `069`). Formato libre — no tienen significado, solo ubicación.

Clientes observados en 2026: TRRA, AAGNES, SYG, RTS, RDN, PAOLA VALDÉS, ROBERTO IBERRI, RAFIC, AMINA (PMP INT.), MONOLITO, ROMO, JESSEVE, TAYLORS, DENISSE LEROY, ROSE SANCHEZ, DANI GONVEL, DAVID ANAYA, MG INTERIORISMO, ARAUJO GALVAN, SUÉTER, DAVID MAPY.

Valores observados en ESTATUS (del Master): `FRABRICACIÓN`, `ENTREGADO`, `EN ESPERA`, `PAUSA`, `MATERIAL EN PISO`, `LISTA DE COMPRAS`, `DESPIECE`, `CANCELADO`.

Valores observados en EN TIEMPO: `EN TIEMPO`, `ATRASADO`, `CRÍTICO`, `PRECAUCIÓN`.

HC: flag SÍ/NO. Indica si el proyecto ya tiene hoja de control detallada armada.

Hay una columna extra al final del Master con un valor tipo `HABILITADO` que parece ser el último proceso en que se vio el proyecto (no el estado macro). Validar con cliente si este campo se mantiene o es redundante con la Hoja de Control.

### 3.2 Hoja de Control por cliente (HOJA_DE_CONTROL_-__SYG_-_2026_.xlsx, _TRRA_-_2026_.xlsx)

Archivo separado **por cliente importante** (SYG, TRRA, etc.). Tres hojas dentro:

**Hoja 1 — ANTICIPOS Y DEUDA**:
```
ORDENES DE COMPRA | TOTAL ÓRDEN | FECHA ANTICIPO | ANTICIPO |
% ANTICIPO | LIQUIDACIÓN | FECHA LIQUIDACIÓN | COMENTARIOS
```
Confirma que **anticipos y liquidaciones se trackean por proyecto con fecha propia**.

**Hoja 2 — ITEMS** (el detalle de muebles):
```
No. | ORDEN | ITEM | ESTRUCTURA | QTY. | TOTAL | FECHA P/O |
FECHA COMPROMISO | MADERA | 3ROS | ESTÁTUS | PROCESO | COMENTARIOS
```
- `ESTRUCTURA`: `MDF`, `PTR` (placa, término carpintero), `N/A`.
- `ESTÁTUS` (del item): `ESPERA`, `FABRICACIÓN`, `REPROCESO`, `PAUSA`, `CANCELADO`, `ENTREGADO`.
- `PROCESO`: los 9 procesos técnicos (ver hoja DATOS abajo).

**Hoja 3 — DATOS** (contiene los enums canónicos):
```
ESTATUS:          ESPERA, FABRICACIÓN, REPROCESO, PAUSA, CANCELADO, ENTREGADO
PROCESO:          HABILITADO, ARMADO, PULIDO, LACA, EXTERNO,
                  COMPLEMENTOS, EMPAQUE, LISTO PARA ENTREGA, ENTREGADO
```

**Importante:** esta hoja DATOS es la fuente de verdad para los enums del sistema. No inventar estados. **"REPROCESO" es el término oficial** — no existe "RETRABAJO" ni "RE_TRABAJO" en el Excel real (fue confusión derivada del Gantt vivo que usa otros labels).

### 3.3 Gantt vivo (PLANEACIO_N_SEMANAL_GANTT_VIVO_1__ENE2026_.xlsx)

Calendario semanal por operador. Filas agrupadas por proceso técnico, dentro por operador. Cada fila es un trabajo asignado con su estado (`OK`, `EN PROCESO`, número de cantidad, o texto libre como `EMPEZAR CON 1703`). Los colores identifican el proyecto.

Estructura:
- Sección HABILITADO → operadores PEPE, MARISOL
- Sección ARMADO → operadores CRISTIAN, BETO, CHAVA, RAMÓN (y Salvador/SV aparece como abreviatura)
- Sección PULIDO → operadores SULI, JONA
- Sección LACA → operador CITLA

Cada operador tiene celdas por semana (LUN-SÁB) donde se marca qué proyecto/mueble está trabajando y con qué estado.

Esto confirma que **hay especialización por operador**: un operador trabaja solo en un tipo de proceso (con excepciones — los armadores a veces se habilitan a sí mismos). Es información relevante para asignar tareas automáticamente.

### 3.4 Producción (PRODUCCIO_N_2026.xlsx)

**Archivo crítico para el cálculo de utilidad.** Captura horas trabajadas por empleado por semana por mueble.

Estructura (una hoja por mes):
```
ÁREA/OPERADOR | POR PROYECTO Y/O MUEBLE | QTY |
SEMANA N: T.O. | T.E. | SEMANA N+1: T.O. | T.E. | ...
```

- `T.O.` = Tiempo Ordinario (horas normales)
- `T.E.` = Tiempo Extra (horas extras, se pagan al doble)

Cada fila: un empleado × un proyecto/mueble × una semana del mes.

Esto alimenta directamente el cálculo de `COSTO MANO DE OBRA DIRECTA` del Master Administrativo (ver 3.7). **Sin este archivo, no hay utilidad calculable.**

### 3.5 Compras por proyecto (1_0_COMPRAS_POR_PROYECTO_2026.xlsx)

Hoja única con todas las compras vinculadas a proyecto. Columnas:
```
Categoría | Cliente | Proyecto | ITEM | Descripción | Proveedor |
ID de Factura | QTY. | Unidad | Importe | IVA | Total | Fecha |
Tipo de Compra | Método
```

- `Categoría` (enum): `MDF`, `SÓLIDO`, `COMPLEMENTOS`, `ENVÍOS`.
- `Unidad` (enum): `HOJA`, `PIE TABLA`, `PIEZA`, `METRO`, `PEDIDO`, `ENVÍO`, `KILOGRAMO`, `LITRO`, `PAQUETE`, `JUEGO`, `GALON`, `CAJA`, `CM`, `ROLLO`, `RECOLECCIÓN`, `GRUPO`.
- `Tipo de Compra` (enum): `INICIAL`, `ADICIONAL`.
- `Método` (string libre, pero con valores frecuentes): `TC BANORTE`, `TRANS. BANORTE`, `TD BANORTE`, `EFECTIVO`, `TC RODRIGO`, `TD RODRIGO`, `TRANS. RODRIGO`, `TC MERCADO PAGO`, `TRANS. MERCADO PAGO`.
- `IVA` separado del importe — permite reporte con o sin IVA.
- Existe cliente/proyecto `POR ASIGNAR` / `POR ASIGNAR` para compras hechas sin asignar todavía a un proyecto específico.

### 3.6 Insumos generales (2_0_INSUMOS_GENERALES_2026.xlsx)

Una hoja por mes. Columnas:
```
DESCRIPCIÓN | PROVEEDOR | FACTURA | QTY. | UNIDAD |
IMPORTE | IVA | TOTAL | FECHA | MÉTODO
```

No tienen cliente/proyecto asociado. Son insumos de taller que se prorratean en el mes. Categorías implícitas por tipo de insumo: embalaje, limpieza, herramientas, consumibles de laca/pulido, papelería, etc.

### 3.7 Master Administrativo (0_0_MA_STER_ADMINISTRACIO_N_2025-2026.xlsx)

**Archivo más importante del cliente.** Una hoja por mes (SEPTIEMBRE25, OCTUBRE25... etc). Contiene:

**Cabecera del mes:**
```
PROYECTOS ENTREGADOS EN EL MES:
  FECHA ENTREGA | CLIENTE | ITEMS | PROYECTO | TOTAL | ADELANTO |
  LIQUIDACIÓN | UTILIDAD DE PROYECTO | UTILIDAD SOBRE VENTA |
  UTILIDAD SOBRE COSTO | ESTATUS DE LIQUIDACIÓN | MÉTODO DE PAGO

BANCOS: saldo inicial, saldo final, débito, crédito
RAYA MANO DE OBRA DIRECTA: por semana del mes
GASTOS FIJOS: renta, luz, agua, mantenimiento, internet, gasolina,
  IMSS, contador, impuestos, gastos varios, maquinaria y equipo
PROYECTOS INGRESADOS EN EL MES: lista
```

**Desglose por proyecto entregado (uno por proyecto):**
```
PROYECTO, CLIENTE, FECHA DE P.O., FECHA DE ENTREGA
MONTO DE COTIZACIÓN
ANTICIPO
LIQUIDACIÓN
MATERIAL DIRECTO PARA PROYECTO       (suma de compras del proyecto)
PROPORCIONAL DE INSUMOS               (insumos del mes / qty items del mes) × qty items del proyecto
PROPORCIONAL DE M.O. INDIRECTA        (M.O.I. del mes / qty items del mes) × qty items del proyecto

Para cada proceso, COSTO x HRA × HORAS:
  M.O. HABILITADO        66.67/hr
  M.O. ARMADO CR         73.33/hr   (Cristian)
  M.O. ARMADO BT         77.78/hr   (Beto)
  M.O. ARMADO SV         73.33/hr   (Chava — abreviado SV)
  M.O. ARMADO RM         88.89/hr   (Ramón)
  M.O. PULIDO            60.00/hr
  M.O. LACA              73.33/hr

  H.E. HABILITADO       133.34/hr  (doble de M.O. — ley laboral mexicana)
  H.E. ARMADO CR        146.66/hr
  H.E. ARMADO BT        155.56/hr
  H.E. ARMADO SV        146.66/hr
  H.E. ARMADO RM        177.78/hr
  H.E. PULIDO           120.00/hr
  H.E. LACA             146.66/hr

COSTO MANO DE OBRA DIRECTA PARA PROYECTO = suma de (horas × tarifa) por proceso
COSTO DE PROYECTO = MATERIAL DIRECTO + PROPORCIONAL INSUMOS + PROPORCIONAL M.O.I. + COSTO M.O. DIRECTA
UTILIDAD DE PROYECTO = MONTO DE COTIZACIÓN − COSTO DE PROYECTO
UTILIDAD SOBRE VENTA = UTILIDAD / MONTO DE COTIZACIÓN
UTILIDAD SOBRE COSTO = UTILIDAD / COSTO DE PROYECTO
```

Ejemplos de proyectos reales cerrados en septiembre 2025 (para testing):
- Proyecto 722 (RTS): monto 159384, costo 65468.41, utilidad 93915.58 (58.9% sobre venta)
- Proyecto EXPRESS (SYG): monto 25800, costo 10845.55, utilidad 14954.45 (57.9%)
- Proyecto 1541 (TRRA): monto 18908, costo 2528.94, utilidad 16379.05 (86.6%)

Estos tres proyectos cerrados son **casos de prueba mandatorios**: los tests unitarios del cálculo de utilidad deben reproducir estos números exactamente.

### Implicancias clave para el modelo

- Los **procesos técnicos son 9** (no 4 como se asumió en versiones anteriores).
- Los **estados de ítem son 6** — `REPROCESO` es el término oficial (no `RETRABAJO`).
- El **prorrateo** se hace por `qty items` del mes, no por cantidad de proyectos.
- Las **tarifas por hora varían por empleado**, no son globales.
- **T.O. y T.E. se trackean separados** y la tarifa de T.E. es exactamente 2× la de T.O.
- **Anticipos son entidad** con fecha propia, no un campo numérico en el proyecto.
- **Compras tienen Tipo** (INICIAL / ADICIONAL) y **Categoría** (MDF / SÓLIDO / COMPLEMENTOS / ENVÍOS).
- **EXTERNO es un estado de proceso**, no un flag. Cuando un mueble va con tercero (tapicería, piel, herrería, mármol), pasa a `EXTERNO` y después vuelve al flujo normal.

---

## 4. Usuarios y roles

| Rol | Quiénes | Qué ven y hacen |
|---|---|---|
| `OWNER` | Dueño y socio (2 personas) | Todo. Único que ve finanzas, utilidad, nómina, sueldos, montos vendidos, distinción facturado/efectivo. |
| `ENCARGADO` | Encargado de compras (1 persona — también apoya en diseño) | Operación: proyectos, muebles, procesos, compras (cargar sí, totales no), asignación de tareas. **No ve** finanzas, montos, utilidades, nómina, sueldos. |

**Total: 3 usuarios en Fase 1.** No más.

Los operadores del taller (PEPE, MARISOL, CRISTIAN, BETO, CHAVA, RAMÓN, SULI, JONA, CITLA, y los que se sumen) son **empleados** — entidad `Empleado`. **No tienen login.** Los datos se capturan por parte del dueño o del encargado.

---

## 5. Stack técnico

Decisión guiada por: **un solo dev programa todo**. Cada pieza extra del stack multiplica costo de mantenimiento.

### Stack elegido

- **Frontend + Backend:** Next.js 15 (App Router), Server Actions para mutaciones, Route Handlers cuando se necesite endpoint estable. TypeScript strict.
- **UI:** Tailwind CSS + shadcn/ui.
- **DB:** PostgreSQL.
- **ORM:** Prisma.
- **Auth:** Clerk o Auth.js (usar lo que ya esté en el repo).
- **Validación:** Zod, shared entre cliente y server.
- **Forms:** react-hook-form + zod resolver.
- **Tablas:** shadcn `DataTable` sobre TanStack Table.
- **Command palette:** shadcn `Command`.
- **Fechas:** date-fns + date-fns-tz (timezone `America/Mexico_City`).
- **Dinero:** Prisma `Decimal`. Nunca floats. En frontend, `decimal.js` o strings controlados.
- **Charts:** `recharts` (KPIs, gráficos de estados, gráficos de procesos en dashboard).
- **Gantt:** `frappe-gantt`. CSS en `src/styles/frappe-gantt.css` — importar en el componente que lo usa. No construir desde cero.
- **Exportes:** `exceljs` (con fórmulas en celdas, no solo valores), `@react-pdf/renderer` o `pdf-lib`.
- **Email:** Resend (Fase 2).
- **Deploy:** Vercel + Neon (Postgres serverless).
- **Storage:** Vercel Blob o UploadThing (Fase 2+).

### Stack rechazado
- FastAPI / Python backend separado.
- App nativa iOS/Android.
- Odoo customizado.
- GraphQL / tRPC.
- Microservicios.

### Estructura de carpetas

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
│   │   │   ├── insumos/
│   │   │   ├── gantt/
│   │   │   ├── produccion/          # captura T.O./T.E. semanal por empleado
│   │   │   ├── empleados/
│   │   │   ├── cierre/              # master administrativo mensual
│   │   │   ├── nomina/
│   │   │   └── rrhh/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── features/
│   │   └── command-palette/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── money.ts
│   │   ├── dates.ts                 # timezone wrappers
│   │   ├── format.ts                # formatMXN, formatDate DD/MM/AAAA
│   │   └── status-colors.ts
│   ├── server/
│   │   ├── actions/
│   │   ├── queries/
│   │   ├── calculations/            # fórmulas de utilidad, prorrateo
│   │   └── jobs/                    # emails (Fase 2)
│   ├── schemas/
│   └── exports/
│       └── templates/               # plantillas Excel fieles al Master Administrativo
└── docs/
    ├── excel-original/              # copias de los Excels reales
    └── decisiones/                  # ADRs
```

---

## 6. Modelo de dominio

Esta sección es **normativa**. Vocabulario oficial. No inventar sinónimos.

### Entidades principales

**Proyecto** — unidad de venta. Un proyecto = un cliente + una P.O. + un monto + un conjunto de muebles. Tiene estado macro, semáforo, datos CFDI opcionales. **No se modelan entregas parciales como sub-entidad**: el cliente divide las entregas como proyectos separados (confirmado en respuestas).

**Mueble** (también llamado "ítem") — unidad de producción dentro de un proyecto. Tiene proceso técnico actual, estado de ítem, madera, estructura (MDF/PTR/N/A), terceros requeridos, monto (si el proyecto cotiza ítem por ítem). **Acá vive el WIP real.**

**Cliente** — quien contrata el proyecto. Puede ser persona física o moral. RFC opcional (algunos pagan efectivo sin factura).

**Empleado** (operador) — quien ejecuta trabajo en el taller. Tiene **especialidad** (qué proceso hace normalmente) y **tarifa por hora individual** (T.O. y T.E.). No tiene login.

**Tarea** — asignación de trabajo: mueble + empleado + proceso + fechas planeadas. Alimenta el Gantt.

**RegistroProduccion** — captura semanal de horas trabajadas por empleado × mueble × proceso, separando T.O. y T.E. Alimenta cálculo de mano de obra directa. **Entidad nueva y crítica** (equivalente al archivo Producción del cliente).

**Compra** — egreso de dinero con categoría (MDF/SÓLIDO/COMPLEMENTOS/ENVÍOS) y tipo (INICIAL/ADICIONAL). Puede estar asociada a un proyecto/mueble o ser `POR ASIGNAR`.

**Insumo** — insumo general del taller, no asignable a proyecto puntual. Se prorratea en el cierre mensual.

**GastoFijo** — gastos mensuales fijos (renta, luz, agua, mantenimiento, internet, IMSS, contador, etc.). Por mes.

**Anticipo** — pago parcial recibido antes de la entrega. Tiene fecha, monto, porcentaje, método. Un proyecto puede tener N anticipos.

**PagoProyecto** — registra la liquidación final o los pagos parciales posteriores al anticipo. Estado `PENDIENTE` / `LIQUIDADO`.

**PagoNomina** — registro semanal o mensual de sueldo a cada empleado. Semanal porque el cliente paga sueldo fijo semanal.

**ProyectoRevision** — histórico de cambios del monto vendido o de ítems agregados después.

**EventoProyecto** — timeline de eventos del proyecto.

**MasterAdministrativoMes** (entidad cacheada, ver sección 9) — representa el cierre mensual cuando se "cierra" formalmente. Los cálculos son on-demand pero una vez que el dueño marca el mes como cerrado, se guarda un snapshot.

### Los 9 procesos técnicos

Orden canónico (de la hoja DATOS del cliente):

```
1. HABILITADO            # materiales cortados/preparados
2. ARMADO                # estructura ensamblada
3. PULIDO                # lijado, preparado para acabado
4. LACA                  # laca aplicada
5. EXTERNO               # con tercero (tapicería, piel, herrería, mármol)
6. COMPLEMENTOS          # herrajes, accesorios (opcional por mueble)
7. EMPAQUE               # empacado (opcional, a veces se entrega sin empacar si es ZMG)
8. LISTO PARA ENTREGA    # esperando despacho/entrega
9. ENTREGADO             # entregado al cliente final
```

**Reglas:**
- El flujo base es secuencial: un mueble avanza típicamente 1→2→3→4→(5 si aplica)→(6 si aplica)→(7 si aplica)→8→9.
- `EXTERNO` es un desvío: un mueble puede ir a EXTERNO antes o después de LACA (ej: tapicería después de armado y pintura).
- `COMPLEMENTOS`, `EMPAQUE` son **opcionales por mueble** — depende de si ese mueble específico los requiere.
- Puede retroceder (reproceso): un mueble en PULIDO puede volver a ARMADO si se detecta un problema.
- Un mueble recién creado sin trabajo: `procesoActual = null` (o estado `ESPERA`).
- Un mueble pasa a `ENTREGADO` solo cuando el proyecto se entrega — no individualmente.

### Los 6 estados de ítem

```
ESPERA          # no iniciado
FABRICACIÓN     # en alguno de los procesos técnicos
REPROCESO       # detectado problema, rehaciendo trabajo (NO es RETRABAJO — REPROCESO es el oficial)
PAUSA           # suspendido temporalmente
CANCELADO       # baja definitiva
ENTREGADO       # entregado al cliente final
```

### Los 11 estados del proyecto (macro)

Derivados del Master observado:

```
COTIZACION          # fase comercial, no confirmado
EN_ESPERA           # confirmado pero sin poder arrancar (no hay plano, no anticipo, etc.)
EN_COMPRAS          # comprando materiales
LISTA_DE_COMPRAS    # compras listas, esperando material
MATERIAL_EN_PISO    # material recibido
DESPIECE            # cortes iniciales (proyectos grandes)
FABRICACION         # en producción (ojo: en el Excel real aparece como "FRABRICACIÓN" — typo del cliente)
POR_EMPACAR         # muebles terminados, listo para entrega
ENTREGADO           # cerrado
PAUSA               # suspendido
CANCELADO           # baja definitiva
```

Transiciones libres. El sistema no impone máquina de estados rígida.

**Nota al dev:** en la UI, el enum interno es `FABRICACION` (correcto) pero en el export a Excel mostrar `FABRICACIÓN` con acento (si el cliente quiere mantener el typo `FRABRICACIÓN` pedirlo explícito — mi recomendación es corregirlo).

### Semáforo

```
EN_TIEMPO
PRECAUCION
ATRASADO
CRITICO
PAUSA
```

Calculado por defecto según `fechaCompromiso`, overridable manualmente.

### Terceros (3ROS)

Array de enum:
```
TAPICERIA
PIEL
ACCESORIOS
HERRERIA
MARMOL        # nuevo, observado en Master Administrativo ("MÁRMOL 17000")
ESPEJO        # observado ("ESPEJO 600", "ESPEJO 2500")
TEJIDO        # observado ("TEJIDO BANCOS 2400", "TEJIDO SILLAS 4800")
OTROS         # fallback
```

**Nota:** en el Master Administrativo los costos de terceros aparecen como líneas separadas dentro del desglose del proyecto. Modelar como `CostoExterno` (sub-entidad de mueble) con monto y proveedor. El tracking de costo por tercero es **crítico** según el cliente ("me interesa trackear ese costo, demasiado").

### Maderas

String libre con autocomplete basado en histórico. Valores observados: `ROSAMORADA`, `PAROTA`, `NOGAL`, `TECA`, `ENCINO`, `ENCINO BLANCO`, `TZALAM`.

### Estructura del mueble

Enum:
```
MDF
PTR
N/A
```

### Categorías de compra

Enum:
```
MDF
SOLIDO        # (sin acento en código, con acento "SÓLIDO" en UI)
COMPLEMENTOS
ENVIOS        # (sin tilde en código, "ENVÍOS" en UI)
```

### Tipos de compra

Enum:
```
INICIAL       # primera compra para ese proyecto
ADICIONAL     # compra adicional posterior
```

### Unidades de compra

Enum extenso (observado en Excels):
```
HOJA, PIE_TABLA, PIEZA, METRO, PEDIDO, ENVIO, KILOGRAMO,
LITRO, PAQUETE, JUEGO, GALON, CAJA, CM, ROLLO, RECOLECCION, GRUPO
```

### Especialidad de empleado (nuevo)

Enum que indica qué proceso hace normalmente:
```
HABILITADOR      # PEPE, MARISOL
ARMADOR          # CRISTIAN, BETO, CHAVA, RAMÓN
PULIDOR          # SULI, JONA
LAQUEADOR        # CITLA
ADMINISTRATIVO   # encargada de compras + diseño
```

Un armador puede a veces habilitarse a sí mismo — el sistema no bloquea, solo sugiere.

### Reglas de negocio

1. Código de proyecto: correlativo numérico con padding (`017`, `058`, `069`). Asignado por el sistema al crear (pero el usuario puede overridearlo — lo hace hoy en el Excel).
2. Un proyecto no se puede `ENTREGADO` si tiene muebles que no llegaron a `LISTO PARA ENTREGA` o `ENTREGADO` (soft warning).
3. Compra con proyecto asignado requiere `proyectoId` y opcionalmente `muebleId`. Compra `POR ASIGNAR` se puede crear sin, y asignar después.
4. `montoVendido`, tarifas, sueldos solo visibles para OWNER.
5. En cierre mensual, proyecto se cuenta en el mes de `fechaEntrega` real.
6. Cambios de `montoVendido` crean `ProyectoRevision` con motivo y autor.
7. Gantt por operador: filas = empleados, barras = tareas, color = proyecto.
8. El cierre mensual distingue **ingresos facturados** (proyectos con `facturado = true`) de **ingresos en efectivo**.
9. Los anticipos son pagos con fecha propia. Un proyecto puede tener `N` anticipos antes de la liquidación.
10. Horas extras se calculan al doble de la tarifa ordinaria (ley federal del trabajo mexicana).
11. Sábados trabajados se capturan como T.E. en el registro de producción.
12. Domingos y días festivos mexicanos no se trabajan — no se pueden crear tareas en esas fechas (soft warning).

---

## 7. Fórmula oficial de utilidad del cliente

**Esta fórmula es ley.** Los tests unitarios del módulo de cálculo deben reproducir exactamente los números del Excel del cliente. Casos de prueba mandatorios (extraídos del Master Administrativo de septiembre 2025):

| Proyecto | Cliente | Monto | Costo | Utilidad | % sobre venta |
|---|---|---:|---:|---:|---:|
| 722 | RTS | 159,384 | 65,468.41 | 93,915.58 | 58.92% |
| EXPRESS | SYG | 25,800 | 10,845.55 | 14,954.45 | 57.96% |
| 1541 | TRRA | 18,908 | 2,528.94 | 16,379.05 | 86.62% |

### Fórmula paso a paso

```
Para cada PROYECTO ENTREGADO en el mes M:

  MATERIAL_DIRECTO = SUM(compras.total donde compras.proyectoId = X AND compras.fecha <= fechaEntrega)

  qtyItemsProyecto = SUM(muebles.cantidad donde muebles.proyectoId = X)

  totalInsumosMes = SUM(insumos.total donde insumos.mes = M)
  totalMOIMes = SUM(gastosMOI.total donde gastosMOI.mes = M)
                (M.O.I. = mano de obra indirecta: encargada de compras, administrativos)
  totalItemsMes = SUM(proyectos.qtyItems donde proyectos.fechaEntrega in mes M)

  PROPORCIONAL_INSUMOS = (totalInsumosMes / totalItemsMes) * qtyItemsProyecto
  PROPORCIONAL_MOI     = (totalMOIMes / totalItemsMes) * qtyItemsProyecto

  COSTO_MO_DIRECTA = SUM(por cada empleado e y por cada proceso p:
                          registroProduccion.horasTO(e, p, proyectoX) * empleado.tarifaHoraTO(e, p)
                          + registroProduccion.horasTE(e, p, proyectoX) * empleado.tarifaHoraTE(e, p)
                       )

  COSTO_PROYECTO = MATERIAL_DIRECTO + PROPORCIONAL_INSUMOS + PROPORCIONAL_MOI + COSTO_MO_DIRECTA

  UTILIDAD_PROYECTO      = MONTO_COTIZACION - COSTO_PROYECTO
  UTILIDAD_SOBRE_VENTA   = UTILIDAD_PROYECTO / MONTO_COTIZACION
  UTILIDAD_SOBRE_COSTO   = UTILIDAD_PROYECTO / COSTO_PROYECTO
```

**Aclaraciones:**

- `totalItemsMes` es el divisor clave del prorrateo. Si en septiembre se entregaron 114 items entre todos los proyectos, y el proyecto X tenía 30 items, el prorrateo es `(totalInsumos/114) * 30`.
- Los costos de **terceros/externos** (tapicería, piel, mármol) aparecen sumados al `MATERIAL_DIRECTO` en los ejemplos del Excel. Modelarlo como compra o como `CostoExterno` — ambas maneras funcionan si se suman al costo de proyecto.
- Los **gastos fijos** del mes (renta, luz, IMSS, etc.) **NO entran al cálculo de utilidad por proyecto** en la fórmula actual del cliente. Entran al cálculo consolidado del mes (resta después de sumar utilidades). Esto es importante: el cliente no prorratea gastos fijos por proyecto.

### Utilidad consolidada del mes

```
UTILIDAD_POR_PROYECTO_TOTAL = SUM(utilidades de todos los proyectos entregados en mes M)

COSTO_FIJO_MES = renta + luz + agua + mantenimiento + internet + gasolina +
                 gastosVarios + IMSS + contador + impuestos + maquinariaYEquipo

UTILIDAD_NETA_MES = UTILIDAD_POR_PROYECTO_TOTAL - COSTO_FIJO_MES
```

### Tarifas por empleado (Septiembre 2025 — validar con cliente si cambian)

| Empleado | Proceso | T.O. (MXN/hr) | T.E. (MXN/hr) |
|---|---|---:|---:|
| PEPE | HABILITADO | 66.67 | 133.34 |
| MARISOL | HABILITADO | 66.67 | 133.34 |
| CRISTIAN | ARMADO | 73.33 | 146.66 |
| BETO | ARMADO | 77.78 | 155.56 |
| CHAVA | ARMADO | 73.33 | 146.66 |
| RAMÓN | ARMADO | 88.89 | 177.78 |
| SULI | PULIDO | 60.00 | 120.00 |
| JONA | PULIDO | 60.00 | 120.00 |
| CITLA | LACA | 73.33 | 146.66 |

Las tarifas pueden cambiar. **Guardarlas por empleado**, no hardcodearlas.

**T.E. = T.O. × 2 exactamente.** Se puede guardar solo `tarifaHoraTO` y calcular `tarifaHoraTE = tarifaHoraTO * 2`, o guardar ambas por flexibilidad futura. Recomiendo guardar ambas con default `TE = TO * 2` al crear empleado.

---

## 8. Esquema Prisma (draft actualizado v6)

> Reemplaza completamente el schema de versiones anteriores. Si ya tenés migraciones, ver sección 21 (migración de v5 a v6).

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ===== USUARIOS =====

model User {
  id              String             @id @default(cuid())
  clerkId         String             @unique           // Clerk user ID
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

// ===== EMPLEADOS (operadores del taller, sin login) =====

model Empleado {
  id              String               @id @default(cuid())
  nombre          String                                     // "PEPE", "MARISOL"
  apellido        String?
  especialidad    EspecialidadEmpleado
  tarifaHoraTO    Decimal              @db.Decimal(10, 2)    // Tiempo Ordinario
  tarifaHoraTE    Decimal              @db.Decimal(10, 2)    // Tiempo Extra (default = TO * 2)
  sueldoSemanal   Decimal?             @db.Decimal(12, 2)    // el cliente paga sueldo fijo semanal
  fechaIngreso    DateTime?
  activo          Boolean              @default(true)
  color           String?                                    // hex para Gantt
  rfc             String?
  nss             String?                                    // Número de Seguro Social
  tareas          Tarea[]
  registros       RegistroProduccion[]
  pagosNomina     PagoNomina[]
  historialTarifas HistorialTarifa[]
  createdAt       DateTime             @default(now())
}

enum EspecialidadEmpleado {
  HABILITADOR
  ARMADOR
  PULIDOR
  LAQUEADOR
  ADMINISTRATIVO
}

// Tarifas cambian con el tiempo — guardar histórico
model HistorialTarifa {
  id            String   @id @default(cuid())
  empleadoId    String
  empleado      Empleado @relation(fields: [empleadoId], references: [id], onDelete: Cascade)
  tarifaHoraTO  Decimal  @db.Decimal(10, 2)
  tarifaHoraTE  Decimal  @db.Decimal(10, 2)
  vigenteDesde  DateTime
  vigenteHasta  DateTime?

  @@index([empleadoId, vigenteDesde])
}

// ===== CLIENTES =====

model Cliente {
  id              String     @id @default(cuid())
  nombre          String                             // "AAGNES", "TRRA", "SYG"
  contacto        String?
  telefono        String?
  email           String?
  rfc             String?
  razonSocial     String?
  usoCFDIDefault  String?                            // clave SAT: G03, P01, etc.
  notas           String?
  proyectos       Proyecto[]
  createdAt       DateTime   @default(now())

  @@index([rfc])
}

// ===== PROYECTOS =====

model Proyecto {
  id                String             @id @default(cuid())
  codigo            String             @unique          // "017", "058", "069"
  nombre            String                              // "CAJONERA", "LOMAS ALTAS"
  po                String?                             // purchase order del cliente
  clienteId         String
  cliente           Cliente            @relation(fields: [clienteId], references: [id])
  estado            EstadoProyecto     @default(COTIZACION)
  semaforo          Semaforo           @default(EN_TIEMPO)
  semaforoManual    Boolean            @default(false)
  fechaPO           DateTime?
  fechaCompromiso   DateTime?
  fechaEntrega      DateTime?                          // real
  montoVendido      Decimal            @db.Decimal(12, 2)
  ivaIncluido       Boolean            @default(true)  // montos del Excel real son con IVA cuando aplica
  moneda            Moneda             @default(MXN)
  tipoCambioVenta   Decimal?           @db.Decimal(12, 4)
  tieneHC           Boolean            @default(false)
  comentarios       String?

  // ===== CFDI =====
  facturado         Boolean            @default(false)
  numeroCFDI        String?
  rfcCliente        String?
  usoCFDI           String?                            // G03 por default
  metodoPago        MetodoPago?                        // PUE / PPD
  formaPago         String?                            // clave SAT: 01, 03, 04
  fechaFacturacion  DateTime?

  muebles           Mueble[]
  compras           Compra[]
  anticipos         Anticipo[]
  pagos             PagoProyecto[]
  revisiones        ProyectoRevision[]
  eventos           EventoProyecto[]

  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  @@index([estado])
  @@index([clienteId])
  @@index([fechaCompromiso])
  @@index([fechaEntrega])
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
  PUE
  PPD
}

// ===== MUEBLES =====

model Mueble {
  id               String             @id @default(cuid())
  proyectoId       String
  proyecto         Proyecto           @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  orden            String?                                  // "1668", "1701" (del Excel)
  nombre           String                                   // "TOCADOR VILNA", "CAMA PRINCIPAL"
  cantidad         Int                @default(1)
  madera           String?
  estructura       Estructura?                              // MDF / PTR / N/A
  monto            Decimal?           @db.Decimal(12, 2)    // por ítem si cotiza así
  descripcionLarga String?
  terceros         TipoTercero[]
  estadoItem       EstadoItem         @default(ESPERA)
  procesoActual    ProcesoTecnico?
  especificaciones Json?                                    // medidas, color, herrajes, etc.
  historialProceso MuebleProcesoLog[]
  tareas           Tarea[]
  registros        RegistroProduccion[]
  costosExternos   CostoExterno[]
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  @@index([proyectoId])
  @@index([estadoItem])
  @@index([procesoActual])
}

enum Estructura {
  MDF
  PTR
  NA
}

enum TipoTercero {
  TAPICERIA
  PIEL
  ACCESORIOS
  HERRERIA
  MARMOL
  ESPEJO
  TEJIDO
  OTROS
}

enum EstadoItem {
  ESPERA
  FABRICACION
  REPROCESO
  PAUSA
  CANCELADO
  ENTREGADO
}

enum ProcesoTecnico {
  HABILITADO
  ARMADO
  PULIDO
  LACA
  EXTERNO
  COMPLEMENTOS
  EMPAQUE
  LISTO_PARA_ENTREGA
  ENTREGADO
}

model MuebleProcesoLog {
  id               String           @id @default(cuid())
  muebleId         String
  mueble           Mueble           @relation(fields: [muebleId], references: [id], onDelete: Cascade)
  procesoAnterior  ProcesoTecnico?
  procesoNuevo     ProcesoTecnico?
  estadoAnterior   EstadoItem?
  estadoNuevo      EstadoItem?
  cambiadoPorId    String?
  fecha            DateTime         @default(now())

  @@index([muebleId])
}

// Costos de terceros por mueble (tapicería, piel, mármol, etc.)
model CostoExterno {
  id            String      @id @default(cuid())
  muebleId      String
  mueble        Mueble      @relation(fields: [muebleId], references: [id], onDelete: Cascade)
  tipo          TipoTercero
  proveedor     String?
  monto         Decimal     @db.Decimal(12, 2)
  ivaIncluido   Boolean     @default(false)
  fecha         DateTime
  comprobante   String?
  notas         String?
  createdAt     DateTime    @default(now())

  @@index([muebleId])
  @@index([tipo])
}

// ===== TAREAS (Gantt) =====

model Tarea {
  id             String         @id @default(cuid())
  muebleId       String
  mueble         Mueble         @relation(fields: [muebleId], references: [id], onDelete: Cascade)
  empleadoId     String
  empleado       Empleado       @relation(fields: [empleadoId], references: [id])
  asignadoPorId  String?
  asignadoPor    User?          @relation("AsignadoPor", fields: [asignadoPorId], references: [id])
  proceso        ProcesoTecnico
  fechaInicio    DateTime
  fechaFinEst    DateTime
  fechaFinReal   DateTime?
  horasEstimadas Decimal?       @db.Decimal(6, 2)
  completada     Boolean        @default(false)
  notas          String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([empleadoId, fechaInicio])
  @@index([muebleId])
}

// ===== REGISTRO DE PRODUCCIÓN (horas trabajadas semanales) =====
// Una fila = un empleado × un mueble × una semana. Guarda T.O. y T.E.

model RegistroProduccion {
  id            String         @id @default(cuid())
  empleadoId    String
  empleado      Empleado       @relation(fields: [empleadoId], references: [id])
  muebleId      String
  mueble        Mueble         @relation(fields: [muebleId], references: [id], onDelete: Cascade)
  proceso       ProcesoTecnico                             // qué proceso estaba haciendo
  semana        DateTime                                    // lunes de la semana
  horasTO       Decimal        @db.Decimal(6, 2) @default(0)
  horasTE       Decimal        @db.Decimal(6, 2) @default(0)
  notas         String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([empleadoId, muebleId, proceso, semana])
  @@index([semana])
  @@index([muebleId])
}

// ===== COMPRAS =====

model Compra {
  id                  String            @id @default(cuid())
  fecha               DateTime
  categoria           CategoriaCompra
  tipo                TipoCompra
  clienteRelacionado  String?                              // nombre en texto del Excel (puede no matchear con Cliente)
  proyectoId          String?
  proyecto            Proyecto?         @relation(fields: [proyectoId], references: [id])
  muebleNombre        String?                              // "ITEM" del Excel, descripción breve
  descripcion         String                               // "MDF 12 ROBLE RUS. DES. 1C"
  proveedor           String
  idFactura           String?                              // "C25605"
  qty                 Decimal           @db.Decimal(10, 3)
  unidad              UnidadCompra
  importe             Decimal           @db.Decimal(12, 2)  // sin IVA
  iva                 Decimal           @db.Decimal(12, 2) @default(0)
  total               Decimal           @db.Decimal(12, 2)  // con IVA
  metodoPago          String                               // string libre: "TC BANORTE", "EFECTIVO", etc.
  numeroCFDIRecibido  String?
  rfcProveedor        String?
  comprobante         String?                              // URL al archivo
  createdAt           DateTime          @default(now())

  @@index([proyectoId])
  @@index([fecha])
  @@index([categoria])
  @@index([tipo])
}

enum CategoriaCompra {
  MDF
  SOLIDO
  COMPLEMENTOS
  ENVIOS
}

enum TipoCompra {
  INICIAL
  ADICIONAL
}

enum UnidadCompra {
  HOJA
  PIE_TABLA
  PIEZA
  METRO
  PEDIDO
  ENVIO
  KILOGRAMO
  LITRO
  PAQUETE
  JUEGO
  GALON
  CAJA
  CM
  ROLLO
  RECOLECCION
  GRUPO
}

// ===== INSUMOS GENERALES (no asignables a proyecto) =====

model Insumo {
  id              String        @id @default(cuid())
  fecha           DateTime
  descripcion     String
  proveedor       String
  idFactura       String?
  qty             Decimal       @db.Decimal(10, 3)
  unidad          UnidadCompra
  importe         Decimal       @db.Decimal(12, 2)
  iva             Decimal       @db.Decimal(12, 2) @default(0)
  total           Decimal       @db.Decimal(12, 2)
  metodoPago      String
  categoria       String?                                 // embalaje, limpieza, herramientas, etc.
  createdAt       DateTime      @default(now())

  @@index([fecha])
}

// ===== GASTOS FIJOS MENSUALES =====

model GastoFijo {
  id          String       @id @default(cuid())
  mes         Int                                         // 1-12
  anio        Int
  concepto    ConceptoGastoFijo
  monto       Decimal      @db.Decimal(12, 2)
  pagado      Boolean      @default(false)
  fechaPago   DateTime?
  notas       String?
  createdAt   DateTime     @default(now())

  @@unique([mes, anio, concepto])
  @@index([anio, mes])
}

enum ConceptoGastoFijo {
  RENTA
  LUZ
  AGUA
  MANTENIMIENTO
  INTERNET
  GASOLINA
  GASTOS_VARIOS
  IMSS
  CONTADOR
  IMPUESTOS
  MAQUINARIA_Y_EQUIPO
  OTROS
}

// ===== ANTICIPOS (pagos parciales antes de entrega) =====

model Anticipo {
  id            String    @id @default(cuid())
  proyectoId    String
  proyecto      Proyecto  @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  monto         Decimal   @db.Decimal(12, 2)
  porcentaje    Decimal?  @db.Decimal(5, 2)               // 60.00 = 60%
  fecha         DateTime
  metodoPago    String
  cfdiEmitido   Boolean   @default(false)
  numeroCFDI    String?
  notas         String?
  createdAt     DateTime  @default(now())

  @@index([proyectoId])
  @@index([fecha])
}

// ===== PAGO PROYECTO (liquidación) =====

model PagoProyecto {
  id            String    @id @default(cuid())
  proyectoId    String
  proyecto      Proyecto  @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  monto         Decimal   @db.Decimal(12, 2)
  fecha         DateTime
  metodoPago    String
  estatus       EstatusPago @default(PENDIENTE)
  cfdiEmitido   Boolean   @default(false)
  numeroCFDI    String?
  notas         String?
  createdAt     DateTime  @default(now())

  @@index([proyectoId])
  @@index([estatus])
}

enum EstatusPago {
  PENDIENTE
  LIQUIDADO
  CANCELADO
}

// ===== NÓMINA =====

model PagoNomina {
  id          String    @id @default(cuid())
  empleadoId  String
  empleado    Empleado  @relation(fields: [empleadoId], references: [id])
  semana      DateTime                                   // lunes de la semana pagada
  sueldoBase  Decimal   @db.Decimal(12, 2)
  horasExtras Decimal   @db.Decimal(6, 2) @default(0)
  montoExtras Decimal   @db.Decimal(12, 2) @default(0)
  bonos       Decimal   @db.Decimal(12, 2) @default(0)
  deducciones Decimal   @db.Decimal(12, 2) @default(0)
  total       Decimal   @db.Decimal(12, 2)
  pagado      Boolean   @default(false)
  fechaPago   DateTime?
  notas       String?
  createdAt   DateTime  @default(now())

  @@unique([empleadoId, semana])
  @@index([semana])
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
  CAMBIO_PROCESO
  ANTICIPO_RECIBIDO
  PAGO_RECIBIDO
  COMPRA_REGISTRADA
  FACTURADO
  COMENTARIO
  OTRO
}

// ===== CIERRE MENSUAL (snapshot cuando se cierra formalmente) =====

model CierreMensual {
  id                      String   @id @default(cuid())
  mes                     Int                                        // 1-12
  anio                    Int
  cerrado                 Boolean  @default(false)
  fechaCierre             DateTime?
  cerradoPorId            String?

  // Totales del mes (cached al cerrar)
  totalProyectosEntregados Int     @default(0)
  totalItemsEntregados     Int     @default(0)
  totalIngresosFacturados  Decimal @db.Decimal(14, 2) @default(0)
  totalIngresosEfectivo    Decimal @db.Decimal(14, 2) @default(0)
  totalIngresos            Decimal @db.Decimal(14, 2) @default(0)
  totalInsumos             Decimal @db.Decimal(14, 2) @default(0)
  totalMOI                 Decimal @db.Decimal(14, 2) @default(0)
  totalGastosFijos         Decimal @db.Decimal(14, 2) @default(0)
  totalUtilidadProyectos   Decimal @db.Decimal(14, 2) @default(0)
  utilidadNetaMes          Decimal @db.Decimal(14, 2) @default(0)

  snapshotProyectos        Json?                                     // desglose completo al momento del cierre

  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt

  @@unique([mes, anio])
}
```

---

## 9. Arquitectura de módulos

### Fase 1 (MVP)

**M1. Proyectos** (núcleo)
Listado estilo Master. Kanban por estado. Detalle con muebles, compras, anticipos, CFDI, timeline. Server actions: CRUD, cambiar estado, cerrar (→ ENTREGADO), ajustar monto (→ Revision), marcar facturado.

**M2. Muebles / WIP**
Vista "Hoja de Control" por proyecto. Vista transversal "Muebles por proceso" (heatmap de los 9 procesos). Edición inline de proceso y estado. Log automático.

**M3. Compras**
Tabla unificada con filtros por categoría, tipo, proyecto, período. Crear con toggle "asignar a proyecto". Categorías MDF / SÓLIDO / COMPLEMENTOS / ENVÍOS. CFDI recibido opcional.

**M4. Insumos generales**
Tabla separada de compras. No se asignan a proyecto. Se prorratean en el cierre.

**M5. Gastos fijos mensuales**
Captura de renta, luz, IMSS, etc. por mes.

**M6. Anticipos y pagos**
Registro de anticipos por proyecto con fecha y método. Liquidación al entregar.

**M7. Empleados**
CRUD. Especialidad, tarifa T.O., tarifa T.E. (default T.O. × 2), sueldo semanal, color para Gantt. Historial de tarifas.

**M8. Registro de producción**
Entrada semanal tipo planilla: semana actual → grilla empleado × mueble donde se cargan horas T.O. y T.E. Reemplaza al archivo "Producción" del cliente.

**M9. Cierre Mensual / Master Administrativo** ⭐
Feature estrella. Selector de mes/año → reporte completo:
- Proyectos entregados con utilidad individual y % sobre venta/costo.
- Totales: ingresos facturados, ingresos efectivo, total.
- Insumos del mes.
- M.O. indirecta del mes.
- Gastos fijos del mes.
- Utilidad consolidada del mes.
- Comparación mes anterior y mismo mes año anterior.
- Botón "Cerrar mes" que guarda snapshot en `CierreMensual`.
- Export a Excel **con fórmulas visibles** (el cliente lo pidió explícitamente — `exceljs` con `cell.value = { formula: 'A1+B1' }`).
- Opción "solo para contador" (solo facturado + compras con CFDI).

**M10. Command Palette**
Cmd+K global. Busca proyectos, muebles, clientes, empleados. Acciones rápidas.

**M11. Dashboard**
- KPIs del mes actual.
- Kanban de proyectos por estado.
- Heatmap de muebles por proceso.
- Alertas visuales: proyectos atrasados, sin actividad, compras colgadas.

### Fase 2

**M12. Gantt por operador**
Filas = empleados, barras = tareas, color = proyecto. Drag & drop. Biblioteca `frappe-gantt`.

**M13. Nómina semanal**
Generar pre-nómina a partir de sueldo base + horas extras del registro de producción. Marcar pagado.

**M14. RRHH avanzado**
Vacaciones, ausencias, historial de puestos.

**M15. Alertas por email (Resend)**
Resumen diario al OWNER. Configurable.

**M16. Upload de comprobantes**
Adjuntar foto/PDF de tickets y CFDIs.

**M17. Multi-moneda operativa**
Activar cuando aparezca primer cliente/proveedor en USD.

**M18. Reporte de ocupación del taller / capacidad semanal**
Pedido explícito del cliente. Muestra horas planeadas / horas disponibles por semana por operador, y por taller completo.

### Fase 3 (backlog con criterio de activación)

Ver sección 14.

---

## 10. Diseño de UI/UX

### Principios

1. Densidad alta de información. No minimalismo decorativo.
2. Edición inline donde aplique. Proceso del mueble: click en celda, dropdown, confirma.
3. Colores del Excel actual (por proyecto, por proceso).
4. Teclado-first. Command palette cmd+K.
5. Mobile = responsive del desktop.
6. Números mexicanos: `$18,562.32`. Fechas: `DD/MM/AAAA`.

### Pantallas clave Fase 1

**Dashboard (home)**
- Arriba: KPIs (proyectos activos, entregados del mes, utilidad [OWNER], compras, utilidad sobre venta promedio [OWNER]).
- Kanban por estado.
- Heatmap de los 9 procesos.
- Feed de eventos recientes.

**Listado de Proyectos**
Replica visual del Master. DataTable con todas las columnas. Filtros. Export a Excel fiel.

**Detalle de Proyecto**
- Header: código, cliente, P.O., fechas, estado editable, semáforo, montoVendido (OWNER), badge facturado.
- Tabs: `Muebles` | `Compras` | `Anticipos y pagos` | `Producción` (registros de horas) | `CFDI` (OWNER) | `Finanzas` (OWNER) | `Historial`.
- Tab Muebles: tabla con proceso editable inline. Botón "Agregar mueble".
- Tab Compras: compras del proyecto, categoría, tipo, total.
- Tab Anticipos y pagos: timeline de pagos con fechas y métodos.
- Tab Producción: registros de horas (solo lectura desde aquí; captura desde módulo dedicado).
- Tab Finanzas: breakdown completo con fórmula de utilidad visible paso a paso.
- Tab Historial: timeline de eventos.

**Captura de Producción semanal**
Grilla semanal: filas = empleados (agrupados por especialidad), columnas = muebles activos esta semana. En cada celda, dos campos: T.O. y T.E. Autoguardado al cambiar.

**Compras**
Listado con filtros (categoría, tipo, proyecto, período, proveedor). Formulario de alta con autocompletes.

**Cierre Mensual**
Selector mes/año. Reporte completo con tres secciones colapsables: ingresos, egresos, utilidad. Botón "Cerrar mes" (irreversible, pide confirmación). Export a Excel con fórmulas. Export PDF. Export "solo contador".

**Master del Mes — vista de edición**
Para el mes abierto, permitir editar: montos de gastos fijos, insumos, costos externos por proyecto, ajustes manuales. Una vez cerrado, solo lectura.

### Componentes

- shadcn `DataTable`
- shadcn `Sheet` (drawer)
- shadcn `Dialog` (destructivas)
- shadcn `Command` (cmd+K)
- shadcn `Sonner` (toasts)
- `react-hook-form` + zod
- `src/lib/status-colors.ts` para mapeo consistente

### NO hacer en UI

- Sobrecargar con iconos.
- Modales anidados.
- Animaciones >200ms.
- Dark mode en Fase 1.
- Onboarding tours in-app.
- Construir Gantt desde cero.

---

## 11. Seguridad y RBAC

### Niveles
1. Autenticación: Clerk o Auth.js. Sin registro público.
2. Autorización: `OWNER` y `ENCARGADO`.

### Reglas
- Middleware valida sesión en `(app)/*`.
- Helper `requireRole(role)` en actions y queries.
- Campos sensibles (montos, tarifas, utilidades, sueldos, CFDI, RFC) **filtrados en server según rol**. El cliente nunca recibe datos que no puede ver.
- UI oculta condicionalmente como defensa en profundidad.

### Auditoría
- Fase 1: `MuebleProcesoLog`, `ProyectoRevision`, `EventoProyecto`, `HistorialTarifa`.
- Fase 3: tabla general.

### Privacidad
- Datos fiscales sensibles bajo LFPDPPP.
- Backups automáticos (Neon) o `pg_dump` diario a S3.

---

## 12. Roadmap y fases

### Fase 0 — Descubrimiento (completada)
- Excel del cliente recibido y analizado.
- Fórmula de utilidad documentada.
- Enums validados contra hoja DATOS.
- Casos de prueba extraídos.

### Fase 1 — MVP (4-6 semanas)
Entregable: reemplaza todos los Excels del dueño. Testeable con los 3 casos de prueba de septiembre 2025.

Módulos: M1-M11 (proyectos, muebles, compras, insumos, gastos fijos, anticipos, empleados, registro producción, cierre mensual, command palette, dashboard).

Criterio de cierre de fase: los 3 proyectos de prueba (722, EXPRESS, 1541) calculan utilidad con el mismo número que el Excel del cliente.

### Fase 2 — Operación (4-5 semanas)
Módulos M12-M18 (Gantt, nómina, RRHH avanzado, alertas email, uploads, multi-moneda, ocupación del taller).

### Fase 3 — Post-validación
Ver sección 14.

### Cronograma (1 dev solo, part-time ~20h/sem)

| Semana | Fase | Entregable |
|---|---|---|
| 1-2 | 1 | (ya avanzado) Auth, CRUD Proyectos y Clientes |
| 3 | 1 | CRUD Muebles, edición inline proceso/estado, log |
| 4 | 1 | Compras + Insumos + Gastos Fijos |
| 5 | 1 | Anticipos + CFDI registro + Empleados |
| 6 | 1 | Registro de Producción semanal (planilla) |
| 7 | 1 | Cierre Mensual con export Excel fórmulas |
| 8 | 1 | Command palette + Dashboard + UAT inicial |
| 9 | 1 | Ajustes post-UAT + deploy staging |
| 10 | 1 | Capacitación + hotfixes |
| 11-13 | 2 | Gantt + Nómina semanal |
| 14 | 2 | RRHH avanzado + Alertas |
| 15 | 2 | Ocupación taller + Uploads |

---

## 13. Convenciones de código

- TypeScript strict.
- Naming: español para dominio (Proyecto, Mueble, Empleado, Tarea, RegistroProduccion, Anticipo, Compra). Inglés para infraestructura.
- Server actions en `src/server/actions/<modulo>.ts`. Validar zod + permisos al inicio.
- Queries en `src/server/queries/<modulo>.ts`.
- Cálculos en `src/server/calculations/<tema>.ts`. **Fórmula de utilidad aquí. Tests obligatorios.**
- Zod schemas compartidos en `src/schemas/`.
- Componentes `PascalCase.tsx`, hooks `useCamelCase.ts`, utils `kebab-case.ts`.
- Commits cortos en español: `feat: agrega kanban`, `fix: corrige prorrateo insumos`.
- Branching: `main` producción, `dev` staging, features en branches cortas.
- Format: `formatMXN(monto)`, `formatDate(fecha)` en `src/lib/format.ts`.

---

## 14. Backlog (Fase 3+)

Cada ítem tiene criterio de activación.

**B1. OCR de tickets y XML CFDI** — >50 compras/mes × 3 meses + sistema estable + pedido explícito. Priorizar parser XML antes que OCR imagen.

**B2. WhatsApp notifications** — pedido explícito con 2 casos de uso nombrados. Validar costo mensual.

**B3. Portal del cliente final** — 3 clientes distintos lo piden con nombre propio.

**B4. Integración con PAC para emisión automática de CFDI** — >70% proyectos facturados + pedido explícito. Evaluar FacturAPI, Facturama, Finkok.

**B5. Mobile PWA para operarios** — WiFi estable confirmado + smartphones + voluntad capacitación + aprobación dueño.

**B6. Dashboard productividad por operador** — 6 meses de datos + aprobación dueño. Sensible laboralmente.

**B7. Predicción fechas de entrega** — mínimo 12 meses de datos históricos.

**B8. Versionado de precios de materiales** — pedido explícito para cotizaciones. Baja prioridad en México.

**B9. Importador masivo Excel histórico** — cliente insiste. Default: empezar limpio.

**B10. Chatbot consultas NL** — nunca proactivo. Solo si filtros estándar no alcanzan.

**B11. Multi-moneda operativa (MXN + USD)** — primer cliente/proveedor USD. Schema ya preparado.

**B12. Integración Aspel NOI / CONTPAQ** — dueño decide formalizar nómina fiscal completa. Export CSV antes de integración profunda.

**B13. Módulo de RH expandido (programas de orden y limpieza del taller)** — pedido del cliente. Puede entrar en Fase 2 si hay capacidad.

---

## 15. Anti-patrones: NO construir

**AP1.** Multi-tenancy "por si lo vendemos". Si algún día se transforma en producto, se refactoriza.
**AP2.** App nativa iOS/Android.
**AP3.** Optimización IA del Gantt.
**AP4.** GraphQL público / tRPC.
**AP5.** Permisos granulares por campo/fila. Con 2 roles y 3 usuarios alcanza.
**AP6.** Chatbot genérico.
**AP7.** Menciones @usuario.
**AP8.** Dark mode en Fase 1-2.
**AP9.** Importador genérico de Excel.
**AP10.** Workflow engine configurable.
**AP11.** Event sourcing / CQRS.
**AP12.** CRM integrado (si lo necesita, HubSpot Free).
**AP13.** Emitir CFDI sin pasar por PAC (ilegal).
**AP14.** Calcular ISR/IMSS/INFONAVIT desde cero. Delegar a Aspel NOI / CONTPAQ i Nóminas.
**AP15.** Cambiar la fórmula de utilidad del cliente "porque técnicamente hay una mejor". Replicar la suya exacto. Si en el futuro quiere comparar con alternativa, mostrar las dos.

---

## 16. Testing

- **Obligatorio:** tests unitarios para `src/server/calculations/`. La fórmula de utilidad debe reproducir los 3 casos de prueba de septiembre 2025 exactos (722, EXPRESS, 1541). Tests para: cálculo de mano de obra directa por empleado, prorrateo de insumos, prorrateo de MOI, suma total de utilidad del mes, conversión de moneda.
- **Recomendado:** integración para actions críticas (crear proyecto, cerrar mes, registrar producción, ajustar monto).
- **Opcional MVP:** E2E con Playwright para 3 flujos.
- **No:** snapshots, tests de UI exhaustivos.

---

## 17. Variables de entorno

```
DATABASE_URL=
DIRECT_URL=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
BLOB_READ_WRITE_TOKEN=           # Fase 2
RESEND_API_KEY=                  # Fase 2
TZ=America/Mexico_City
NEXT_PUBLIC_LOCALE=es-MX
NEXT_PUBLIC_CURRENCY=MXN
```

---

## 18. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cálculo de utilidad no coincide con Excel | Crítico | 3 casos de prueba obligatorios. Tests unitarios. Breakdown visible en UI. |
| Fórmula se entiende mal y se "optimiza" | Crítico | AP15 explícito. Replicar sin cuestionar. |
| Cliente abandona el sistema por tedio | Alto | Captura de producción tipo planilla, muy rápida. Command palette. Export fiel al Excel. |
| Datos fiscales mal manejados | Alto | No emitir CFDI en Fase 1. Solo registrar. |
| Dev solo, imprevisto | Alto | Documentación completa (este archivo), código sin magia. |
| Gantt custom explota | Medio | Biblioteca existente. |
| Usuarios cometen errores irreversibles | Alto | Cierre de mes con confirmación. Revisión de monto con motivo. Soft deletes donde aplique. |

---

## 19. Decisiones ya resueltas (no volver a abrir)

Respuestas del cliente (documentadas):

1. **Entregas parciales:** no se modelan como sub-entidad. El cliente divide entregas parciales como proyectos separados con código propio.
2. **Reprocesos:** se marcan aparte ("ley del taco"), no vuelven al proceso anterior. `REPROCESO` es el estado oficial. `RETRABAJO` no existe en el vocabulario real.
3. **Procesos técnicos:** son 9, no 4. Orden canónico en sección 6.
4. **Modelo de catálogo (VILNA, HYGGE):** no. Eran de un cliente del que dejan de atender.
5. **IVA:** montos del Excel son con IVA cuando aplica. Campo `ivaIncluido` en Proyecto.
6. **CFDI típico:** G03 (gastos en general). Guardar en `usoCFDIDefault` del Cliente.
7. **Anticipos:** todos los proyectos cobran anticipo. CFDI de anticipo o CFDI PPD.
8. **Sueldo empleados:** fijo semanal.
9. **Horas extras:** al doble (ley federal del trabajo). Modelar como `tarifaHoraTE = tarifaHoraTO * 2` por default.
10. **Sábados:** se trabajan cuando hay carga, se pagan como T.E. Domingos y festivos no.
11. **Granularidad de tareas:** por mueble, con lógica de flujo entre operadores (habilitador → armador → pulidor → laqueador).
12. **Horizonte del Gantt:** 3 meses adelante.
13. **Usuarios del sistema:** 3 (dueño, socio, encargada de compras).
14. **Dispositivos:** computadora y celular. Internet estable en el taller.
15. **Histórico a migrar:** 2026. Si no alcanza info, solo activos.
16. **Prorrateo:** por `qty items` entregados en el mes (fórmula oficial del cliente).
17. **Imputación temporal:** por fecha de entrega, no de facturación.
18. **RRHH:** sí entra, mínimo gancho en Fase 1 (empleados + tarifas + especialidad), ampliación Fase 2 (vacaciones, etc.).
19. **Ocupación del taller:** indicador solicitado por cliente. Fase 2 (M18).
20. **Export Master Administrativo:** Excel con fórmulas visibles, no solo valores.

---

## 20. Para Claude Code / Antigravity

Leer esta sección antes de cualquier modificación al código.

### Biblioteca de componentes UI — patrón `render` (NO `asChild`)

Este proyecto usa `@base-ui/react` (no shadcn/radix estándar). Los componentes como `DialogTrigger`, `SheetTrigger`, `PopoverTrigger`, `DialogClose` usan la prop `render` en lugar de `asChild`. `Sheet` está implementado como un `Dialog` lateral (usa `@base-ui/react/dialog` internamente):

```tsx
// ✅ Correcto
<DialogTrigger render={<Button className="gap-2" />}>
  Texto del botón
</DialogTrigger>

// ❌ Incorrecto — asChild no existe en @base-ui/react
<DialogTrigger asChild>
  <Button>Texto</Button>
</DialogTrigger>
```

### Role filtering en queries

`listarProyectos(filtros, owner)` y `obtenerProyecto(id, owner)` requieren que la página les pase `owner`. Las páginas deben obtener `owner` primero con `await isOwner()` antes de llamar estas queries en paralelo:

```tsx
const owner = await isOwner();
const [proyectos, clientes] = await Promise.all([
  listarProyectos({}, owner),
  listarClientesSelect(),
]);
```

Los campos financieros (`montoVendido`, `anticipos`, `revisiones`, totales de compras, datos CFDI) llegan como `null` para `ENCARGADO`. Nunca asumas que son non-null sin verificar `isOwner`.

### Auth — Clerk + User.clerkId

Clerk maneja la sesión. El `userId` de Clerk se guarda en `User.clerkId` (campo único en la DB). El **rol** (`OWNER` / `ENCARGADO`) vive en `User.role` en Postgres, no en Clerk metadata.

- `requireAuth()` → devuelve User de DB; lanza si no autenticado.
- `requireOwner()` → lanza si `user.role !== "OWNER"`. Usar en actions de empleados, tarifas, montos.
- `isOwner()` → boolean; usar en Server Components para condicionar UI y queries.
- `syncUser()` → upsert al hacer login; llamado desde webhook Clerk en `src/app/api/webhooks/clerk/route.ts`.

### Estado de módulos implementados

| Módulo | Ruta | Estado |
|---|---|---|
| M1 Proyectos | `/proyectos` | ✅ Completo |
| M2 Muebles / WIP | tabs de `/proyectos/[id]` | ✅ Completo |
| M3 Compras | `/compras` | ✅ Completo |
| M4 Insumos | `/insumos` | ✅ Completo |
| M5 Gastos fijos | `/gastos` | ✅ Completo |
| M6 Anticipos | tab en `/proyectos/[id]` | ✅ Completo |
| M7 Empleados | `/empleados` | ✅ Completo |
| M8 Producción semanal | `/produccion` | ✅ Completo |
| M9 Cierre mensual | `/cierre` | ✅ Completo |
| M10 Command Palette | global (Cmd+K) | ✅ Completo |
| M11 Dashboard | `/dashboard` | ✅ Completo |
| Cálculos utilidad | `src/server/calculations/` | ✅ Con 25 tests |
| M12 Gantt | `/gantt` | ✅ Completo (OWNER-only) |
| M13 Nómina | `/nomina` | ✅ Completo (OWNER-only) |
| M14 RRHH | `/rrhh` | ✅ Completo |
| M18 Ocupación taller | `/ocupacion` | ✅ Completo |
| Tipo de cambio | `/tipocambio` | ✅ Completo |

**Todos los módulos de Fase 1 y la mayoría de Fase 2 están implementados.** Próximo foco: mejoras y ajustes sobre lo existente según feedback del cliente.

### Patrón de server action

```ts
"use server";
export async function miAction(input: MiInput) {
  await requireOwner();          // o requireAuth()
  const data = miSchema.parse(input);
  await db.miModelo.create({ data: ... });
  revalidatePath("/mi-ruta");
  return { ok: true };
}
```

### Decimal en frontend

`Prisma.Decimal` no es serializable directamente a Client Components. Hacer `.toString()` en queries antes de devolver:
```ts
// En la query:
tarifaHoraTO: isOwner ? e.tarifaHoraTO.toString() : null,
```

- **Este documento manda.** Si una instrucción contradice esto, preguntar antes de ejecutar.
- **Contexto regional: México, Guadalajara/Jalisco.** TZ `America/Mexico_City`. Moneda MXN. Fechas `DD/MM/AAAA`. Montos `$18,562.32`.
- **Los 9 procesos técnicos (HABILITADO → ARMADO → PULIDO → LACA → EXTERNO → COMPLEMENTOS → EMPAQUE → LISTO_PARA_ENTREGA → ENTREGADO) son canónicos.** Confirmados contra hoja DATOS del Excel.
- **Los 6 estados de ítem (ESPERA, FABRICACION, REPROCESO, PAUSA, CANCELADO, ENTREGADO)** son canónicos. **REPROCESO** es el oficial (no RETRABAJO).
- **Las tarifas por hora son por empleado**, no globales. Y T.E. = T.O. × 2 por default.
- **La fórmula de utilidad** de sección 7 es la del cliente. **NUNCA alterarla.** Tests obligatorios contra los 3 casos de prueba.
- **El Gantt es por operador:** filas = Empleado, barras = Tarea, color = Proyecto.
- **No romper separación OWNER/ENCARGADO.** Campos fiscales y financieros (montos, utilidades, tarifas, sueldos, CFDI, RFC) son OWNER-only.
- **Nunca floats para dinero.** Siempre `Decimal` de Prisma.
- **En cierre mensual, mostrar tres totales:** facturado, efectivo, total.
- **En Fase 1 NO se emite CFDI desde el sistema.** Solo se registra. PAC es backlog (B4).
- **Cambios de `montoVendido` crean `ProyectoRevision`.**
- **No inventar estados/enums.** Los enums son cerrados y validados.
- **No escribir SQL raw** salvo queries agregadas del cierre mensual.
- **Fechas:** siempre timezone explícito.
- **Testing obligatorio:** calculations y cambios de estado.
- **Antes de agregar feature que no esté acá, revisar backlog (14) y anti-patrones (15).** Si entra en 15, rechazar. Si entra en 14, respetar criterio de activación. Si no está en ninguno, discutir con el usuario.
- **Vocabulario oficial del cliente.** No sinónimos en inglés. No hispanismos de otras regiones.
- **Un solo repo, un solo lenguaje.**

---

## 21. Cambios v5 → v6 (referencia histórica para migración)

Si venís de código escrito contra v5, estos son los cambios que requieren atención:

**Schema — entidades nuevas:**
- `Empleado.especialidad` (enum), `Empleado.tarifaHoraTO`, `Empleado.tarifaHoraTE`, `Empleado.sueldoSemanal` (no mensual).
- `HistorialTarifa` nuevo.
- `RegistroProduccion` nuevo (clave para cálculo de utilidad).
- `CostoExterno` nuevo (tapicería, piel, mármol, etc.).
- `Insumo` separado de `Compra`.
- `GastoFijo` con enum `ConceptoGastoFijo`.
- `Anticipo` ahora es entidad (antes era campo numérico en Proyecto).
- `PagoProyecto` nuevo.
- `CierreMensual` como snapshot.

**Schema — entidades eliminadas:**
- `ModeloMueble` (catálogo de modelos) — cliente confirmó que los modelos VILNA/HYGGE no son suyos.
- `Entrega` — cliente divide entregas parciales como proyectos separados.

**Schema — cambios en entidades existentes:**
- `Mueble.estadoTecnico` → renombrado a `procesoActual` (tipo `ProcesoTecnico`).
- Agregado `Mueble.estadoItem` (tipo `EstadoItem` — nuevo enum de 6 valores).
- `Mueble.estructura` (enum) nuevo: MDF/PTR/NA.
- `Compra` ahora tiene `categoria` (enum), `tipo` (enum INICIAL/ADICIONAL), `unidad` (enum), `importe` e `iva` separados.
- `Proyecto.anticipo: Decimal` eliminado — ahora relación con entidad `Anticipo`.
- `Proyecto.ivaIncluido: Boolean` nuevo.
- `PagoNomina` pasa de mensual a semanal (cliente paga semanal).

**Enums — cambios:**
- `ProcesoTecnico` pasa de 4 a 9 valores.
- Nuevo `EstadoItem` con 6 valores.
- Nuevo `EspecialidadEmpleado`.
- Nuevo `Estructura`.
- Nuevo `CategoriaCompra`.
- Nuevo `TipoCompra`.
- Nuevo `UnidadCompra`.
- Nuevo `ConceptoGastoFijo`.
- Nuevo `TipoTercero` con 8 valores (antes era array booleano).
- `EstadoTarea` eliminado — el estado de tarea es derivado (completada si/no + fechaFinReal).

**Lógica:**
- Fórmula de utilidad documentada y canónica (sección 7).
- Prorrateo por `qty items`, no por proyectos.
- T.O. y T.E. separados en registro de producción.
- Gastos fijos NO se prorratean por proyecto — se restan al consolidado del mes.
- Tres totales de ingresos: facturado, efectivo, total.

**Migración recomendada:**
Si ya tenés auth + CRUD parcial de proyectos (según respondiste), lo que aguanta: auth, el modelo Cliente, y la parte básica de Proyecto (código, nombre, cliente, fechas, estado). Lo que hay que tocar: agregar campos CFDI e IVA al Proyecto, reemplazar el viejo enum `EstadoTecnico`/`EstadoMueble` por los dos nuevos enums (`ProcesoTecnico` + `EstadoItem`), y agregar todas las entidades nuevas. Si usaste entidad `Entrega` o `ModeloMueble` en v5, borrarlas antes de migrar.