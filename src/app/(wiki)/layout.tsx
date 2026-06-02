import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense
        fallback={
          <aside className="fixed left-0 top-0 z-50 h-screen w-[272px] border-r border-border bg-sidebar/95" />
        }
      >
        <Sidebar />
      </Suspense>
      <div className="ml-[272px] flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
