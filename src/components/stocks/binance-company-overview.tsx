"use client";

import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  RefreshCw,
  PieChart,
  DollarSign,
  TrendingUp,
  Building,
  Users,
  FileText,
  Percent,
  Calendar,
  Layers,
  MapPin,
  Phone,
  Mail,
  Globe,
  Award,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  StockTicker,
  CompanyOverview,
  ShareholdingItem,
  FinancialRatioItem,
  DividendHistoryItem,
  InterimReportItem,
  BoardMemberItem,
  AuditorItem,
  ContactItem,
  stocksApi,
} from "@/lib/api/stocks";

interface BinanceCompanyOverviewProps {
  stock: StockTicker | null;
  onSelectTicker?: (ticker: string) => void;
}

type OverviewSubTab =
  | "profile"
  | "shareholding"
  | "ratios"
  | "dividends"
  | "interim"
  | "governance";

export function BinanceCompanyOverview({
  stock,
  onSelectTicker,
}: BinanceCompanyOverviewProps) {
  const [activeSubTab, setActiveSubTab] = useState<OverviewSubTab>("profile");
  const [loading, setLoading] = useState<boolean>(false);
  const [overview, setOverview] = useState<CompanyOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ratioCategoryFilter, setRatioCategoryFilter] = useState<string>("all");

  const currentTicker = stock?.ticker;

  useEffect(() => {
    if (!currentTicker) {
      setOverview(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    stocksApi
      .getCompanyOverview(currentTicker)
      .then((res) => {
        if (isMounted) {
          setOverview(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to fetch company overview:", err);
          setError("Failed to load company overview from LankaBangla.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentTicker]);

  const handleRefresh = () => {
    if (!currentTicker) return;
    setLoading(true);
    setError(null);
    stocksApi
      .getCompanyOverview(currentTicker)
      .then((res) => {
        setOverview(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to refresh overview:", err);
        setError("Failed to reload data.");
        setLoading(false);
      });
  };

  // Filtered Financial Ratios (Hooks must always run unconditionally at top)
  const ratioCategories = React.useMemo(() => {
    if (!overview?.financial_ratios) return [];
    const set = new Set<string>();
    overview.financial_ratios.forEach((r) => {
      if (r.Category) set.add(r.Category);
    });
    return Array.from(set);
  }, [overview?.financial_ratios]);

  const filteredRatios = React.useMemo(() => {
    if (!overview?.financial_ratios) return [];
    if (ratioCategoryFilter === "all") return overview.financial_ratios;
    return overview.financial_ratios.filter((r) => r.Category === ratioCategoryFilter);
  }, [overview?.financial_ratios, ratioCategoryFilter]);

  if (!stock) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center text-[#848e9c]">
        <div>
          <Building className="w-8 h-8 mx-auto mb-2 text-[#5e6673]" />
          <p className="text-xs">Select a stock from the watchlist to view its company overview.</p>
        </div>
      </div>
    );
  }

  // Safe stats helper
  const stats = overview?.statistics || {};
  const profile = overview?.profile || {};
  const latestShareholding = overview?.shareholding && overview.shareholding.length > 0
    ? overview.shareholding[0]
    : null;

  // LankaBD Link
  const lankabdUrl =
    overview?.lankabd_url ||
    `https://lankabd.com/Company/OverviewV2?cid=${overview?.cid || ""}&sn=${stock.ticker}&cn=${encodeURIComponent(
      (stock.name || stock.ticker).replace(/\s+/g, "_")
    )}`;

  return (
    <div className="h-full flex flex-col text-xs text-[#848e9c] overflow-hidden select-none">
      {/* ── Sub Navigation & Quick Header Bar ───────────────────── */}
      <div className="shrink-0 pb-2 border-b border-[#1e2329] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: "profile", label: "Profile & Capital", icon: Building },
            { id: "shareholding", label: "Shareholding", icon: PieChart },
            { id: "ratios", label: "Financial Ratios", icon: Percent },
            { id: "dividends", label: "Dividend History", icon: DollarSign },
            { id: "interim", label: "Interim Financials", icon: TrendingUp },
            { id: "governance", label: "Board & Auditors", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as OverviewSubTab)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  isActive
                    ? "bg-[#2b313a] text-[#f0b90b] shadow-sm"
                    : "text-[#848e9c] hover:text-[#eaecef] hover:bg-[#1e2329]"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {overview?.cid && (
            <span className="text-[10px] font-mono text-[#848e9c] bg-[#12161c] px-1.5 py-0.5 rounded border border-[#2b313a]">
              CID: #{overview.cid}
            </span>
          )}

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1 rounded hover:bg-[#2b313a] text-[#848e9c] hover:text-[#eaecef] transition-colors"
            title="Refresh LankaBangla Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#f0b90b]" : ""}`} />
          </button>

          <a
            href={lankabdUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0b90b]/15 text-[#f0b90b] hover:bg-[#f0b90b]/25 text-[10px] font-bold transition-all border border-[#f0b90b]/30"
            title="Open in LankaBangla OverviewV2"
          >
            <span>LankaBD OverviewV2</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* ── Key Financial Metric Badges Strip ────────────────────── */}
      <div className="shrink-0 py-1.5 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 border-b border-[#1e2329] bg-[#12161c]/50 text-[10px]">
        <div className="px-2 py-1 rounded bg-[#181a20] border border-[#2b313a]/50">
          <span className="text-[#848e9c] block text-[9px]">Market Cap</span>
          <span className="font-mono font-bold text-[#eaecef]">
            {stats.market_capitalization ? `${stats.market_capitalization}M` : "--"}
          </span>
        </div>
        <div className="px-2 py-1 rounded bg-[#181a20] border border-[#2b313a]/50">
          <span className="text-[#848e9c] block text-[9px]">P/E (Interim)</span>
          <span className="font-mono font-bold text-[#f0b90b]">
            {stats["p/e_(interim)_as_on_04"] || stats.raw?.["P/E (Interim) as on 04"] || "--"}
          </span>
        </div>
        <div className="px-2 py-1 rounded bg-[#181a20] border border-[#2b313a]/50">
          <span className="text-[#848e9c] block text-[9px]">P/E (Audited)</span>
          <span className="font-mono font-bold text-[#eaecef]">
            {stats["p/e_(audited)_as_on_04"] || stats.raw?.["P/E (Audited) as on 04"] || "--"}
          </span>
        </div>
        <div className="px-2 py-1 rounded bg-[#181a20] border border-[#2b313a]/50">
          <span className="text-[#848e9c] block text-[9px]">EPS (BDT)</span>
          <span className="font-mono font-bold text-emerald-400">
            {stats.earning_per_share || "--"}
          </span>
        </div>
        <div className="px-2 py-1 rounded bg-[#181a20] border border-[#2b313a]/50">
          <span className="text-[#848e9c] block text-[9px]">NAV per Share</span>
          <span className="font-mono font-bold text-[#eaecef]">
            {stats.net_asset_value_per_share || "--"}
          </span>
        </div>
        <div className="px-2 py-1 rounded bg-[#181a20] border border-[#2b313a]/50">
          <span className="text-[#848e9c] block text-[9px]">Div Yield</span>
          <span className="font-mono font-bold text-cyan-400">
            {stats.dividend_yield || "--"}
          </span>
        </div>
        <div className="px-2 py-1 rounded bg-[#181a20] border border-[#2b313a]/50">
          <span className="text-[#848e9c] block text-[9px]">52-Week Range</span>
          <span className="font-mono font-bold text-[#848e9c] truncate block">
            {stats["52_weeks_moving_range"] || "--"}
          </span>
        </div>
      </div>

      {/* ── Active Content Scrollable Panel ───────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pt-2">
        {loading && !overview ? (
          <div className="h-full flex items-center justify-center p-6 text-center text-[#848e9c]">
            <RefreshCw className="w-5 h-5 animate-spin text-[#f0b90b] mr-2 inline" />
            <span>Fetching company profile, ratios & reports from LankaBangla...</span>
          </div>
        ) : error && !overview ? (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* SUB-VIEW 1: Profile & Capital Structure */}
            {activeSubTab === "profile" && (
              <div className="space-y-3 pb-2">
                {/* Main Activity / Nature of Business */}
                {profile.mainActivityENG && (
                  <div className="p-2.5 rounded-lg bg-[#12161c] border border-[#2b313a]/60">
                    <span className="text-[10px] font-bold text-[#848e9c] block uppercase tracking-wider mb-1">
                      Business Nature / Main Activity
                    </span>
                    <p className="text-xs text-[#eaecef] leading-relaxed">
                      {profile.mainActivityENG}
                    </p>
                  </div>
                )}

                {/* Capital & Listing Structure Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  <div className="p-2 rounded bg-[#12161c] border border-[#2b313a]/50">
                    <span className="text-[10px] text-[#848e9c] block">Authorized Capital</span>
                    <span className="font-mono font-bold text-[#eaecef] text-xs">
                      {stats.authorized_capital ? `${stats.authorized_capital}M BDT` : "--"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#12161c] border border-[#2b313a]/50">
                    <span className="text-[10px] text-[#848e9c] block">Paid-up Capital</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {stats.paid_up_capital ? `${stats.paid_up_capital}M BDT` : "--"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#12161c] border border-[#2b313a]/50">
                    <span className="text-[10px] text-[#848e9c] block">Total Shares</span>
                    <span className="font-mono font-bold text-[#eaecef] text-xs">
                      {stats.total_shares || profile.totalShares?.toLocaleString() || "--"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#12161c] border border-[#2b313a]/50">
                    <span className="text-[10px] text-[#848e9c] block">Face Value / Lot</span>
                    <span className="font-mono font-bold text-[#eaecef] text-xs">
                      BDT {profile.faceValue ?? 10} / {profile.marketLot ?? 1}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#12161c] border border-[#2b313a]/50">
                    <span className="text-[10px] text-[#848e9c] block">Reserve & Surplus</span>
                    <span className="font-mono font-bold text-[#f0b90b] text-xs">
                      {stats["reserve_&_surplus"] ? `${stats["reserve_&_surplus"]}M BDT` : "--"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#12161c] border border-[#2b313a]/50">
                    <span className="text-[10px] text-[#848e9c] block">Listing Year / Board</span>
                    <span className="font-mono font-bold text-[#eaecef] text-xs">
                      {profile.listingYear || "--"} ({profile.board || stock.board})
                    </span>
                  </div>
                </div>

                {/* Contact & Registered Office */}
                <div className="p-2.5 rounded-lg bg-[#12161c] border border-[#2b313a]/60">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[11px]">
                    {profile.headOfficePhone && (
                      <div className="flex items-center gap-1.5 text-[#eaecef]">
                        <Phone className="w-3.5 h-3.5 text-[#f0b90b]" />
                        <span>{profile.headOfficePhone}</span>
                      </div>
                    )}
                    {profile.headOfficeEmail && (
                      <div className="flex items-center gap-1.5 text-[#eaecef]">
                        <Mail className="w-3.5 h-3.5 text-[#f0b90b]" />
                        <a
                          href={`mailto:${profile.headOfficeEmail}`}
                          className="hover:underline hover:text-[#f0b90b]"
                        >
                          {profile.headOfficeEmail}
                        </a>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-1.5 text-[#eaecef]">
                        <Globe className="w-3.5 h-3.5 text-[#f0b90b]" />
                        <a
                          href={
                            profile.website.startsWith("http")
                              ? profile.website
                              : `https://${profile.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-[#f0b90b]"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                    {profile.contactPerson && (
                      <div className="flex items-center gap-1.5 text-[#848e9c]">
                        <Users className="w-3.5 h-3.5 text-[#848e9c]" />
                        <span>Contact: {profile.contactPerson}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: Shareholding Pattern */}
            {activeSubTab === "shareholding" && (
              <div className="space-y-3 pb-2">
                {latestShareholding ? (
                  <>
                    {/* Visual Segmented Shareholding Bar */}
                    <div className="p-3 rounded-lg bg-[#12161c] border border-[#2b313a]/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#eaecef] flex items-center gap-1.5">
                          <PieChart className="w-3.5 h-3.5 text-[#f0b90b]" />
                          <span>Latest Shareholding Distribution</span>
                        </span>
                        <span className="text-[10px] text-[#848e9c]">
                          As of {latestShareholding.date}
                        </span>
                      </div>

                      {/* Stacked Progress Bar */}
                      <div className="h-4 w-full bg-[#181a20] rounded-full overflow-hidden flex border border-[#2b313a]">
                        {latestShareholding.sponsorDirector > 0 && (
                          <div
                            style={{ width: `${latestShareholding.sponsorDirector}%` }}
                            className="bg-[#f0b90b] hover:opacity-80 transition-opacity"
                            title={`Sponsor / Director: ${latestShareholding.sponsorDirector}%`}
                          />
                        )}
                        {latestShareholding.ins > 0 && (
                          <div
                            style={{ width: `${latestShareholding.ins}%` }}
                            className="bg-[#0ecb81] hover:opacity-80 transition-opacity"
                            title={`Institutional: ${latestShareholding.ins}%`}
                          />
                        )}
                        {latestShareholding.public > 0 && (
                          <div
                            style={{ width: `${latestShareholding.public}%` }}
                            className="bg-[#00b8d9] hover:opacity-80 transition-opacity"
                            title={`Public: ${latestShareholding.public}%`}
                          />
                        )}
                        {latestShareholding.foreign > 0 && (
                          <div
                            style={{ width: `${latestShareholding.foreign}%` }}
                            className="bg-[#8c52ff] hover:opacity-80 transition-opacity"
                            title={`Foreign: ${latestShareholding.foreign}%`}
                          />
                        )}
                        {latestShareholding.govt > 0 && (
                          <div
                            style={{ width: `${latestShareholding.govt}%` }}
                            className="bg-[#f6465d] hover:opacity-80 transition-opacity"
                            title={`Government: ${latestShareholding.govt}%`}
                          />
                        )}
                      </div>

                      {/* Legend badges */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#f0b90b]" />
                          <span className="text-[#eaecef]">
                            Sponsor/Director: <b>{latestShareholding.sponsorDirector}%</b>
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#0ecb81]" />
                          <span className="text-[#eaecef]">
                            Institutional: <b>{latestShareholding.ins}%</b>
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#00b8d9]" />
                          <span className="text-[#eaecef]">
                            General Public: <b>{latestShareholding.public}%</b>
                          </span>
                        </div>
                        {latestShareholding.foreign > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#8c52ff]" />
                            <span className="text-[#eaecef]">
                              Foreign: <b>{latestShareholding.foreign}%</b>
                            </span>
                          </div>
                        )}
                        {latestShareholding.govt > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#f6465d]" />
                            <span className="text-[#eaecef]">
                              Govt: <b>{latestShareholding.govt}%</b>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Historical Shareholding Table */}
                    <div className="rounded-lg bg-[#12161c] border border-[#2b313a]/60 overflow-hidden">
                      <div className="grid grid-cols-6 px-3 py-1.5 text-[10px] font-bold text-[#848e9c] border-b border-[#2b313a] bg-[#181a20]">
                        <span>Report Date</span>
                        <span className="text-right">Sponsor %</span>
                        <span className="text-right">Institute %</span>
                        <span className="text-right">Public %</span>
                        <span className="text-right">Foreign %</span>
                        <span className="text-right">Govt %</span>
                      </div>
                      <div className="divide-y divide-[#1e2329] max-h-[140px] overflow-y-auto no-scrollbar font-mono text-[11px]">
                        {overview?.shareholding?.slice(0, 10).map((sh, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-6 px-3 py-1.5 items-center hover:bg-[#181a20]/60 transition-colors"
                          >
                            <span className="text-[#eaecef]">{sh.date}</span>
                            <span className="text-right text-[#f0b90b] font-bold">
                              {sh.sponsorDirector}%
                            </span>
                            <span className="text-right text-[#0ecb81]">{sh.ins}%</span>
                            <span className="text-right text-[#00b8d9]">{sh.public}%</span>
                            <span className="text-right text-[#848e9c]">{sh.foreign}%</span>
                            <span className="text-right text-[#848e9c]">{sh.govt}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-[#848e9c]">
                    No shareholding history available for this stock.
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 3: Financial Ratios */}
            {activeSubTab === "ratios" && (
              <div className="space-y-2 pb-2">
                {/* Category Filter Pills */}
                {ratioCategories.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                    <button
                      onClick={() => setRatioCategoryFilter("all")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        ratioCategoryFilter === "all"
                          ? "bg-[#f0b90b] text-black"
                          : "bg-[#12161c] text-[#848e9c] hover:text-[#eaecef]"
                      }`}
                    >
                      All Ratios ({overview?.financial_ratios?.length || 0})
                    </button>
                    {ratioCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setRatioCategoryFilter(cat)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all whitespace-nowrap ${
                          ratioCategoryFilter === cat
                            ? "bg-[#f0b90b] text-black"
                            : "bg-[#12161c] text-[#848e9c] hover:text-[#eaecef]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Ratios Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[180px] overflow-y-auto no-scrollbar">
                  {filteredRatios.length === 0 ? (
                    <div className="col-span-full p-6 text-center text-[#848e9c]">
                      No financial ratios available for this selection.
                    </div>
                  ) : (
                    filteredRatios.map((ratio, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#12161c] border border-[#2b313a]/60 hover:border-[#f0b90b]/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-[10px] text-[#848e9c] block truncate" title={ratio.Category}>
                            {ratio.Category}
                          </span>
                          <span className="font-bold text-[#eaecef] text-xs block mt-0.5 truncate" title={ratio.Name}>
                            {ratio.Name}
                          </span>
                          {ratio.Equation && (
                            <span className="text-[9px] text-[#5e6673] block truncate mt-0.5 font-mono" title={ratio.Equation}>
                              {ratio.Equation}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 pt-1 border-t border-[#1e2329] flex items-center justify-between">
                          <span className="text-[9px] font-mono text-[#848e9c]">{ratio.Code}</span>
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            {ratio.Result !== undefined && ratio.Result !== null
                              ? Number(ratio.Result).toFixed(2)
                              : "--"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW 4: Dividend History */}
            {activeSubTab === "dividends" && (
              <div className="rounded-lg bg-[#12161c] border border-[#2b313a]/60 overflow-hidden pb-2">
                <div className="grid grid-cols-6 px-3 py-1.5 text-[10px] font-bold text-[#848e9c] border-b border-[#2b313a] bg-[#181a20]">
                  <span>Year</span>
                  <span className="text-right">Cash Div %</span>
                  <span className="text-right">Stock Div %</span>
                  <span className="text-right">EPS</span>
                  <span className="text-right">NAV</span>
                  <span className="text-right">Record Date</span>
                </div>
                <div className="divide-y divide-[#1e2329] max-h-[160px] overflow-y-auto no-scrollbar font-mono text-[11px]">
                  {overview?.dividend_history && overview.dividend_history.length > 0 ? (
                    overview.dividend_history.map((div, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-6 px-3 py-1.5 items-center hover:bg-[#181a20]/60 transition-colors"
                      >
                        <span className="font-bold text-[#f0b90b]">{div.year || "--"}</span>
                        <span className="text-right text-emerald-400 font-bold">
                          {div.cashDividend !== undefined && div.cashDividend !== null
                            ? `${div.cashDividend}%`
                            : "--"}
                        </span>
                        <span className="text-right text-[#eaecef]">
                          {div.stockDividend !== undefined && div.stockDividend !== null
                            ? `${div.stockDividend}%`
                            : "--"}
                        </span>
                        <span className="text-right text-[#848e9c]">{div.eps ?? "--"}</span>
                        <span className="text-right text-[#848e9c]">{div.nav ?? "--"}</span>
                        <span className="text-right text-[#848e9c] text-[10px]">
                          {div.recordDate || "--"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-[#848e9c]">
                      No dividend history recorded on LankaBangla.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW 5: Interim Financial Reports */}
            {activeSubTab === "interim" && (
              <div className="rounded-lg bg-[#12161c] border border-[#2b313a]/60 overflow-hidden pb-2">
                <div className="grid grid-cols-6 px-3 py-1.5 text-[10px] font-bold text-[#848e9c] border-b border-[#2b313a] bg-[#181a20]">
                  <span>Year</span>
                  <span>Quarter / Period</span>
                  <span className="text-right">Turnover (M)</span>
                  <span className="text-right">Net Profit (M)</span>
                  <span className="text-right">EPS (BDT)</span>
                  <span className="text-right">NAV (BDT)</span>
                </div>
                <div className="divide-y divide-[#1e2329] max-h-[160px] overflow-y-auto no-scrollbar font-mono text-[11px]">
                  {overview?.interim_reports && overview.interim_reports.length > 0 ? (
                    overview.interim_reports.map((rep, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-6 px-3 py-1.5 items-center hover:bg-[#181a20]/60 transition-colors"
                      >
                        <span className="font-bold text-[#eaecef]">{rep.year}</span>
                        <span className="text-[#f0b90b]">
                          {rep.quarterId ? `Quarter ${rep.quarterId}` : "Annual / Interim"}
                        </span>
                        <span className="text-right text-[#eaecef]">{rep.turnover ?? "--"}</span>
                        <span className="text-right text-emerald-400 font-bold">
                          {rep.netProfit ?? "--"}
                        </span>
                        <span className="text-right text-[#eaecef]">{rep.eps ?? "--"}</span>
                        <span className="text-right text-[#848e9c]">{rep.nav ?? "--"}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-[#848e9c]">
                      No interim financial reports available on LankaBangla.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW 6: Governance, Board & Auditors */}
            {activeSubTab === "governance" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                {/* Board of Directors */}
                <div className="rounded-lg bg-[#12161c] border border-[#2b313a]/60 p-3 space-y-2">
                  <span className="text-xs font-bold text-[#eaecef] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#f0b90b]" />
                    <span>Board of Directors</span>
                  </span>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto no-scrollbar font-sans text-[11px]">
                    {overview?.board_members && overview.board_members.length > 0 ? (
                      overview.board_members.map((member, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-1.5 rounded bg-[#181a20] border border-[#2b313a]/40"
                        >
                          <span className="font-medium text-[#eaecef]">{member.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2b313a] text-[#f0b90b] font-semibold">
                            {member.designation || "Director"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-[#848e9c] text-xs">
                        Board member roster not listed.
                      </div>
                    )}
                  </div>
                </div>

                {/* Statutory Auditors & Registered Contacts */}
                <div className="space-y-2">
                  <div className="rounded-lg bg-[#12161c] border border-[#2b313a]/60 p-3 space-y-2">
                    <span className="text-xs font-bold text-[#eaecef] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Statutory Auditors</span>
                    </span>
                    <div className="space-y-1 max-h-[70px] overflow-y-auto no-scrollbar text-[11px]">
                      {overview?.auditors && overview.auditors.length > 0 ? (
                        overview.auditors.map((aud, idx) => (
                          <div key={idx} className="p-1 text-[#eaecef]">
                            {aud.name}
                          </div>
                        ))
                      ) : (
                        <div className="text-[#848e9c] text-xs">Auditor data not available.</div>
                      )}
                    </div>
                  </div>

                  {overview?.contacts && overview.contacts.length > 0 && (
                    <div className="rounded-lg bg-[#12161c] border border-[#2b313a]/60 p-2.5 text-[11px] text-[#848e9c] space-y-1">
                      <span className="font-bold text-[#eaecef] block text-[10px] uppercase">
                        {overview.contacts[0].name || "Corporate Office"}
                      </span>
                      {overview.contacts[0].address && (
                        <p className="text-xs text-[#eaecef] flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-[#f0b90b] mt-0.5 shrink-0" />
                          <span>{overview.contacts[0].address}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
