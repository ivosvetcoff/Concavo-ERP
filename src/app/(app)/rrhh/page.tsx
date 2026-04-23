import { redirect } from "next/navigation";
import { isOwner } from "@/lib/auth";
import { listarAusencias } from "@/server/queries/rrhh";
import { AusenciasTabla } from "@/components/features/rrhh/AusenciasTabla";
import { db } from "@/lib/db";

export default async function RrhhPage() {
  const owner = await isOwner();
  if (!owner) redirect("/dashboard");

  const ausencias = await listarAusencias();
  const empleados = await db.empleado.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, apellido: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Recursos Humanos</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Gestión de ausencias, vacaciones y permisos
        </p>
      </div>

      <AusenciasTabla ausencias={ausencias} empleados={empleados} />
    </div>
  );
}
