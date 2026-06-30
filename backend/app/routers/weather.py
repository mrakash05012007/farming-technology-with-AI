from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import random
import datetime

router = APIRouter()

class WeatherInputSchema(BaseModel):
    state: str
    district: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class WeatherAlert(BaseModel):
    alert_type: str  # Flood Warning, Cyclone, Heatwave, Cold Wave, Lightning Strike, Heavy Rain
    severity: str  # Critical, Warning, Watch, Info
    message: str
    timestamp: str

class DayForecast(BaseModel):
    date: str
    temp_min: float
    temp_max: float
    humidity: float
    rainfall_mm: float
    condition: str  # Sunny, Rainy, Cloudy, Thunderstorm, Windy

class WeatherOutputSchema(BaseModel):
    current: dict
    forecast: List[DayForecast]
    alerts: List[WeatherAlert]

WEATHER_CONDITIONS = ["Sunny", "Cloudy", "Rainy", "Thunderstorm", "Windy"]

@router.post("/forecast", response_model=WeatherOutputSchema)
def get_weather_forecast(payload: WeatherInputSchema):
    # Base ranges depending on state climate
    state_norm = payload.state.lower()
    
    # Defaults
    base_temp = 28.0
    base_rain = 2.0
    is_coastal = any(x in state_norm for x in ["odisha", "tamil nadu", "andhra", "kerala", "goa", "west bengal", "maharashtra"])
    is_arid = any(x in state_norm for x in ["rajasthan", "gujarat", "madhya"])
    
    if is_arid:
        base_temp = 38.0
        base_rain = 0.1
    elif is_coastal:
        base_temp = 30.0
        base_rain = 8.0
    elif "kashmir" in state_norm or "himachal" in state_norm or "uttarakhand" in state_norm:
        base_temp = 16.0
        base_rain = 4.0
        
    # Current Weather
    current = {
        "temperature": round(base_temp + random.uniform(-2, 2), 1),
        "humidity": round(random.uniform(45, 92), 1) if not is_arid else round(random.uniform(15, 40), 1),
        "pressure": round(random.uniform(995, 1015), 1),
        "wind_speed": round(random.uniform(5, 25), 1),
        "wind_direction": random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
        "solar_radiation": round(random.uniform(150, 320), 1),
        "lightning_index": round(random.uniform(0, 100), 1),
        "ground_temp": round(base_temp + random.uniform(0, 4), 1),
        "timestamp": datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    }
    
    # 7-day forecast
    forecast = []
    today = datetime.date.today()
    for i in range(7):
        day_date = today + datetime.timedelta(days=i)
        temp_min = round(base_temp - random.uniform(4, 8), 1)
        temp_max = round(base_temp + random.uniform(2, 6), 1)
        humidity = round(random.uniform(50, 90), 1) if not is_arid else round(random.uniform(20, 45), 1)
        rainfall = round(max(0.0, base_rain + random.normalvariate(0, 5)), 1)
        
        condition = "Sunny"
        if rainfall > 15.0:
            condition = "Thunderstorm" if random.random() > 0.4 else "Rainy"
        elif rainfall > 2.0:
            condition = "Rainy"
        elif humidity > 75.0:
            condition = "Cloudy"
        elif current["wind_speed"] > 18.0:
            condition = "Windy"
            
        forecast.append(DayForecast(
            date=day_date.strftime('%Y-%m-%d'),
            temp_min=temp_min,
            temp_max=temp_max,
            humidity=humidity,
            rainfall_mm=rainfall,
            condition=condition
        ))
        
    # Trigger Dynamic Alerts
    alerts = []
    
    # Heavy Rain & Flood warning logic
    if any(f.rainfall_mm > 40.0 for f in forecast):
        alerts.append(WeatherAlert(
            alert_type="Flood Warning",
            severity="Critical",
            message=f"Intense precipitation forecast (>40mm/day). Low-lying drainage sectors in {payload.district} district are at high risk of waterlogging.",
            timestamp=datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        ))
        
    # Cyclone Alert for coastal states
    if is_coastal and current["wind_speed"] > 20.0 and random.random() > 0.6:
        alerts.append(WeatherAlert(
            alert_type="Cyclone Warning",
            severity="Warning",
            message="Depression in Bay of Bengal / Arabian Sea detected. Wind speeds projected to increase. Fishermen and coastal farmers advised to secure equipment.",
            timestamp=datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        ))
        
    # Heatwave logic
    if current["temperature"] > 40.0:
        alerts.append(WeatherAlert(
            alert_type="Heatwave Alert",
            severity="Warning",
            message="Extreme solar insulation and ambient temperatures above 40 C. Risk of crop heat stress and high evapotranspiration rates. Increase irrigation frequency.",
            timestamp=datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        ))
        
    # Lightning Strike alert
    if current["lightning_index"] > 70.0:
        alerts.append(WeatherAlert(
            alert_type="Lightning Warning",
            severity="Watch",
            message="High convective activity and atmospheric charge buildup. Potential lightning strikes in agricultural fields. Avoid standing under tall trees or near metal machinery.",
            timestamp=datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        ))
        
    return WeatherOutputSchema(
        current=current,
        forecast=forecast,
        alerts=alerts
    )
