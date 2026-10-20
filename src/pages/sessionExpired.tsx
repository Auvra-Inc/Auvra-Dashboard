import { useNavigate } from "react-router-dom";
import { AuthHeading, PrimaryButton } from "../components/auth/authUi";
import sessionMark from "../assets/auth/session-mark.svg";

export function SessionExpired() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#2a2723] font-sans text-left text-[16px] leading-normal tracking-normal antialiased">
      <div className="pointer-events-none fixed inset-0 bg-[rgba(28,26,24,0.55)]" />
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-[440px] rounded-[24px] bg-white px-6 pb-[35px] pt-9 text-center sm:px-9">
          <div className="mx-auto flex size-[60px] items-center justify-center rounded-[18px] bg-[#1c1a18]">
            <img src={sessionMark} alt="Auvra" width={27.3} height={30} />
          </div>
          <AuthHeading className="mt-[19px] text-[26px]">You were signed out</AuthHeading>
          <div className="mx-auto mt-[9px] max-w-[349px] text-[14px] leading-[21px] text-[#6b7180]">
            For security, sessions end after 30 minutes without activity. Sign in again to pick up where you left off.
          </div>
          <PrimaryButton type="button" onClick={() => navigate("/login")} className="mt-[22px]">
            Sign in again
          </PrimaryButton>
          <div className="mt-[18px] text-[12px] text-[#6b7180]">Keeping Culture Alive.</div>
        </div>
      </div>
    </div>
  );
}
