from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, Farm, TelemetryData
import random

router = APIRouter()

@router.get("/summary/{user_id}")
def get_dashboard_summary(user_id: int, db: Session = Depends(get_db)):
    # 1. Fetch user's farms
    farms = db.query(Farm).filter(Farm.user_id == user_id).all()
    
    # If no farms, create a mock farm for this user so the dashboard works instantly
    if not farms:
        mock_farm = Farm(
            user_id=user_id,
            name="Green Valley Model Farm",
            area=12.5,
            soil_type="Alluvial",
            soil_texture="Loamy",
            soil_color="Dark Brown",
            state="Punjab",
            district="Ludhiana",
            taluk="Ludhiana East",
            village="Gill",
            latitude=30.86,
            longitude=75.86
        )
        db.add(mock_farm)
        db.commit()
        db.refresh(mock_farm)
        farms = [mock_farm]

    # Aggregate statistics
    total_area = sum(f.area for f in farms)
    
    # Latest telemetry (mock or database)
    latest_temp = round(28.5 + random.uniform(-2, 2), 1)
    latest_humidity = round(68.0 + random.uniform(-5, 5), 1)
    latest_soil_moist = round(54.0 + random.uniform(-10, 5), 1)
    latest_ndvi = round(0.72 + random.uniform(-0.05, 0.05), 2)
    
    # Calculate water requirement
    # Base calculation: area * (ETc - Effective Rainfall)
    water_req_liters = round(total_area * 450 * 4047 * 0.1, 2) # approximate daily need in liters
    
    # Market trends summary
    market_trends = [
        {"crop": "Rice", "price": 2250, "trend": "Up", "change_pct": 2.4},
        {"crop": "Wheat", "price": 2320, "trend": "Up", "change_pct": 1.8},
        {"crop": "Tomato", "price": 1800, "trend": "Down", "change_pct": -8.5},
        {"crop": "Onion", "price": 2100, "trend": "Stable", "change_pct": 0.2}
    ]
    
    # Active alerts
    alerts = [
        {"id": 1, "type": "Weather", "severity": "Warning", "title": "Heavy Rainfall Expected", "message": "IMD reports convective cloud buildup. Postpone urea application."},
        {"id": 2, "type": "Disease", "severity": "Critical", "title": "Yellow Rust Outbreak Nearby", "message": "Spotted 5km away in neighboring wheat fields. Inspect crops immediately."}
    ]

    return {
        "user_id": user_id,
        "total_farms": len(farms),
        "total_area_acres": total_area,
        "weather_summary": {
            "temperature_c": latest_temp,
            "humidity_pct": latest_humidity,
            "rainfall_mm": 1.2,
            "wind_speed_kmh": 14.5
        },
        "soil_summary": {
            "average_moisture_pct": latest_soil_moist,
            "average_ndvi": latest_ndvi,
            "water_requirement_liters": water_req_liters
        },
        "crop_health": {
            "status": "Good",
            "excellent_pct": 65,
            "fair_pct": 25,
            "poor_pct": 10
        },
        "financial_summary": {
            "expected_yield_tons": round(total_area * 2.1, 1),
            "expected_profit_inr": round(total_area * 42000, 2),
            "expenses_inr": round(total_area * 12000, 2)
        },
        "market_trends": market_trends,
        "alerts": alerts,
        "farms": [
            {
                "id": f.id,
                "name": f.name,
                "area": f.area,
                "soil_type": f.soil_type,
                "state": f.state,
                "district": f.district,
                "lat": f.latitude,
                "lng": f.longitude
            } for f in farms
        ]
    }
