import { notFound } from "next/navigation";
import Link from "next/link";
import { obtenerProyecto } from "@/server/queries/proyecto-detalle";
import {
  obtenerRegistrosProyecto,
  obtenerFinanzasProyecto,
  type MODetalleEmpleado,
} from "@/server/queries/proyecto-finanzas";
import { calcularUtilidadProyecto } from "@/server/calculations/utilidad";
import { isOwner } from "@/lib/auth";
import { HeaderProyecto } from "@/components/features/proyectos/detalle/HeaderProyecto";
import { TabMuebles } from "@/components/features/proyectos/detalle/TabMuebles";
import { TabCompras } from "@/components/features/proyectos/detalle/TabCompras";
import { TabAnticipos } from "@/components/features/proyectos/detalle/TabAnticipos";
import { TabCFDI } from "@/components/features/proyectos/detalle/TabCFDI";
import { TabHistorial } from "@/components/features/proyectos/detalle/TabHistorial";
import { TabProduccion } from "@/components/features/proyectos/detalle/TabProduccion";
import { TabFinanzas } from "@/components/features/proyectos/detalle/TabFinanzas";
import { TabPlanificacion } from "@/components/features/proyectos/detalle/TabPlanificacion";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import Decimal from "decimal.js";
import { obtenerPlanProyecto } from "@/server/queries/gantt-plan";

