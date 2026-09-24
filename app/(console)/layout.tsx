"use client";

import { Suspense } from "react";
import { AppLayout } from "@/components/shell/app-layout";
import { AdminGate } from "@/components/shell/admin-gate";
import { SessionProvider } from "@/components/shell/session";
import { Sidebar } from "@/components/shell/sidebar";

export default function ConsoleLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider>
      <AppLayout
        sidebar={
          <Suspense>
            <Sidebar />
          </Suspense>
        }
      >
        <div className="mx-auto max-w-screen-2xl">
          <AdminGate>{children}</AdminGate>
        </div>
      </AppLayout>
    </SessionProvider>
  );
}
