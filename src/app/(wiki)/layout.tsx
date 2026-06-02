import { Suspense } from "react";
import { ExcelRibbon } from "@/components/layout/ExcelRibbon";
import { ExcelSheetTabs } from "@/components/layout/ExcelSheetTabs";
import { ExcelStatusBar } from "@/components/layout/ExcelStatusBar";
import { ExcelTitleBar } from "@/components/layout/ExcelTitleBar";

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="excel-window">
      <ExcelTitleBar />
      <ExcelRibbon />
      <div className="excel-grid-area flex min-h-0 flex-1 flex-col">{children}</div>
      <Suspense fallback={<div className="excel-sheet-tabs h-8" />}>
        <ExcelSheetTabs />
      </Suspense>
      <Suspense fallback={<div className="excel-status-bar h-6" />}>
        <ExcelStatusBar />
      </Suspense>
    </div>
  );
}
