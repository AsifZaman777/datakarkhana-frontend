import apiClient from "@/lib/api/client";
import { getLocalApiBase } from "@/lib/constants";

export interface StockTicker {
  ticker: string;
  name?: string;
  ltp: number;
  ycp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  value_mn: number;
  trades: number;
  percent: number;
  change: number;
  category: string;
  board: string;
  sector: string;
  asset_type: string;
  updated_at: string;
  direction?: "up" | "down" | "neutral";
}

export interface MarketIndex {
  key: string;
  value: number;
  change: number;
  percent: number;
  prev: number;
}

export interface ExchangeStatus {
  code: string;
  name: string;
  exchangeID: number;
  marketStatus: string; // "Open" | "Pre-Open" | "Post-Close" | "Closed" | "CPT"
  status?: string;
  selected?: number;
  logoPath?: string;
  currency?: string;
  city?: string;
  country?: string;
  indices?: string[];
  trading_hours?: string;
}

export interface MarketSummary {
  summary: {
    indices?: MarketIndex[];
    totals?: {
      trades?: number;
      volume?: number;
      value?: number;
      turnover?: number;
      marketCap?: number;
      tradeTime?: string;
    };
    breadth?: {
      advanced: number;
      declined: number;
      unchanged: number;
    };
    market_status?: string;
    exchanges?: ExchangeStatus[];
    session?: {
      state: string;
      date: string;
      time: string;
    };
    movers?: any;
    topMovers?: any;
  };
  is_trading_hour: boolean;
  market_status?: string;
  exchanges?: ExchangeStatus[];
  total_tracked: number;
  last_scraped_at?: string;
}


export interface StockNewsItem {
  id: string;
  code: string;
  name: string;
  type: string;
  date: string;
  time: string;
  summary: string;
  body: string;
}

export interface UserStockAlert {
  id: string;
  user_id?: number;
  whatsapp_number: string;
  ticker: string;
  alert_type: string;
  threshold_value: number;
  is_one_shot: boolean;
  status: string;
  last_triggered_at?: string;
  created_at?: string;
}

export interface MarketDepthLevel {
  price: number;
  volume: number;
  quantity?: number;
  orders?: number;
  total?: number;
}

export interface MarketDepthData {
  symbol?: string;
  code?: string;
  exchange?: string;
  bids: MarketDepthLevel[];
  asks: MarketDepthLevel[];
  buy_percentage?: number;
  sell_percentage?: number;
  total_buy_volume?: number;
  total_sell_volume?: number;
  lankabd_url?: string;
  circuit_upper?: number;
  circuit_lower?: number;
  as_of?: string;
  session?: any;
  stats?: {
    ltp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    ycp: number;
    volume: number;
    value_mn?: number;
    value?: number;
    trades: number;
    change?: number;
    percent?: number;
  };
  y_stats?: {
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    ltp?: number;
    trades?: number;
    volume?: number;
    value_bdt?: number;
  };
  priceStats?: {
    ltp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    ycp: number;
    volume: number;
    value: number;
    trades: number;
    change?: number;
    percent?: number;
  };
}

export interface ShareholdingItem {
  date: string;
  sponsorDirector: number;
  govt: number;
  foreign: number;
  ins: number;
  public: number;
}

export interface FinancialRatioItem {
  id: number;
  Name: string;
  Code: string;
  Category: string;
  Result: number;
  Equation?: string;
}

export interface DividendHistoryItem {
  symbol: string;
  dividendType?: string;
  cashDividend?: number;
  stockDividend?: number;
  eps?: number;
  nav?: number;
  year?: number;
  recordDate?: string;
}

export interface InterimReportItem {
  year?: number;
  quarterId?: number;
  turnover?: string;
  netProfit?: string;
  eps?: string;
  nav?: string;
}

export interface BoardMemberItem {
  name: string;
  designation?: string;
  level?: number;
}

export interface AuditorItem {
  name: string;
}

export interface ContactItem {
  name?: string;
  contact_person?: string;
  address?: string;
  phone?: string;
  fax?: string;
  is_headquarter?: boolean;
}

export interface CompanyOverview {
  symbol: string;
  cid?: number;
  name: string;
  sector: string;
  category: string;
  board: string;
  ltp: number;
  change?: number;
  percent?: number;
  profile: {
    nameENG?: string;
    board?: string;
    financialYearEndMonth?: number;
    totalShares?: number;
    mainActivityENG?: string;
    listingYear?: number;
    marketLot?: number;
    faceValue?: number;
    contactPerson?: string;
    headOfficePhone?: string;
    headOfficeEmail?: string;
    website?: string;
  };
  statistics: {
    authorized_capital?: string;
    paid_up_capital?: string;
    total_shares?: string;
    market_capitalization?: string;
    "p/e_(interim)_as_on_04"?: string;
    "p/e_(audited)_as_on_04"?: string;
    market_category?: string;
    "52_weeks_moving_range"?: string;
    net_asset_value_per_share?: string;
    earning_per_share?: string;
    dividend_yield?: string;
    "reserve_&_surplus"?: string;
    raw?: Record<string, any>;
  };
  shareholding: ShareholdingItem[];
  financial_ratios: FinancialRatioItem[];
  dividend_history: DividendHistoryItem[];
  interim_reports: InterimReportItem[];
  board_members: BoardMemberItem[];
  auditors: AuditorItem[];
  contacts: ContactItem[];
  lankabd_url: string;
  as_of?: string;
}

export interface CircuitBreakerItem {
  code: string;
  name: string;
  close_price: number;
  breaker_pct: string;
  tick_size: number;
  open_adj_price: number;
  lower_limit: number;
  upper_limit: number;
  board?: string;
}

