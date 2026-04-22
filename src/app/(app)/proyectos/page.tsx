import { listarProyectos } from "@/server/queries/proyectos";
import { listarClientesSelect } from "@/server/queries/clientes";
import { isOwner } from "@/lib/auth";
import { TablaProyectos } from "@/components/features/proyectos/TablaProyectos";
import { NuevoProyectoSheet } from "@/components/features/proyectos/NuevoProyectoSheet";

export default async function ProyectosPage() {
  const [proyectos, clientes, owner] = await Promise.all([
    listarProyectos(),
    listarClientesSelect(),
    isOwner(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Proyectos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Master de proyectos — {new Date().getFullYear()}
          </p>
        </div>
        <NuevoProyectoSheet clientes={clientes} isOwner={owner} />
      </div>
      <TablaProyectos data={proyectos} isOwner={owner} />
    </div>
  );
}
