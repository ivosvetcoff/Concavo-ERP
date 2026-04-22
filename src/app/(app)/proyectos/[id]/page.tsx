import { notFound } from "next/navigation";
import Link from "next/link";
import { obtenerProyecto } from "@/server/queries/proyecto-detalle";
import { isOwner } from "@/lib/auth";
import { HeaderProyecto } from "@/components/features/proyectos/detalle/HeaderProyecto";
import { TabMuebles } from "@/components/features/proyectos/detalle/TabMuebles";
import { TabCompras } from "@/components/features/proyectos/detalle/TabCompras";
import { TabCFDI } from "@/components/features/proyectos/detalle/TabCFDI";
import { TabHistorial } from "@/components/features/proyectos/detalle/TabHistorial";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";

export default async function ProyectoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const owner = await isOwner();
  const proyecto = await obtenerProyecto(id, owner);

  if (!proyecto) notFound();

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
