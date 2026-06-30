from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.database import get_db, TelemetryData
import datetime
import random

router = APIRouter()

class TelemetryInputSchema(BaseModel):
    farm_id: int
    device_id: str
    temperature: float
    humidity: float
    soil_moisture: float
    rainfall: float
    water_flow_rate: float

class PumpControlInput(BaseModel):
    farm_id: int
    device_id: str
    action: str  # ON, OFF
    flow_rate_limit: float = 12.5

@router.post("/telemetry")
def post_telemetry(payload: TelemetryInputSchema, db: Session = Depends(get_db)):
    db_tel = TelemetryData(
        farm_id=payload.farm_id,
        device_id=payload.device_id,
        temperature=payload.temperature,
        humidity=payload.humidity,
        soil_moisture=payload.soil_moisture,
        rainfall=payload.rainfall,
        water_flow_rate=payload.water_flow_rate
    )
    db.add(db_tel)
    db.commit()
    db.refresh(db_tel)
    return {
        "status": "success",
        "timestamp": db_tel.timestamp,
        "message": f"Telemetry received from node {payload.device_id}"
    }

@router.get("/history/{farm_id}", response_model=List[dict])
def get_telemetry_history(farm_id: int, db: Session = Depends(get_db)):
    # Fetch latest 20 telemetry entries for charting
    records = db.query(TelemetryData)\
                .filter(TelemetryData.farm_id == farm_id)\
                .order_by(TelemetryData.timestamp.desc())\
                .limit(20)\
                .all()
                
    # If no records exist, generate mock records so the UI is immediately interactive
    if not records:
        mock_data = []
        base_time = datetime.datetime.utcnow()
        for i in range(20):
            time_point = base_time - datetime.timedelta(minutes=i * 15)
            mock_data.append({
                "id": i + 1,
                "farm_id": farm_id,
                "device_id": "ESP32_NODE_01",
                "temperature": round(26.0 + random.uniform(-2, 2), 1),
                "humidity": round(72.0 + random.uniform(-5, 5), 1),
                "soil_moisture": round(48.0 - (i * 0.8) + random.uniform(-1, 1), 1), # drying curve
                "rainfall": 0.0,
                "water_flow_rate": 0.0 if i > 5 else 12.0, # simulating pump turned on recently
                "timestamp": time_point.strftime('%Y-%m-%dT%H:%M:%SZ')
            })
        return mock_data
        
    return [
        {
            "id": r.id,
            "farm_id": r.farm_id,
            "device_id": r.device_id,
            "temperature": r.temperature,
            "humidity": r.humidity,
            "soil_moisture": r.soil_moisture,
            "rainfall": r.rainfall,
            "water_flow_rate": r.water_flow_rate,
            "timestamp": r.timestamp.strftime('%Y-%m-%dT%H:%M:%SZ')
        } for r in records
    ]

@router.post("/control-pump")
def control_pump(payload: PumpControlInput):
    # Simulate signal delivery to ESP32 / Arduino relay
    status_msg = f"Command sent to gateway. Relay {payload.action} triggered for device {payload.device_id}."
    return {
        "status": "success",
        "device_id": payload.device_id,
        "pump_state": payload.action,
        "flow_rate_limit": payload.flow_rate_limit,
        "execution_timestamp": datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        "log": status_msg
    }
