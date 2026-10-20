import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/auth/authLayout";
import {
  AuthHeading,
  AuthStepper,
  BackToSignIn,
  Field,
  PasswordChecklist,
  PasswordInput,
  PrimaryButton,
} from "../components/auth/authUi";
import { getPasswordRules } from "../components/auth/authHelpers";

export function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // The last rule is validated by the server, so only the client-checkable ones gate the button
  const rulesMet = getPasswordRules(password).slice(0, 2).every((r) => r.met);
  const mismatch = confirm.length > 0 && confirm !== password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // await api.auth.resetPassword({ token: params.get("token"), password });

      // Simulated network delay until the backend is connected
      await new Promise((resolve) => setTimeout(resolve, 1200));
      navigate("/login", { state: { email } });
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

      <div className="mt-10">
        <BackToSignIn />
      </div>

      <AuthHeading className="mt-6">Set a new password</AuthHeading>
      <div className="mt-2 text-[14px] leading-[21px] text-[#6b7180]">
        {email ? `For ${email}. ` : ""}This link works once and expires in 30 minutes.
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="space-y-4">
          <Field label="New password">
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
          <Field label="Confirm new password" error={mismatch ? "Passwords don't match" : undefined}>
            {(id) => (
              <PasswordInput
                id={id}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                invalid={mismatch}
                required
              />
            )}
          </Field>
        </div>

        <div className="mt-3">
          <PasswordChecklist password={password} />
        </div>

        <PrimaryButton
          type="submit"
          loading={loading}
          disabled={!rulesMet || !confirm || mismatch}
          className="mt-[21px]"
        >
          Save and sign in
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}
