"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  BarChart2,
  TrendingUp,
  Maximize2,
  Minimize2,
  Clock,
  Layers,
  Bell,
  Shield,
  Activity,
  Zap,
} from "lucide-react";
import {
  createChart,
  AreaSeries,
  HistogramSeries,
  CandlestickSeries,
  ColorType,
  IChartApi,
} from "lightweight-charts";
import { StockTicker, MarketDepthData } from "@/lib/api/stocks";

interface BinanceChartPanelProps {
  stock: StockTicker | null;
  depth: MarketDepthData | null;
  onOpenAlertModal: (ticker: string) => void;
}

type Timeframe = "1m" | "5m" | "15m" | "1H" | "1D";
type ChartType = "area" | "candle";

export function BinanceChartPanel({
  stock,
  depth,
  onOpenAlertModal,
}: BinanceChartPanelProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const [timeframe, setTimeframe] = useState<Timeframe>("5m");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [showMA, setShowMA] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Price metrics
  const ltp = stock?.ltp ?? 0;
  const ycp = stock?.ycp ?? ltp;
  const high = stock?.high ?? ltp;
  const low = stock?.low ?? ltp;
  const open = stock?.open ?? ltp;
  const isPositive = (stock?.change ?? 0) >= 0;

  // Circuit limits & 52w bounds
  const upperLimit = ycp > 0 ? Number((ycp * 1.1).toFixed(2)) : Number((ltp * 1.1).toFixed(2));
  const lowerLimit = ycp > 0 ? Number((ycp * 0.9).toFixed(2)) : Number((ltp * 0.9).toFixed(2));
  const est52wHigh = Number(Math.max(high, ltp * 1.35).toFixed(2));
  const est52wLow = Number(Math.min(low, ltp * 0.72).toFixed(2));

  // 52-week position percentage
  const rangePct = useMemo(() => {
    if (est52wHigh <= est52wLow) return 50;
    const p = ((ltp - est52wLow) / (est52wHigh - est52wLow)) * 100;
    return Math.max(0, Math.min(100, Math.round(p)));
  }, [ltp, est52wHigh, est52wLow]);

  // Buy vs Sell pressure
  const buyPct = depth?.buy_percentage ?? 50;
  const sellPct = depth?.sell_percentage ?? 50;

  const seriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const lastBarRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !stock) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      lastBarRef.current = null;
    }

    const container = chartContainerRef.current;
    const initialHeight = container.clientHeight > 50 ? container.clientHeight : (isFullscreen ? 580 : 350);

    const chart = createChart(container, {
      width: container.clientWidth,
      height: initialHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#12161c" },
        textColor: "#848e9c",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      crosshair: {
        vertLine: { color: "#f0b90b", width: 1, style: 2 },
        horzLine: { color: "#f0b90b", width: 1, style: 2 },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#1e2329",
      },
      rightPriceScale: {
        borderColor: "#1e2329",
      },
    });

    chartRef.current = chart;

    const lineColor = isPositive ? "#0ecb81" : "#f6465d";
    const topColor = isPositive ? "rgba(14, 203, 129, 0.25)" : "rgba(246, 70, 93, 0.25)";

    // Prepare simulated/real intraday candlesticks & area series
    const baseLtp = ltp > 0 ? ltp : 100;
    const now = Math.floor(Date.now() / 1000);
    const stepSeconds = timeframe === "1m" ? 60 : timeframe === "5m" ? 300 : timeframe === "15m" ? 900 : timeframe === "1H" ? 3600 : 86400;

    const pointsCount = 40;
    const candleData: any[] = [];
    const areaData: any[] = [];
    const volumeData: any[] = [];

    let curPrice = open > 0 ? open : baseLtp * 0.98;
    for (let i = pointsCount; i >= 0; i--) {
      const t = now - i * stepSeconds;
      const progress = 1 - i / pointsCount;
      const target = baseLtp;
      const drift = (target - curPrice) * 0.1;
      const noise = (Math.sin(i * 1.5) * baseLtp * 0.008) + drift;
      const o = curPrice;
      const c = i === 0 ? baseLtp : Math.max(0.1, Number((o + noise).toFixed(2)));
      const h = Math.max(o, c) + Math.abs(noise * 0.5);
      const l = Math.min(o, c) - Math.abs(noise * 0.5);
      curPrice = c;

      const vol = Math.floor(Math.abs(Math.sin(i)) * 45000 + 10000);

      candleData.push({
        time: t as any,
        open: Number(o.toFixed(2)),
        high: Number(h.toFixed(2)),
        low: Number(l.toFixed(2)),
        close: Number(c.toFixed(2)),
      });

      areaData.push({
        time: t as any,
        value: Number(c.toFixed(2)),
      });

      volumeData.push({
        time: t as any,
        value: vol,
        color: c >= o ? "rgba(14, 203, 129, 0.3)" : "rgba(246, 70, 93, 0.3)",
      });
    }

    if (chartType === "candle") {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#0ecb81",
        downColor: "#f6465d",
        borderVisible: false,
        wickUpColor: "#0ecb81",
        wickDownColor: "#f6465d",
      });
      candleSeries.setData(candleData);
      seriesRef.current = candleSeries;
      lastBarRef.current = candleData[candleData.length - 1];
    } else {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor,
        topColor,
        bottomColor: "rgba(0, 0, 0, 0)",
        lineWidth: 2,
        priceFormat: { type: "price", precision: 2, minMove: 0.1 },
      });
      areaSeries.setData(areaData);
      seriesRef.current = areaSeries;
      lastBarRef.current = areaData[areaData.length - 1];
    }

    // Volume Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    volumeSeries.setData(volumeData);
    volumeSeriesRef.current = volumeSeries;

    // Auto-fit content
    chart.timeScale().fitContent();

    // Resize handler via ResizeObserver and window event
    const handleResize = () => {
      if (container && chartRef.current) {
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight > 50 ? container.clientHeight : 350,
        });
      }
    };

    const ro = new ResizeObserver(() => handleResize());
    ro.observe(container);
    window.addEventListener("resize", handleResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
        volumeSeriesRef.current = null;
        lastBarRef.current = null;
      }
    };
  }, [stock?.ticker, timeframe, chartType, isFullscreen]);

  // Real-time tick update to the active chart series without recreating the chart
  useEffect(() => {
    if (!seriesRef.current || !lastBarRef.current || ltp <= 0) return;

    try {
      if (chartType === "candle") {
        const prev = lastBarRef.current;
        const updated = {
          ...prev,
          close: ltp,
          high: Math.max(prev.high, ltp),
          low: Math.min(prev.low, ltp),
        };
        lastBarRef.current = updated;
        seriesRef.current.update(updated);
      } else if (chartType === "area") {
        const prev = lastBarRef.current;
        const updated = {
          time: prev.time,
          value: ltp,
        };
        lastBarRef.current = updated;
        seriesRef.current.update(updated);
      }
    } catch {}
  }, [ltp, chartType]);

  return (
    <div className="flex flex-col bg-[#12161c] h-full border-r border-[#1e2329] select-none text-xs">
      {/* ── Chart Pro Controls Bar ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#1e2329] bg-[#181a20]">
        {/* Timeframes */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#848e9c] mr-1 hidden sm:inline">Time:</span>
          {(["1m", "5m", "15m", "1H", "1D"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-all ${
                timeframe === tf
                  ? "bg-[#2b313a] text-[#f0b90b]"
                  : "text-[#848e9c] hover:text-[#eaecef]"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Type & Indicator Toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded bg-[#12161c] border border-[#2b313a]">
            <button
              onClick={() => setChartType("area")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                chartType === "area"
                  ? "bg-[#2b313a] text-[#eaecef]"
                  : "text-[#848e9c] hover:text-[#eaecef]"
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType("candle")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                chartType === "candle"
                  ? "bg-[#2b313a] text-[#eaecef]"
                  : "text-[#848e9c] hover:text-[#eaecef]"
              }`}
            >
              Candles
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-[#848e9c] hover:text-[#eaecef] rounded hover:bg-[#2b313a] transition-all"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Lightweight Canvas Chart Container ───────────────── */}
      <div className="flex-1 w-full min-h-[160px] relative bg-[#12161c] overflow-hidden">
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>

      {/* ── Decision-Making Gauges & Analysis Hub (Compact Zero-Scroll Strip) ── */}
      <div className="px-2 py-1 border-t border-[#1e2329] bg-[#181a20] shrink-0 space-y-1">
        <div className="grid grid-cols-3 gap-1.5">
          {/* Gauge 1: 52-Week Range Meter */}
          <div className="p-1 rounded bg-[#12161c] border border-[#2b313a]/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#848e9c] font-medium flex items-center gap-0.5">
                <Activity className="w-2.5 h-2.5 text-[#f0b90b]" />
                <span>52W</span>
              </span>
              <span className="font-mono font-bold text-[#eaecef] text-[10px]">{rangePct}%</span>
            </div>
            {/* Visual Slider Bar */}
            <div className="w-full bg-[#1e2329] h-1.5 rounded-full overflow-hidden my-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#f6465d] via-[#f0b90b] to-[#0ecb81] rounded-full transition-all duration-500"
                style={{ width: `${rangePct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-[#848e9c]">
              <span>L: {est52wLow}</span>
              <span className="text-[#f0b90b] font-bold">LTP: {ltp}</span>
              <span>H: {est52wHigh}</span>
            </div>
          </div>

          {/* Gauge 2: Circuit Limits Guard */}
          <div className="p-1 rounded bg-[#12161c] border border-[#2b313a]/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#848e9c] font-medium flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5 text-cyan-400" />
                <span>Circuit</span>
              </span>
              <span className="text-[9px] text-cyan-400 font-bold">±10%</span>
            </div>
            {/* Visual Limit Meter */}
            <div className="w-full bg-[#1e2329] h-1.5 rounded-full overflow-hidden flex my-0.5">
              <div className="bg-[#f6465d]/50 w-1/2 h-full" />
              <div className="bg-[#0ecb81]/50 w-1/2 h-full" />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-[#848e9c]">
              <span className="text-[#f6465d]">Flr: {lowerLimit}</span>
              <span className="text-[#0ecb81]">Ceil: {upperLimit}</span>
            </div>
          </div>

          {/* Gauge 3: Order Depth Ratio */}
          <div className="p-1 rounded bg-[#12161c] border border-[#2b313a]/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#848e9c] font-medium flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 text-[#0ecb81]" />
                <span>Pressure</span>
              </span>
              <span className="font-mono text-[9px]">
                <strong className="text-[#0ecb81]">{buyPct}%B</strong> / <strong className="text-[#f6465d]">{sellPct}%S</strong>
              </span>
            </div>
            {/* Split Pressure Bar */}
            <div className="w-full bg-[#1e2329] h-1.5 rounded-full overflow-hidden flex my-0.5">
              <div
                className="bg-[#0ecb81] h-full transition-all duration-300"
                style={{ width: `${buyPct}%` }}
              />
              <div
                className="bg-[#f6465d] h-full transition-all duration-300"
                style={{ width: `${sellPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-[#848e9c]">
              <span className="text-[#0ecb81]">Demand</span>
              <span className="text-[#f6465d]">Supply</span>
            </div>
          </div>
        </div>

        {/* Quick Alert CTA Strip */}
        <div className="flex items-center justify-between text-[10px] text-[#848e9c] pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81]" />
            <span className="hidden sm:inline">Real-time Stream</span>
          </div>

          {stock && (
            <button
              onClick={() => onOpenAlertModal(stock.ticker)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0b90b]/15 hover:bg-[#f0b90b]/25 text-[#f0b90b] border border-[#f0b90b]/40 font-bold transition-all text-[10px]"
            >
              <Bell className="w-2.5 h-2.5" />
              <span>WhatsApp Alert</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
