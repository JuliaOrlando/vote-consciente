import type { ReactNode } from "react";
import { AppNavigation } from "@/components/AppNavigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <AppNavigation />
        <main className="min-w-0 flex-1 pb-28 md:pb-10">
          <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
