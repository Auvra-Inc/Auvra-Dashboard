import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/auth/authLayout";
import { AuthHeading, AuthStepper, IconBadge, PrimaryButton } from "../components/auth/authUi";
import { INVITATION_HERO } from "../components/auth/authHelpers";
import clockIcon from "../assets/auth/clock.svg";

export function InvitationExpired() {
  const [requested, setRequested] = useState(false);

  return (
    <AuthLayout {...INVITATION_HERO}>
      <AuthStepper current={1} />

      <div className="mt-10 text-center">
        <IconBadge icon={clockIcon} tone="warning" />
        <AuthHeading className="mx-auto mt-[21px] max-w-[264px] leading-[39px]">This invitation has expired</AuthHeading>
        <div className="mx-auto mt-[9px] max-w-[356px] text-[14px] leading-[21px] text-[#6b7180]">
          Invitations last 7 days and work once. Ask the Super Admin who invited you to send a new one.
        </div>
      </div>

      {/* No request endpoint exists yet; this only confirms the action in the UI */}
      <PrimaryButton type="button" onClick={() => setRequested(true)} disabled={requested} className="mt-[26px]">
        {requested ? "Request sent" : "Request a new invitation"}
      </PrimaryButton>

      <Link to="/login" className="mt-4 block text-center text-[13px] font-semibold text-[#3310be] hover:underline">
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
