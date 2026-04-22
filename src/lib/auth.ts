import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

export async function getAuthUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  return user;
}

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("No autenticado");
  }
  return user;
}

export async function requireRole(role: Role) {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new Error("Sin permisos suficientes");
  }
  return user;
}

export async function requireOwner() {
  return requireRole("OWNER");
}

export async function isOwner(): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === "OWNER";
}

export async function syncUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ");

  const user = await db.user.upsert({
    where: { clerkId: clerkUser.id },
    update: { email, name },
    create: {
      clerkId: clerkUser.id,
      email,
      name,
      role: "ENCARGADO",
    },
  });

  return user;
}
