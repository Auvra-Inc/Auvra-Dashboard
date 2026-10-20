import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { useHeaderSlots } from "./headerSlots";

// Renders a page's buttons (e.g. "Export report") on the right of the shared header
export function PageActions({ children }: { children: ReactNode }) {
  const { actionsEl } = useHeaderSlots();
  return actionsEl ? createPortal(children, actionsEl) : null;
}
