'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../layout';
import { apiUrl } from '../../lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { KpiCard } from '../components/KpiCard';
import { WeatherWidget } from '../components/WeatherWidget';
import {
  Sprout, Layers, Droplet, TrendingUp, AlertCircle,
  Thermometer, Wind, Sun, Loader2, ArrowUpRight,
  ArrowDownRight, Bell, MapPin, Activity, Zap, ChevronRight
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────
interface Alert       { id: number; type: string; severity: string; title: string; message: string; }
interface MarketTrend { crop: string; price: number; trend: string; change_pct: number; }
interface Summary {
  total_farms: number; total_area_acres: number;
  weather_summary:   { temperature_c: number; humidity_pct: number; rainfall_mm: number; wind_speed_kmh: number; };
  soil_summary:      { average_moisture_pct: number; average_ndvi: number; water_requirement_liters: number; };
  crop_health:       { status: string; excellent_pct: number; fair_pct: number; poor_pct: number; };
  financial_summary: { expected_yield_tons: number; expected_profit_inr: number; expenses_inr: number; };
  market_trends: MarketTrend[];
  alerts: Alert[];
}

const chartData = [
  { name: 'Jan', ndvi: 0.42, moisture: 35, water_needed: 600 },
  { name: 'Feb', ndvi: 0.55, moisture: 42, water_needed: 550 },
  { name: 'Mar', ndvi: 0.68, moisture: 50, water_needed: 480 },
  { name: 'Apr', ndvi: 0.76, moisture: 54, water_needed: 400 },
  { name: 'May', ndvi: 0.71, moisture: 48, water_needed: 450 },
  { name: 'Jun', ndvi: 0.62, moisture: 38, water_needed: 580 },
];

const FALLBACK: Summary = {
  total_farms: 3, total_area_acres: 24.5,
  weather_summary:   { temperature_c: 28.5, humidity_pct: 68, rainfall_mm: 1.2, wind_speed_kmh: 14.5 },
  soil_summary:      { average_moisture_pct: 54, average_ndvi: 0.72, water_requirement_liters: 11025.5 },
  crop_health:       { status: 'Good', excellent_pct: 65, fair_pct: 25, poor_pct: 10 },
  financial_summary: { expected_yield_tons: 51.4, expected_profit_inr: 1029000, expenses_inr: 294000 },
  market_trends: [
    { crop: 'Rice',   price: 2250, trend: 'Up',     change_pct: 2.4  },
    { crop: 'Wheat',  price: 2320, trend: 'Up',     change_pct: 1.8  },
    { crop: 'Tomato', price: 1800, trend: 'Down',   change_pct: -8.5 },
    { crop: 'Onion',  price: 2100, trend: 'Stable', change_pct: 0.2  },
  ],
  alerts: [
    { id:1, type:'Weather', severity:'Warning',  title:'Heavy Rainfall Expected',     message:'IMD reports convective cloud buildup. Postpone urea application for 48 hrs.' },
    { id:2, type:'Disease', severity:'Critical', title:'Yellow Rust Outbreak Nearby', message:'Spotted 5 km away in neighbouring wheat fields. Inspect crops immediately.' },
  ],
};

export default function Dashboard() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(apiUrl('/api/v1/dashboard/summary/1'));
        setSummary(await res.json());
      } catch {
        setSummary(FALLBACK);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading AgriVerse telemetry…</p>
      </div>
    );
  }

  const s      = summary!;
  const soil   = s.soil_summary;
  const fin    = s.financial_summary;
  const health = s.crop_health;

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-10"
        style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #0f766e 100%)' }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(52,211,153,0.4) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, #34d399, transparent 70%)' }} />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Left: text */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border"
                style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(52,211,153,0.3)', color: '#a7f3d0' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Live · AgriVerse Grid Connected
              </span>
              <span className="text-[11px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <MapPin className="w-3 h-3" /> Ludhiana, Punjab
              </span>
            </div>

            <h1 className="font-outfit text-white"
              style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Agricultural{' '}
              <span style={{
                background: 'linear-gradient(90deg,#6ee7b7,#34d399,#a7f3d0)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Command Center</span>
            </h1>

            <p className="text-sm leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Real-time IoT telemetry, Sentinel-2 satellite crop health, and AI-driven market analytics — unified enterprise dashboard.
            </p>

            <div className="flex gap-3 flex-wrap pt-1">
              <a href="/crop-recommendation"
                className="inline-flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl no-underline transition-all"
                style={{ background: 'linear-gradient(135deg,#059669,#0d9488)', boxShadow: '0 4px 16px rgba(5,150,105,0.35)', textDecoration: 'none' }}>
                <Sprout className="w-4 h-4" /> Get Crop Advisory
              </a>
              <a href="/weather"
                className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl no-underline transition-all"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.80)', textDecoration: 'none' }}>
                <Sun className="w-4 h-4" /> Weather Forecast
              </a>
            </div>

            {/* Quick stats */}
            <div className="flex gap-6 pt-2 flex-wrap">
              {[
                { label: 'Active Farms', value: s.total_farms },
                { label: 'Total Area',   value: `${s.total_area_acres} ac` },
                { label: 'NDVI Index',   value: soil.average_ndvi },
                { label: 'Crop Status',  value: health.status },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="font-outfit font-extrabold text-white" style={{ fontSize: '20px' }}>{value}</p>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: weather widget */}
          <div className="lg:col-span-2">
            <WeatherWidget summary={s.weather_summary} />
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Farm Area"
          value={`${s.total_area_acres} ac`}
          subtitle={`${s.total_farms} active fields registered`}
          icon={<Sprout className="h-5 w-5" />}
          gradient="from-emerald-500 to-teal-600"
          animClass="anim-1"
        />
        <KpiCard
          title="Average NDVI Index"
          value={soil.average_ndvi}
          subtitle={`Health: ${health.status}`}
          icon={<Layers className="h-5 w-5" />}
          gradient="from-lime-500 to-emerald-600"
          animClass="anim-2"
        />
        <KpiCard
          title="Est. Daily Water Need"
          value={`${(soil.water_requirement_liters / 1000).toFixed(1)} kL`}
          subtitle="Based on ETc model"
          icon={<Droplet className="h-5 w-5" />}
          gradient="from-cyan-500 to-blue-600"
          animClass="anim-3"
        />
        <KpiCard
          title="Season Profit Est."
          value={`₹${(fin.expected_profit_inr / 100000).toFixed(1)}L`}
          subtitle={`Yield: ${fin.expected_yield_tons}T`}
          icon={<TrendingUp className="h-5 w-5" />}
          gradient="from-violet-500 to-purple-700"
          animClass="anim-4"
        />
      </div>

      {/* ── CHARTS ROW ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* NDVI + Moisture area chart */}
        <div className="lg:col-span-2 glass-card p-6 space-y-3 anim-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-outfit font-bold text-slate-800 dark:text-slate-100 text-base">Indices Trend Analysis</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">NDVI (Sentinel-2) vs Soil Moisture (IoT) · Last 6 months</p>
            </div>
            <div className="flex gap-4 text-[11px] font-semibold pt-1">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />NDVI
              </span>
              <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" />Moisture
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gNDVI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gMoist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', color: '#f1f5f9', fontSize: '12px' }} />
                <Area type="monotone" dataKey="ndvi"     name="NDVI"       stroke="#10b981" strokeWidth={2.5} fill="url(#gNDVI)"  dot={false} />
                <Area type="monotone" dataKey="moisture" name="Moisture %"  stroke="#06b6d4" strokeWidth={2.5} fill="url(#gMoist)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market prices */}
        <div className="glass-card p-6 flex flex-col anim-3">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-outfit font-bold text-slate-800 dark:text-slate-100 text-base">Market Prices</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">₹/Quintal · Live mandi rates</p>
            </div>
            <a href="/market-prices" className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 no-underline" style={{ textDecoration: 'none' }}>
              View all <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-2.5 flex-1">
            {s.market_trends.map((item) => (
              <div key={item.crop}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors"
                style={{ background: 'rgba(248,250,252,0.8)', borderColor: 'rgba(16,185,129,0.08)' }}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.trend === 'Up' ? 'bg-emerald-500' : item.trend === 'Down' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.crop}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">₹{item.price}</p>
                  <span className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${item.trend === 'Up' ? 'text-emerald-600' : item.trend === 'Down' ? 'text-rose-500' : 'text-slate-400'}`}>
                    {item.trend === 'Up'   ? <ArrowUpRight   className="w-3 h-3" /> : null}
                    {item.trend === 'Down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                    {item.change_pct > 0 ? '+' : ''}{item.change_pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <a href="/market-prices"
            className="block text-center mt-4 py-2.5 rounded-xl text-sm font-semibold text-white no-underline"
            style={{ background: 'linear-gradient(135deg,#059669,#0d9488)', boxShadow: '0 4px 14px rgba(5,150,105,0.25)', textDecoration: 'none' }}>
            Open Market Forecaster →
          </a>
        </div>
      </div>

      {/* ── CROP HEALTH + ALERTS ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Crop health */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4 anim-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-outfit font-bold text-slate-800 dark:text-slate-100 text-base">Crop Health</h3>
          </div>
          <div className="text-center py-2">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg,#059669,#0d9488)', boxShadow: '0 0 0 10px rgba(16,185,129,0.10)' }}>
              <Activity className="w-8 h-8 text-white" />
            </div>
            <p className="font-outfit font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">{health.status}</p>
            <p className="text-xs text-slate-400 mt-1">Overall ecosystem status</p>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Excellent', pct: health.excellent_pct, color: '#10b981' },
              { label: 'Fair',      pct: health.fair_pct,      color: '#f59e0b' },
              { label: 'Poor',      pct: health.poor_pct,      color: '#ef4444' },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600 dark:text-slate-300">{label}</span>
                  <span style={{ color }}>{pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
          <a href="/satellite-analytics"
            className="block text-center py-2 rounded-xl text-xs font-semibold border no-underline transition-all"
            style={{ borderColor: 'rgba(16,185,129,0.2)', color: '#059669', textDecoration: 'none' }}>
            View Satellite Analytics →
          </a>
        </div>

        {/* Alerts */}
        <div className="lg:col-span-3 glass-card p-6 flex flex-col anim-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              <Bell className="w-5 h-5 text-rose-500" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            </div>
            <h3 className="font-outfit font-bold text-slate-800 dark:text-slate-100 text-base">Active Alerts & Risks</h3>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Bell className="w-2.5 h-2.5" />{s.alerts.length} Active
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {s.alerts.map((alert) => (
              <div key={alert.id}
                className="flex gap-3 p-4 rounded-2xl border"
                style={{
                  background: alert.severity === 'Critical' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)',
                  borderColor: alert.severity === 'Critical' ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)',
                }}>
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: alert.severity === 'Critical' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)' }}>
                  <AlertCircle className="w-4 h-4" style={{ color: alert.severity === 'Critical' ? '#ef4444' : '#f59e0b' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-xs font-bold truncate"
                      style={{ color: alert.severity === 'Critical' ? '#dc2626' : '#d97706' }}>
                      {alert.title}
                    </h4>
                    <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: alert.severity === 'Critical' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                        color: alert.severity === 'Critical' ? '#ef4444' : '#f59e0b',
                      }}>{alert.severity}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <a href="/weather"
              className="text-center py-2.5 rounded-xl text-xs font-semibold border transition-all no-underline"
              style={{ borderColor: 'rgba(16,185,129,0.2)', color: '#059669', textDecoration: 'none' }}>
              Weather Details
            </a>
            <a href="/disease-detection"
              className="text-center py-2.5 rounded-xl text-xs font-semibold text-white no-underline"
              style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.25)', textDecoration: 'none' }}>
              Disease Detection
            </a>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────────────── */}
      <div className="glass-card p-6 anim-5">
        <h3 className="font-outfit font-bold text-slate-800 dark:text-slate-100 text-base mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Crop Advisor',     href: '/crop-recommendation', icon: Sprout,    grad: 'linear-gradient(135deg,#059669,#0d9488)', glow: 'rgba(5,150,105,0.20)'  },
            { label: 'Smart Irrigation', href: '/smart-irrigation',    icon: Droplet,   grad: 'linear-gradient(135deg,#0ea5e9,#0284c7)', glow: 'rgba(14,165,233,0.20)' },
            { label: 'Market Forecast',  href: '/market-prices',       icon: TrendingUp,grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', glow: 'rgba(139,92,246,0.20)' },
            { label: 'AI Chat',          href: '/chatbot',             icon: Zap,       grad: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.20)' },
          ].map(({ label, href, icon: Icon, grad, glow }) => (
            <a key={label} href={href}
              className="flex items-center gap-3 p-4 rounded-xl border transition-all no-underline group"
              style={{ border: '1px solid rgba(16,185,129,0.10)', background: 'rgba(248,250,252,0.6)', textDecoration: 'none' }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-2px)';
                el.style.boxShadow = `0 8px 24px ${glow}`;
                el.style.borderColor = '#10b981';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = '';
                el.style.boxShadow = '';
                el.style.borderColor = 'rgba(16,185,129,0.10)';
              }}
            >
              <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center" style={{ background: grad, boxShadow: `0 4px 12px ${glow}` }}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
              <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
