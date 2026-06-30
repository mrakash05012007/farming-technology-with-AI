from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
import datetime
import random

router = APIRouter()

class MarketInputSchema(BaseModel):
    crop: str
    state: str
    district: str
    current_market: Optional[str] = "Main Mandi"

class PricePoint(BaseModel):
    date: str
    predicted_price: float
    confidence_interval_low: float
    confidence_interval_high: float

class MarketPredictionOutput(BaseModel):
    crop: str
    current_price: float
    msp: float  # Minimum Support Price
    demand_level: str  # High, Medium, Low
    supply_level: str
    best_selling_time: str
    best_market: str
    storage_recommendation: str
    forecast_daily: List[PricePoint]
    forecast_monthly: List[PricePoint]
    nearby_markets: List[dict]

# Base Price & MSP index (per Quintal / 100 kg in INR)
CROP_MARKET_INDEX = {
    "Rice":       {"base": 2200, "msp": 2183, "volatility": 0.05, "seasonality": 12}, # peaks around Aug-Sep pre-harvest, lowest Nov-Dec harvest
    "Wheat":      {"base": 2300, "msp": 2275, "volatility": 0.04, "seasonality": 4},  # peaks Rabi sowing (Nov-Jan), low harvest (Apr-May)
    "Potato":     {"base": 1500, "msp": 0,    "volatility": 0.18, "seasonality": 1},  # highly volatile, cold storage cycles
    "Tomato":     {"base": 2500, "msp": 0,    "volatility": 0.35, "seasonality": 7},  # hyper volatile, monsoon spikes
    "Onion":      {"base": 2000, "msp": 0,    "volatility": 0.28, "seasonality": 10}, # peaks Oct-Nov (storage deplete)
    "Cotton":     {"base": 6800, "msp": 6620, "volatility": 0.08, "seasonality": 10}
}

NEARBY_MANDIS = {
    "Maharashtra": ["Vashi Mandi (Mumbai)", "Pune Mandi", "Nashik Agricultural Market", "Nagpur APMC"],
    "Uttar Pradesh": ["Sahibabad Mandi", "Noida Sector 88 APMC", "Lucknow Mandi", "Kanpur Grain Market"],
    "Punjab": ["Ludhiana APMC", "Amritsar Mandi", "Jalandhar Vegetable Market"],
    "Tamil Nadu": ["Koyambedu Wholesale Market (Chennai)", "Madurai APMC", "Coimbatore Market"]
}

def simulate_price_series(base_price: float, volatility: float, seasonal_phase: int, steps: int, freq: str = "daily") -> List[PricePoint]:
    series = []
    current_date = datetime.date.today()
    
    # Simple AR(1) processes combined with a sinusoidal seasonal wave
    # P_t = P_0 + Seasonal_Wave + Random_Walk
    ar_coef = 0.85
    prev_shock = 0.0
    
    for i in range(steps):
        if freq == "daily":
            step_date = current_date + datetime.timedelta(days=i)
            # Seasonal wave with 365 days period
            angle = (step_date.timetuple().tm_yday / 365.0) * 2.0 * np.pi + (seasonal_phase * np.pi / 6.0)
            wave = np.sin(angle) * (base_price * 0.12)
            noise = (ar_coef * prev_shock) + np.random.normal(0, base_price * volatility * 0.2)
            prev_shock = noise
            predicted = base_price + wave + noise
            ci = predicted * volatility * 0.4 * (1 + (i / 10)) # widening confidence intervals
            date_str = step_date.strftime('%Y-%m-%d')
        else: # monthly
            step_date = current_date + datetime.timedelta(days=i*30)
            # Seasonal wave with 12 months period
            month_index = (step_date.month)
            angle = (month_index / 12.0) * 2.0 * np.pi + (seasonal_phase * np.pi / 6.0)
            wave = np.sin(angle) * (base_price * 0.15)
            noise = np.random.normal(0, base_price * volatility * 0.4)
            predicted = base_price + wave + noise
            ci = predicted * volatility * 0.6 * (1 + (i / 3))
            date_str = step_date.strftime('%B %Y')
            
        predicted = max(base_price * 0.5, round(predicted, 2))
        series.append(PricePoint(
            date=date_str,
            predicted_price=predicted,
            confidence_interval_low=round(max(base_price * 0.4, predicted - ci), 2),
            confidence_interval_high=round(predicted + ci, 2)
        ))
    return series

@router.post("/forecast", response_model=MarketPredictionOutput)
def get_price_forecast(payload: MarketInputSchema):
    crop_info = CROP_MARKET_INDEX.get(payload.crop)
    if not crop_info:
        # Default fallback
        crop_info = {"base": 1800, "msp": 0, "volatility": 0.10, "seasonality": 6}
        
    base = crop_info["base"]
    vol = crop_info["volatility"]
    phase = crop_info["seasonality"]
    
    # Current Stats
    today = datetime.date.today()
    angle_today = (today.timetuple().tm_yday / 365.0) * 2.0 * np.pi + (phase * np.pi / 6.0)
    current_price = round(base + np.sin(angle_today) * (base * 0.12) + np.random.normal(0, base * vol * 0.05), 2)
    
    # Generate Forecasts
    daily = simulate_price_series(base, vol, phase, 10, "daily")
    monthly = simulate_price_series(base, vol, phase, 6, "monthly")
    
    # Overwrite index 0 to match exactly current price
    daily[0].predicted_price = current_price
    
    # Determine Demand and Supply
    demand_options = ["High", "Medium", "Low"]
    supply_options = ["High", "Medium", "Low"]
    
    # Logic matching seasonal cycle
    sin_val = np.sin(angle_today)
    if sin_val > 0.4:
        demand = "High"
        supply = "Low"
        sell_advice = "Sell Now! Markets are currently peaking with strong demand and lower storage reserves."
        storage = "No storage recommended. Capitalize on existing peak prices immediately."
    elif sin_val < -0.4:
        demand = "Low"
        supply = "High"
        sell_advice = "Defer sale. Prices are seasonally low due to harvest supply floods."
        storage = "Store crop for 6-8 weeks until warehouse supplies normalize and prices rise 15-20%."
    else:
        demand = "Medium"
        supply = "Medium"
        sell_advice = "Staggered selling. Sell 50% now and store the remainder."
        storage = "Short-term storage (2-3 weeks) recommended to wait for slight local market bumps."

    # Best Market finding
    state_mandis = NEARBY_MANDIS.get(payload.state, [f"{payload.district} Central Market", "State Agro APMC Hub"])
    
    nearby = []
    highest_price = 0
    best_mandi = state_mandis[0]
    
    for i, mandi in enumerate(state_mandis):
        mandi_price = round(current_price * random.uniform(0.96, 1.07), 2)
        dist = random.uniform(8.0, 45.0)
        transport_cost = round(dist * 2.5 * 10, 2) # Rs per Quintal approximate
        net_profit = mandi_price - transport_cost
        
        nearby.append({
            "market_name": mandi,
            "distance_km": round(dist, 1),
            "price_per_quintal": mandi_price,
            "transport_cost_per_quintal": transport_cost,
            "net_payback_per_quintal": round(net_profit, 2)
        })
        
        if net_profit > highest_price:
            highest_price = net_profit
            best_mandi = mandi
            
    return MarketPredictionOutput(
        crop=payload.crop,
        current_price=current_price,
        msp=crop_info["msp"],
        demand_level=demand,
        supply_level=supply,
        best_selling_time=sell_advice,
        best_market=best_mandi,
        storage_recommendation=storage,
        forecast_daily=daily,
        forecast_monthly=monthly,
        nearby_markets=nearby
    )
