import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clerkId = process.argv[2];
  const email = process.argv[3];
  const name = process.argv[4] ?? "Owner";

  if (!clerkId || !email) {
    console.error("Uso: tsx scripts/set-owner.ts <clerkId> <email> [nombre]");
    console.error("Ejemplo: tsx scripts/set-owner.ts user_abc123 ivo@ejemplo.com 'Ivo'");
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: { role: "OWNER", email, name },
    create: { clerkId, email, name, role: "OWNER" },
  });

  console.log(`✓ Usuario creado/actualizado: ${user.name} <${user.email}> — rol: ${user.role}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
