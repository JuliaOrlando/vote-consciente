import type { ReactNode } from "react";
import { AppNavigation } from "@/components/AppNavigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-clip">
      <div className="flex min-h-screen w-full">
        <AppNavigation />
        <main className="min-w-0 flex-1 overflow-x-clip pb-28 md:pb-10">
          <div className="mx-auto flex min-h-full w-full max-w-[1540px] flex-col px-4 py-5 sm:px-6 md:px-7 md:py-7 xl:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
