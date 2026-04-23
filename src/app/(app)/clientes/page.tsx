import { listarClientes } from "@/server/queries/clientes";
import { ClientesTabla } from "@/components/features/clientes/ClientesTabla";

export default async function ClientesPage() {
  const clientes = await listarClientes();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
      </div>
      <ClientesTabla clientes={clientes} />
    </div>
  );
}
