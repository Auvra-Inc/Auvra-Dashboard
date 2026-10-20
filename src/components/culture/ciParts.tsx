import { Link, useLocation } from "react-router-dom";
import { Card } from "../ui/card";
import { StatusPill } from "../ui/controls";
import type { PillTone } from "../ui/controls";
import type { VerificationStatus } from "../../data/culturalIntelligence";
import { can, useSessionUser } from "../../auth/session";
import { readBack, userPath } from "../../utils/navigation";
import chevronLeftIcon from "../../assets/dashboard/chevron-left-13.svg";

const DECISIONS: Record<VerificationStatus | "unchecked", { label: string; tone: PillTone }> = {
  verified: { label: "Verified", tone: "green" },
  pending: { label: "Waiting for review", tone: "amber" },
  restricted: { label: "Restricted to community", tone: "amber" },
  disputed: { label: "Disputed", tone: "red" },
  unchecked: { label: "Not checked yet", tone: "gray" },
};

export function DecisionPill({ decision }: { decision: VerificationStatus | "unchecked" }) {
  return <StatusPill tone={DECISIONS[decision].tone}>{DECISIONS[decision].label}</StatusPill>;
}

// Returns to the page that linked here (community record, review queue…), else the overview
export function BackToCulture() {
  const back = readBack(useLocation().state) ?? { to: "/app/culture", label: "Cultural Intelligence" };
  return (
    <Link to={back.to} className="-mt-3 mb-3 inline-flex items-center gap-1.5 text-[13px] text-[#6b7180] hover:text-[#1c1a18] sm:-mt-4">
      <img src={chevronLeftIcon} alt="" width={13} height={13} />
      Back to {back.label}
    </Link>
  );
}

// A person's name, linked to their profile for admins who can see Users
export function PersonLink({ name, className = "" }: { name: string; className?: string }) {
  const user = useSessionUser();
  if (!can(user, "users")) return <span className={className}>{name}</span>;
  return (
    <Link to={userPath(name)} className={`hover:underline ${className}`}>
      {name}
    </Link>
  );
}

export function NotFound({ title, body }: { title: string; body: string }) {
  return (
    <Card className="flex flex-col items-center px-5 py-14 text-center">
      <div className="text-[17px] font-semibold text-[#1c1a18]">{title}</div>
      <div className="mt-2 max-w-[358px] text-[13px] leading-[20px] text-[#6b7180]">{body}</div>
      <Link to="/app/culture" className="mt-4 flex h-10 items-center rounded-[10px] bg-[#1c1a18] px-4 text-[13px] font-medium text-white hover:bg-[#2f2c29]">
        Back to Cultural Intelligence
      </Link>
    </Card>
  );
}
