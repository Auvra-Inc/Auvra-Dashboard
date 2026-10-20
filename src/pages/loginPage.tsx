import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/authLayout";
import {
  AuthHeading,
  AuthStepper,
  Field,
  Notice,
  PasswordInput,
  PrimaryButton,
  SessionFootnote,
  TextInput,
} from "../components/auth/authUi";
import type { ApiError } from "../components/auth/authHelpers";
import { SUPER_ADMIN, saveSessionUser, saveToken } from "../auth/session";
import type { SessionUser } from "../auth/session";
import alertIcon from "../assets/auth/alert.svg";
import checkboxCheckIcon from "../assets/auth/checkbox-check.svg";

type LoginError =
  | { kind: "locked"; until?: string }
  | { kind: "password" }
  | { kind: "generic"; message: string };

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string>(location.state?.email ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  const locked = error?.kind === "locked";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) {
      navigate("/forgot-password", { state: { email } });
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // const res: any = await api.auth.login({ email, password });

      // Simulated network delay until the backend is connected
      await new Promise((resolve) => setTimeout(resolve, 1200));
      // Mock: any email signs in as a Super Admin, except analyst@… which signs in as a Data Analyst
      // so restricted pages can be tried before the backend exists
      const isAnalyst = email.toLowerCase().startsWith("analyst@");
      const res: { requires2fa: boolean; twoFactorToken?: string; token?: string; user: SessionUser } = isAnalyst
        ? { requires2fa: false, token: "fake_jwt_token_for_testing", user: { name: "Amara Okeke", email, role: "Data Analyst" } }
        : { requires2fa: true, twoFactorToken: "fake_2fa_token_for_testing", user: { name: "Emmanuel John", email, role: SUPER_ADMIN } };

      saveSessionUser(res.user);
      localStorage.setItem("auvra_remember", String(remember));

      // 2FA is mandatory only for Super Admin (PRD §5), so the backend decides
      if (res.requires2fa) {
        navigate("/login/verify", { state: { email, twoFactorToken: res.twoFactorToken } });
      } else {
        if (res.token) saveToken(res.token);
        navigate("/app");
      }
    } catch (e) {
      const err = e as ApiError;
      if (err?.status === 423) setError({ kind: "locked", until: err?.payload?.lockedUntil });
      else if (err?.status === 401) setError({ kind: "password" });
      else setError({ kind: "generic", message: err?.message || "Login failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Keeping Culture Alive."
      title="The Permanent Home for Human Culture."
      description="Sign in to look after the stories, languages and traditions people trust Auvra to keep."
    >
      <AuthStepper current={1} />

      <div className="mt-10 text-center">
        <AuthHeading className="text-[32px]">Welcome back</AuthHeading>
        <div className="mt-1 text-[14px] text-[#6b7180]">Sign in to Auvra Admin</div>
      </div>

      <form onSubmit={handleLogin} className="mt-[23px]">
        {error?.kind === "locked" && (
          <div className="mb-[18px]">
            <Notice tone="error" icon={alertIcon}>
              <div className="font-bold">Account locked for 15 minutes.</div>
              <div>
                There were 5 wrong passwords in a row. Try again{error.until ? ` at ${error.until}` : " later"}, or reset
                your password.
              </div>
            </Notice>
          </div>
        )}
        {error?.kind === "generic" && (
          <div className="mb-[18px]">
            <Notice tone="error" icon={alertIcon}>
              {error.message}
            </Notice>
          </div>
        )}

        <div className={`space-y-[18px] ${locked || error?.kind === "generic" ? "" : "mt-2"}`}>
          <Field label="Work email">
            {(id) => (
              <TextInput
                id={id}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@goauvra.com"
                autoComplete="email"
                required
              />
            )}
          </Field>

          <Field label="Password" error={error?.kind === "password" || locked ? "Incorrect password" : undefined}>
            {(id) => (
              <PasswordInput
                id={id}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                invalid={error?.kind === "password" || locked}
                required
              />
            )}
          </Field>
        </div>

        {!locked && (
          <div className="mt-[13px] flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#1c1a18]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="peer sr-only"
              />
              <span className="flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border border-[#d4d7de] bg-white peer-checked:border-[#1c1a18] peer-checked:bg-[#1c1a18] peer-focus-visible:ring-2 peer-focus-visible:ring-[#3310be]/40">
                {remember && <img src={checkboxCheckIcon} alt="" width={12} height={12} />}
              </span>
              Keep me signed in on this device
            </label>
            <button
              type="button"
              onClick={() => navigate("/forgot-password", { state: { email } })}
              className="shrink-0 text-[13px] font-semibold text-[#3310be] hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        <PrimaryButton
          type="submit"
          loading={loading}
          disabled={!locked && (!email || !password)}
          className={locked ? "mt-[23px]" : "mt-[25px]"}
        >
          {locked ? "Reset password" : "Continue"}
        </PrimaryButton>
      </form>

      <div className="mt-7">
        <SessionFootnote />
      </div>
    </AuthLayout>
  );
}
