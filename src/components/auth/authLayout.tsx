import type { ReactNode } from "react";
import logoMark from "../../assets/auth/logo-mark.svg";

type HeroVariant = "people" | "trees";

type AuthLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  // "people" and "trees" match the photo slots in the design; each has its own overlay strength
  variant?: HeroVariant;
  children: ReactNode;
};

const heroOverlay: Record<HeroVariant, string> = {
  people: "linear-gradient(to bottom, rgba(28,26,24,0.62) 0%, rgba(28,26,24,0.3) 34%, rgba(28,26,24,0) 56%)",
  trees: "linear-gradient(to bottom, rgba(28,26,24,0.88) 0%, rgba(28,26,24,0.74) 40%, rgba(28,26,24,0) 66%)",
};

function Brand() {
  return (
    <div className="flex items-center gap-[8.5px]">
      <img src={logoMark} alt="" width={23.6167} height={26} className="block shrink-0" />
      <span className="text-[27px] leading-[27px] font-semibold tracking-normal text-[#f4f0e8]">Auvra</span>
    </div>
  );
}

export function AuthLayout({ eyebrow, title, description, variant = "people", children }: AuthLayoutProps) {
  return (
    // fixed + overflow so the auth shell fills the viewport regardless of #root sizing
    <div className="fixed inset-0 overflow-y-auto bg-[#14151a] font-sans text-left text-[16px] leading-normal tracking-normal antialiased">
      <div className="flex min-h-full flex-col items-center justify-center p-3 sm:p-6 lg:p-10">

        {/* Brand row shown above the card when the hero panel is hidden */}
        <div className="mb-5 mt-3 flex w-full max-w-[560px] items-center justify-between px-2 lg:hidden">
          <Brand />
          <span className="rounded-full bg-white/16 px-3 py-[7px] text-[12px] font-medium leading-none text-white">
            Auvra Admin
          </span>
        </div>

        <div className="flex w-full max-w-[560px] rounded-[28px] bg-white lg:max-w-[1240px] lg:min-h-[760px] lg:rounded-[34px] lg:p-[10px]">

          {/* Hero panel */}
          <aside className="relative hidden shrink-0 flex-col overflow-hidden rounded-[26px] bg-[#2a2723] p-9 lg:flex lg:w-1/2 xl:w-[620px]">
            <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: heroOverlay[variant] }} />

            <div className="relative flex items-center justify-between">
              <Brand />
              <span className="flex h-[29px] items-center rounded-full bg-white/16 px-3 text-[12px] font-medium text-white">
                Auvra Admin
              </span>
            </div>

            <div className="relative mt-[67px] max-w-[467px]">
              <div className="text-[13px] font-medium tracking-[0.52px] text-[#f4f0e8]">{eyebrow}</div>
              <div className="mt-[11px] text-[44px] leading-[48px] font-semibold tracking-[-0.4px] text-white">{title}</div>
              <div className="mt-4 max-w-[430px] text-[15px] leading-[23px] text-white/86">{description}</div>
            </div>

            <span className="relative mt-auto flex h-[29px] w-fit items-center rounded-full bg-[rgba(28,26,24,0.45)] px-3 text-[12px] text-[#f4f0e8]">
              goauvra.com
            </span>
          </aside>

          {/* Form column */}
          <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:py-12">
            <div className="w-full max-w-[380px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
