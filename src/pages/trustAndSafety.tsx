import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader } from "../components/ui/card";
import { PrimaryAction } from "../components/ui/controls";
import { DataTable } from "../components/ui/table";
import { PageActions } from "../components/layout/pageActions";
import { KpiLinkCard, KpiSkeleton, LoadError } from "../components/business/biParts";
import { DoneBanner, PersonCell } from "../components/ui/actions";
import { CardListSkeleton, FraudAlertModal, KycReviewDrawer, KycStatusPill, SeverityPill } from "../components/safety/tsParts";
import { fraudUser, getSafetyOverview } from "../data/trustAndSafety";
import type { FraudAlert, SafetyOverview } from "../data/trustAndSafety";
import { typeLabel } from "../data/users";
import { can, useSessionUser } from "../auth/session";
import { usd } from "../utils/format";
import flagIcon from "../assets/dashboard/card-flag.svg";
import shieldIcon from "../assets/dashboard/shield-13.svg";
import closeIcon from "../assets/dashboard/close-13.svg";
import arrowsIcon from "../assets/dashboard/card-transactions.svg";
import alertIcon from "../assets/dashboard/card-alert.svg";
import noteIcon from "../assets/dashboard/card-note.svg";
import checkWhiteIcon from "../assets/dashboard/check-13-white.svg";

const KPI_ICONS: Record<string, string> = { reports: flagIcon, kycPending: shieldIcon, kycRejected: closeIcon, bank: arrowsIcon, fraud: alertIcon };

// Where each KPI card leads
const KPI_LINKS: Record<string, string> = {
  reports: "/app/safety/reports",
  kycPending: "/app/safety/kyc",
  kycRejected: "/app/safety/kyc?status=rejected",
  bank: "/app/safety/kyc?status=all&provider=Paystack",
};

