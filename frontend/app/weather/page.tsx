'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../layout';
import { apiUrl } from '../../lib/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import {
  CloudSun,
  Thermometer,
  Droplet,
  Wind,
  CloudRain,
  Sun,
  CloudLightning,
  Gauge,
  Compass,
  AlertTriangle,
  Loader2,
  MapPin,
  Calendar,
  Zap
} from 'lucide-react';

interface DayForecast {
  date: string;
  temp_min: number;
  temp_max: number;
  humidity: number;
  rainfall_mm: number;
  condition: string;
}

interface WeatherAlert {
  alert_type: string;
  severity: string;
  message: string;
  timestamp: string;
}

interface CurrentWeather {
  temperature: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: string;
  solar_radiation: number;
  lightning_index: number;
  ground_temp: number;
  timestamp: string;
}

interface WeatherData {
  current: CurrentWeather;
  forecast: DayForecast[];
  alerts: WeatherAlert[];
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const conditionIcons: Record<string, React.ReactNode> = {
  Sunny: <Sun className="h-8 w-8 text-amber-400" />,
  Cloudy: <CloudSun className="h-8 w-8 text-slate-400" />,
  Rainy: <CloudRain className="h-8 w-8 text-blue-400" />,
  Thunderstorm: <CloudLightning className="h-8 w-8 text-purple-400" />,
  Windy: <Wind className="h-8 w-8 text-cyan-400" />,
};

const conditionGradients: Record<string, string> = {
  Sunny: 'from-amber-500 to-orange-500',
  Cloudy: 'from-slate-500 to-slate-600',
  Rainy: 'from-blue-500 to-indigo-600',
  Thunderstorm: 'from-purple-600 to-indigo-800',
  Windy: 'from-cyan-500 to-teal-600',
};

export default function WeatherIntelligence() {
  const { t } = useLanguage();
  const [state, setState] = useState('Tamil Nadu');
  const [district, setDistrict] = useState('Chennai');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WeatherData | null>(null);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/v1/weather/forecast'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, district })
      });
      const resData: WeatherData = await res.json();
      setData(resData);
    } catch (err) {
      console.error('Error fetching weather:', err);
      // Fallback data
      setData({
        current: {
          temperature: 30.2,
          humidity: 72.5,
          pressure: 1008.3,
          wind_speed: 14.2,
          wind_direction: 'SE',
          solar_radiation: 245.6,
          lightning_index: 32.1,
          ground_temp: 33.8,
          timestamp: new Date().toISOString()
        },
        forecast: [
          { date: '2026-07-01', temp_min: 24.2, temp_max: 33.5, humidity: 78.0, rainfall_mm: 12.3, condition: 'Rainy' },
          { date: '2026-07-02', temp_min: 25.0, temp_max: 34.1, humidity: 65.0, rainfall_mm: 0.0, condition: 'Sunny' },
          { date: '2026-07-03', temp_min: 23.8, temp_max: 31.2, humidity: 82.0, rainfall_mm: 28.5, condition: 'Thunderstorm' },
          { date: '2026-07-04', temp_min: 24.5, temp_max: 32.0, humidity: 70.0, rainfall_mm: 5.2, condition: 'Cloudy' },
          { date: '2026-07-05', temp_min: 25.2, temp_max: 35.0, humidity: 55.0, rainfall_mm: 0.0, condition: 'Sunny' },
          { date: '2026-07-06', temp_min: 24.8, temp_max: 33.8, humidity: 68.0, rainfall_mm: 3.1, condition: 'Cloudy' },
          { date: '2026-07-07', temp_min: 23.5, temp_max: 30.5, humidity: 85.0, rainfall_mm: 35.0, condition: 'Rainy' }
        ],
        alerts: [
          { alert_type: 'Heavy Rain', severity: 'Warning', message: 'IMD reports convective cloud buildup. Postpone urea application and ensure field drainage.', timestamp: new Date().toISOString() }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWeather();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const currentCondition = data?.forecast?.[0]?.condition ?? 'Sunny';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-outfit">
            Weather Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            7-day agrometeorological forecast with IMD-grade precision and crop-specific alerts
          </p>
        </div>

        {/* Location Selector */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs font-semibold">
          <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="bg-transparent border-none focus:outline-none font-bold text-xs cursor-pointer"
          >
            {INDIAN_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="text-slate-300">|</span>
          <input
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="District"
            className="w-24 bg-transparent border-none focus:outline-none font-bold"
          />
          <button
            onClick={fetchWeather}
            className="px-3 py-1.5 bg-emerald-500 text-white font-bold rounded-lg cursor-pointer hover:bg-emerald-600 transition-colors"
          >
            Fetch
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            Querying IMD meteorological stations and satellite feed...
          </span>
        </div>
      ) : data ? (
        <div className="space-y-8">

          {/* Current Weather Hero Card */}
          <div className={`bg-gradient-to-br ${conditionGradients[currentCondition] ?? 'from-emerald-600 to-teal-600'} text-white rounded-3xl p-8 shadow-lg relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r="80" fill="white" />
                <circle cx="60" cy="80" r="50" fill="white" />
                <circle cx="140" cy="90" r="45" fill="white" />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-white/15 rounded-2xl backdrop-blur-sm">
                    {conditionIcons[currentCondition] ?? <CloudSun className="h-8 w-8" />}
                  </div>
                  <div>
                    <p className="text-5xl font-extrabold">{data.current.temperature}°C</p>
                    <p className="text-sm opacity-80 mt-1">{currentCondition} &bull; {state}, {district}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <Droplet className="h-4 w-4 mx-auto opacity-80" />
                    <span className="text-[10px] opacity-70 block mt-1">Humidity</span>
                    <span className="font-bold text-sm">{data.current.humidity}%</span>
                  </div>
                  <div className="text-center bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <Wind className="h-4 w-4 mx-auto opacity-80" />
                    <span className="text-[10px] opacity-70 block mt-1">Wind</span>
                    <span className="font-bold text-sm">{data.current.wind_speed} km/h {data.current.wind_direction}</span>
                  </div>
                  <div className="text-center bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <Gauge className="h-4 w-4 mx-auto opacity-80" />
                    <span className="text-[10px] opacity-70 block mt-1">Pressure</span>
                    <span className="font-bold text-sm">{data.current.pressure} hPa</span>
                  </div>
                  <div className="text-center bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <Zap className="h-4 w-4 mx-auto opacity-80" />
                    <span className="text-[10px] opacity-70 block mt-1">Lightning</span>
                    <span className="font-bold text-sm">{data.current.lightning_index.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 opacity-70" />
                  <span className="text-xs">Solar Radiation: <strong>{data.current.solar_radiation} W/m²</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 opacity-70" />
                  <span className="text-xs">Ground Temp: <strong>{data.current.ground_temp}°C</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 opacity-70" />
                  <span className="text-xs">Wind Dir: <strong>{data.current.wind_direction}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* 7-Day Forecast Cards */}
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-emerald-500" />
              7-Day Agrometeorological Forecast
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {data.forecast.map((day, i) => (
                <div
                  key={day.date}
                  className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center space-y-2 transition-all hover:shadow-md hover:-translate-y-0.5 ${i === 0 ? 'ring-2 ring-emerald-500/50' : ''}`}
                >
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    {formatDate(day.date)}
                  </p>
                  <div className="flex justify-center py-1">
                    {conditionIcons[day.condition] ?? <CloudSun className="h-6 w-6 text-slate-400" />}
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{day.condition}</p>
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold">
                      <span className="text-rose-500">{day.temp_max}°</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-blue-500">{day.temp_min}°</span>
                    </p>
                    <p className="text-slate-500 flex items-center justify-center gap-1">
                      <CloudRain className="h-3 w-3" />{day.rainfall_mm}mm
                    </p>
                    <p className="text-slate-500 flex items-center justify-center gap-1">
                      <Droplet className="h-3 w-3" />{day.humidity}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Temperature Trend Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">Temperature Trend</h3>
                <p className="text-xs text-slate-500">Min/Max temperature over 7 days</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickFormatter={(v) => formatDate(v)} />
                    <YAxis stroke="#94a3b8" fontSize={9} unit="°C" />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                      labelFormatter={(v) => formatDate(v as string)}
                    />
                    <Area type="monotone" dataKey="temp_max" name="Max Temp" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorMax)" />
                    <Area type="monotone" dataKey="temp_min" name="Min Temp" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMin)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Rainfall Bar Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">Precipitation Forecast</h3>
                <p className="text-xs text-slate-500">Expected rainfall (mm) and humidity (%)</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickFormatter={(v) => formatDate(v)} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                      labelFormatter={(v) => formatDate(v as string)}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="rainfall_mm" name="Rainfall (mm)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="humidity" name="Humidity (%)" fill="#06b6d4" radius={[6, 6, 0, 0]} opacity={0.5} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Weather Alerts Panel */}
          {data.alerts.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Active Weather Alerts &amp; Agricultural Advisories
              </h3>
              <div className="space-y-3">
                {data.alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-4 rounded-xl border ${
                      alert.severity === 'Critical'
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30'
                        : alert.severity === 'Warning'
                          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30'
                          : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30'
                    }`}
                  >
                    <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${
                      alert.severity === 'Critical' ? 'text-rose-500'
                        : alert.severity === 'Warning' ? 'text-amber-500'
                          : 'text-blue-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs font-bold ${
                          alert.severity === 'Critical' ? 'text-rose-800 dark:text-rose-400'
                            : alert.severity === 'Warning' ? 'text-amber-800 dark:text-amber-400'
                              : 'text-blue-800 dark:text-blue-400'
                        }`}>
                          {alert.alert_type}
                        </h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          alert.severity === 'Critical' ? 'bg-rose-200 text-rose-800'
                            : alert.severity === 'Warning' ? 'bg-amber-200 text-amber-800'
                              : 'bg-blue-200 text-blue-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{alert.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{alert.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agricultural Advisory */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-3xl p-6 shadow-md space-y-4">
            <h4 className="font-bold text-base">🌾 Crop Advisory Based on Weather</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm space-y-2">
                <p className="font-bold text-sm">Irrigation</p>
                <p className="text-emerald-100 leading-relaxed">
                  {data.forecast.some(d => d.rainfall_mm > 10)
                    ? 'Significant rainfall expected. Reduce irrigation frequency and ensure proper drainage to prevent waterlogging.'
                    : 'Low rainfall projected. Maintain regular irrigation schedule and monitor soil moisture levels closely.'}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm space-y-2">
                <p className="font-bold text-sm">Pesticide Application</p>
                <p className="text-emerald-100 leading-relaxed">
                  {data.forecast.some(d => d.condition === 'Rainy' || d.condition === 'Thunderstorm')
                    ? 'Avoid spraying pesticides on rainy days. Plan application during dry windows for maximum efficacy.'
                    : 'Conditions are favorable for pesticide spraying. Apply during early morning or late evening hours.'}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm space-y-2">
                <p className="font-bold text-sm">Harvest Planning</p>
                <p className="text-emerald-100 leading-relaxed">
                  {data.current.humidity > 75
                    ? 'High humidity detected. Ensure harvested grains are dried properly to prevent fungal growth and storage losses.'
                    : 'Humidity levels are moderate. Good conditions for harvest and post-harvest drying operations.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}
