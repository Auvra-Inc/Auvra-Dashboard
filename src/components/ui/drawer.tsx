import { useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseButton } from "./modal";
import { useDialogFocus } from "./useDialogFocus";

// Panel docked to the right over a dimmed page (KYC review); full width on phones
export function Drawer({ title, onClose, children, footer, width = 480 }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocus(panelRef, onClose);

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[rgba(28,26,24,0.45)]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ maxWidth: width }}
        className="relative flex h-full w-full flex-col bg-white text-left text-[#1c1a18] shadow-[0_24px_64px_rgba(28,26,24,0.18)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#eceef2] px-6 py-5">
          <h2 id={titleId} className="min-w-0 text-[18px] font-medium">
            {title}
          </h2>
          <CloseButton onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2.5 px-6 pb-6 pt-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
