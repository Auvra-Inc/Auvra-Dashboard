import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/auth/authLayout";
import {
  AuthHeading,
  AuthStepper,
  Field,
  PasswordChecklist,
  PasswordInput,
  PrimaryButton,
  TextInput,
} from "../components/auth/authUi";
import { getPasswordRules, INVITATION_HERO, type ApiError } from "../components/auth/authHelpers";

type Invitation = {
  inviterName: string;
  role: string;
  email: string;
  expiresAt: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AcceptInvitation() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [invite, setInvite] = useState<Invitation | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // const res: any = await api.invitations.verify(params.get("token") ?? "");

        // Placeholder invitation until the backend is connected
        const res: Invitation = {
          inviterName: "Emmanuel John",
          role: "Data Analyst",
          email: "amara@goauvra.com",
          expiresAt: "2026-10-26",
        };
        if (!cancelled) setInvite(res);
      } catch (e) {
        const err = e as ApiError;
        if (err?.status === 410 || err?.status === 404) navigate("/invite/expired", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params, navigate]);

  const rulesMet = getPasswordRules(password).slice(0, 2).every((r) => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // await api.invitations.accept({ token: params.get("token"), fullName, password });

      // Simulated network delay until the backend is connected
      await new Promise((resolve) => setTimeout(resolve, 1200));
      navigate("/login", { state: { email: invite?.email } });
    } finally {
      setLoading(false);
    }
  };

  const expires = invite
    ? new Date(invite.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <AuthLayout {...INVITATION_HERO}>
      <AuthStepper current={1} />

      {invite && (
        <div className="mt-10 flex items-center gap-3 rounded-[16px] bg-[#efebfe] p-[14px]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#3310be] text-[13px] font-semibold text-white">
            {initials(invite.inviterName)}
          </span>
          <div className="text-[13px] leading-[19px] text-[#1c1a18]">
            {invite.inviterName} invited you to Auvra Admin as {invite.role}
          </div>
        </div>
      )}

      <AuthHeading className="mt-[25px]">Set up your account</AuthHeading>
      {invite && <div className="mt-1 text-[14px] text-[#6b7180]">This invitation expires on {expires}.</div>}

      <form onSubmit={handleSubmit} className="mt-[21px]">
        <div className="space-y-4">
          <Field label="Full name">
            {(id) => (
              <TextInput
                id={id}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                required
              />
            )}
          </Field>
          <Field label="Work email">
            {(id) => <TextInput id={id} type="email" value={invite?.email ?? ""} readOnly autoComplete="email" />}
          </Field>
          <Field label="Create password">
            {(id) => (
              <PasswordInput
                id={id}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            )}
          </Field>
        </div>

        <div className="mt-[13px]">
          <PasswordChecklist password={password} />
        </div>

        <PrimaryButton type="submit" loading={loading} disabled={!invite || !fullName || !rulesMet} className="mt-5">
          Create account
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}
