// Where a "Back to …" link should return to; passed as router state by the page that links in
export type BackTarget = { to: string; label: string };

export const backState = (to: string, label: string) => ({ back: { to, label } satisfies BackTarget });

export function readBack(state: unknown): BackTarget | null {
  const back = (state as { back?: BackTarget } | null)?.back;
  return back && typeof back.to === "string" && typeof back.label === "string" ? back : null;
}

// Mock ids are name slugs until the API returns real user ids
export const userPath = (name: string) =>
  `/app/users/${name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
