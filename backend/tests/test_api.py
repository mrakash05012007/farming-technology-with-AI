from fastapi.testclient import TestClient
import pytest
from app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_crop_recommendation():
    payload = {
        "state": "Punjab",
        "district": "Ludhiana",
        "season": "Kharif",
        "farm_area": 2.5,
        "soil_type": "Alluvial",
        "soil_ph": 6.5,
        "nitrogen": 80.0,
        "phosphorus": 40.0,
        "potassium": 40.0,
        "organic_carbon": 0.6,
        "temperature": 28.0,
        "humidity": 75.0,
        "rainfall": 1000.0,
        "water_availability": "Medium",
        "budget": 20000.0
    }
    response = client.post("/api/v1/crop-recommendation/recommend", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["recommendations"]) > 0
    assert data["recommendations"][0]["crop"] in ["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Groundnut", "Millets", "Tomato", "Potato", "Onion", "Coconut", "Mango"]

def test_smart_irrigation():
    payload = {
        "crop": "Wheat",
        "growth_stage": "Development",
        "soil_moisture": 45.0,
        "temperature": 24.0,
        "humidity": 60.0,
        "wind_speed": 10.0,
        "solar_radiation": 18.0,
        "rainfall": 0.0,
        "groundwater_depth": 10.0,
        "reservoir_level: ": 70.0,
        "reservoir_level": 70.0,
        "irrigation_method": "Drip"
    }
    response = client.post("/api/v1/irrigation/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "evapotranspiration_et0" in data
    assert "crop_water_need_etc" in data
    assert "net_irrigation_needed_liters_per_acre" in data

def test_market_price_forecast():
    payload = {
        "crop": "Wheat",
        "state": "Punjab",
        "district": "Ludhiana"
    }
    response = client.post("/api/v1/market-price/forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "Wheat"
    assert len(data["forecast_daily"]) == 10
    assert len(data["nearby_markets"]) > 0

def test_weather_intelligence():
    payload = {
        "state": "Punjab",
        "district": "Ludhiana"
    }
    response = client.post("/api/v1/weather/forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "current" in data
    assert len(data["forecast"]) == 7
    assert "alerts" in data
