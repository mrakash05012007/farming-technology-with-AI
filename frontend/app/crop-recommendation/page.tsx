'use client';

import React, { useState } from 'react';
import { useLanguage } from '../layout';
import { INDIA_STATES_DISTRICTS } from '../data/india_data';
import { 
  Sprout, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  HelpCircle, 
  MapPin, 
  Sliders, 
  Coins, 
  ShieldCheck, 
  Sparkles,
  Loader2
} from 'lucide-react';

const STATES_DISTRICTS = INDIA_STATES_DISTRICTS;

export default function CropRecommendation() {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  
  // Form State
  const [state, setState] = useState('Punjab');
  const [district, setDistrict] = useState('Ludhiana');
  const [season, setSeason] = useState('Kharif');
  const [area, setArea] = useState('5.0');
  const [soilType, setSoilType] = useState('Alluvial');
  const [soilPh, setSoilPh] = useState('6.5');
  
  const [nitrogen, setNitrogen] = useState('80');
  const [phosphorus, setPhosphorus] = useState('40');
  const [potassium, setPotassium] = useState('40');
  const [organicCarbon, setOrganicCarbon] = useState('0.6');
  
  const [budget, setBudget] = useState('25000');
  const [waterAvailability, setWaterAvailability] = useState('Medium');
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setState(val);
    const dists = STATES_DISTRICTS[val as keyof typeof STATES_DISTRICTS] || [];
    setDistrict(dists[0] || '');
  };

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep(4); // Move to results step
    try {
      const res = await fetch('http://localhost:8000/api/v1/crop-recommendation/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          district,
          season,
          farm_area: parseFloat(area),
          soil_type: soilType,
          soil_ph: parseFloat(soilPh),
          nitrogen: parseFloat(nitrogen),
          phosphorus: parseFloat(phosphorus),
          potassium: parseFloat(potassium),
          organic_carbon: parseFloat(organicCarbon),
          temperature: 27.5,
          humidity: 72.0,
          rainfall: season === 'Kharif' ? 1100 : 450,
          water_availability: waterAvailability,
          budget: parseFloat(budget)
        })
      });
      const data = await res.json();
      if (data.recommendations) {
        setResults(data.recommendations);
      }
    } catch (err) {
      console.error("Error fetching crop recommendation:", err);
      // Fallback local mock data
      setResults([
        {
          rank: 1, crop: "Rice", confidence: 0.95, expected_yield: 2.4, growing_duration: 120, estimated_profit: 38000,
          water_requirement: 1200, seed_requirement: 20, fertilizer_schedule: ["Week 1: Basal NPK", "Week 4: Urea split"],
          disease_risk: "Medium", major_diseases: ["Blast", "Brown Spot"], insurance_plan: "PMFBY Standard", subsidy_info: "50% Seed Subsidy"
        },
        {
          rank: 2, crop: "Maize", confidence: 0.82, expected_yield: 2.1, growing_duration: 100, estimated_profit: 29500,
          water_requirement: 600, seed_requirement: 8, fertilizer_schedule: ["Week 1: Basal NPK", "Week 5: Nitrogen top-up"],
          disease_risk: "Low", major_diseases: ["Leaf Blight"], insurance_plan: "WBCIS Maize Protection", subsidy_info: "ISOPOM Subsidy"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-outfit">AI Crop Recommendation Engine</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Maximize yield and profit by selecting crops tailored to your soil, climate, and financial parameters</p>
      </div>

      {/* Wizard Progress Indicator */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
        {[
          { num: 1, label: "Geographics", icon: MapPin },
          { num: 2, label: "Soil Nutrients", icon: Sliders },
          { num: 3, label: "Farm Economics", icon: Coins },
          { num: 4, label: "Analysis Results", icon: Sparkles }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
              step === s.num 
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                : step > s.num 
                  ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            }`}>
              {s.num}
            </div>
            <span className={`text-xs font-semibold hidden md:inline ${
              step === s.num ? "text-slate-800 dark:text-slate-200" : "text-slate-400"
            }`}>
              {s.label}
            </span>
            {s.num < 4 && <ChevronRight className="h-4 w-4 text-slate-300 hidden md:block" />}
          </div>
        ))}
      </div>

      {/* Wizard Body Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        
        {/* Step 1: Geographics & Location */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-500" />
              Regional & Climatic Context
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">State / Union Territory</label>
                <select value={state} onChange={handleStateChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500">
                  {Object.keys(STATES_DISTRICTS).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">District</label>
                <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500">
                  {(STATES_DISTRICTS[state as keyof typeof STATES_DISTRICTS] || []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Season</label>
                <select value={season} onChange={(e) => setSeason(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500">
                  <option value="Kharif">Kharif (Monsoon)</option>
                  <option value="Rabi">Rabi (Winter)</option>
                  <option value="Zaid">Zaid (Summer)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Farm Area (Acres)</label>
                <input type="number" value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button onClick={() => setStep(2)} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md flex items-center gap-1 cursor-pointer">
                Next Step
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Soil Nutrients */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-emerald-500" />
              Soil Chemistry & Nutrients (N-P-K)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Nitrogen (N) - kg/ha</label>
                <input type="number" value={nitrogen} onChange={(e) => setNitrogen(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Phosphorus (P) - kg/ha</label>
                <input type="number" value={phosphorus} onChange={(e) => setPhosphorus(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Potassium (K) - kg/ha</label>
                <input type="number" value={potassium} onChange={(e) => setPotassium(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Soil pH</label>
                <input type="number" step="0.1" value={soilPh} onChange={(e) => setSoilPh(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Organic Carbon (%)</label>
                <input type="number" step="0.1" value={organicCarbon} onChange={(e) => setOrganicCarbon(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Soil Classification Type</label>
                <select value={soilType} onChange={(e) => setSoilType(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500">
                  <option value="Alluvial">Alluvial</option>
                  <option value="Black">Black Soil</option>
                  <option value="Red">Red Soil</option>
                  <option value="Laterite">Laterite</option>
                  <option value="Clayey">Clayey</option>
                  <option value="Sandy">Sandy</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-1 cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button onClick={() => setStep(3)} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md flex items-center gap-1 cursor-pointer">
                Next Step
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Farm Economics */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-500" />
              Financials & Water Infrastructure
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Working Budget (INR)</label>
                <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Water Availability Level</label>
                <select value={waterAvailability} onChange={(e) => setWaterAvailability(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500">
                  <option value="High">High (Perennial Canal / Tube-well)</option>
                  <option value="Medium">Medium (Rainfed + seasonal backup)</option>
                  <option value="Low">Low (Arid / rainfed only)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(2)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-1 cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button onClick={handleRecommend} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer">
                Generate Crop Recommendation
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Results Display */}
        {step === 4 && (
          <div className="space-y-8">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                <p className="font-semibold text-slate-600 dark:text-slate-400 text-sm">Processing soil composition & running Random Forest classification...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Recommended Crops (Top 10 Match)</h3>
                  <button onClick={() => setStep(1)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-lg cursor-pointer">
                    Run New Analysis
                  </button>
                </div>

                <div className="space-y-6">
                  {results.map((crop, idx) => (
                    <div key={crop.crop} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-800/20 hover:border-emerald-500 transition-all space-y-4">
                      
                      {/* Crop Header */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center text-sm">
                            #{idx + 1}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-lg text-slate-800 dark:text-slate-200">{crop.crop}</h4>
                            <span className="text-xs text-slate-500 font-medium">Confidence Score: {(crop.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Estimated Profit</span>
                          <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">₹{crop.estimated_profit.toLocaleString()} / Acre</span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500">Expected Yield:</span>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{crop.expected_yield} Tons/Acre</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Growing Cycle:</span>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{crop.growing_duration} Days</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Water Needed:</span>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{crop.water_requirement} mm</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Seed Rate:</span>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{crop.seed_requirement} kg/Acre</p>
                        </div>
                      </div>

                      {/* Additional Metadata */}
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/60 dark:border-slate-800/60 text-xs space-y-2">
                        <p><strong>Fertilizer Schedule:</strong></p>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                          {crop.fertilizer_schedule.map((f: string) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-6 gap-y-2 text-[10px]">
                          <span className="text-slate-500">🛡️ <strong>Insurance:</strong> {crop.insurance_plan}</span>
                          <span className="text-slate-500">💰 <strong>Govt. Subsidy:</strong> {crop.subsidy_info}</span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
