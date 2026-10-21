import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card, Skeleton } from "../ui/card";
import { ChoiceList, DarkButton, OutlineButton, textareaClass } from "../ui/actions";
import { Avatar, StatusPill } from "../ui/controls";
import type { PillTone } from "../ui/controls";
import { Drawer } from "../ui/drawer";
import { Modal } from "../ui/modal";
import { CancelButton, UserStatusPill } from "../users/userParts";
import { decideKyc, fraudUser, getKycCheck, kycDecisionOptions, KYC_STATUS_LABELS, needsAction, resolveFraudAlert, revealDocuments } from "../../data/trustAndSafety";
import type { FraudAlert, KycCheck, KycCheckStatus, KycDecision } from "../../data/trustAndSafety";
import { suspendUser, typeLabel } from "../../data/users";
import { can, useSessionUser } from "../../auth/session";
import type { Permission } from "../../auth/session";
import { usd } from "../../utils/format";
import chevronLeftIcon from "../../assets/dashboard/chevron-left-13.svg";
import checkWhiteIcon from "../../assets/dashboard/check-13-white.svg";
import eyeIcon from "../../assets/dashboard/eye-14.svg";
import eyeOffIcon from "../../assets/dashboard/eye-off-14.svg";
import lockWhiteIcon from "../../assets/dashboard/lock-13-white.svg";

/* ---------- Small pieces ---------- */

const KYC_TONES: Record<KycCheckStatus, PillTone> = { pending: "amber", name_mismatch: "red", photo_requested: "purple", rejected: "red", verified: "green" };

export function KycStatusPill({ status }: { status: KycCheckStatus }) {
  return <StatusPill tone={KYC_TONES[status]}>{KYC_STATUS_LABELS[status]}</StatusPill>;
}

export function SeverityPill({ severity }: { severity: FraudAlert["severity"] }) {
  return <StatusPill tone={severity === "high" ? "red" : "amber"}>{severity === "high" ? "High" : "Medium"}</StatusPill>;
}

export function BackToSafety() {
  return (
    <Link to="/app/safety" className="-mt-3 mb-3 inline-flex items-center gap-1.5 text-[13px] text-[#6b7180] hover:text-[#1c1a18] sm:-mt-4">
      <img src={chevronLeftIcon} alt="" width={13} height={13} />
      Back to Trust and Safety
    </Link>
  );
}

// A link for admins who can open the target section, plain text for everyone else
export function MaybeLink({ to, permission, state, className = "", children }: { to: string; permission: Permission; state?: unknown; className?: string; children: ReactNode }) {
  const user = useSessionUser();
  if (!can(user, permission)) return <span className={className}>{children}</span>;
  return (
    <Link to={to} state={state} className={`hover:underline ${className}`}>
      {children}
    </Link>
  );
}

/* ---------- KYC review drawer ---------- */

const NAME_LABELS = ["Name on ID", "Registered name", "Name on bank account"];

