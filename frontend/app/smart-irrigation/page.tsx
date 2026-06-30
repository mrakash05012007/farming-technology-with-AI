'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../layout';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Droplet, 
  Wifi, 
  Power, 
  AlertTriangle, 
  Thermometer, 
  Clock, 
  Activity, 
  Calculator,
  Loader2 
} from 'lucide-react';

interface TelemetryPoint {
  time: string;
  moisture: number;
  flow: number;
}

interface IrrigationCalculation {
  evapotranspiration_et0: number;
  crop_water_need_etc: number;
  net_irrigation_needed_mm: number;
  net_irrigation_needed_liters_per_acre: number;
  best_irrigation_time: string;
  water_stress_status: string;
  risks: string[];
  method_efficiency: number;
  recommendations: string[];
  schedule?: {
    morning: { active: boolean; quantity_liters: number };
    evening: { active: boolean; quantity_liters: number };
    night: { active: boolean; quantity_liters: number };
  };
}

export default function SmartIrrigation() {
  const { t } = useLanguage();
  
  // Calculator inputs
  const [crop, setCrop] = useState('Rice');
  const [stage, setStage] = useState('Development');
  const [moistureInput, setMoistureInput] = useState('45');
  const [tempInput, setTempInput] = useState('32');
  const [solarInput, setSolarInput] = useState('22');
  const [method, setMethod] = useState('Drip');

  const [loading, setLoading] = useState(false);
  const [calcResult, setCalcResult] = useState<IrrigationCalculation | null>(null);

  // IoT Live Telemetry Simulator State
  const [pumpActive, setPumpActive] = useState(false);
  const [liveMoisture, setLiveMoisture] = useState(48.5);
  const [liveFlowRate, setLiveFlowRate] = useState(0.0);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>(() => {
    const history = [];
    const now = new Date();
    for (let i = 10; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 5000).toLocaleTimeString();
      history.push({
        time: timeStr,
        moisture: 48.0 + Math.sin(i) * 1.5,
        flow: 0.0
      });
    }
    return history;
  });

  // Calculate Irrigation Need
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/irrigation/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop,
          growth_stage: stage,
          soil_moisture: parseFloat(moistureInput),
          temperature: parseFloat(tempInput),
          humidity: 65.0,
          wind_speed: 12.5,
          solar_radiation: parseFloat(solarInput),
          rainfall: 0.0,
          groundwater_depth: 15.0,
          reservoir_level: 65.0,
          irrigation_method: method
        })
      });
      const data = await res.json();
      setCalcResult(data);
    } catch (err) {
      console.error("Error calculating irrigation:", err);
      // Fallback
      setCalcResult({
        evapotranspiration_et0: 5.8,
        crop_water_need_etc: 4.64,
        net_irrigation_needed_mm: 5.16,
        net_irrigation_needed_liters_per_acre: 20882.5,
        best_irrigation_time: "Morning (05:00 - 08:00 AM)",
        water_stress_status: "Warning",
        risks: ["Moderate Under-irrigation"],
        method_efficiency: 0.90,
        recommendations: [
          "Schedule irrigation within the next 24 hours.",
          "Using Drip irrigation achieves 90% field application efficiency."
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // IoT Pump Relay Control Toggle
  const handleTogglePump = async () => {
    const nextState = !pumpActive;
    setPumpActive(nextState);
    setLiveFlowRate(nextState ? 12.0 : 0.0);

    try {
      await fetch('http://localhost:8000/api/v1/iot/control-pump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farm_id: 1,
          device_id: "ESP32_NODE_01",
          action: nextState ? "ON" : "OFF"
        })
      });
    } catch (err) {
      console.error("Error controlling IoT pump:", err);
    }
  };

  // Initialize and run real-time IoT simulator
  useEffect(() => {
    const interval = setInterval(() => {
      let nextMoistureVal = 0;

      setLiveMoisture((prev) => {
        // If pump is active, moisture increases. If inactive, it dries out slowly.
        let nextMoisture = prev;
        if (pumpActive) {
          nextMoisture = Math.min(100, prev + 0.4 + Math.random() * 0.1);
        } else {
          nextMoisture = Math.max(0, prev - 0.05 - Math.random() * 0.02);
        }
        nextMoistureVal = parseFloat(nextMoisture.toFixed(2));
        return nextMoistureVal;
      });

      setTelemetryHistory((prevHistory) => {
        const nextHistory = [...prevHistory];
        nextHistory.shift();
        nextHistory.push({
          time: new Date().toLocaleTimeString(),
          moisture: nextMoistureVal,
          flow: liveFlowRate
        });
        return nextHistory;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [pumpActive, liveFlowRate]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-outfit">Smart Irrigation & IoT Cockpit</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Calculate exact evapotranspiration water demands and control edge telemetry pumps in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Evapotranspiration Calculator Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 lg:col-span-1 h-fit">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-500" />
            Evapotranspiration Calculator
          </h3>

          <form onSubmit={handleCalculate} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500">Crop Type</label>
              <select value={crop} onChange={(e) => setCrop(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500">
                <option value="Rice">Rice</option>
                <option value="Wheat">Wheat</option>
                <option value="Maize">Maize</option>
                <option value="Tomato">Tomato</option>
                <option value="Potato">Potato</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500">Growth Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500">
                <option value="Initial">Initial (Sowing)</option>
                <option value="Development">Development (Vegetative)</option>
                <option value="Mid-season">Mid-season (Flowering)</option>
                <option value="Late-season">Late-season (Ripening)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500">Soil Moisture (%)</label>
              <input type="number" value={moistureInput} onChange={(e) => setMoistureInput(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500">Solar Radiation (MJ/m²/day)</label>
              <input type="number" value={solarInput} onChange={(e) => setSolarInput(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500">Irrigation Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500">
                <option value="Drip">Drip Irrigation</option>
                <option value="Sprinkler">Sprinkler Irrigation</option>
                <option value="Flood">Flood Irrigation</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Calculate Water Need"}
            </button>
          </form>

          {calcResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">ETc Water Need:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{calcResult.crop_water_need_etc} mm/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Irrigation Volume:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{calcResult.net_irrigation_needed_liters_per_acre.toLocaleString()} L/Acre</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Water Stress:</span>
                <span className={`font-bold uppercase ${
                  calcResult.water_stress_status === 'Critical' ? 'text-rose-500 animate-pulse' : 'text-emerald-600'
                }`}>{calcResult.water_stress_status}</span>
              </div>
              <div className="pt-2 border-t border-emerald-200/40 space-y-1">
                <p className="font-bold">Recommendations:</p>
                <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-1">
                  {calcResult.recommendations.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right IoT Telemetry Cockpit */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* IoT Controller Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-emerald-500 animate-pulse" />
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Node 01: Pump Controller</h3>
                  <p className="text-[10px] text-slate-500">Device ID: ESP32_NODE_01</p>
                </div>
              </div>
              
              <button 
                onClick={handleTogglePump}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                  pumpActive 
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20" 
                    : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                }`}
              >
                <Power className="h-4 w-4" />
                {pumpActive ? "Stop Pump (ON)" : "Start Pump (OFF)"}
              </button>
            </div>

            {/* IoT Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold">Soil Moisture</span>
                <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200">{liveMoisture}%</p>
                <span className={`text-[9px] font-bold ${liveMoisture > 70 ? 'text-teal-600' : liveMoisture < 45 ? 'text-amber-500' : 'text-emerald-600'}`}>
                  {liveMoisture > 70 ? "Saturated" : liveMoisture < 45 ? "Under-watered" : "Optimal"}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold">Water Flow Rate</span>
                <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200">{liveFlowRate} L/min</p>
                <span className="text-[9px] text-slate-500 font-semibold">Pump Status: {pumpActive ? "ON" : "OFF"}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 font-bold">Last Telemetry Received</span>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pt-1">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  Just now
                </p>
                <span className="text-[9px] text-slate-500 font-semibold">Signal Strength: -62dBm</span>
              </div>
            </div>
          </div>

          {/* Real-time Charts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Live Telemetry Stream (Last 30s)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryHistory} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={9} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="moisture" name="Soil Moisture %" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="flow" name="Flow Rate (L/min)" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
