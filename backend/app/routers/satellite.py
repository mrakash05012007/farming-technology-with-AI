from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import random

router = APIRouter()

class SatelliteInputSchema(BaseModel):
    latitude: float
    longitude: float
    radius_meters: Optional[float] = 500.0

class IndexTimeSeriesPoint(BaseModel):
    date: str
    ndvi: float
    ndwi: float
    evi: float

class SatelliteAnalysisResponse(BaseModel):
    latitude: float
    longitude: float
    field_boundary_geojson: Dict[str, Any]
    crop_health_status: str  # Excellent, Good, Fair, Poor
    average_ndvi: float
    average_ndwi: float
    average_evi: float
    cloud_cover_percentage: float
    land_cover_type: str  # Cropland, Forest, Shrubland, Water, Urban
    change_detected: bool
    time_series: List[IndexTimeSeriesPoint]

@router.post("/analyze", response_model=SatelliteAnalysisResponse)
def analyze_satellite_data(payload: SatelliteInputSchema):
    # Simulating Sentinel-2/Landsat-8 analytics around the coordinates
    lat = payload.latitude
    lon = payload.longitude
    
    # Generate a mock field boundary polygon (GeoJSON) around the coordinate
    # Let's make a small rectangle/polygon
    d = 0.002 # offset
    coordinates = [
        [lon - d, lat - d],
        [lon + d, lat - d],
        [lon + d * 1.2, lat + d * 0.8],
        [lon - d * 0.8, lat + d * 1.1],
        [lon - d, lat - d] # closed loop
    ]
    
    geojson = {
        "type": "Feature",
        "properties": {
            "name": "Farm Boundary",
            "area_acres": round(random.uniform(5.0, 25.0), 2),
            "soil_organic_matter": "2.4%"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [coordinates]
        }
    }
    
    # Generate index time series (last 6 months)
    import datetime
    time_series = []
    today = datetime.date.today()
    
    # Simulating growth curve (e.g., NDVI rises then falls before harvest)
    base_ndvi = 0.3
    base_ndwi = 0.2
    base_evi = 0.15
    
    for i in range(6):
        month_offset = (5 - i) * 30
        date_point = today - datetime.timedelta(days=month_offset)
        
        # Bell curve simulation for crop season
        x = i / 5.0  # 0 to 1
        season_curve = math_bell_curve(x)
        
        ndvi_val = round(base_ndvi + 0.5 * season_curve + random.uniform(-0.05, 0.05), 3)
        ndwi_val = round(base_ndwi + 0.3 * season_curve + random.uniform(-0.04, 0.04), 3)
        evi_val = round(base_evi + 0.4 * season_curve + random.uniform(-0.03, 0.03), 3)
        
        time_series.append(IndexTimeSeriesPoint(
            date=date_point.strftime("%B %Y"),
            ndvi=max(0.0, min(1.0, ndvi_val)),
            ndwi=max(-1.0, min(1.0, ndwi_val)),
            evi=max(0.0, min(1.0, evi_val))
        ))
        
    latest = time_series[-1]
    
    status = "Good"
    if latest.ndvi > 0.7:
        status = "Excellent"
    elif latest.ndvi > 0.5:
        status = "Good"
    elif latest.ndvi > 0.3:
        status = "Fair"
    else:
        status = "Poor"
        
    return SatelliteAnalysisResponse(
        latitude=lat,
        longitude=lon,
        field_boundary_geojson=geojson,
        crop_health_status=status,
        average_ndvi=latest.ndvi,
        average_ndwi=latest.ndwi,
        average_evi=latest.evi,
        cloud_cover_percentage=round(random.uniform(0.0, 12.5), 2),
        land_cover_type="Cropland",
        change_detected=random.choice([True, False]),
        time_series=time_series
    )

def math_bell_curve(x: float) -> float:
    # returns value between 0 and 1 with peak at x=0.6
    return math_exponential_bell(x, 0.6, 0.25)

def math_exponential_bell(x: float, mu: float, sig: float) -> float:
    import math
    return math.exp(-0.5 * (((x - mu) / sig) ** 2))
