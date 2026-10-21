import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { StatusPill } from "../ui/controls";
import type { PillTone } from "../ui/controls";
import { Modal } from "../ui/modal";
import { SUSPEND_REASONS, kycLabel, statusLabel } from "../../data/users";
import type { KycStatus, UserStatus } from "../../data/users";
import { readBack } from "../../utils/navigation";
import chevronLeftIcon from "../../assets/dashboard/chevron-left-13.svg";
import closeIcon from "../../assets/dashboard/close-13.svg";
import lockWhiteIcon from "../../assets/dashboard/lock-13-white.svg";

const STATUS_TONES: Record<UserStatus, PillTone> = { active: "green", pending: "amber", suspended: "red" };
const KYC_TONES: Record<KycStatus, PillTone> = { verified: "green", pending: "amber", not_started: "gray", rejected: "red" };

export function UserStatusPill({ status }: { status: UserStatus }) {
  return <StatusPill tone={STATUS_TONES[status]}>{statusLabel(status)}</StatusPill>;
}

// "KYC verified" on the profile header, plain "Verified" in the table
export function KycPill({ kyc, prefixed = false }: { kyc: KycStatus; prefixed?: boolean }) {
  const label = prefixed ? `KYC ${kycLabel(kyc).toLowerCase()}` : kycLabel(kyc);
  return <StatusPill tone={KYC_TONES[kyc]}>{label}</StatusPill>;
}

// Returns to the page that linked here (a badge record, the filtered list…), else the Users list
export function BackToUsers() {
  const back = readBack(useLocation().state) ?? { to: "/app/users", label: "users" };
  return (
    <Link to={back.to} className="-mt-3 mb-3 inline-flex items-center gap-1.5 text-[13px] text-[#6b7180] hover:text-[#1c1a18] sm:-mt-4">
      <img src={chevronLeftIcon} alt="" width={13} height={13} />
      Back to {back.label}
    </Link>
  );
}

export function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[40px] items-center gap-1.5 rounded-[10px] border border-[#eceef2] px-4 text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8]"
    >
      <img src={closeIcon} alt="" width={13} height={13} />
      Cancel
    </button>
  );
}

const textareaClass =
  "mt-2 block min-h-[64px] w-full resize-y rounded-[12px] border border-[#eceef2] bg-white px-[10px] py-[9px] text-[13px] text-[#1c1a18] outline-none placeholder:text-[#a0a5b1] focus:border-[#1c1a18]";

// Reason + audit-log details; the backend signs the person out and blocks preserve, claim and withdraw
export function SuspendUserModal({
  name,
  isCommunity,
  onSuspend,
  onClose,
}: {
  name: string;
  isCommunity: boolean;
  onSuspend: (reason: string, details: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // "Other" needs a written reason so the audit log is never blank
  const needsDetails = reason === "Other" && !details.trim();
  const canSubmit = !!reason && !needsDetails && !busy;
  const subject = isCommunity ? "The community's admins" : name.split(" ")[0];

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setFailed(false);
    try {
      await onSuspend(reason, details.trim());
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Suspend ${name}?`}
      onClose={onClose}
      width={520}
      footer={
        <>
          <CancelButton onClick={onClose} />
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="flex h-[40px] items-center gap-1.5 rounded-[10px] bg-[#dc2626] px-4 text-[13px] font-medium text-white hover:bg-[#c21f1f] disabled:opacity-40"
          >
            <img src={lockWhiteIcon} alt="" width={13} height={13} />
            {busy ? "Suspending…" : "Suspend user"}
          </button>
        </>
      }
    >
      <p className="-mt-1 text-[14px] leading-[21px] text-[#6b7180]">
        {subject} will be signed out within 1 minute and can't preserve, claim or withdraw until reactivated. {isCommunity ? "The community's" : "Their"} Badges stay
        visible unless you hide them.
      </p>

      <fieldset className="mt-6">
        <legend className="text-[13px] font-medium text-[#1c1a18]">Reason (required)</legend>
        <div className="mt-2 space-y-2">
          {SUSPEND_REASONS.map((r) => {
            const checked = reason === r;
            return (
              <label
                key={r}
                className={`flex h-[44px] cursor-pointer items-center gap-2.5 rounded-[10px] px-3 text-[13px] text-[#1c1a18] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#3310be]/40 ${
                  checked ? "border-[1.5px] border-[#1c1a18]" : "border border-[#eceef2] hover:bg-[#f8f9fb]"
                }`}
              >
                <input type="radio" name="suspend-reason" value={r} checked={checked} onChange={() => setReason(r)} className="sr-only" />
                <span aria-hidden className={`flex size-[18px] items-center justify-center rounded-full border-[1.5px] ${checked ? "border-[#1c1a18]" : "border-[#c8ccd4]"}`}>
                  {checked && <span className="size-2 rounded-full bg-[#1c1a18]" />}
                </span>
                {r}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-5 block">
        <span className="text-[13px] font-medium text-[#1c1a18]">Details for the audit log{reason === "Other" ? " (required)" : ""}</span>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="What happened? Link reports if there are any." className={textareaClass} />
      </label>
      {failed && <p className="mt-3 text-[12px] text-[#dc2626]">We couldn't suspend this account. Try again.</p>}
    </Modal>
  );
}

export function ReactivateUserModal({ name, onReactivate, onClose }: { name: string; onReactivate: () => Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await onReactivate();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Reactivate ${name}?`}
      onClose={onClose}
      width={480}
      footer={
        <>
          <CancelButton onClick={onClose} />
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="h-[40px] rounded-[10px] bg-[#1c1a18] px-4 text-[13px] font-medium text-white hover:bg-[#2f2c29] disabled:opacity-40"
          >
            {busy ? "Reactivating…" : "Reactivate user"}
          </button>
        </>
      }
    >
      <p className="-mt-1 text-[14px] leading-[21px] text-[#6b7180]">
        They can sign in, preserve, claim and withdraw again straight away. The reactivation is recorded in the audit log.
      </p>
      {failed && <p className="mt-3 text-[12px] text-[#dc2626]">We couldn't reactivate this account. Try again.</p>}
    </Modal>
  );
}
