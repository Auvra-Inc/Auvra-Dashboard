import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/authLayout";
import {
  AuthHeading,
  AuthStepper,
  IconBadge,
  Notice,
  PrimaryButton,
  SessionFootnote,
  TextButton,
  TextInput,
} from "../components/auth/authUi";
import type { ApiError } from "../components/auth/authHelpers";
import { clearSession, saveToken } from "../auth/session";
import shieldIcon from "../assets/auth/shield.svg";
import alertIcon from "../assets/auth/alert.svg";

const CODE_LENGTH = 6;
const TOTP_PERIOD = 30;

function secondsUntilRefresh() {
  return TOTP_PERIOD - (Math.floor(Date.now() / 1000) % TOTP_PERIOD);
}

export function VerifyCode() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [backupMode, setBackupMode] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const [remaining, setRemaining] = useState(secondsUntilRefresh);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setRemaining(secondsUntilRefresh()), 1000);
    return () => clearInterval(timer);
  }, []);

  const setDigitsFrom = (start: number, value: string) => {
    const chars = value.replace(/\D/g, "").slice(0, CODE_LENGTH - start).split("");
    if (!chars.length) return;
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((c, i) => (next[start + i] = c));
      return next;
    });
    inputs.current[Math.min(start + chars.length, CODE_LENGTH - 1)]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      setDigits((prev) => prev.map((d, i) => (i === index - 1 ? "" : d)));
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const code = digits.join("");
  const canSubmit = backupMode ? backupCode.trim().length > 0 : code.length === CODE_LENGTH;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // const res: any = await api.auth.verify2fa({ token: twoFactorTokenFromLoginState, otp: backupMode ? backupCode : code });

      // Simulated network delay until the backend is connected
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const res = { token: "fake_jwt_token_for_testing" };

      if (res.token) saveToken(res.token);
      navigate("/app");
    } catch (e) {
      const err = e as ApiError;
      setError(err?.message || "That code didn't work. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const signInDifferentAccount = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <AuthLayout
      eyebrow="Keeping Culture Alive."
      title="One more step to protect what we preserve."
      description="Your code keeps the stories, languages and traditions on Auvra safe."
    >
      <AuthStepper current={2} />

      <div className="mt-10 text-center">
        <IconBadge icon={shieldIcon} tone="brand" />
        <AuthHeading className="mt-[21px]">{backupMode ? "Enter a backup code" : "Enter your code"}</AuthHeading>
        <div className="mx-auto mt-2 max-w-[374px] text-[14px] leading-[21px] text-[#6b7180]">
          {backupMode
            ? "Use one of the backup codes you saved when you set up two-step verification."
            : "Open your authenticator app and enter the 6-digit code for Auvra Admin."}
        </div>
      </div>

      <form onSubmit={handleVerify} className="mt-[26px]">
        {error && (
          <div className="mb-4">
            <Notice tone="error" icon={alertIcon}>
              {error}
            </Notice>
          </div>
        )}

        {backupMode ? (
          <TextInput
            aria-label="Backup code"
            value={backupCode}
            onChange={(e) => setBackupCode(e.target.value)}
            placeholder="xxxx-xxxx"
            autoComplete="one-time-code"
            autoFocus
          />
        ) : (
          <div className="flex justify-between gap-2">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={digit}
                onChange={(e) => setDigitsFrom(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={(e) => {
                  e.preventDefault();
                  setDigitsFrom(i, e.clipboardData.getData("text"));
                }}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                autoFocus={i === 0}
                maxLength={CODE_LENGTH}
                aria-label={`Digit ${i + 1}`}
                className={`h-[60px] w-full min-w-0 max-w-[52px] rounded-[14px] border text-center text-[24px] font-semibold text-[#1c1a18] outline-none transition-colors focus:border-[#3310be] focus:bg-white ${
                  digit ? "border-[#eceef2] bg-[#f4f5f8]" : "border-[#eceef2] bg-white"
                }`}
              />
            ))}
          </div>
        )}

        <div className="mt-[14px] flex items-center justify-between gap-3 text-[13px]">
          <span className="text-[#6b7180]">
            {backupMode ? "Each backup code works once." : `Code refreshes in 0:${String(remaining).padStart(2, "0")}`}
          </span>
          <TextButton onClick={() => setBackupMode((b) => !b)}>
            {backupMode ? "Use authenticator app" : "Use a backup code"}
          </TextButton>
        </div>

        <PrimaryButton type="submit" loading={loading} disabled={!canSubmit} className="mt-[23px]">
          Verify and sign in
        </PrimaryButton>
      </form>

      <button
        type="button"
        onClick={signInDifferentAccount}
        className="mt-4 block w-full text-center text-[13px] text-[#6b7180] hover:text-[#1c1a18]"
      >
        Not you? Sign in with a different account
      </button>

      <div className="mt-[27px]">
        <SessionFootnote />
      </div>
    </AuthLayout>
  );
}
