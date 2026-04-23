import { listarCompras, listarProyectosParaSelector } from "@/server/queries/compras";
import { isOwner } from "@/lib/auth";
import { ComprasTabla } from "@/components/features/compras/ComprasTabla";

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const owner = await isOwner();

  const filtros = {
    categoriaCompra: sp.categoria as never,
    tipoCompra: sp.tipo as never,
    proyectoId: sp.proyecto,
    desde: sp.desde,
    hasta: sp.hasta,
  };

  const [compras, proyectos] = await Promise.all([
    listarCompras(owner, filtros),
    listarProyectosParaSelector(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Compras</h1>
      </div>
      <ComprasTabla
        compras={compras}
        proyectos={proyectos}
        isOwner={owner}
        filtrosActivos={filtros}
      />
    </div>
  );
}
