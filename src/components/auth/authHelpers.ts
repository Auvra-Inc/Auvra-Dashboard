// Shape of errors thrown by fetchJson in utils/api.ts
export type ApiError = {
  status?: number;
  message?: string;
  payload?: { lockedUntil?: string };
};

export function getPasswordRules(password: string) {
  return [
    { label: "At least 12 characters", met: password.length >= 12 },
    { label: "A number and a symbol", met: /\d/.test(password) && /[^A-Za-z0-9]/.test(password) },
    // Checked by the server on submit; stays neutral on the client
    { label: "Not one of your last 5 passwords", met: false },
  ];
}

export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  return `${name[0]}•••••@${domain}`;
}

export const INVITATION_HERO = {
  eyebrow: "Preserving Today for Tomorrow.",
  title: "Welcome to the team keeping culture alive.",
  description: "Some stories are too valuable to disappear. Set up your account and help give them a permanent home.",
  variant: "trees" as const,
};
