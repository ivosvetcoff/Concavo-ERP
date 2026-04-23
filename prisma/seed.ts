import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // Clientes
  const cliente1 = await prisma.cliente.upsert({
    where: { id: "seed-cliente-syg" },
    update: {},
    create: { id: "seed-cliente-syg", nombre: "SYG", telefono: "3310000001" },
  });
  const cliente2 = await prisma.cliente.upsert({
    where: { id: "seed-cliente-aagnes" },
    update: {},
    create: { id: "seed-cliente-aagnes", nombre: "AAGNES", telefono: "3310000002" },
  });
  const cliente3 = await prisma.cliente.upsert({
    where: { id: "seed-cliente-trra" },
    update: {},
    create: { id: "seed-cliente-trra", nombre: "TRRA", telefono: "3310000003" },
  });
  const cliente4 = await prisma.cliente.upsert({
    where: { id: "seed-cliente-rts" },
    update: {},
    create: { id: "seed-cliente-rts", nombre: "RTS", telefono: "3310000004" },
  });

  console.log(`Clientes: ${[cliente1, cliente2, cliente3, cliente4].map((c) => c.nombre).join(", ")}`);

  // Empleados — tarifas de septiembre 2025 del Master Administrativo
  const empleados = await Promise.all([
    prisma.empleado.upsert({
      where: { id: "seed-emp-pepe" },
      update: {},
      create: {
        id: "seed-emp-pepe",
        nombre: "Pepe",
        especialidad: "HABILITADOR",
        tarifaHoraTO: "66.67",
        tarifaHoraTE: "133.34",
        sueldoSemanal: "2000.00",
        activo: true,
        color: "#4F46E5",
      },
    }),
    prisma.empleado.upsert({
      where: { id: "seed-emp-marisol" },
      update: {},
      create: {
        id: "seed-emp-marisol",
        nombre: "Marisol",
        especialidad: "HABILITADOR",
        tarifaHoraTO: "66.67",
        tarifaHoraTE: "133.34",
        sueldoSemanal: "2000.00",
        activo: true,
        color: "#059669",
      },
    }),
    prisma.empleado.upsert({
      where: { id: "seed-emp-cristian" },
      update: {},
      create: {
        id: "seed-emp-cristian",
        nombre: "Cristian",
        especialidad: "ARMADOR",
        tarifaHoraTO: "73.33",
        tarifaHoraTE: "146.66",
        sueldoSemanal: "2200.00",
        activo: true,
        color: "#D97706",
      },
    }),
    prisma.empleado.upsert({
      where: { id: "seed-emp-beto" },
      update: {},
      create: {
        id: "seed-emp-beto",
        nombre: "Beto",
        especialidad: "ARMADOR",
        tarifaHoraTO: "77.78",
        tarifaHoraTE: "155.56",
        sueldoSemanal: "2400.00",
        activo: true,
        color: "#DC2626",
      },
    }),
    prisma.empleado.upsert({
      where: { id: "seed-emp-chava" },
      update: {},
      create: {
        id: "seed-emp-chava",
        nombre: "Chava",
        especialidad: "ARMADOR",
        tarifaHoraTO: "73.33",
        tarifaHoraTE: "146.66",
        sueldoSemanal: "2200.00",
        activo: true,
        color: "#7C3AED",
      },
    }),
    prisma.empleado.upsert({
      where: { id: "seed-emp-ramon" },
      update: {},
      create: {
        id: "seed-emp-ramon",
        nombre: "Ramón",
        especialidad: "ARMADOR",
        tarifaHoraTO: "88.89",
        tarifaHoraTE: "177.78",
        sueldoSemanal: "2700.00",
        activo: true,
        color: "#0891B2",
      },
    }),
    prisma.empleado.upsert({
      where: { id: "seed-emp-suli" },
      update: {},
      create: {
        id: "seed-emp-suli",
        nombre: "Suli",
        especialidad: "PULIDOR",
        tarifaHoraTO: "60.00",
        tarifaHoraTE: "120.00",
        sueldoSemanal: "1800.00",
        activo: true,
        color: "#BE185D",
      },
    }),
    prisma.empleado.upsert({
      where: { id: "seed-emp-jona" },
      update: {},
      create: {
        id: "seed-emp-jona",
        nombre: "Jona",
        especialidad: "PULIDOR",
        tarifaHoraTO: "60.00",
        tarifaHoraTE: "120.00",
        sueldoSemanal: "1800.00",
        activo: true,
        color: "#65A30D",
      },
    }),
    prisma.empleado.upsert({
      where: { id: "seed-emp-citla" },
      update: {},
      create: {
        id: "seed-emp-citla",
        nombre: "Citla",
        especialidad: "LAQUEADOR",
        tarifaHoraTO: "73.33",
        tarifaHoraTE: "146.66",
        sueldoSemanal: "2200.00",
        activo: true,
        color: "#EA580C",
      },
    }),
  ]);

  console.log(`Empleados: ${empleados.map((e) => e.nombre).join(", ")}`);

  // ===== PROYECTO 058 — en fabricación =====
  const proyecto058 = await prisma.proyecto.upsert({
    where: { codigo: "058" },
    update: {},
    create: {
      codigo: "058",
      nombre: "Recámara principal SYG",
      clienteId: cliente1.id,
      estado: "FABRICACION",
      semaforo: "EN_TIEMPO",
      montoVendido: "185000.00",
      ivaIncluido: true,
      moneda: "MXN",
      tieneHC: true,
      qtyItems: 3,
      fechaCompromiso: new Date("2026-05-15"),
      comentarios: "Proyecto de muestra del seed",
    },
  });

  await Promise.all([
    prisma.mueble.upsert({
      where: { id: "seed-mueble-1" },
      update: {},
      create: {
        id: "seed-mueble-1",
        proyectoId: proyecto058.id,
        nombre: "CAMA PRINCIPAL",
        cantidad: 1,
        madera: "NOGAL",
        estructura: "MDF",
        estadoItem: "FABRICACION",
        procesoActual: "ARMADO",
        orden: "1",
      },
    }),
    prisma.mueble.upsert({
      where: { id: "seed-mueble-2" },
      update: {},
      create: {
        id: "seed-mueble-2",
        proyectoId: proyecto058.id,
        nombre: "BURÓ",
        cantidad: 2,
        madera: "NOGAL",
        estructura: "MDF",
        estadoItem: "FABRICACION",
        procesoActual: "HABILITADO",
        orden: "2",
      },
    }),
    prisma.mueble.upsert({
      where: { id: "seed-mueble-3" },
      update: {},
      create: {
        id: "seed-mueble-3",
        proyectoId: proyecto058.id,
        nombre: "VESTIDOR",
        cantidad: 1,
        madera: "NOGAL",
        estructura: "PTR",
        estadoItem: "ESPERA",
        procesoActual: null,
        orden: "3",
      },
    }),
  ]);

  console.log(`Proyecto: ${proyecto058.codigo} — ${proyecto058.nombre}`);

  // ===== PROYECTO 059 — en compras, AAGNES =====
  const proyecto059 = await prisma.proyecto.upsert({
    where: { codigo: "059" },
    update: {},
    create: {
      codigo: "059",
      nombre: "Sala comedor AAGNES",
      clienteId: cliente2.id,
      estado: "EN_COMPRAS",
      semaforo: "EN_TIEMPO",
      montoVendido: "92000.00",
      ivaIncluido: true,
      moneda: "MXN",
      tieneHC: false,
      qtyItems: 4,
      fechaCompromiso: new Date("2026-06-01"),
      po: "AAGNES-2026-04",
      fechaPO: new Date("2026-04-10"),
    },
  });

  await Promise.all([
    prisma.mueble.upsert({
      where: { id: "seed-mueble-4" },
      update: {},
      create: {
        id: "seed-mueble-4",
        proyectoId: proyecto059.id,
        nombre: "MESA COMEDOR",
        cantidad: 1,
        madera: "PAROTA",
        estructura: "PTR",
        estadoItem: "ESPERA",
        procesoActual: null,
        orden: "1",
      },
    }),
    prisma.mueble.upsert({
      where: { id: "seed-mueble-5" },
      update: {},
      create: {
        id: "seed-mueble-5",
        proyectoId: proyecto059.id,
        nombre: "SILLA",
        cantidad: 6,
        madera: "PAROTA",
        estructura: "MDF",
        terceros: ["TAPICERIA"],
        estadoItem: "ESPERA",
        procesoActual: null,
        orden: "2",
      },
    }),
    prisma.mueble.upsert({
      where: { id: "seed-mueble-6" },
      update: {},
      create: {
        id: "seed-mueble-6",
        proyectoId: proyecto059.id,
        nombre: "APARADOR",
        cantidad: 1,
        madera: "PAROTA",
        estructura: "MDF",
        estadoItem: "ESPERA",
        procesoActual: null,
        orden: "3",
      },
    }),
    prisma.mueble.upsert({
      where: { id: "seed-mueble-7" },
      update: {},
      create: {
        id: "seed-mueble-7",
        proyectoId: proyecto059.id,
        nombre: "VITRINA",
        cantidad: 1,
        madera: "PAROTA",
        estructura: "MDF",
        terceros: ["ESPEJO"],
        estadoItem: "ESPERA",
        procesoActual: null,
        orden: "4",
      },
    }),
  ]);

  console.log(`Proyecto: ${proyecto059.codigo} — ${proyecto059.nombre}`);

  // ===== PROYECTO 057 — entregado, TRRA (con CFDI) =====
  const proyecto057 = await prisma.proyecto.upsert({
    where: { codigo: "057" },
    update: {},
    create: {
      codigo: "057",
      nombre: "Estudio ejecutivo TRRA",
      clienteId: cliente3.id,
      estado: "ENTREGADO",
      semaforo: "EN_TIEMPO",
      montoVendido: "210000.00",
      ivaIncluido: true,
      moneda: "MXN",
      tieneHC: true,
      qtyItems: 5,
      facturado: true,
      fechaCompromiso: new Date("2026-04-10"),
      fechaEntrega: new Date("2026-04-08"),
      po: "TRRA-099",
      fechaPO: new Date("2026-02-20"),
      comentarios: "Entregado antes del compromiso. Cliente muy satisfecho.",
    },
  });

  await Promise.all([
    prisma.mueble.upsert({
      where: { id: "seed-mueble-8" },
      update: {},
      create: {
        id: "seed-mueble-8",
        proyectoId: proyecto057.id,
        nombre: "ESCRITORIO",
        cantidad: 1,
        madera: "ROSAMORADA",
        estructura: "PTR",
        estadoItem: "ENTREGADO",
        procesoActual: "ENTREGADO",
        orden: "1",
      },
    }),
    prisma.mueble.upsert({
      where: { id: "seed-mueble-9" },
      update: {},
      create: {
        id: "seed-mueble-9",
        proyectoId: proyecto057.id,
        nombre: "LIBRERO EMPOTRADO",
        cantidad: 1,
        madera: "ROSAMORADA",
        estructura: "MDF",
        estadoItem: "ENTREGADO",
        procesoActual: "ENTREGADO",
        orden: "2",
      },
    }),
    prisma.mueble.upsert({
      where: { id: "seed-mueble-10" },
      update: {},
      create: {
        id: "seed-mueble-10",
        proyectoId: proyecto057.id,
        nombre: "SILLA EJECUTIVA",
        cantidad: 2,
        madera: "ROSAMORADA",
        estructura: "PTR",
        terceros: ["PIEL"],
        estadoItem: "ENTREGADO",
        procesoActual: "ENTREGADO",
        orden: "3",
      },
    }),
  ]);

  console.log(`Proyecto: ${proyecto057.codigo} — ${proyecto057.nombre}`);

  // ===== PROYECTO 060 — por empacar, crítico en tiempo, RTS =====
  const proyecto060 = await prisma.proyecto.upsert({
    where: { codigo: "060" },
    update: {},
    create: {
      codigo: "060",
      nombre: "Cocina integral RTS",
      clienteId: cliente4.id,
      estado: "POR_EMPACAR",
      semaforo: "CRITICO",
      montoVendido: "340000.00",
      ivaIncluido: true,
      moneda: "MXN",
      tieneHC: true,
      qtyItems: 7,
      fechaCompromiso: new Date("2026-04-25"),
      po: "RTS-2026-03",
      fechaPO: new Date("2026-03-01"),
      comentarios: "Urgente — cliente solicita entrega sin falta el 25/04.",
    },
  });

  await Promise.all([
    prisma.mueble.upsert({
      where: { id: "seed-mueble-11" },
      update: {},
      create: {
        id: "seed-mueble-11",
        proyectoId: proyecto060.id,
        nombre: "ISLA CENTRAL",
        cantidad: 1,
        madera: "TECA",
        estructura: "PTR",
        estadoItem: "FABRICACION",
        procesoActual: "LISTO_PARA_ENTREGA",
        orden: "1",
      },
    }),
    prisma.mueble.upsert({
      where: { id: "seed-mueble-12" },
      update: {},
      create: {
        id: "seed-mueble-12",
        proyectoId: proyecto060.id,
        nombre: "GABINETES ALTOS",
        cantidad: 4,
        madera: "TECA",
        estructura: "MDF",
        estadoItem: "FABRICACION",
        procesoActual: "LISTO_PARA_ENTREGA",
        orden: "2",
      },
    }),
    prisma.mueble.upsert({
      where: { id: "seed-mueble-13" },
      update: {},
      create: {
        id: "seed-mueble-13",
        proyectoId: proyecto060.id,
        nombre: "GABINETES BAJOS",
        cantidad: 4,
        madera: "TECA",
        estructura: "MDF",
        estadoItem: "FABRICACION",
        procesoActual: "LISTO_PARA_ENTREGA",
        orden: "3",
      },
    }),
  ]);

  console.log(`Proyecto: ${proyecto060.codigo} — ${proyecto060.nombre}`);
  console.log("Muebles creados.");
  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
