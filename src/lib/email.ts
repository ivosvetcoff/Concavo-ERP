import { Resend } from "resend";

// Graceful no-op when RESEND_API_KEY is not set (dev / local)
const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM ?? "ERP Concavo <erp@concavo.mx>";
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? "";

// ── Email templates ───────────────────────────────────────────────────────────

function baseHtml(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
  body { font-family: Inter, sans-serif; background: #f9fafb; margin: 0; padding: 24px; }
  .card { background: white; border-radius: 8px; padding: 24px; max-width: 540px; margin: 0 auto; border: 1px solid #e5e7eb; }
  h2 { color: #1e1b4b; font-size: 18px; margin: 0 0 12px; }
  p { color: #374151; font-size: 14px; line-height: 1.6; margin: 6px 0; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .tag-ok { background: #d1fae5; color: #065f46; }
  .tag-warn { background: #fef3c7; color: #92400e; }
  .tag-danger { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 20px; font-size: 11px; color: #9ca3af; }
  a.btn { display: inline-block; margin-top: 14px; padding: 8px 18px; background: #4f46e5; color: white; border-radius: 6px; text-decoration: none; font-size: 13px; }
</style></head>
<body><div class="card">
  <h2>${title}</h2>
  ${body}
  <p class="footer">Sistema ERP Concavo &mdash; mensaje automático</p>
</div></body>
</html>`;
}

// ── Send helpers ──────────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string) {
  if (!resendClient) {
    console.log(`[email no-op] To: ${to} | Subject: ${subject}`);
    return;
  }
  await resendClient.emails.send({ from: FROM, to, subject, html });
}

// ── M15: Alert triggers ───────────────────────────────────────────────────────

export async function emailProyectoEntregado(payload: {
  codigo: string;
  nombre: string;
  cliente: string;
  monto: string;
  proyectoId: string;
}) {
  if (!OWNER_EMAIL) return;
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/proyectos/${payload.proyectoId}`;
  await send(
    OWNER_EMAIL,
    `✅ Proyecto #${payload.codigo} entregado`,
    baseHtml(
      `Proyecto entregado: #${payload.codigo}`,
      `<p><strong>Proyecto:</strong> ${payload.nombre}</p>
       <p><strong>Cliente:</strong> ${payload.cliente}</p>
       <p><strong>Monto:</strong> ${payload.monto}</p>
       <span class="badge tag-ok">ENTREGADO</span>
       <br><a class="btn" href="${url}">Ver detalle</a>`
    )
  );
}

export async function emailProyectoCritico(payload: {
  codigo: string;
  nombre: string;
  cliente: string;
  fechaCompromiso: string;
  proyectoId: string;
}) {
  if (!OWNER_EMAIL) return;
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/proyectos/${payload.proyectoId}`;
  await send(
    OWNER_EMAIL,
    `🔴 Proyecto #${payload.codigo} marcado como CRÍTICO`,
    baseHtml(
      `Alerta crítica: #${payload.codigo}`,
      `<p><strong>Proyecto:</strong> ${payload.nombre}</p>
       <p><strong>Cliente:</strong> ${payload.cliente}</p>
       <p><strong>Fecha compromiso:</strong> ${payload.fechaCompromiso}</p>
       <span class="badge tag-danger">CRÍTICO</span>
       <br><a class="btn" href="${url}">Ver detalle</a>`
    )
  );
}

export async function emailCierreMensual(payload: {
  mes: string;
  anio: number;
  utilidadNeta: string;
  proyectosEntregados: number;
}) {
  if (!OWNER_EMAIL) return;
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/cierre`;
  const positivo = !payload.utilidadNeta.startsWith("-");
  await send(
    OWNER_EMAIL,
    `📊 Cierre mensual ${payload.mes} ${payload.anio}`,
    baseHtml(
      `Cierre mensual: ${payload.mes} ${payload.anio}`,
      `<p><strong>Proyectos entregados:</strong> ${payload.proyectosEntregados}</p>
       <p><strong>Utilidad neta:</strong> ${payload.utilidadNeta}</p>
       <span class="badge ${positivo ? "tag-ok" : "tag-danger"}">${positivo ? "POSITIVO" : "NEGATIVO"}</span>
       <br><a class="btn" href="${url}">Ver cierre</a>`
    )
  );
}
