from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import math

router = APIRouter()

class IrrigationInputSchema(BaseModel):
    crop: str
    growth_stage: str  # Initial, Development, Mid-season, Late-season
    soil_moisture: float = Field(..., ge=0, le=100)  # in %
    temperature: float
    min_temperature: Optional[float] = None
    max_temperature: Optional[float] = None
    humidity: float
    wind_speed: float
    solar_radiation: float  # MJ/m2/day
    rainfall: float  # mm
    groundwater_depth: float  # meters
    reservoir_level: float  # % capacity
    irrigation_method: str = "Drip" # Drip, Sprinkler, Flood, Subsurface

class IrrigationOutputSchema(BaseModel):
    evapotranspiration_et0: float  # mm/day
    crop_water_need_etc: float  # mm/day
    net_irrigation_needed_mm: float
    net_irrigation_needed_liters_per_acre: float
    best_irrigation_time: str
    schedule: dict
    water_stress_status: str  # Critical, Warning, Optimal, Saturation
    risks: List[str]
    method_efficiency: float
    recommendations: List[str]

# Crop Coefficients (Kc) based on crop and growth stage (FAO-56 guidelines)
KC_VALUES = {
    "Rice":       {"Initial": 1.05, "Development": 1.15, "Mid-season": 1.20, "Late-season": 0.90},
    "Wheat":      {"Initial": 0.30, "Development": 0.70, "Mid-season": 1.15, "Late-season": 0.40},
    "Maize":      {"Initial": 0.30, "Development": 0.75, "Mid-season": 1.20, "Late-season": 0.60},
    "Cotton":     {"Initial": 0.35, "Development": 0.75, "Mid-season": 1.15, "Late-season": 0.70},
    "Sugarcane":  {"Initial": 0.40, "Development": 0.85, "Mid-season": 1.25, "Late-season": 0.75},
    "Groundnut":  {"Initial": 0.40, "Development": 0.80, "Mid-season": 1.15, "Late-season": 0.60},
    "Tomato":     {"Initial": 0.60, "Development": 0.85, "Mid-season": 1.15, "Late-season": 0.80},
    "Potato":     {"Initial": 0.50, "Development": 0.75, "Mid-season": 1.15, "Late-season": 0.75},
    "Onion":      {"Initial": 0.70, "Development": 0.90, "Mid-season": 1.05, "Late-season": 0.75}
}

IRRIGATION_EFFICIENCIES = {
    "Drip": 0.90,
    "Sprinkler": 0.75,
    "Flood": 0.50,
    "Subsurface": 0.95
}