function FraudAlertsCard({ alerts, onOpen }: { alerts: FraudAlert[]; onOpen: (a: FraudAlert) => void }) {
  return (
    <Card className="px-[17px] pb-[17px] pt-[13px]">
      <CardHeader
        icon={alertIcon}
        title="Fraud alerts"
        tip={{ title: "Fraud alerts", body: "Payments and payouts our rules flagged as unusual. Open one to see what happened, then dismiss it or suspend the account." }}
      />
      {alerts.length === 0 ? (
        <div className="mt-4 rounded-[12px] border border-dashed border-[#eceef2] px-4 py-8 text-center text-[13px] text-[#6b7180]">No fraud alerts right now.</div>
      ) : (
        <ul className="mt-4 space-y-3">
          {alerts.map((a) => {
            const person = fraudUser(a);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onOpen(a)}
                  className="block w-full rounded-[12px] border border-[#eceef2] px-3.5 pb-6 pt-3.5 text-left hover:border-[#d9dce3] hover:bg-[#f8f9fb]"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-[13px] font-medium text-[#1c1a18]">{a.title}</span>
                    <SeverityPill severity={a.severity} />
                  </span>
                  <span className="mt-2 block text-[11px] text-[#6b7180]">
                    {person ? `${typeLabel(person.type)} ID ${person.code.slice(0, 7)}…` : "Unknown account"} · {usd(a.amount)} total
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]">
        <CardListSkeleton />
        <CardListSkeleton rows={3} />
      </div>
      <CardListSkeleton rows={3} />
    </div>
  );
}

type LoadResult = { attempt: number; data?: SafetyOverview; failed?: boolean };

export function TrustAndSafety() {
  const navigate = useNavigate();
  const user = useSessionUser();
  const [params, setParams] = useSearchParams();
  const review = params.get("review");
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [alert, setAlert] = useState<FraudAlert | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const fraudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getSafetyOverview()
      .then((data) => !cancelled && setResult({ attempt, data }))
      .catch(() => !cancelled && setResult({ attempt, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = (message: string) => {
    setDone(message);
    setAttempt((a) => a + 1);
  };
  const openReview = (id: string) => setParams({ review: id });
  const closeReview = () => setParams({}, { replace: true });

  const data = result?.data;
  const actions = (
    <PageActions>
      <PrimaryAction onClick={() => navigate("/app/safety/reports")}>
        <img src={checkWhiteIcon} alt="" width={13} height={13} />
        Review reports
      </PrimaryAction>
    </PageActions>
  );

  if (result?.failed && result.attempt === attempt) return <LoadError title="We couldn't load Trust and Safety" onRetry={() => setAttempt((a) => a + 1)} />;
  if (!data)
    return (
      <>
        {actions}
        <OverviewSkeleton />
      </>
    );

  const showLog = can(user, "audit");

  return (
    <>
      {actions}
      {review && (
        <KycReviewDrawer
          checkId={review}
          onClose={closeReview}
          onDecided={(message) => {
            closeReview();
            reload(message);
          }}
        />
      )}
      {alert && (
        <FraudAlertModal
          alert={alert}
          onClose={() => setAlert(null)}
          onResolved={(message) => {
            setAlert(null);
            reload(message);
          }}
        />
      )}

      <div className="space-y-3">
        {done && <DoneBanner onClose={() => setDone(null)}>{done}</DoneBanner>}

        <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {data.kpis.map((k) =>
            k.key === "fraud" ? (
              <KpiLinkCard
                key={k.key}
                kpi={k}
                icon={KPI_ICONS[k.key]}
                onClick={() => {
                  fraudRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  fraudRef.current?.querySelector<HTMLElement>("li button")?.focus({ preventScroll: true });
                }}
              />
            ) : (
              <KpiLinkCard key={k.key} kpi={k} icon={KPI_ICONS[k.key]} to={KPI_LINKS[k.key]} />
            ),
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <div className="px-[17px] pb-[14px] pt-[13px]">
              <CardHeader
                icon={shieldIcon}
                title="KYC and bank verification"
                tip={{ title: "KYC and bank verification", body: "Identity checks run by Dojah and bank checks run by Paystack. Creators can't withdraw until both pass." }}
              >
                <Link to="/app/safety/kyc" className="text-[12px] font-medium text-[#3310be] hover:underline">
                  See all checks
                </Link>
              </CardHeader>
            </div>
            <DataTable
              minWidth={640}
              head={
                <>
                  <th scope="col" className="w-[30%] text-left">Person</th>
                  <th scope="col" className="px-2 text-left">Check</th>
                  <th scope="col" className="px-2 text-left">Provider</th>
                  <th scope="col" className="px-2 text-left">Status</th>
                  <th scope="col" className="text-right">Submitted</th>
                </>
              }
            >
              {data.checks.map((c) => (
                <tr
                  key={c.id}
                  tabIndex={0}
                  aria-label={`Review ${c.name}, ${c.document}`}
                  onClick={() => openReview(c.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openReview(c.id))}
                  className="cursor-pointer outline-none hover:bg-[#f8f9fb] focus-visible:bg-[#f4f5f8]"
                >
                  <td className="h-[52px]">
                    <PersonCell name={c.name} sub={c.userType} />
                  </td>
                  <td className="px-2">{c.document}</td>
                  <td className="px-2">{c.provider}</td>
                  <td className="px-2">
                    <KycStatusPill status={c.status} />
                  </td>
                  <td className="text-right">{c.submitted}</td>
                </tr>
              ))}
            </DataTable>
          </Card>

          <div ref={fraudRef} id="fraud-alerts">
            <FraudAlertsCard alerts={data.fraudAlerts} onOpen={setAlert} />
          </div>
        </div>

        {showLog && (
          <Card className="overflow-hidden">
            <div className="px-[17px] pb-[14px] pt-[13px]">
              <CardHeader
                icon={noteIcon}
                title="Compliance log"
                tip={{ title: "Compliance log", body: "Every time someone on the team views KYC records or bank details, or exports personal data. Only Super Admins see this." }}
              />
            </div>
            <DataTable
              minWidth={560}
              head={
                <>
                  <th scope="col" className="w-[37%] text-left">Who</th>
                  <th scope="col" className="px-2 text-left">Viewed</th>
                  <th scope="col" className="text-right">When</th>
                </>
              }
            >
              {data.complianceLog.map((e) => (
                <tr key={e.id}>
                  <td className="h-[44px]">
                    {e.who} · {e.role}
                  </td>
                  <td className="px-2">
                    {e.checkId ? (
                      <button type="button" onClick={() => openReview(e.checkId!)} className="text-left hover:underline">
                        {e.viewed}
                      </button>
                    ) : e.to ? (
                      <Link to={e.to} className="hover:underline">
                        {e.viewed}
                      </Link>
                    ) : (
                      e.viewed
                    )}
                  </td>
                  <td className="text-right">{e.when}</td>
                </tr>
              ))}
            </DataTable>
          </Card>
        )}
      </div>
    </>
  );
}
