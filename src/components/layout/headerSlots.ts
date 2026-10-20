import { createContext, useContext, useEffect } from "react";

type HeaderSlots = {
  // DOM node on the right of the header that pages portal their buttons into
  actionsEl: HTMLElement | null;
  setTitle: (title: string | null) => void;
  setSubtitle: (subtitle: string | null) => void;
};

export const HeaderSlotsContext = createContext<HeaderSlots>({ actionsEl: null, setTitle: () => {}, setSubtitle: () => {} });

export function useHeaderSlots() {
  return useContext(HeaderSlotsContext);
}

// Replaces the nav label while the page is mounted (e.g. "My Vault subscriptions" under Business Intelligence)
export function usePageTitle(title: string | null) {
  const { setTitle } = useHeaderSlots();
  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [setTitle, title]);
}

// Replaces the nav subtitle while the page is mounted (e.g. "Loading the latest numbers…")
export function usePageSubtitle(subtitle: string | null) {
  const { setSubtitle } = useHeaderSlots();
  useEffect(() => {
    setSubtitle(subtitle);
    return () => setSubtitle(null);
  }, [setSubtitle, subtitle]);
}