@router.post("/calculate", response_model=IrrigationOutputSchema)
def calculate_irrigation(payload: IrrigationInputSchema):
    # 1. Estimate Evapotranspiration (ET0) using Hargreaves-Samani Equation
    # ET0 = 0.0023 * Ra * (Tmean + 17.8) * (Tmax - Tmin)**0.5
    # Since Ra (Extraterrestrial Radiation) depends on latitude and date, we approximate Ra using Solar Radiation (MJ/m2/day)
    # Ra is usually 2.0 to 2.5 times Solar Radiation reaching ground due to atmosphere attenuation
    t_min = payload.min_temperature if payload.min_temperature is not None else (payload.temperature - 5.0)
    t_max = payload.max_temperature if payload.max_temperature is not None else (payload.temperature + 5.0)
    t_mean = (t_max + t_min) / 2.0
    t_range = max(1.0, t_max - t_min)
    
    # Hargreaves formula coefficient
    ra_approx = payload.solar_radiation * 2.1
    et0 = 0.0023 * (ra_approx * 0.408) * (t_mean + 17.8) * math.sqrt(t_range)
    et0 = max(0.5, round(et0, 2))
    
    # 2. Get Crop Coefficient (Kc)
    crop_kc_map = KC_VALUES.get(payload.crop, {"Initial": 0.5, "Development": 0.8, "Mid-season": 1.0, "Late-season": 0.6})
    kc = crop_kc_map.get(payload.growth_stage, 0.8)
    
    # 3. Calculate Crop Water Need (ETc)
    etc = round(et0 * kc, 2)
    
    # 4. Calculate Net Irrigation needed
    # Effective Rainfall (simplified USDA SCS method)
    if payload.rainfall > 8.3:
        effective_rain = (payload.rainfall * 0.6) - 10.0
    else:
        effective_rain = payload.rainfall * 0.8
    effective_rain = max(0.0, effective_rain)
    
    net_irrigation = max(0.0, etc - effective_rain)
    
    # Convert mm/day to Liters/acre: 1 mm over 1 acre = 4,047 Liters
    efficiency = IRRIGATION_EFFICIENCIES.get(payload.irrigation_method, 0.75)
    gross_irrigation_mm = net_irrigation / efficiency
    liters_needed = round(gross_irrigation_mm * 4047.0, 2)
    
    # Determine Water Stress status and Risks
    water_stress = "Optimal"
    risks = []
    recs = []
    
    # Check soil moisture
    if payload.soil_moisture < 35:
        water_stress = "Critical"
        risks.append("Severe Soil Moisture Depletion (Drought Risk)")
        recs.append("Immediate water application required to prevent permanent wilting.")
    elif payload.soil_moisture < 50:
        water_stress = "Warning"
        risks.append("Moderate Under-irrigation / Crop Stress")
        recs.append("Schedule irrigation within the next 24 hours.")
    elif payload.soil_moisture > 85:
        water_stress = "Saturation"
        risks.append("Root Zone Anoxia / Waterlogging (Flood Risk)")
        recs.append("Suspend all irrigation immediately. Enhance drainage vectors.")
    else:
        # Check groundwater levels
        if payload.groundwater_depth > 30:
            risks.append("Deep Groundwater Depletion")
            recs.append("Promote rainwater harvesting; avoid excessive pumping.")
            
    if payload.reservoir_level < 20:
        risks.append("Critical Reservoir Supply Shortage")
        recs.append("Shift to strict deficit irrigation cycles.")
        
    # Schedule Distribution
    best_time = "Morning (05:00 - 08:00 AM)"
    if payload.temperature > 32:
        best_time = "Night (09:00 PM - Midnight)"  # avoid high evapotranspiration losses during day
        recs.append("High diurnal temperatures detected. Irrigate at night/evening to reduce evaporative drift.")
        
    # Split schedule allocation
    morning_split = 0.0
    evening_split = 0.0
    night_split = 0.0
    
    if liters_needed > 0:
        if best_time.startswith("Morning"):
            morning_split = round(liters_needed * 0.7, 2)
            evening_split = round(liters_needed * 0.3, 2)
        else:
            night_split = round(liters_needed * 0.7, 2)
            evening_split = round(liters_needed * 0.3, 2)
            
    schedule = {
        "morning": {"active": morning_split > 0, "quantity_liters": morning_split},
        "evening": {"active": evening_split > 0, "quantity_liters": evening_split},
        "night": {"active": night_split > 0, "quantity_liters": night_split}
    }
    
    # Generic advice
    recs.append(f"Using {payload.irrigation_method} irrigation achieves {int(efficiency*100)}% field application efficiency.")
    if payload.irrigation_method == "Flood":
        recs.append("High risk of water waste. Upgrading to Drip or Sprinklers could save up to 40% water.")

    return IrrigationOutputSchema(
        evapotranspiration_et0=et0,
        crop_water_need_etc=etc,
        net_irrigation_needed_mm=round(gross_irrigation_mm, 2),
        net_irrigation_needed_liters_per_acre=liters_needed,
        best_irrigation_time=best_time,
        schedule=schedule,
        water_stress_status=water_stress,
        risks=risks,
        method_efficiency=efficiency,
        recommendations=recs
    )