export default async function ProyectoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const owner = await isOwner();
  const proyecto = await obtenerProyecto(id, owner);

  if (!proyecto) notFound();

  // Compute compras total (visible to owner only, compras always fetched)
  const comprasTotal = proyecto.compras
    .reduce((s, c) => s + parseFloat(c.total?.toString() ?? "0"), 0)
    .toFixed(2);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Link
        href="/proyectos"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Proyectos
      </Link>

      {/* Header */}
      <HeaderProyecto proyecto={proyecto} isOwner={owner} />

      {/* Tabs */}
      <Tabs defaultValue="muebles">
        <TabsList>
          <TabsTrigger value="muebles">
            Muebles ({proyecto.muebles.length})
          </TabsTrigger>
          <TabsTrigger value="compras">
            Compras ({proyecto.compras.length})
          </TabsTrigger>
          {owner && (
            <TabsTrigger value="anticipos">
              Anticipos ({proyecto.anticipos?.length ?? 0})
            </TabsTrigger>
          )}
          <TabsTrigger value="produccion">Producción</TabsTrigger>
          <TabsTrigger value="planificacion">Planificación</TabsTrigger>
          {owner && (
            <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
          )}
          {owner && (
            <TabsTrigger value="cfdi">CFDI</TabsTrigger>
          )}
          <TabsTrigger value="historial">
            Historial ({proyecto.eventos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="muebles" className="mt-4">
          <TabMuebles muebles={proyecto.muebles} proyectoId={proyecto.id} />
        </TabsContent>

        <TabsContent value="compras" className="mt-4">
          <TabCompras compras={proyecto.compras} isOwner={owner} />
        </TabsContent>

        {owner && proyecto.anticipos && proyecto.pagos && proyecto.montoVendido && (
          <TabsContent value="anticipos" className="mt-4">
            <TabAnticipos
              anticipos={proyecto.anticipos}
              pagos={proyecto.pagos}
              proyectoId={proyecto.id}
              montoProyecto={proyecto.montoVendido.toString()}
            />
          </TabsContent>
        )}

        <TabsContent value="produccion" className="mt-4">
          <TabProduccionAsync proyectoId={proyecto.id} />
        </TabsContent>

        <TabsContent value="planificacion" className="mt-4">
          <TabPlanificacionAsync proyectoId={proyecto.id} />
        </TabsContent>

        {owner && proyecto.montoVendido && (
          <TabsContent value="finanzas" className="mt-4">
            <TabFinanzasAsync
              proyectoId={proyecto.id}
              montoVendido={proyecto.montoVendido.toString()}
              qtyItems={proyecto.qtyItems}
              isEntregado={proyecto.estado === "ENTREGADO"}
              fechaEntrega={proyecto.fechaEntrega?.toISOString() ?? null}
              comprasTotal={comprasTotal}
            />
          </TabsContent>
        )}

        {owner && (
          <TabsContent value="cfdi" className="mt-4">
            <TabCFDI proyecto={proyecto} />
          </TabsContent>
        )}

        <TabsContent value="historial" className="mt-4">
          <TabHistorial eventos={proyecto.eventos} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Async Server Component wrappers ─────────────────────────────────────────

async function TabPlanificacionAsync({ proyectoId }: { proyectoId: string }) {
  const planData = await obtenerPlanProyecto(proyectoId);
  return <TabPlanificacion proyectoId={proyectoId} planData={planData} />;
}

async function TabProduccionAsync({ proyectoId }: { proyectoId: string }) {
  const registros = await obtenerRegistrosProyecto(proyectoId);
  return <TabProduccion registros={registros} />;
}

async function TabFinanzasAsync({
  proyectoId,
  montoVendido,
  qtyItems,
  isEntregado,
  fechaEntrega,
  comprasTotal,
}: {
  proyectoId: string;
  montoVendido: string;
  qtyItems: number;
  isEntregado: boolean;
  fechaEntrega: string | null;
  comprasTotal: string;
}) {
  let finanzasCalculadas: {
    materialDirecto: string;
    proporcionalInsumos: string;
    proporcionalMOI: string;
    costoMODirecta: string;
    costoProyecto: string;
    utilidad: string;
    utilidadSobreVentaPct: string;
    utilidadSobreCostoPct: string;
  } | null = null;
  let moDetalle: MODetalleEmpleado[] = [];

  if (isEntregado && fechaEntrega) {
    const datos = await obtenerFinanzasProyecto(proyectoId, new Date(fechaEntrega));
    moDetalle = datos.moDetalle;

    const res = calcularUtilidadProyecto({
      montoVendido,
      materialDirecto: comprasTotal,
      registros: datos.registrosParaCalculo,
      qtyItemsProyecto: qtyItems,
      totalInsumosMes: datos.totalInsumosMes,
      totalMOIMes: datos.totalMOIMes,
      totalItemsMes: datos.totalItemsMes,
    });

    finanzasCalculadas = {
      materialDirecto: res.materialDirecto.toFixed(2),
      proporcionalInsumos: res.proporcionalInsumos.toFixed(2),
      proporcionalMOI: res.proporcionalMOI.toFixed(2),
      costoMODirecta: res.costoMODirecta.toFixed(2),
      costoProyecto: res.costoProyecto.toFixed(2),
      utilidad: res.utilidad.toFixed(2),
      utilidadSobreVentaPct: res.utilidadSobreVenta.mul(100).toFixed(2),
      utilidadSobreCostoPct: res.utilidadSobreCosto.mul(100).toFixed(2),
    };
  } else {
    // Project not yet delivered: show MO detail only (partial estimate)
    const registros = await db.registroProduccion.findMany({
      where: { mueble: { proyectoId } },
      select: {
        proceso: true,
        horasTO: true,
        horasTE: true,
        empleado: {
          select: { nombre: true, tarifaHoraTO: true, tarifaHoraTE: true },
        },
      },
    });
    moDetalle = registros.map((r) => {
      const to = new Decimal(r.horasTO.toString());
      const te = new Decimal(r.horasTE.toString());
      const tarifaTO = new Decimal(r.empleado.tarifaHoraTO.toString());
      const tarifaTE = new Decimal(r.empleado.tarifaHoraTE.toString());
      return {
        empleadoNombre: r.empleado.nombre,
        proceso: r.proceso,
        horasTO: to.toString(),
        horasTE: te.toString(),
        tarifaTO: tarifaTO.toFixed(2),
        tarifaTE: tarifaTE.toFixed(2),
        costoTO: to.mul(tarifaTO).toFixed(2),
        costoTE: te.mul(tarifaTE).toFixed(2),
        costoTotal: to.mul(tarifaTO).plus(te.mul(tarifaTE)).toFixed(2),
      };
    });
  }

  return (
    <TabFinanzas
      montoVendido={montoVendido}
      qtyItems={qtyItems}
      isEntregado={isEntregado}
      finanzas={finanzasCalculadas}
      moDetalle={moDetalle}
      comprasTotal={comprasTotal}
    />
  );
}