export interface BoardSummaryItem {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface RecentMarketInfoRow {
  date: string;
  dsex: number;
  dses: number;
  ds30: number;
  trades: number;
  volume: number;
  value: number;
  marketCap: number;
}

export interface PEItem {
  code: string;
  close_price: string;
  ycp: string;
  pe1: string;
  pe2: string;
  pe3: string;
  pe4: string;
  pe5: string;
  pe6: string;
  trailing_pe: string;
}

export interface TopSharesData {
  top_turnover: StockTicker[];
  top_gainers: StockTicker[];
  top_losers: StockTicker[];
  top_volume: StockTicker[];
}

export interface ScrapedSectorItem {
  code: string;
  name: string;
  raw_name?: string;
  change_pct: number;
  col_span?: number;
  row_span?: number;
  bg_color?: string;
  turnover?: number;
}

export interface SectorHeatmapData {
  adv: number;
  dec: number;
  unch?: number;
  sectors: ScrapedSectorItem[];
  top_12: ScrapedSectorItem[];
  last_scraped_at?: string;
  source?: string;
}

export interface BlockMarketDeal {
  symbol: string;
  company_name: string;
  max_price: number;
  min_price: number;
  trades: number;
  quantity: number;
  value_mn: number;
  exchange: string;
  date: string;
}

export interface IndexMover {
  symbol: string;
  company_name: string;
  ltp: number;
  ycp: number;
  change_percent: number;
  total_volume: number;
  total_value_mn: number;
  index_mover_points: number;
  market_cap: number;
  updated_at?: string;
}

export interface ExchangeInfo {
  code: string;
  name: string;
  exchangeID: number;
  status: "OPEN" | "CLOSED";
  currency: string;
  city: string;
  country: string;
  indices: string[];
  trading_hours: string;
}

export interface StockDetail extends StockTicker {
  intraday_series?: { time: number; value: number; volume?: number }[];
  est_52w_high?: number;
  est_52w_low?: number;
  tick_size?: number;
  circuit_upper?: number;
  circuit_lower?: number;
}

export const stocksApi = {
  getTickers: (params?: {
    exchange?: string;
    board?: string;
    category?: string;
    sector?: string;
    search?: string;
    sort_by?: string;
    limit?: number;
  }) => apiClient.get<{ count: number; total_available: number; tickers: StockTicker[] }>("/api/stocks/tickers", { params }),

  getTickerDetail: (ticker: string) =>
    apiClient.get<StockDetail>(`/api/stocks/ticker/${ticker}`),

  getSummary: () =>
    apiClient.get<MarketSummary>("/api/stocks/summary"),

  getDepth: (symbol: string, exchange: string = "DSE") =>
    apiClient.get<MarketDepthData>("/api/stocks/depth", { params: { symbol, exchange } }),

  getCompanyOverview: (symbol: string) =>
    apiClient.get<CompanyOverview>(`/api/stocks/overview/${symbol}`),

  getSectors: () =>
    apiClient.get<SectorHeatmapData>("/api/stocks/sectors"),

  getNews: (params?: { ticker?: string; limit?: number }) =>
    apiClient.get<{ count: number; news: StockNewsItem[] }>("/api/stocks/news", { params }),

  getBlockMarket: () =>
    apiClient.get<{ count: number; deals: BlockMarketDeal[] }>("/api/stocks/block-market"),

  getMovers: () =>
    apiClient.get<{ index_movers: IndexMover[]; top_lists: any }>("/api/stocks/movers"),

  getExchanges: () =>
    apiClient.get<ExchangeStatus[]>("/api/stocks/exchanges"),

  getMarketStatus: (exchange: string = "DSE") =>
    apiClient.get<{ exchange: string; market_status: string; is_trading_hour: boolean }>("/api/stocks/status", { params: { exchange } }),

  createAlert: (data: {
    whatsapp_number: string;
    ticker: string;
    alert_type: string;
    threshold_value?: number;
    is_one_shot?: boolean;
    user_id?: number;
  }) => apiClient.post<{ success: boolean; message: string; alert: UserStockAlert }>("/api/stocks/alerts", data),

  getAlerts: (whatsapp_number?: string) =>
    apiClient.get<{ count: number; alerts: UserStockAlert[] }>("/api/stocks/alerts", {
      params: { whatsapp_number },
    }),

  deleteAlert: (alertId: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/api/stocks/alerts/${alertId}`),

  rearmAlert: (alertId: string) =>
    apiClient.post<{ success: boolean; message: string }>(`/api/stocks/alerts/${alertId}/rearm`),

  sendTestPing: (whatsapp_number: string) =>
    apiClient.post<{ success: boolean; message: string }>("/api/stocks/alerts/test-ping", {
      whatsapp_number,
    }),

  sendOtp: (whatsapp_number: string) =>
    apiClient.post<{ success: boolean; message: string; phone?: string }>("/api/stocks/alerts/send-otp", {
      whatsapp_number,
    }),

  verifyOtp: (whatsapp_number: string, otp: string) =>
    apiClient.post<{ success: boolean; message: string; phone?: string }>("/api/stocks/alerts/verify-otp", {
      whatsapp_number,
      otp,
    }),

  checkVerification: (whatsapp_number: string) =>
    apiClient.get<{ whatsapp_number: string; is_verified: boolean }>("/api/stocks/alerts/verification-status", {
      params: { whatsapp_number },
    }),

  getStreamUrl: () => `${getLocalApiBase()}/api/stocks/stream`,
  getWsUrl: () => {
    const base = getLocalApiBase()
      .replace(/^https:\/\//, "wss://")
      .replace(/^http:\/\//, "ws://");
    return `${base}/api/stocks/ws`;
  },
};
