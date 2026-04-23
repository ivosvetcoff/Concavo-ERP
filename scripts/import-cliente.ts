/**
 * scripts/import-cliente.ts
 * Importa datos reales del cliente desde la carpeta /Cliente.
 * Ejecutar con: npx tsx scripts/import-cliente.ts
 *
 * Orden de importación:
 *   1. Clientes (del Master 2026)
 *   2. Proyectos (del Master 2026)
 *   3. Muebles (de HC SYG y HC TRRA — los únicos clientes con HC)
 *   4. Compras (de COMPRAS POR PROYECTO 2026)
 *   5. Insumos (de INSUMOS GENERALES 2026 — hojas por mes)
 */

import { PrismaClient } from "@prisma/client";
import type {
  EstadoProyecto,
  Semaforo,
  EstadoItem,
  ProcesoTecnico,
  CategoriaCompra,
  TipoCompra,
  UnidadCompra,
  TipoTercero,
  Estructura,
} from "@prisma/client";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

const db = new PrismaClient();
const BASE = path.resolve(process.cwd(), "Cliente");

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convierte número serial de Excel a Date de JS */
function excelDate(val: unknown): Date | null {
  if (!val || typeof val !== "number" || val < 10000) return null;
  return new Date((val - 25569) * 86400 * 1000);
}

/** Texto limpio */
function str(val: unknown): string {
  return String(val ?? "").trim();
}

/** Número limpio */
function num(val: unknown): number {
  const n = parseFloat(String(val ?? "0").replace(/[$,\s]/g, ""));
  return isNaN(n) ? 0 : n;
}

