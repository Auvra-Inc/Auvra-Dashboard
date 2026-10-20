import { useId, useState } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Eye, Loader2 } from "lucide-react";
import eyeOffIcon from "../../assets/auth/eye-off.svg";
import lockIcon from "../../assets/auth/lock.svg";
import stepCheckIcon from "../../assets/auth/step-check.svg";
import chevronLeftIcon from "../../assets/auth/chevron-left.svg";
import checkGreenIcon from "../../assets/auth/check-green.svg";
import xGrayIcon from "../../assets/auth/x-gray.svg";
import { getPasswordRules } from "./authHelpers";

/* ---------- Stepper ---------- */

const STEPS = ["Sign in", "Verify", "Get to work"];

export function AuthStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                done || active ? "bg-[#3310be] text-white" : "bg-[#f4f5f8] text-[#6b7180]"
              }`}
            >
              {done ? <img src={stepCheckIcon} alt="" width={12} height={12} /> : step}
            </span>
            <span
              className={`ml-2 whitespace-nowrap text-[12px] ${
                active ? "font-semibold text-[#1c1a18]" : done ? "font-medium text-[#1c1a18]" : "font-medium text-[#6b7180]"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="mx-2.5 h-px min-w-4 flex-1 bg-[#eceef2]" />}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Headings ---------- */

// Global h1/h2 rules in index.css are unlayered and would override Tailwind, so headings use role="heading"
export function AuthHeading({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div role="heading" aria-level={1} className={`text-[30px] leading-[1.3] font-semibold tracking-[-0.2px] text-[#1c1a18] ${className}`}>
      {children}
    </div>
  );
}

export function IconBadge({ icon, tone }: { icon: string; tone: "brand" | "warning" }) {
  return (
    <div
      className={`mx-auto flex size-14 items-center justify-center rounded-[18px] ${
        tone === "brand" ? "bg-[#efebfe]" : "bg-[#fff3dc]"
      }`}
    >
      <img src={icon} alt="" width={26} height={26} />
    </div>
  );
}

export function BackToSignIn() {
  return (
    <Link to="/login" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1c1a18] hover:opacity-70">
      <img src={chevronLeftIcon} alt="" width={16} height={16} />
      Back to sign in
    </Link>
  );
}

/* ---------- Form fields ---------- */

type FieldProps = {
  label: string;
  error?: string;
  children: (id: string) => ReactNode;
};

export function Field({ label, error, children }: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-[7px] block text-[13px] font-semibold text-[#1c1a18]">
        {label}
      </label>
      {children(id)}
      {error && <div className="mt-2 text-[12px] text-[#dc2626]">{error}</div>}
    </div>
  );
}

const inputBase =
  "h-[50px] w-full rounded-[12px] border bg-[#f4f5f8] px-[17px] text-[14px] text-[#1c1a18] placeholder:text-[#6b7180] outline-none transition-colors focus:bg-white read-only:focus:bg-[#f4f5f8]";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function TextInput({ invalid, className = "", ...props }: TextInputProps) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={`${inputBase} ${invalid ? "border-[#dc2626]" : "border-transparent focus:border-[#3310be]"} ${className}`}
    />
  );
}

export function PasswordInput({ invalid, ...props }: TextInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextInput {...props} invalid={invalid} type={visible ? "text" : "password"} className="pr-12" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-[24px] top-1/2 flex -translate-y-1/2 items-center text-[#6b7180] hover:opacity-70"
      >
        {visible ? <Eye size={18} strokeWidth={1.25} /> : <img src={eyeOffIcon} alt="" width={18} height={18} />}
      </button>
    </div>
  );
}

/* ---------- Buttons & messages ---------- */

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean };

export function PrimaryButton({ loading, children, disabled, className = "", ...props }: PrimaryButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`flex h-[54px] w-full items-center justify-center rounded-[14px] bg-[#1c1a18] text-[15px] font-semibold text-white transition-colors hover:bg-[#2f2c29] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? <Loader2 className="size-5 animate-spin" /> : children}
    </button>
  );
}

export function TextButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={`text-[13px] font-semibold text-[#3310be] hover:underline ${className}`} />
  );
}

export function Notice({ tone, icon, children }: { tone: "error" | "success"; icon: string; children: ReactNode }) {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex gap-2.5 rounded-[14px] p-[14px] text-[13px] leading-[19px] ${
        isError ? "bg-[#fdedee] text-[#dc2626]" : "bg-[#e8f7ee] text-[#15803d]"
      }`}
    >
      <img src={icon} alt="" width={isError ? 18 : 16} height={isError ? 18 : 16} className="mt-px shrink-0 self-start" />
      <div>{children}</div>
    </div>
  );
}

export function SessionFootnote() {
  return (
    <div className="flex items-center gap-2 text-[12px] text-[#6b7180]">
      <img src={lockIcon} alt="" width={14} height={14} className="shrink-0" />
      Access by invitation only. Sessions end after 30 minutes idle.
    </div>
  );
}

/* ---------- Password rules ---------- */

export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="space-y-[5px]">
      {getPasswordRules(password).map((rule) => (
        <li key={rule.label} className={`flex items-center gap-2 text-[12px] ${rule.met ? "text-[#15803d]" : "text-[#6b7180]"}`}>
          <img src={rule.met ? checkGreenIcon : xGrayIcon} alt="" width={14} height={14} className="shrink-0" />
          {rule.label}
        </li>
      ))}
    </ul>
  );
}
