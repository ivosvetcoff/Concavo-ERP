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

  // Proyecto de muestra
  const proyecto = await prisma.proyecto.upsert({
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
      comentarios: "Proyecto de muestra del seed",
    },
  });

  console.log(`Proyecto: ${proyecto.codigo} — ${proyecto.nombre}`);

  // Muebles del proyecto
  await Promise.all([
    prisma.mueble.upsert({
      where: { id: "seed-mueble-1" },
      update: {},
      create: {
        id: "seed-mueble-1",
        proyectoId: proyecto.id,
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
        proyectoId: proyecto.id,
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
        proyectoId: proyecto.id,
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
