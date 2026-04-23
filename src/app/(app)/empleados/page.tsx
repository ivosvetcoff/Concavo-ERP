import { isOwner } from "@/lib/auth";
import { listarEmpleados } from "@/server/queries/empleados";
import { EmpleadoSheet } from "@/components/features/empleados/EmpleadoSheet";
import { EmpleadosTabla } from "@/components/features/empleados/EmpleadosTabla";

export default async function EmpleadosPage() {
  const owner = await isOwner();
  const empleados = await listarEmpleados(owner);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Empleados</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {empleados.length} operadores registrados
          </p>
        </div>
        {owner && <EmpleadoSheet mode="crear" />}
      </div>

      <EmpleadosTabla empleados={empleados} isOwner={owner} />
    </div>
  );
}
