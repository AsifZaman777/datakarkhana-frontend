import apiClient from "@/lib/api/client";
import { getLocalApiBase } from "@/lib/constants";

export interface StockTicker {
  ticker: string;
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
    session?: {
      state: string;
      date: string;
      time: string;
    };
    movers?: any;
    topMovers?: any;
  };
  is_trading_hour: boolean;
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
  quantity: number;
  orders: number;
}

export interface MarketDepthData {
  code: string;
  bids: MarketDepthLevel[];
  asks: MarketDepthLevel[];
  asOf?: string;
  session?: any;
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

export const stocksApi = {
  getSummary: () => apiClient.get<MarketSummary>("/api/stocks/summary"),
  getBoards: () => apiClient.get<{ boards: BoardSummaryItem[]; total_instruments: number }>("/api/stocks/boards"),
  
  getAll: (params?: {
    search?: string;
    sector?: string;
    category?: string;
    board?: string;
    sort_by?: string;
    sort_order?: string;
  }) => apiClient.get<{ count: number; stocks: StockTicker[] }>("/api/stocks/all", { params }),

  getDetail: (ticker: string) =>
    apiClient.get<StockTicker & { intraday_series: { time: number; value: number; volume: number }[] }>(
      `/api/stocks/detail/${ticker}`
    ),

  getNews: (ticker?: string, limit: number = 50) =>
    apiClient.get<{ count: number; news: StockNewsItem[] }>("/api/stocks/news", {
      params: { ticker, limit },
    }),

  getMarketDepth: (code: string) =>
    apiClient.get<MarketDepthData>("/api/stocks/depth", { params: { code } }),

  getDepthInstruments: () =>
    apiClient.get<{ rows: { code: string; name: string; sector: string; price: number }[]; popular: string[] }>(
      "/api/stocks/depth/instruments"
    ),

  getSectorHeatmap: () => apiClient.get<SectorHeatmapData>("/api/stocks/sector-heatmap"),
  getTopShares: () => apiClient.get<TopSharesData>("/api/stocks/top-shares"),

  getCircuitBreakers: () =>
    apiClient.get<{ count: number; circuit_breakers: CircuitBreakerItem[] }>("/api/stocks/circuit-breakers"),

  getRecentMarketInfo: (fromDate?: string, toDate?: string) =>
    apiClient.get<{ rows: RecentMarketInfoRow[] }>("/api/stocks/recent-market-info", {
      params: { from_date: fromDate, to_date: toDate },
    }),

  getPe: () => apiClient.get<{ count: number; pe_data: PEItem[] }>("/api/stocks/pe"),

  getAtAGlance: () => apiClient.get<{ count: number; at_a_glance: Record<string, string>[] }>("/api/stocks/at-a-glance"),

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

  getStreamUrl: () => `${getLocalApiBase()}/api/stocks/stream`,
  getWsUrl: () => {
    const base = getLocalApiBase()
      .replace(/^https:\/\//, "wss://")
      .replace(/^http:\/\//, "ws://");
    return `${base}/api/stocks/ws`;
  },
};
