import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { isOwner } from "@/lib/auth";
import { obtenerDatosCierre } from "@/server/queries/cierre";
import { calcularUtilidadProyecto, calcularUtilidadMes } from "@/server/calculations/utilidad";
import Decimal from "decimal.js";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function mxn(value: number | string): string {
  return `$${parseFloat(value.toString()).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export async function GET(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const owner = await isOwner();
  if (!owner) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // ── Params ──────────────────────────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const ahora = new Date();
  const mes = searchParams.get("mes") ? parseInt(searchParams.get("mes")!) : ahora.getMonth() + 1;
  const anio = searchParams.get("anio") ? parseInt(searchParams.get("anio")!) : ahora.getFullYear();
  const soloContador = searchParams.get("contador") === "1";

  const mesLabel = MESES[mes - 1];

  // ── Data ────────────────────────────────────────────────────────────────────
  const datos = await obtenerDatosCierre(mes, anio);

  const proyectosCalculados = datos.proyectos
    .filter((p) => !soloContador || p.facturado)
    .map((p) => {
      const res = calcularUtilidadProyecto({
        montoVendido: p.montoVendido,
        materialDirecto: p.comprasTotal,
        registros: p.registros,
        qtyItemsProyecto: p.qtyItemsProyecto,
        totalInsumosMes: datos.totalInsumosMes,
        totalMOIMes: datos.totalMOIMes,
        totalItemsMes: datos.totalItemsMes,
      });
      return { ...p, res };
    });

  const proyectosParaMes = proyectosCalculados.map((p) => ({ utilidad: p.res.utilidad }));
  const gastosFijos = datos.totalGastosFijosMes !== "0" ? [datos.totalGastosFijosMes] : [];
  const resultadoMes = calcularUtilidadMes({ proyectos: proyectosParaMes, gastosFijos });

  const totalIngresosFacturado = datos.proyectos
    .filter((p) => p.facturado)
    .reduce((acc, p) => acc.plus(p.montoVendido), new Decimal(0));
  const totalIngresosEfectivo = datos.proyectos
    .filter((p) => !p.facturado)
    .reduce((acc, p) => acc.plus(p.montoVendido), new Decimal(0));

  // ── Workbook ─────────────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = "Concavo ERP";
  wb.created = new Date();

  // ════════════════════════════════════════════════════════════════════════════
  // HOJA 1: RESUMEN DEL MES
  // ════════════════════════════════════════════════════════════════════════════
  const wsResumen = wb.addWorksheet("Resumen del mes", {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
  });

  // Styles
  const hStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: "FFFFFFFF" }, size: 10 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF3730A3" } },
    alignment: { vertical: "middle", horizontal: "center", wrapText: true },
    border: {
      bottom: { style: "thin", color: { argb: "FFE0E7FF" } },
    },
  };
  const labelStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 10 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } },
  };
  const mxnStyle: Partial<ExcelJS.Style> = {
    numFmt: "$#,##0.00",
    alignment: { horizontal: "right" },
  };
  const pctStyle: Partial<ExcelJS.Style> = {
    numFmt: "0.00%",
    alignment: { horizontal: "right" },
  };

  // Título
  wsResumen.mergeCells("A1:J1");
  const titleCell = wsResumen.getCell("A1");
  titleCell.value = `MASTER ADMINISTRATIVO — ${mesLabel.toUpperCase()} ${anio}${soloContador ? " (solo facturado)" : ""}`;
  titleCell.style = {
    font: { bold: true, size: 14, color: { argb: "FF1E1B4B" } },
    alignment: { horizontal: "center", vertical: "middle" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } },
  };
  wsResumen.getRow(1).height = 30;

  wsResumen.addRow([]);

  // Ingresos del mes
  wsResumen.mergeCells("A3:J3");
  const ingresosTitle = wsResumen.getCell("A3");
  ingresosTitle.value = "INGRESOS DEL MES";
  ingresosTitle.style = { ...hStyle };
  wsResumen.getRow(3).height = 20;

  const ingresosData = [
    ["Facturado", totalIngresosFacturado.toNumber()],
    ["Efectivo", totalIngresosEfectivo.toNumber()],
    ["TOTAL INGRESOS", totalIngresosFacturado.plus(totalIngresosEfectivo).toNumber()],
  ];
  ingresosData.forEach(([label, value], i) => {
    const row = wsResumen.addRow([label, value]);
    row.getCell(1).style = { ...labelStyle, font: { bold: i === 2, size: 10 } };
    row.getCell(2).style = { ...mxnStyle, font: { bold: i === 2 } };
  });

  wsResumen.addRow([]);

  // Egresos del mes
  const egresosTitleRow = wsResumen.addRow(["EGRESOS DEL MES"]);
  wsResumen.mergeCells(`A${egresosTitleRow.number}:J${egresosTitleRow.number}`);
  egresosTitleRow.getCell(1).style = { ...hStyle };
  egresosTitleRow.height = 20;

  const egresoData = [
    ["Insumos generales (prorateados)", parseFloat(datos.totalInsumosMes)],
    ["M.O. indirecta (prorateada)", parseFloat(datos.totalMOIMes)],
    ["Gastos fijos del mes", parseFloat(datos.totalGastosFijosMes)],
  ];
  egresoData.forEach(([label, value]) => {
    const row = wsResumen.addRow([label, value]);
    row.getCell(1).style = labelStyle;
    row.getCell(2).style = mxnStyle;
  });

  wsResumen.addRow([]);

  // Utilidad neta
  const utilTitleRow = wsResumen.addRow(["RESULTADO NETO DEL MES"]);
  wsResumen.mergeCells(`A${utilTitleRow.number}:J${utilTitleRow.number}`);
  utilTitleRow.getCell(1).style = { ...hStyle };
  utilTitleRow.height = 20;

  const utilData = [
    ["Utilidad bruta de proyectos", resultadoMes.utilidadProyectosTotal.toNumber()],
    ["Gastos fijos", resultadoMes.costoFijoTotal.toNumber()],
    ["UTILIDAD NETA DEL MES", resultadoMes.utilidadNetaMes.toNumber()],
  ];
  utilData.forEach(([label, value], i) => {
    const row = wsResumen.addRow([label, value]);
    row.getCell(1).style = { ...labelStyle, font: { bold: i === 2, size: i === 2 ? 12 : 10 } };
    row.getCell(2).style = {
      ...mxnStyle,
      font: { bold: i === 2, size: i === 2 ? 12 : 10 },
      fill: i === 2
        ? { type: "pattern", pattern: "solid", fgColor: { argb: resultadoMes.utilidadNetaMes.gte(0) ? "FFD1FAE5" : "FFFEE2E2" } }
        : undefined,
    };
  });

  wsResumen.getColumn(1).width = 38;
  wsResumen.getColumn(2).width = 18;

  // ════════════════════════════════════════════════════════════════════════════
  // HOJA 2: PROYECTOS ENTREGADOS (con fórmulas)
  // ════════════════════════════════════════════════════════════════════════════
  const wsProyectos = wb.addWorksheet("Proyectos entregados", {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
  });

  // Título
  wsProyectos.mergeCells("A1:L1");
  const ptitleCell = wsProyectos.getCell("A1");
  ptitleCell.value = `PROYECTOS ENTREGADOS — ${mesLabel.toUpperCase()} ${anio}`;
  ptitleCell.style = {
    font: { bold: true, size: 13, color: { argb: "FF1E1B4B" } },
    alignment: { horizontal: "center", vertical: "middle" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } },
  };
  wsProyectos.getRow(1).height = 28;

  wsProyectos.addRow([]);

  // Cabecera de tabla
  const headers = [
    "#Proyecto", "Cliente", "Entrega", "Ítems",
    "Monto vendido", "Material directo", "Prop. insumos", "Prop. M.O.I.",
    "M.O. directa", "Costo total", "Utilidad", "% s/ venta",
  ];
  const headerRow = wsProyectos.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.style = hStyle;
  });
  headerRow.height = 22;

  // Collect row numbers for formula references
  const dataStartRow = 4;
  proyectosCalculados.forEach((p, i) => {
    const rowNum = dataStartRow + i;
    const row = wsProyectos.addRow([
      p.codigo,
      `${p.nombre} — ${p.clienteNombre}`,
      p.fechaEntrega,
      p.qtyItemsProyecto,
      parseFloat(p.montoVendido),
      parseFloat(p.comprasTotal),                        // material directo
      p.res.proporcionalInsumos.toNumber(),              // prop. insumos
      p.res.proporcionalMOI.toNumber(),                  // prop. M.O.I.
      p.res.costoMODirecta.toNumber(),                   // M.O. directa
      // Costo total como fórmula: F + G + H + I
      { formula: `F${rowNum}+G${rowNum}+H${rowNum}+I${rowNum}`, result: p.res.costoProyecto.toNumber() },
      // Utilidad: Monto - Costo total
      { formula: `E${rowNum}-J${rowNum}`, result: p.res.utilidad.toNumber() },
      // % sobre venta
      { formula: `K${rowNum}/E${rowNum}`, result: p.res.utilidadSobreVenta.toNumber() },
    ]);

    // Apply styles
    const isEven = i % 2 === 0;
    const bgColor = isEven ? "FFFAFAFF" : "FFFFFFFF";
    row.eachCell((cell) => {
      cell.style = {
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } },
        font: { size: 10 },
      };
    });
    row.getCell(1).style = { ...row.getCell(1).style, font: { bold: true, size: 10, color: { argb: "FF4338CA" } } };
    row.getCell(3).numFmt = "DD/MM/YYYY";
    row.getCell(3).style = { ...row.getCell(3).style, alignment: { horizontal: "center" } };
    row.getCell(4).style = { ...row.getCell(4).style, alignment: { horizontal: "center" } };
    // MXN columns: E-K
    for (let c = 5; c <= 11; c++) {
      row.getCell(c).numFmt = "$#,##0.00";
      row.getCell(c).style = { ...row.getCell(c).style, numFmt: "$#,##0.00", alignment: { horizontal: "right" } };
    }
    // % column
    row.getCell(12).numFmt = "0.00%";
    row.getCell(12).style = {
      ...row.getCell(12).style,
      numFmt: "0.00%",
      alignment: { horizontal: "right" },
      font: {
        bold: true, size: 10,
        color: { argb: p.res.utilidadSobreVenta.gte(0.5) ? "FF065F46" : p.res.utilidadSobreVenta.gte(0.3) ? "FF92400E" : "FF991B1B" },
      },
    };
  });

  // Totals row
  const totalsRow = wsProyectos.rowCount + 1;
  const lastDataRow = totalsRow - 1;
  const totRow = wsProyectos.addRow([
    "TOTALES", "",
    "",
    { formula: `SUM(D${dataStartRow}:D${lastDataRow})`, result: proyectosCalculados.reduce((s, p) => s + p.qtyItemsProyecto, 0) },
    { formula: `SUM(E${dataStartRow}:E${lastDataRow})`, result: proyectosCalculados.reduce((s, p) => s + parseFloat(p.montoVendido), 0) },
    { formula: `SUM(F${dataStartRow}:F${lastDataRow})`, result: proyectosCalculados.reduce((s, p) => s + parseFloat(p.comprasTotal), 0) },
    { formula: `SUM(G${dataStartRow}:G${lastDataRow})`, result: proyectosCalculados.reduce((s, p) => s + p.res.proporcionalInsumos.toNumber(), 0) },
    { formula: `SUM(H${dataStartRow}:H${lastDataRow})`, result: proyectosCalculados.reduce((s, p) => s + p.res.proporcionalMOI.toNumber(), 0) },
    { formula: `SUM(I${dataStartRow}:I${lastDataRow})`, result: proyectosCalculados.reduce((s, p) => s + p.res.costoMODirecta.toNumber(), 0) },
    { formula: `SUM(J${dataStartRow}:J${lastDataRow})`, result: proyectosCalculados.reduce((s, p) => s + p.res.costoProyecto.toNumber(), 0) },
    { formula: `SUM(K${dataStartRow}:K${lastDataRow})`, result: resultadoMes.utilidadProyectosTotal.toNumber() },
    { formula: `K${totalsRow}/E${totalsRow}`, result: resultadoMes.utilidadProyectosTotal.div(
        proyectosCalculados.reduce((s, p) => s + parseFloat(p.montoVendido), 0) || 1
      ).toNumber() },
  ]);
  totRow.eachCell((cell) => {
    cell.style = {
      font: { bold: true, size: 10 },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } },
      border: { top: { style: "medium", color: { argb: "FF6366F1" } } },
    };
  });
  for (let c = 5; c <= 11; c++) {
    totRow.getCell(c).numFmt = "$#,##0.00";
    totRow.getCell(c).style = { ...totRow.getCell(c).style, numFmt: "$#,##0.00", alignment: { horizontal: "right" } };
  }
  totRow.getCell(12).numFmt = "0.00%";
  totRow.getCell(12).style = { ...totRow.getCell(12).style, numFmt: "0.00%", alignment: { horizontal: "right" } };

  // Column widths
  wsProyectos.getColumn(1).width = 14;
  wsProyectos.getColumn(2).width = 40;
  wsProyectos.getColumn(3).width = 14;
  wsProyectos.getColumn(4).width = 8;
  for (let c = 5; c <= 11; c++) wsProyectos.getColumn(c).width = 16;
  wsProyectos.getColumn(12).width = 12;

  // Freeze header
  wsProyectos.views = [{ state: "frozen", ySplit: 3 }];

  // ════════════════════════════════════════════════════════════════════════════
  // HOJA 3: DESGLOSE POR PROYECTO (detalle fórmula Master Administrativo)
  // ════════════════════════════════════════════════════════════════════════════
  const wsDetalle = wb.addWorksheet("Desglose por proyecto");

  let detalleRow = 1;

  // Context header
  wsDetalle.mergeCells("A1:D1");
  wsDetalle.getCell("A1").value = `DESGLOSE POR PROYECTO — ${mesLabel.toUpperCase()} ${anio}`;
  wsDetalle.getCell("A1").style = {
    font: { bold: true, size: 13, color: { argb: "FF1E1B4B" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } },
    alignment: { horizontal: "center" },
  };
  wsDetalle.getRow(1).height = 26;
  detalleRow++;
  wsDetalle.addRow([]);
  detalleRow++;

  // Context: prorrateo denominador
  wsDetalle.addRow(["Total ítems entregados en el mes (denominador prorrateo):", datos.totalItemsMes, "", ""]);
  wsDetalle.getRow(detalleRow).getCell(1).style = { font: { bold: true, size: 10 } };
  wsDetalle.getRow(detalleRow).getCell(2).style = { alignment: { horizontal: "center" }, font: { bold: true } };
  detalleRow++;
  wsDetalle.addRow(["Total insumos generales del mes:", { formula: `${parseFloat(datos.totalInsumosMes)}`, result: parseFloat(datos.totalInsumosMes) }]);
  wsDetalle.getRow(detalleRow).getCell(1).style = { font: { bold: true, size: 10 } };
  wsDetalle.getRow(detalleRow).getCell(2).numFmt = "$#,##0.00";
  detalleRow++;
  wsDetalle.addRow(["Total M.O. indirecta del mes:", { formula: `${parseFloat(datos.totalMOIMes)}`, result: parseFloat(datos.totalMOIMes) }]);
  wsDetalle.getRow(detalleRow).getCell(1).style = { font: { bold: true, size: 10 } };
  wsDetalle.getRow(detalleRow).getCell(2).numFmt = "$#,##0.00";
  detalleRow++;

  wsDetalle.addRow([]);
  detalleRow++;

  proyectosCalculados.forEach((p) => {
    const { res } = p;

    // Project header
    wsDetalle.mergeCells(`A${detalleRow}:D${detalleRow}`);
    wsDetalle.getCell(`A${detalleRow}`).value =
      `PROYECTO #${p.codigo} — ${p.nombre} — ${p.clienteNombre} — ${p.facturado ? "FACTURADO" : "EFECTIVO"}`;
    wsDetalle.getCell(`A${detalleRow}`).style = {
      font: { bold: true, size: 11, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4338CA" } },
      alignment: { horizontal: "left" },
    };
    wsDetalle.getRow(detalleRow).height = 20;
    detalleRow++;

    // Rows: label | formula/value
    const rows: [string, ExcelJS.CellValue, boolean?][] = [
      ["Monto de cotización", parseFloat(p.montoVendido)],
      ["Qty ítems proyecto", p.qtyItemsProyecto],
      ["Material directo (sum compras)", parseFloat(p.comprasTotal)],
      ["Proporcional insumos  =  (totalInsumos ÷ totalItems) × qtyItems", res.proporcionalInsumos.toNumber()],
      ["Proporcional M.O.I.   =  (totalMOI ÷ totalItems) × qtyItems", res.proporcionalMOI.toNumber()],
      ["Costo M.O. directa    =  Σ (horasTO × tarifaTO) + (horasTE × tarifaTE)", res.costoMODirecta.toNumber()],
      ["COSTO TOTAL DEL PROYECTO", res.costoProyecto.toNumber(), true],
      ["UTILIDAD              =  Monto − Costo", res.utilidad.toNumber(), true],
      ["% Utilidad s/ venta   =  Utilidad ÷ Monto", res.utilidadSobreVenta.toNumber(), true],
      ["% Utilidad s/ costo   =  Utilidad ÷ Costo", res.utilidadSobreCosto.toNumber(), true],
    ];

    rows.forEach(([label, value, bold]) => {
      const r = wsDetalle.addRow([label, value]);
      r.getCell(1).style = {
        font: { bold: !!bold, size: 10 },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: bold ? "FFE0E7FF" : "FFFAFAFA" } },
      };
      const isPercent = label.startsWith("%");
      r.getCell(2).numFmt = isPercent ? "0.00%" : "$#,##0.00";
      if (label === "Qty ítems proyecto") r.getCell(2).numFmt = "0";
      r.getCell(2).style = {
        font: { bold: !!bold, size: 10, color: bold && typeof value === "number" && value < 0 ? { argb: "FF991B1B" } : undefined },
        numFmt: r.getCell(2).numFmt,
        alignment: { horizontal: "right" },
        fill: r.getCell(1).style.fill,
      };
      detalleRow++;
    });

    wsDetalle.addRow([]);
    detalleRow++;
  });

  wsDetalle.getColumn(1).width = 62;
  wsDetalle.getColumn(2).width = 16;

  // ── Stream response ──────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const filename = `Cierre_${mesLabel}_${anio}${soloContador ? "_contador" : ""}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
