import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // Clientes
  const cliente1 = await prisma.cliente.upsert({
    where: { id: "seed-cliente-syg" },
    update: {},
    create: {
      id: "seed-cliente-syg",
      nombre: "SYG",
      contacto: "Contacto SYG",
      telefono: "3310000001",
    },
  });

  const cliente2 = await prisma.cliente.upsert({
    where: { id: "seed-cliente-aagnes" },
    update: {},
    create: {
      id: "seed-cliente-aagnes",
      nombre: "AAGNES",
      telefono: "3310000002",
    },
  });

  const cliente3 = await prisma.cliente.upsert({
    where: { id: "seed-cliente-trra" },
    update: {},
    create: {
      id: "seed-cliente-trra",
      nombre: "TRRA",
      telefono: "3310000003",
    },
  });

  console.log(`Clientes creados: ${cliente1.nombre}, ${cliente2.nombre}, ${cliente3.nombre}`);

  // Empleados
  const empleados = await Promise.all([
    prisma.empleado.upsert({
      where: { id: "seed-emp-pepe" },
      update: {},
      create: {
        id: "seed-emp-pepe",
        nombre: "Pepe",
        puesto: "Carpintero",
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
        puesto: "Carpintero",
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
        puesto: "Carpintero",
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
        puesto: "Carpintero",
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
        puesto: "Carpintero",
        activo: true,
        color: "#7C3AED",
      },
    }),
  ]);

  console.log(`Empleados creados: ${empleados.map((e) => e.nombre).join(", ")}`);

  // Catálogo de modelos
  const modelos = await Promise.all([
    prisma.modeloMueble.upsert({
      where: { codigo: "CAM-VLN-25" },
      update: {},
      create: {
        codigo: "CAM-VLN-25",
        nombre: "CAMA VILNA 25 KS",
        linea: "VILNA",
        maderaTipica: "NOGAL",
        activo: true,
      },
    }),
    prisma.modeloMueble.upsert({
      where: { codigo: "MES-HYG-01" },
      update: {},
      create: {
        codigo: "MES-HYG-01",
        nombre: "MESA HYGGE",
        linea: "HYGGE",
        maderaTipica: "PAROTA",
        activo: true,
      },
    }),
    prisma.modeloMueble.upsert({
      where: { codigo: "COM-PDG-01" },
      update: {},
      create: {
        codigo: "COM-PDG-01",
        nombre: "COMODA PEDREGAL",
        linea: "PEDREGAL",
        maderaTipica: "ROSAMORADA",
        activo: true,
      },
    }),
  ]);

  console.log(`Modelos creados: ${modelos.map((m) => m.nombre).join(", ")}`);

  // Proyecto de ejemplo
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
      moneda: "MXN",
      tieneHC: true,
      qtyItems: 3,
      comentarios: "Proyecto de muestra del seed",
    },
  });

  console.log(`Proyecto creado: ${proyecto.codigo} — ${proyecto.nombre}`);

  // Muebles del proyecto
  await Promise.all([
    prisma.mueble.upsert({
      where: { id: "seed-mueble-1" },
      update: {},
      create: {
        id: "seed-mueble-1",
        proyectoId: proyecto.id,
        nombre: "CAMA VILNA 25 KS",
        cantidad: 1,
        madera: "NOGAL",
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
        nombre: "BURÓ VILNA",
        cantidad: 2,
        madera: "NOGAL",
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
        procesoActual: null,
        orden: "3",
      },
    }),
  ]);

  console.log("Muebles de ejemplo creados.");
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
