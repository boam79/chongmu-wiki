import { Sidebar } from "@/components/layout/Sidebar";

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-[272px] flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
