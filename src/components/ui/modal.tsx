import { useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "./useDialogFocus";
import closeIcon from "../../assets/dashboard/close-14.svg";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  // Buttons row at the bottom right
  footer?: ReactNode;
  width?: number;
};

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-[#eceef2] hover:bg-[#f4f5f8]"
    >
      <img src={closeIcon} alt="" width={14} height={14} />
    </button>
  );
}

// Centred dialog over a dimmed page; Escape and the backdrop close it, Tab stays inside
export function Modal({ title, onClose, children, footer, width = 520 }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocus(panelRef, onClose);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(28,26,24,0.45)]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ maxWidth: width }}
        className="relative max-h-full w-full overflow-y-auto rounded-[20px] bg-white p-[26px] text-left text-[#1c1a18] shadow-[0_24px_64px_rgba(28,26,24,0.18)]"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="pt-2 text-[20px] font-medium">
            {title}
          </h2>
          <CloseButton onClick={onClose} />
        </div>
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
