# Tareas Pendientes / Últimas Actualizaciones

- [x] Update Todos
- [x] Role filtering en listarProyectos y obtenerProyecto
- [x] Actualizar páginas para pasar owner a queries
- [x] Actualizar schema Zod de mueble (estadoItem, estructura, monto)
- [x] Server actions para Anticipo (registrar + eliminar)
- [x] TabAnticipos en detalle de proyecto (solo OWNER)
- [x] MuebleSheet: agregar campos estructura, estadoItem, todos los procesos y terceros
- [x] Fix null safety: TabCompras (totales), HeaderProyecto (montoVendido), TabCFDI (facturado)
- [x] Prisma client regenerado (prisma generate)
- [x] Módulo Compras: página global /compras con tabla + CompraSheet para registrar
- [x] Módulo de cálculos (utilidad) con tests
- [x] Clientes CRUD (/clientes)
- [x] Command Palette (Cmd+K) — con búsqueda de proyectos, clientes y empleados
- [x] Dashboard rediseño: KPIs, GraficoEstados (Recharts), GraficoProcesos (Recharts)
- [x] Módulo Empleados: CRUD completo con tarifas, colores Gantt, historial
- [x] TabProduccion + TabFinanzas en detalle de proyecto (conectados)
- [x] Export Excel del Cierre Mensual con fórmulas reales (exceljs) — 3 hojas
- [x] Fix bug planilla producción: rango de semana era 1 día en lugar de 7
- [x] Command Palette: agregar empleados + todas las acciones rápidas (8 destinos)
- [x] Sidebar: reordenar menú (Producción sube, Empleados a sección Personas)

## Fase 1 — Estado: ✅ COMPLETA

Todos los módulos M1–M11 están operativos:
- M1 Proyectos · M2 WIP/Muebles · M3 Compras · M4 Insumos · M5 Gastos Fijos
- M6 Anticipos/Pagos · M7 Empleados · M8 Producción Semanal
- M9 Cierre Mensual + Export Excel · M10 Command Palette · M11 Dashboard

## Fase 2 (completada)

- [x] M12 Gantt de producción (`frappe-gantt`) — `/gantt`
- [x] M13 Nómina semanal (pre-nómina desde sueldo base + T.E.) — `/nomina`
- [x] M14 RRHH avanzado (vacaciones, ausencias) — `/rrhh`
- [x] M15 Alertas email (Resend)
- [x] M16 Upload comprobantes (Vercel Blob) — integrado en compras/insumos
- [x] M17 Multi-moneda operativa (MXN + USD con tipo de cambio) — `/tipocambio`
- [x] M18 Reporte de ocupación del taller con historial 8 semanas — `/ocupacion`