/** Elimina acentos y normaliza a mayúsculas */
function norm(val: string): string {
  return val
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/** Busca archivo en /Cliente con RegExp */
function findFile(pattern: RegExp): string {
  const files = fs.readdirSync(BASE);
  const found = files.find((f) => pattern.test(f));
  if (!found) throw new Error(`Archivo no encontrado: ${pattern}`);
  return path.join(BASE, found);
}

// ── Enum mappers ─────────────────────────────────────────────────────────────

function mapEstado(raw: string): EstadoProyecto {
  const MAP: Record<string, EstadoProyecto> = {
    ENTREGADO: "ENTREGADO",
    "EN ESPERA": "EN_ESPERA",
    "FRABRICACION": "FABRICACION", // typo del cliente
    FABRICACION: "FABRICACION",
    PAUSA: "PAUSA",
    CANCELADO: "CANCELADO",
    "MATERIAL EN PISO": "MATERIAL_EN_PISO",
    "LISTA DE COMPRAS": "LISTA_DE_COMPRAS",
    DESPIECE: "DESPIECE",
    COMPRAS: "EN_COMPRAS",
    "EN COMPRAS": "EN_COMPRAS",
  };
  return MAP[norm(raw)] ?? "EN_ESPERA";
}

function mapSemaforo(raw: string): Semaforo {
  const MAP: Record<string, Semaforo> = {
    "EN TIEMPO": "EN_TIEMPO",
    ATRASADO: "ATRASADO",
    CRITICO: "CRITICO",
    PRECAUCION: "PRECAUCION",
    PAUSA: "PAUSA",
  };
  return MAP[norm(raw)] ?? "EN_TIEMPO";
}

function mapEstadoItem(raw: string): EstadoItem {
  const MAP: Record<string, EstadoItem> = {
    ESPERA: "ESPERA",
    FABRICACION: "FABRICACION",
    REPROCESO: "REPROCESO",
    PAUSA: "PAUSA",
    CANCELADO: "CANCELADO",
    ENTREGADO: "ENTREGADO",
  };
  return MAP[norm(raw)] ?? "ESPERA";
}

function mapProceso(raw: string): ProcesoTecnico | null {
  const MAP: Record<string, ProcesoTecnico> = {
    HABILITADO: "HABILITADO",
    ARMADO: "ARMADO",
    PULIDO: "PULIDO",
    LACA: "LACA",
    EXTERNO: "EXTERNO",
    COMPLEMENTOS: "COMPLEMENTOS",
    EMPAQUE: "EMPAQUE",
    "LISTO PARA ENTREGA": "LISTO_PARA_ENTREGA",
    ENTREGADO: "ENTREGADO",
  };
  return MAP[norm(raw)] ?? null;
}

function mapEstructura(raw: string): Estructura | null {
  const s = norm(raw);
  if (s === "MDF") return "MDF";
  if (s === "PTR") return "PTR";
  if (s === "N/A" || s === "NA") return "NA";
  return null;
}

function mapTerceros(raw: string): TipoTercero[] {
  if (!raw?.trim()) return [];
  const MAP: Record<string, TipoTercero> = {
    TAPICERIA: "TAPICERIA",
    PIEL: "PIEL",
    MARMOL: "MARMOL",
    ESPEJO: "ESPEJO",
    HERRERIA: "HERRERIA",
    TEJIDO: "TEJIDO",
    ACCESORIOS: "ACCESORIOS",
    ACCS: "ACCESORIOS",
    LED: "OTROS",
    "PIEDRA TEC": "OTROS",
    OTROS: "OTROS",
  };
  return raw
    .split(/[,;]/)
    .map((s) => MAP[norm(s)])
    .filter((v): v is TipoTercero => !!v);
}

function mapCategoria(raw: string): CategoriaCompra {
  const MAP: Record<string, CategoriaCompra> = {
    MDF: "MDF",
    SOLIDO: "SOLIDO",
    COMPLEMENTOS: "COMPLEMENTOS",
    ENVIOS: "ENVIOS",
  };
  return MAP[norm(raw)] ?? "COMPLEMENTOS";
}

function mapUnidad(raw: string): UnidadCompra {
  const MAP: Record<string, UnidadCompra> = {
    HOJA: "HOJA",
    "PIE TABLA": "PIE_TABLA",
    PIEZA: "PIEZA",
    PIEZAS: "PIEZA",
    METRO: "METRO",
    METROS: "METRO",
    PEDIDO: "PEDIDO",
    ENVIO: "ENVIO",
    KILOGRAMO: "KILOGRAMO",
    LITRO: "LITRO",
    LITROS: "LITRO",
    PAQUETE: "PAQUETE",
    JUEGO: "JUEGO",
    GALON: "GALON",
    CAJA: "CAJA",
    CM: "CM",
    ROLLO: "ROLLO",
    RECOLECCION: "RECOLECCION",
    GRUPO: "GRUPO",
  };
  return MAP[norm(raw)] ?? "PIEZA";
}

// ── Step 1: Clientes ──────────────────────────────────────────────────────────

async function importarClientes(masterRows: unknown[][]): Promise<Map<string, string>> {
  console.log("\n📋 Importando clientes...");
  const clienteMap = new Map<string, string>(); // nombre → id

  // Fila de headers
  const hi = masterRows.findIndex((r) => str(r[1]).includes("#PROYECTO"));
  if (hi < 0) throw new Error("No se encontró header en Master");

  const nombres = new Set<string>();
  for (let i = hi + 1; i < masterRows.length; i++) {
    const nombre = str(masterRows[i][2]);
    if (nombre && str(masterRows[i][1])) nombres.add(nombre);
  }

  for (const nombre of nombres) {
    const existing = await db.cliente.findFirst({ where: { nombre } });
    if (existing) {
      clienteMap.set(nombre, existing.id);
    } else {
      const c = await db.cliente.create({ data: { nombre } });
      clienteMap.set(nombre, c.id);
      console.log(`  + ${nombre}`);
    }
  }
  console.log(`  Total clientes: ${clienteMap.size}`);
  return clienteMap;
}

// ── Step 2: Proyectos ─────────────────────────────────────────────────────────

async function importarProyectos(
  masterRows: unknown[][],
  clienteMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("\n📁 Importando proyectos...");
  const proyectoMap = new Map<string, string>(); // codigo → id

  const hi = masterRows.findIndex((r) => str(r[1]).includes("#PROYECTO"));
  let created = 0,
    updated = 0,
    skipped = 0;

  for (let i = hi + 1; i < masterRows.length; i++) {
    const row = masterRows[i];
    const codigo = str(row[1]);
    const clienteNombre = str(row[2]);

    // Saltar filas vacías (placeholders 070-200)
    if (!clienteNombre || !str(row[8])) continue;

    const clienteId = clienteMap.get(clienteNombre);
    if (!clienteId) {
      console.log(`  ! Sin cliente para #${codigo}: "${clienteNombre}"`);
      skipped++;
      continue;
    }

    const qtyItems = Math.max(num(row[3]), 0);
    const po = str(row[4]) || null;
    const fechaPO = excelDate(row[5]);
    const fechaCompromiso = excelDate(row[6]);
    const fechaEntrega = excelDate(row[7]);
    const estado = mapEstado(str(row[8]));
    const semaforo = mapSemaforo(str(row[9]));
    const tieneHC = norm(str(row[10])) === "SI";
    const comentarios = str(row[11]) || null;

    // Columna1 (índice 12): a veces tiene el monto de anticipo/orden
    // Solo usar si es positivo y razonable (> 1000 MXN)
    const montoCol = num(row[12]);
    const montoVendido = montoCol > 1000 ? montoCol : 0;

    // Nombre descriptivo del proyecto: usar P.O. si es texto, si no el código
    const nombre = po && isNaN(Number(po)) ? po : `Proyecto ${codigo}`;

    const data = {
      codigo,
      nombre,
      clienteId,
      estado,
      semaforo,
      tieneHC,
      qtyItems,
      po,
      fechaPO: fechaPO ?? undefined,
      fechaCompromiso: fechaCompromiso ?? undefined,
      fechaEntrega: fechaEntrega ?? undefined,
      montoVendido: montoVendido.toFixed(2),
      comentarios,
      ivaIncluido: true,
      moneda: "MXN" as const,
    };

    try {
      const existing = await db.proyecto.findUnique({ where: { codigo } });
      if (existing) {
        await db.proyecto.update({ where: { codigo }, data });
        proyectoMap.set(codigo, existing.id);
        updated++;
      } else {
        const p = await db.proyecto.create({ data });
        proyectoMap.set(codigo, p.id);
        created++;
      }
    } catch (e) {
      console.log(`  ! Error en proyecto ${codigo}:`, (e as Error).message);
      skipped++;
    }
  }

  console.log(`  Creados: ${created} | Actualizados: ${updated} | Omitidos: ${skipped}`);
  return proyectoMap;
}

// ── Step 3: Muebles de HC ─────────────────────────────────────────────────────

async function importarMueblesHC(
  hcFile: string,
  clienteNombre: string,
  proyectoMap: Map<string, string>,
  clienteMap: Map<string, string>
): Promise<void> {
  const wb = XLSX.readFile(hcFile);
  const wsItems = wb.Sheets["ITEMS"];
  if (!wsItems) {
    console.log(`  ! No se encontró hoja ITEMS en ${path.basename(hcFile)}`);
    return;
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(wsItems, { header: 1, defval: "" });
  const clienteId = clienteMap.get(clienteNombre);
  if (!clienteId) return;

  // Detectar fila de headers (la que tiene "ORDEN" e "ITEM")
  const hi = rows.findIndex((r) => str(r[1]) === "ORDEN" && str(r[2]).includes("ITEM"));
  if (hi < 0) {
    console.log(`  ! No se encontró header ITEMS en ${path.basename(hcFile)}`);
    return;
  }

  const headers = rows[hi].map(str);
  const col = (name: string) => headers.findIndex((h) => h.includes(name));

  const iNo = col("No");
  const iOrden = col("ORDEN");
  const iItem = col("ITEM");
  const iEstructura = col("ESTRUCTURA"); // -1 si no existe (TRRA no tiene)
  const iQty = col("QTY");
  const iTotal = col("TOTAL");
  const iFechaPO = col("FECHA P/O");
  const iFechaComp = col("FECHA COMPROMISO");
  const iMadera = col("MADERA");
  const i3ros = col("3ROS");
  const iEstatus = col("ESTÁTUS") >= 0 ? col("ESTÁTUS") : col("ESTATUS");
  const iProceso = col("PROCESO");
  const iComentarios = col("COMENTARIOS");

  // Agrupar proyectos de este cliente por P.O.
  // Construir mapa: PO_normalizado → proyectoId
  const poMap = new Map<string, string>();
  for (const [codigo, pid] of proyectoMap) {
    const proyecto = await db.proyecto.findUnique({
      where: { id: pid },
      select: { clienteId: true, po: true },
    });
    if (proyecto?.clienteId === clienteId && proyecto.po) {
      poMap.set(norm(proyecto.po), pid);
    }
  }

  let created = 0;
  let sinProyecto = 0;

  for (let i = hi + 1; i < rows.length; i++) {
    const row = rows[i];
    const orden = str(row[iOrden]);
    const nombre = str(row[iItem]);

    if (!nombre || !orden) continue;

    // Buscar proyecto matching este ORDEN (= P.O. del proyecto)
    const proyectoId = poMap.get(norm(orden));
    if (!proyectoId) {
      sinProyecto++;
      continue; // Sin proyecto asignado, skip
    }

    const cantidad = Math.max(num(row[iQty]), 1);
    const monto = num(row[iTotal]);
    const madera = str(row[iMadera]) || null;
    const estructuraRaw = iEstructura >= 0 ? str(row[iEstructura]) : "";
    const estructura = mapEstructura(estructuraRaw);
    const tercerosRaw = str(row[i3ros]);
    const terceros = mapTerceros(tercerosRaw);
    const estadoItem = mapEstadoItem(str(row[iEstatus]));
    const procesoActual = mapProceso(str(row[iProceso]));
    const comentarios = str(row[iComentarios]) || null;
    const fechaCompromiso = excelDate(row[iFechaComp]);
    const orden2 = str(row[iNo]) || null;

    await db.mueble.create({
      data: {
        proyectoId,
        nombre,
        cantidad,
        monto: monto > 0 ? monto.toFixed(2) : undefined,
        madera,
        estructura: estructura ?? undefined,
        terceros,
        estadoItem,
        procesoActual: procesoActual ?? undefined,
        orden: orden2,
        descripcionLarga: comentarios || undefined,
      },
    });
    created++;
  }

  console.log(
    `  ${path.basename(hcFile)}: ${created} muebles creados (${sinProyecto} sin proyecto asignado)`
  );
}

// ── Step 4: Compras ───────────────────────────────────────────────────────────

async function importarCompras(
  comprasFile: string,
  clienteMap: Map<string, string>
): Promise<void> {
  console.log("\n🛒 Importando compras...");

  const wb = XLSX.readFile(comprasFile);
  const ws = wb.Sheets["Compras"];
  if (!ws) throw new Error("No se encontró hoja Compras");

  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  // Row 1 = headers
  const hi = 0;
  if (!str(rows[hi][0]).includes("Categor")) {
    throw new Error("Headers inesperados en Compras");
  }

  // Construir mapa cliente_norm → list of proyectos
  const clienteProyectos = new Map<string, { id: string; po: string | null; nombre: string }[]>();
  for (const [nombre, cid] of clienteMap) {
    const proyectos = await db.proyecto.findMany({
      where: { clienteId: cid },
      select: { id: true, po: true, nombre: true },
    });
    clienteProyectos.set(norm(nombre), proyectos);
  }

  function buscarProyecto(clienteRaw: string, proyectoRaw: string): string | null {
    const cn = norm(clienteRaw);
    // Intentar con el nombre exacto y también con nombre sin acento o espacio
    let proyectos =
      clienteProyectos.get(cn) ??
      [...clienteProyectos.entries()].find(([k]) => k.startsWith(cn.split(" ")[0]))?.[1];

    if (!proyectos || proyectos.length === 0) return null;

    const pn = norm(proyectoRaw);
    // 1. Match exacto por P.O.
    let match = proyectos.find((p) => p.po && norm(p.po) === pn);
    if (match) return match.id;
    // 2. Match exacto por nombre
    match = proyectos.find((p) => norm(p.nombre) === pn);
    if (match) return match.id;
    // 3. Match parcial por P.O. (contains)
    match = proyectos.find((p) => p.po && (norm(p.po).includes(pn) || pn.includes(norm(p.po))));
    if (match) return match.id;

    return null;
  }

  let created = 0;
  let sinProyecto = 0;

  for (let i = hi + 1; i < rows.length; i++) {
    const row = rows[i];
    const categoriaRaw = str(row[0]);
    if (!categoriaRaw) continue; // fila vacía

    const clienteRaw = str(row[1]);
    const proyectoRaw = str(row[2]);
    const muebleNombre = str(row[3]) || null;
    const descripcion = str(row[4]);
    const proveedor = str(row[5]) || "Sin especificar";
    const idFactura = str(row[6]) || null;
    const qty = num(row[7]);
    const unidadRaw = str(row[8]);
    const importe = num(row[9]);
    const iva = num(row[10]);
    const total = num(row[11]);
    const fechaRaw = row[12];
    const tipoRaw = str(row[13]);
    const metodoPago = str(row[14]) || "Sin especificar";

    const fecha = typeof fechaRaw === "number" ? excelDate(fechaRaw) : new Date(str(fechaRaw));
    if (!fecha || isNaN(fecha.getTime())) continue;
    if (!descripcion) continue;

    const proyectoId = buscarProyecto(clienteRaw, proyectoRaw);
    if (!proyectoId) sinProyecto++;

    await db.compra.create({
      data: {
        fecha,
        categoria: mapCategoria(categoriaRaw),
        tipo: tipoRaw ? (norm(tipoRaw).includes("ADICIONAL") ? "ADICIONAL" : "INICIAL") : "INICIAL",
        clienteRelacionado: clienteRaw || null,
        proyectoId,
        muebleNombre,
        descripcion,
        proveedor,
        idFactura,
        qty: qty.toString(),
        unidad: mapUnidad(unidadRaw),
        importe: importe.toFixed(2),
        iva: iva.toFixed(2),
        total: total.toFixed(2),
        metodoPago,
      },
    });
    created++;
  }

  console.log(`  Total compras: ${created} (${sinProyecto} sin proyecto asignado)`);
}

// ── Step 5: Insumos ───────────────────────────────────────────────────────────

async function importarInsumos(insumosFile: string): Promise<void> {
  console.log("\n📦 Importando insumos generales...");

  const wb = XLSX.readFile(insumosFile);
  let totalCreated = 0;

  // Hoja por mes: ENE, FEB, MAR, ABRIL, MAYO, ...
  const MESES: Record<string, number> = {
    ENE: 1, FEB: 2, MAR: 3, ABRIL: 4, MAYO: 5, JUN: 6,
    JUL: 7, AGO: 8, SEP: 9, OCT: 10, NOV: 11, DIC: 12,
  };

  for (const sheetName of wb.SheetNames) {
    const mes = MESES[sheetName.toUpperCase()];
    if (!mes) continue; // Skip hojas no-mes (DataValidation, etc.)

    const ws = wb.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    // Buscar fila de headers (la que tiene "DESCRIPCIÓN")
    const hi = rows.findIndex((r) => str(r[1]).includes("DESCRIPCI"));
    if (hi < 0) continue;

    let sheetCreated = 0;

    for (let i = hi + 1; i < rows.length; i++) {
      const row = rows[i];
      const descripcion = str(row[1]);
      if (!descripcion) continue;

      const proveedor = str(row[2]) || "Sin especificar";
      const idFactura = str(row[3]) || null;
      const qty = num(row[4]);
      const unidadRaw = str(row[5]);
      const importe = num(row[6]);
      const iva = num(row[7]);
      const total = num(row[8]);
      const fechaRaw = row[9];
      const metodoPago = str(row[10]) || "Sin especificar";

      const fecha = typeof fechaRaw === "number" ? excelDate(fechaRaw) : new Date(str(fechaRaw));
      if (!fecha || isNaN(fecha.getTime())) continue;

      await db.insumo.create({
        data: {
          fecha,
          descripcion,
          proveedor,
          idFactura,
          qty: qty.toString(),
          unidad: mapUnidad(unidadRaw),
          importe: importe.toFixed(2),
          iva: iva.toFixed(2),
          total: total.toFixed(2),
          metodoPago,
        },
      });
      sheetCreated++;
    }

    console.log(`  ${sheetName}: ${sheetCreated} insumos`);
    totalCreated += sheetCreated;
  }

  console.log(`  Total insumos: ${totalCreated}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Iniciando importación de datos del cliente...");
  console.log(`   Carpeta: ${BASE}\n`);

  // Leer archivo Master
  const masterFile = findFile(/STER 2026/);
  if (!fs.existsSync(masterFile) && !masterFile.includes("MINISTRACI"))
    throw new Error("No se encontró MÁSTER 2026.xlsx");

  // Buscar el master correcto (no el de Administración)
  const files = fs.readdirSync(BASE);
  const masterFilename = files.find(
    (f) => f.includes("STER 2026") && !f.includes("MINISTRACI")
  )!;
  const masterPath = path.join(BASE, masterFilename);
  const masterWB = XLSX.readFile(masterPath);
  const masterWS = masterWB.Sheets["PROYECTOS 2026"];
  const masterRows: unknown[][] = XLSX.utils.sheet_to_json(masterWS, {
    header: 1,
    defval: "",
  });

  // 1. Clientes
  const clienteMap = await importarClientes(masterRows);

  // 2. Proyectos
  const proyectoMap = await importarProyectos(masterRows, clienteMap);

  // 3. Muebles de HC files
  console.log("\n🪑 Importando muebles desde Hojas de Control...");

  // HC SYG
  try {
    const hcSYG = path.join(BASE, files.find((f) => f.includes("SYG"))!);
    // Limpiar muebles existentes de proyectos SYG antes de reimportar
    const syg = await db.cliente.findFirst({ where: { nombre: "SYG" } });
    if (syg) {
      const proyectosSYG = await db.proyecto.findMany({
        where: { clienteId: syg.id },
        select: { id: true },
      });
      for (const p of proyectosSYG) {
        await db.mueble.deleteMany({ where: { proyectoId: p.id } });
      }
    }
    await importarMueblesHC(hcSYG, "SYG", proyectoMap, clienteMap);
  } catch (e) {
    console.log("  ! Error HC SYG:", (e as Error).message);
  }

  // HC TRRA
  try {
    const hcTRRA = path.join(BASE, files.find((f) => f.includes("TRRA"))!);
    const trra = await db.cliente.findFirst({ where: { nombre: "TRRA" } });
    if (trra) {
      const proyectosTRRA = await db.proyecto.findMany({
        where: { clienteId: trra.id },
        select: { id: true },
      });
      for (const p of proyectosTRRA) {
        await db.mueble.deleteMany({ where: { proyectoId: p.id } });
      }
    }
    await importarMueblesHC(hcTRRA, "TRRA", proyectoMap, clienteMap);
  } catch (e) {
    console.log("  ! Error HC TRRA:", (e as Error).message);
  }

  // 4. Compras
  try {
    // Verificar si ya hay compras importadas
    const totalCompras = await db.compra.count();
    if (totalCompras > 0) {
      console.log(
        `\n🛒 Ya existen ${totalCompras} compras. Omitiendo (borrar manualmente si desea reimportar).`
      );
    } else {
      const comprasFile = path.join(BASE, files.find((f) => f.includes("COMPRAS"))!);
      await importarCompras(comprasFile, clienteMap);
    }
  } catch (e) {
    console.log("  ! Error Compras:", (e as Error).message);
  }

  // 5. Insumos
  try {
    const totalInsumos = await db.insumo.count();
    if (totalInsumos > 0) {
      console.log(
        `\n📦 Ya existen ${totalInsumos} insumos. Omitiendo (borrar manualmente si desea reimportar).`
      );
    } else {
      const insumosFile = path.join(BASE, files.find((f) => f.includes("INSUMOS"))!);
      await importarInsumos(insumosFile);
    }
  } catch (e) {
    console.log("  ! Error Insumos:", (e as Error).message);
  }

  // Resumen final
  const [totalClientes, totalProyectos, totalMuebles, totalComprasF, totalInsumosF] =
    await Promise.all([
      db.cliente.count(),
      db.proyecto.count(),
      db.mueble.count(),
      db.compra.count(),
      db.insumo.count(),
    ]);

  console.log("\n✅ Importación completada:");
  console.log(`   Clientes:  ${totalClientes}`);
  console.log(`   Proyectos: ${totalProyectos}`);
  console.log(`   Muebles:   ${totalMuebles}`);
  console.log(`   Compras:   ${totalComprasF}`);
  console.log(`   Insumos:   ${totalInsumosF}`);
  console.log(
    "\n⚠️  Registro de producción y Gantt deben cargarse manualmente desde el módulo Producción."
  );
}

main()
  .catch((e) => {
    console.error("❌ Error fatal:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