export function KycReviewDrawer({ checkId, onClose, onDecided }: { checkId: string; onClose: () => void; onDecided: (message: string) => void }) {
  const user = useSessionUser();
  const [check, setCheck] = useState<KycCheck | null | undefined>(undefined);
  const [revealed, setRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [decision, setDecision] = useState<KycDecision | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getKycCheck(checkId).then((c) => {
      if (cancelled) return;
      setCheck(c);
      // Pre-select Approve for fresh checks, as in the design; mismatches and re-submissions need a deliberate choice
      setDecision(c?.status === "pending" ? "approve" : null);
    });
    return () => {
      cancelled = true;
    };
  }, [checkId]);

  const title = check ? `${check.name} · ${check.document}` : check === null ? "Check not found" : "Loading…";
  const actionable = !!check && needsAction(check.status);
  const reasonRequired = decision === "resubmit" || decision === "reject";
  const canConfirm = actionable && !!decision && (!reasonRequired || !!reason.trim()) && !busy;

  const toggleReveal = async () => {
    if (!check) return;
    if (revealed) return setRevealed(false);
    setRevealing(true);
    try {
      await revealDocuments(check.id, { name: user?.name ?? "Admin", role: user?.role ?? "Admin" });
      setRevealed(true);
    } finally {
      setRevealing(false);
    }
  };

  const confirm = async () => {
    if (!check || !decision || !canConfirm) return;
    setBusy(true);
    setFailed(false);
    try {
      await decideKyc(check.id, decision, reason.trim(), user?.name ?? "Admin");
      const outcome = {
        approve: `${check.name}'s ${check.document} check was approved.`,
        resubmit: `${check.name} was asked for ${check.kind === "bank" ? "new bank details" : "a clearer photo"}.`,
        reject: `${check.name}'s ${check.document} check was rejected.`,
      }[decision];
      onDecided(`${outcome} They've been told by email.`);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  const footer = check ? (
    <>
      <OutlineButton onClick={toggleReveal} disabled={revealing}>
        <img src={revealed ? eyeOffIcon : eyeIcon} alt="" width={14} height={14} />
        {revealing ? "Revealing…" : revealed ? "Hide documents" : "Reveal documents"}
      </OutlineButton>
      {actionable ? (
        <DarkButton onClick={confirm} disabled={!canConfirm} busy={busy}>
          <img src={checkWhiteIcon} alt="" width={13} height={13} />
          {busy ? "Saving…" : "Confirm"}
        </DarkButton>
      ) : (
        <DarkButton onClick={onClose}>Close</DarkButton>
      )}
    </>
  ) : undefined;

  const nameOnAuvra = check?.details.find((d) => d.label === "Name on Auvra")?.value;

  return (
    <Drawer title={title} onClose={onClose} footer={footer}>
      {check === undefined && (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-[118px]" />
            <Skeleton className="h-[118px]" />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      )}
      {check === null && <p className="text-[13px] text-[#6b7180]">This check may have been removed. Close this panel and refresh the list.</p>}
      {check && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <KycStatusPill status={check.status} />
            <span className="inline-flex h-[22px] items-center rounded-[6px] bg-[#f4f5f8] px-2 text-[11px] font-medium text-[#1c1a18]">{check.ref}</span>
            <MaybeLink to={`/app/users/${check.userId}`} permission="users" className="ml-auto text-[12px] font-medium text-[#3310be]">
              Open profile
            </MaybeLink>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {check.previews.map((p) => (
              <div
                key={p}
                className={`flex h-[118px] flex-col items-center justify-center gap-1 rounded-[12px] px-2 text-center text-[11px] ${
                  revealed ? "bg-[repeating-linear-gradient(135deg,#e9e4dc_0_10px,#f1ede6_10px_20px)] text-[#1c1a18]" : "bg-[#f4f5f8] text-[#6b7180]"
                }`}
              >
                {revealed ? (
                  <>
                    <span className="font-medium">{p.replace(" · masked", "")}</span>
                    <span className="text-[10px] text-[#6b7180]">Loaded from {check.provider} · view logged</span>
                  </>
                ) : (
                  p
                )}
              </div>
            ))}
          </div>

          <dl className="mt-5">
            {check.details.map((d) => {
              // Flags a name that differs from the Auvra account
              const mismatch = NAME_LABELS.includes(d.label) && nameOnAuvra && d.value !== nameOnAuvra;
              return (
                <div key={d.label} className="flex min-h-[40px] items-center justify-between gap-4 border-b border-[#eceef2] py-2">
                  <dt className="text-[12px] text-[#6b7180]">{d.label}</dt>
                  <dd className={`text-right text-[13px] ${mismatch ? "font-medium text-[#dc2626]" : "text-[#1c1a18]"}`}>{d.value}</dd>
                </div>
              );
            })}
          </dl>

          {actionable && (
            <div className="mt-6">
              <ChoiceList name="kyc-decision" legend="Decision" options={kycDecisionOptions(check.kind)} value={decision} onChange={setDecision} />
              {decision && (
                <label className="mt-4 block">
                  <span className="text-[13px] font-medium text-[#1c1a18]">{reasonRequired ? "Reason sent to the person (required)" : "Note for the audit log (optional)"}</span>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={decision === "approve" ? "Anything the next reviewer should know" : decision === "resubmit" ? "e.g. The photo is blurred; retake it in daylight." : "e.g. The face doesn't match the ID photo."}
                    className={textareaClass}
                  />
                </label>
              )}
              {failed && <p className="mt-3 text-[12px] text-[#dc2626]">We couldn't save this decision. Try again.</p>}
            </div>
          )}

          <div className="mt-6">
            <div className="text-[13px] font-medium text-[#1c1a18]">History</div>
            <ol className="mt-2">
              {check.history.map((h, i) => (
                <li key={i} className="flex items-start justify-between gap-4 border-b border-[#eceef2] py-2.5 text-[12px]">
                  <span className="text-[#1c1a18]">
                    {h.text}
                    <span className="text-[#6b7180]"> · {h.by}</span>
                  </span>
                  <span className="shrink-0 text-[#6b7180]">{h.when}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </Drawer>
  );
}

/* ---------- Fraud alert dialog ---------- */

export function FraudAlertModal({ alert, onClose, onResolved }: { alert: FraudAlert; onClose: () => void; onResolved: (message: string) => void }) {
  const session = useSessionUser();
  const person = fraudUser(alert);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"dismiss" | "suspend" | null>(null);
  const [failed, setFailed] = useState(false);
  const alreadySuspended = person?.status === "suspended";
  const canSuspend = can(session, "users") && !!person && !alreadySuspended;

  const act = async (kind: "dismiss" | "suspend") => {
    if (!note.trim() || busy) return;
    setBusy(kind);
    setFailed(false);
    try {
      if (kind === "suspend" && person) await suspendUser(person.id, "Fraud or payment abuse", `${alert.title}. ${note.trim()}`, session?.name ?? "Admin");
      await resolveFraudAlert(alert.id, kind === "suspend" ? "suspended" : "dismissed", note.trim());
      onResolved(kind === "suspend" ? `${person?.name} was suspended and the alert closed.` : `Alert “${alert.title}” dismissed.`);
    } catch {
      setFailed(true);
      setBusy(null);
    }
  };

  return (
    <Modal
      title={alert.title}
      onClose={onClose}
      width={560}
      footer={
        <>
          <CancelButton onClick={onClose} />
          <OutlineButton onClick={() => act("dismiss")} disabled={!note.trim() || !!busy}>
            {busy === "dismiss" ? "Dismissing…" : alreadySuspended ? "Close alert" : "Dismiss alert"}
          </OutlineButton>
          {canSuspend && (
            <button
              type="button"
              onClick={() => act("suspend")}
              disabled={!note.trim() || !!busy}
              className="flex h-[40px] items-center gap-1.5 rounded-[10px] bg-[#dc2626] px-4 text-[13px] font-medium text-white hover:bg-[#c21f1f] disabled:opacity-40"
            >
              <img src={lockWhiteIcon} alt="" width={13} height={13} />
              {busy === "suspend" ? "Suspending…" : "Suspend user"}
            </button>
          )}
        </>
      }
    >
      <div className="-mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#6b7180]">
        <SeverityPill severity={alert.severity} />
        Raised {alert.raised} · {usd(alert.amount)} total
      </div>
      <p className="mt-4 text-[14px] leading-[21px] text-[#6b7180]">{alert.explanation}</p>

      {person && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-[12px] border border-[#eceef2] px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={person.name} size={36} color="#3e3a36" className="rounded-[8px] text-[12px]" />
            <div className="min-w-0">
              <MaybeLink to={`/app/users/${person.id}`} permission="users" state={{ back: { to: "/app/safety", label: "Trust and Safety" } }} className="block truncate text-[14px] text-[#1c1a18]">
                {person.name}
              </MaybeLink>
              <div className="truncate text-[11px] text-[#6b7180]">
                {typeLabel(person.type)} · ID {person.code}
              </div>
            </div>
          </div>
          <UserStatusPill status={person.status} />
        </div>
      )}

      <div className="mt-5">
        <div className="text-[13px] font-medium text-[#1c1a18]">What happened</div>
        <ol className="mt-2">
          {alert.events.map((e, i) => (
            <li key={i} className="flex items-center justify-between gap-4 border-b border-[#eceef2] py-2.5 text-[12px]">
              <span className="text-[#1c1a18]">
                {e.txId ? (
                  <MaybeLink to={`/app/transactions/${e.txId}`} permission="transactions" state={{ back: { to: "/app/safety", label: "Trust and Safety" } }}>
                    {e.text}
                  </MaybeLink>
                ) : (
                  e.text
                )}
              </span>
              <span className="shrink-0 text-[#6b7180]">{e.when}</span>
            </li>
          ))}
        </ol>
        {alert.kycCheckId && (
          <Link to={`/app/safety/kyc?status=all&review=${alert.kycCheckId}`} onClick={onClose} className="mt-3 inline-block text-[12px] font-medium text-[#3310be] hover:underline">
            Open the bank check
          </Link>
        )}
      </div>

      <label className="mt-5 block">
        <span className="text-[13px] font-medium text-[#1c1a18]">Note for the audit log (required)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you check, and why this outcome?" className={textareaClass} />
      </label>
      {alreadySuspended && <p className="mt-3 text-[12px] text-[#6b7180]">This account is already suspended. Close the alert once you've checked the transactions.</p>}
      {failed && <p className="mt-3 text-[12px] text-[#dc2626]">We couldn't save this. Try again.</p>}
    </Modal>
  );
}

/* ---------- Loading ---------- */

export function CardListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="space-y-4 p-[17px]">
      <Skeleton className="h-3 w-40" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </Card>
  );
}
