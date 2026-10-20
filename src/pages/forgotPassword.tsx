import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AuthLayout } from "../components/auth/authLayout";
import {
  AuthHeading,
  AuthStepper,
  BackToSignIn,
  Field,
  Notice,
  PrimaryButton,
  TextInput,
} from "../components/auth/authUi";
import { maskEmail } from "../components/auth/authHelpers";
import checkIcon from "../assets/auth/check-green-16.svg";

export function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState<string>(location.state?.email ?? "");
  const [sentTo, setSentTo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // await api.auth.forgotPassword({ email });

      // Simulated network delay until the backend is connected
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setSentTo(email);
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

      <AuthHeading className="mt-6">Reset your password</AuthHeading>
      <div className="mt-2 text-[14px] leading-[21px] text-[#6b7180]">
        Enter your work email. If it belongs to an Auvra Admin account, we will send a link that works for 30 minutes.
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
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

        <PrimaryButton type="submit" loading={loading} disabled={!email} className="mt-[22px]">
          {sentTo ? "Resend link" : "Send reset link"}
        </PrimaryButton>
      </form>

      {sentTo && (
        <div className="mt-[18px]">
          <Notice tone="success" icon={checkIcon}>
            Check your inbox. The link was sent to {maskEmail(sentTo)}.
          </Notice>
        </div>
      )}
    </AuthLayout>
  );
}
