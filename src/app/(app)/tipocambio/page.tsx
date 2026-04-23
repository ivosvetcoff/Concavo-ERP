import { redirect } from "next/navigation";
import { isOwner } from "@/lib/auth";
import { listarTiposCambio } from "@/server/actions/tipo-cambio";
import { TipoCambioView } from "@/components/features/tipocambio/TipoCambioView";

export default async function TipoCambioPage() {
  const owner = await isOwner();
  if (!owner) redirect("/dashboard");

  const historial = await listarTiposCambio();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tipos de Cambio</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Historial de tipos de cambio USD/MXN para proyectos internacionales
        </p>
      </div>

      <TipoCambioView historial={historial} />
    </div>
  );
}
