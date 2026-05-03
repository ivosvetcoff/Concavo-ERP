import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/features/Sidebar";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { PrivacyProvider } from "@/lib/privacy";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <PrivacyProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
        <CommandPalette />
      </div>
    </PrivacyProvider>
  );
}
