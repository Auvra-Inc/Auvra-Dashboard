import type { ReactNode } from "react";

// Grey header row, hairline rows; columns are passed as <th>/<td> by the caller
export function DataTable({ head, children, minWidth = 520 }: { head: ReactNode; children: ReactNode; minWidth?: number }) {
  return (
    // relative keeps sr-only header labels inside the scroll area
    <div className="relative overflow-x-auto">
      <table className="w-full text-[13px] text-[#1c1a18]" style={{ minWidth }}>
        <thead>
          <tr className="bg-[#f8f9fb] text-[12px] text-[#6b7180] [&>th]:h-[38px] [&>th]:font-normal [&>th:first-child]:pl-[17px] [&>th:last-child]:pr-[17px]">{head}</tr>
        </thead>
        <tbody className="[&>tr]:border-t [&>tr]:border-[#eceef2] [&>tr:first-child]:border-t-0 [&_td:first-child]:pl-[17px] [&_td:last-child]:pr-[17px] [&_th:first-child]:pl-[17px]">
          {children}
        </tbody>
      </table>
    </div>
  );
}
