import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { can, SUPER_ADMIN, useSessionUser } from "../../auth/session";
import type { Permission } from "../../auth/session";
import lockIcon from "../../assets/dashboard/lock-24.svg";
import homeIcon from "../../assets/dashboard/home-16.svg";
import sendIcon from "../../assets/dashboard/send-16.svg";

function NoAccess({ pageName, role }: { pageName: string; role: string }) {
  const [requested, setRequested] = useState(false);

  return (
    <section className="flex flex-col items-center rounded-[16px] border border-[#eceef2] bg-white px-5 pb-14 pt-14">
      <div className="flex size-14 items-center justify-center rounded-[16px] bg-[#f4f5f8]">
        <img src={lockIcon} alt="" width={24} height={24} />
      </div>
      <div className="mt-4 w-full max-w-[358px]">
        <div className="text-[17px] font-semibold text-[#1c1a18]">You don't have access to {pageName}</div>
        <div className="mt-2.5 text-[13px] leading-[20px] text-[#6b7180]">
          Your role, {role}, can't open this page. If you need it for your work, ask a Super Admin to change your role.
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link
          to="/app"
          className="flex h-10 items-center gap-2 rounded-[10px] border border-[#eceef2] bg-white px-[17px] text-[13px] font-medium text-[#1c1a18] hover:bg-[#f4f5f8]"
        >
          <img src={homeIcon} alt="" width={16} height={16} />
          Back to Home
        </Link>
        {/* No access-request endpoint yet; this only confirms the action in the UI */}
        <button
          type="button"
          onClick={() => setRequested(true)}
          disabled={requested}
          className="flex h-10 items-center gap-2 rounded-[10px] bg-[#1c1a18] px-4 text-[13px] font-medium text-white hover:bg-[#2f2c29] disabled:opacity-60"
        >
          <img src={sendIcon} alt="" width={16} height={16} />
          {requested ? "Request sent" : "Ask for access"}
        </button>
      </div>
    </section>
  );
}

type RequirePermissionProps = {
  permission: Permission;
  pageName: string;
  children: ReactNode;
};

// Frontend half of PRD §5 role checks; the API enforces the same rules
export function RequirePermission({ permission, pageName, children }: RequirePermissionProps) {
  const user = useSessionUser();
  if (can(user, permission)) return <>{children}</>;
  return <NoAccess pageName={pageName} role={user?.role ?? "Viewer"} />;
}

export function RequireSuperAdmin({ pageName, children }: Omit<RequirePermissionProps, "permission">) {
  const user = useSessionUser();
  if (user?.role === SUPER_ADMIN) return <>{children}</>;
  return <NoAccess pageName={pageName} role={user?.role ?? "Viewer"} />;
}

// Holding screen for sections whose rebuild hasn't started yet
export function ComingSoon({ pageName }: { pageName: string }) {
  return (
    <section className="flex flex-col items-center rounded-[16px] border border-[#eceef2] bg-white px-5 py-14 text-center">
      <div className="text-[17px] font-semibold text-[#1c1a18]">{pageName}</div>
      <div className="mt-2 max-w-[358px] text-[13px] leading-[20px] text-[#6b7180]">
        This section is part of the rebuild plan and will be built in a later step.
      </div>
    </section>
  );
}
