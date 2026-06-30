from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sqlalchemy.orm import Session
from app.database import get_db, CropRecommendation
import json

router = APIRouter()

# Input Schema
class CropRecInputSchema(BaseModel):
    country: str = "India"
    state: str
    district: str
    taluk: Optional[str] = None
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    season: str  # Kharif, Rabi, Zaid, Year-round
    farm_area: float = Field(..., gt=0)
    soil_type: str  # Alluvial, Black, Red, Laterite, Clayey, Sandy
    soil_texture: Optional[str] = "Loamy"
    soil_color: Optional[str] = "Brown"
    soil_ph: float = Field(..., ge=0, le=14)
    nitrogen: float = Field(..., ge=0)
    phosphorus: float = Field(..., ge=0)
    potassium: float = Field(..., ge=0)
    organic_carbon: Optional[float] = 0.5
    temperature: float
    humidity: float
    rainfall: float
    wind_speed: Optional[float] = 12.0
    solar_radiation: Optional[float] = 200.0
    groundwater_level: Optional[float] = 15.0
    water_availability: str  # High, Medium, Low
    previous_crop: Optional[str] = "None"
    crop_rotation: Optional[bool] = True
    budget: float
    expected_profit: Optional[float] = None
    market_demand: Optional[str] = "High"
    storage_availability: Optional[bool] = True
    farmer_experience: Optional[int] = 5  # in years

# Output Schemas
class CropDetail(BaseModel):
    rank: int
    crop: str
    confidence: float
    expected_yield: float  # tons per acre
    growing_duration: int  # days
    estimated_profit: float  # INR per acre
    water_requirement: float  # mm
    seed_requirement: float  # kg/acre
    fertilizer_schedule: List[str]
    harvest_time: str
    disease_risk: str  # Low, Medium, High
    major_diseases: List[str]
    insurance_plan: str
    subsidy_info: str

class CropRecOutputSchema(BaseModel):
    status: str
    recommendations: List[CropDetail]

# Dynamic Dataset and Model Training
# We train a RandomForestClassifier on crop parameters
CROPS = ["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Groundnut", "Millets", "Tomato", "Potato", "Onion", "Coconut", "Mango"]

# Define optimal parameters (N, P, K, pH, Temp, Humidity, Rainfall) for training data generation
CROP_OPTIMALS = {
    "Rice":       {"N": 80,  "P": 40, "K": 40, "pH": 6.2, "temp": 27, "hum": 82, "rain": 1200},
    "Wheat":      {"N": 120, "P": 60, "K": 40, "pH": 6.8, "temp": 18, "hum": 60, "rain": 600},
    "Maize":      {"N": 100, "P": 50, "K": 40, "pH": 6.5, "temp": 24, "hum": 70, "rain": 800},
    "Cotton":     {"N": 100, "P": 50, "K": 50, "pH": 7.5, "temp": 28, "hum": 65, "rain": 750},
    "Sugarcane":  {"N": 150, "P": 80, "K": 80, "pH": 6.8, "temp": 28, "hum": 75, "rain": 1800},
    "Groundnut":  {"N": 40,  "P": 50, "K": 50, "pH": 6.0, "temp": 25, "hum": 72, "rain": 700},
    "Millets":    {"N": 50,  "P": 30, "K": 30, "pH": 7.0, "temp": 30, "hum": 55, "rain": 400},
    "Tomato":     {"N": 90,  "P": 60, "K": 60, "pH": 6.3, "temp": 22, "hum": 68, "rain": 700},
    "Potato":     {"N": 120, "P": 80, "K": 100, "pH": 5.8, "temp": 17, "hum": 72, "rain": 500},
    "Onion":      {"N": 100, "P": 50, "K": 80, "pH": 6.7, "temp": 20, "hum": 65, "rain": 550},
    "Coconut":    {"N": 60,  "P": 40, "K": 120, "pH": 6.5, "temp": 27, "hum": 80, "rain": 1600},
    "Mango":      {"N": 80,  "P": 60, "K": 80, "pH": 6.4, "temp": 28, "hum": 62, "rain": 1100}
}

def train_crop_model():
    data = []
    for crop, opts in CROP_OPTIMALS.items():
        # Generate 50 sample points per crop with normal noise
        for _ in range(50):
            n = max(0, int(np.random.normal(opts["N"], 15)))
            p = max(0, int(np.random.normal(opts["P"], 10)))
            k = max(0, int(np.random.normal(opts["K"], 15)))
            ph = max(3.5, min(9.5, np.random.normal(opts["pH"], 0.4)))
            temp = np.random.normal(opts["temp"], 3)
            hum = max(10, min(100, np.random.normal(opts["hum"], 8)))
            rain = max(100, np.random.normal(opts["rain"], 150))
            data.append([n, p, k, ph, temp, hum, rain, crop])
            
    df = pd.DataFrame(data, columns=["N", "P", "K", "pH", "temp", "hum", "rain", "label"])
    X = df.drop("label", axis=1)
    y = df["label"]
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    return model

# Train the model once on module loading
crop_model = train_crop_model()

# Helper crop details metadata
CROP_METADATA = {
    "Rice": {
        "yield": 2.2, "duration": 120, "profit": 35000, "water": 1200, "seeds": 20,
        "fertilizer": ["Week 1: Basal N-P-K (20-40-40 kg/acre)", "Week 4: Urea Top Dressing (30 kg/acre)", "Week 8: Urea Top Dressing (30 kg/acre)"],
        "harvest": "October - November", "diseases": ["Blast", "Bacterial Leaf Blight", "Brown Spot"],
        "insurance": "PM Fasal Bima Yojana - Kharif Rice Protection Plan",
        "subsidy": "National Food Security Mission - Certified Seed Subsidy (50% off)"
    },
    "Wheat": {
        "yield": 1.8, "duration": 130, "profit": 42000, "water": 450, "seeds": 40,
        "fertilizer": ["Week 1: Basal N-P-K (40-60-40 kg/acre)", "Week 5: First Irrigation Nitrogen Top Dressing (40 kg/acre)", "Week 9: Second Nitrogen Top Dressing (40 kg/acre)"],
        "harvest": "March - April", "diseases": ["Rust", "Loose Smut", "Powdery Mildew"],
        "insurance": "PM Fasal Bima Yojana - Rabi Wheat Yield Protection",
        "subsidy": "Rashtriya Krishi Vikas Yojana - Fertilizer Subsidy & Seed Subsidy"
    },
    "Maize": {
        "yield": 2.5, "duration": 100, "profit": 28000, "water": 600, "seeds": 8,
        "fertilizer": ["Week 1: Basal N-P-K (30-60-40 kg/acre)", "Week 4: Urea Top Dressing (40 kg/acre)", "Week 7: Potash + Urea Top Dressing (30 kg/acre)"],
        "harvest": "September - October", "diseases": ["Turcicum Leaf Blight", "Common Rust", "Downy Mildew"],
        "insurance": "Weather Based Crop Insurance Scheme (WBCIS) - Maize",
        "subsidy": "Integrated Scheme of Oilseeds, Pulses, Oil Palm and Maize (ISOPOM) Subsidy"
    },
    "Cotton": {
        "yield": 1.1, "duration": 160, "profit": 55000, "water": 800, "seeds": 2.5,
        "fertilizer": ["Week 1: Basal N-P-K (30-50-50 kg/acre)", "Week 6: Nitrogen Top Dressing (35 kg/acre)", "Week 12: Potash + Nitrogen Spray (20 kg/acre)"],
        "harvest": "November - January", "diseases": ["Bollworm", "Fusarium Wilt", "Root Rot"],
        "insurance": "Agri-Enterprise Cotton Crop Insurance Policy",
        "subsidy": "Technology Mission on Cotton - Drip Irrigation Installation Subsidy (80%)"
    },
    "Sugarcane": {
        "yield": 35.0, "duration": 360, "profit": 95000, "water": 1800, "seeds": 2000, # setts
        "fertilizer": ["Week 1: Basal N-P-K (75-100-100 kg/acre)", "Week 8: Nitrogen Split (75 kg/acre)", "Week 16: Nitrogen Top Dressing & Earthing Up (100 kg/acre)"],
        "harvest": "December - March", "diseases": ["Red Rot", "Smut", "Wilt"],
        "insurance": "Commercial Crop Insurance - Sugarcane Security Standard",
        "subsidy": "State Sugarcane Development Scheme - Organic Compost & Micro-irrigation Subsidy"
    },
    "Groundnut": {
        "yield": 1.2, "duration": 110, "profit": 38000, "water": 500, "seeds": 35,
        "fertilizer": ["Week 1: Basal N-P-K (10-40-40 kg/acre) + Gypsum (100 kg/acre)", "Week 4: Earthing Up - Gypsum Application (100 kg/acre)"],
        "harvest": "October - November", "diseases": ["Tikka Leaf Spot", "Rust", "Collar Rot"],
        "insurance": "PM Fasal Bima Yojana - Groundnut Insurance Scheme",
        "subsidy": "NFSM-Oilseeds Sub-Mission - Seed Drilling Implement Subsidy"
    },
    "Millets": {
        "yield": 0.9, "duration": 90, "profit": 20000, "water": 350, "seeds": 4,
        "fertilizer": ["Week 1: Basal N-P-K (20-20-20 kg/acre)", "Week 4: Nitrogen Top Dressing (20 kg/acre)"],
        "harvest": "August - September", "diseases": ["Downy Mildew", "Ergot", "Smut"],
        "insurance": "Drought-Resilient Crop Insurance Plan",
        "subsidy": "National Millet Mission - Millets Cultivation Incentive Program"
    },
    "Tomato": {
        "yield": 8.0, "duration": 110, "profit": 60000, "water": 600, "seeds": 0.15,
        "fertilizer": ["Week 1: Basal N-P-K (30-60-60 kg/acre)", "Week 4: Calcium Nitrate + Boron Spray", "Week 8: N-P-K Top Dressing (30-0-30 kg/acre)"],
        "harvest": "Multiple pickings over 60 days", "diseases": ["Early Blight", "Late Blight", "Tomato Leaf Curl Virus"],
        "insurance": "Horticulture Crop Insurance Scheme - Tomato Protection Plan",
        "subsidy": "Mission for Integrated Development of Horticulture (MIDH) - Polyhouse Subsidy"
    },
    "Potato": {
        "yield": 10.0, "duration": 100, "profit": 75000, "water": 500, "seeds": 600,
        "fertilizer": ["Week 1: Basal N-P-K (60-100-120 kg/acre) + Micronutrient Mix", "Week 5: Nitrogen Top Dressing & Earthing Up (60 kg/acre)"],
        "harvest": "February - March", "diseases": ["Late Blight", "Early Blight", "Black Scurf"],
        "insurance": "Rabi Cold-Chain Potato Yield Insurance",
        "subsidy": "MIDH - Cold Storage Infrastructure Subsidy & Seed Potato Subsidy"
    },
    "Onion": {
        "yield": 7.5, "duration": 120, "profit": 65000, "water": 450, "seeds": 4,
        "fertilizer": ["Week 1: Basal N-P-K (30-50-80 kg/acre) + Sulphur (15 kg/acre)", "Week 4: Urea Top Dressing (30 kg/acre)", "Week 6: Potassium Sulphate spray"],
        "harvest": "March - May", "diseases": ["Purple Blotch", "Downy Mildew", "Onion Smut"],
        "insurance": "PMFBY - Horticultural Onion Risk Coverage",
        "subsidy": "Agri-Infrastructure Fund - Onion Storage Structure (Chawl) Subsidy (50%)"
    },
    "Coconut": {
        "yield": 6.0, "duration": 365, "profit": 80000, "water": 1500, "seeds": 70, # seedlings
        "fertilizer": ["Bi-Annual: Organic Manure (50kg/palm) + N-P-K (500g-320g-1200g/palm/year) in two split doses"],
        "harvest": "Every 45 days throughout the year", "diseases": ["Bud Rot", "Stem Bleeding", "Root Wilt"],
        "insurance": "Coconut Palm Insurance Scheme (CPIS)",
        "subsidy": "Coconut Development Board - New Plantation Subsidy (25% off costs)"
    },
    "Mango": {
        "yield": 4.5, "duration": 365, "profit": 70000, "water": 900, "seeds": 40, # grafts
        "fertilizer": ["Pre-monsoon: Farmyard Manure (50kg) + N-P-K (1kg-1kg-1.5kg per tree for >10yr old)", "Post-monsoon: Micronutrient spray"],
        "harvest": "April - June", "diseases": ["Powdery Mildew", "Anthracnose", "Dieback"],
        "insurance": "Weather Based Crop Insurance - Mango Flower and Fruit Set Cover",
        "subsidy": "National Horticulture Mission - High Density Orchards Subsidy (40%)"
    }
}

@router.post("/recommend", response_model=CropRecOutputSchema)
def recommend_crops(payload: CropRecInputSchema, db: Session = Depends(get_db)):
    # Prepare model input features
    features = np.array([[
        payload.nitrogen,
        payload.phosphorus,
        payload.potassium,
        payload.soil_ph,
        payload.temperature,
        payload.humidity,
        payload.rainfall
    ]])
    
    try:
        # Predict class probabilities
        probs = crop_model.predict_proba(features)[0]
        classes = crop_model.classes_
        
        # Zip and sort by probability descending
        recommendations_raw = sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)
        
        # Assemble recommendations output
        recs = []
        rank = 1
        
        for crop_name, confidence in recommendations_raw:
            # Map default metadata
            meta = CROP_METADATA.get(crop_name, {
                "yield": 1.5, "duration": 120, "profit": 30000, "water": 600, "seeds": 10,
                "fertilizer": ["N-P-K standard dosage"], "harvest": "Winter", "diseases": ["Leaf Spot"],
                "insurance": "Standard PMFBY Cover", "subsidy": "National Agricultural Subsidy"
            })
            
            # Calibrate yield based on organic carbon and rainfall
            carbon_factor = 1.0 + (payload.organic_carbon - 0.5) * 0.2
            rain_factor = 1.0 - abs(payload.rainfall - CROP_OPTIMALS.get(crop_name, {}).get("rain", payload.rainfall)) / 3000
            rain_factor = max(0.6, min(1.2, rain_factor))
            
            yield_est = round(meta["yield"] * carbon_factor * rain_factor, 2)
            profit_est = round(meta["profit"] * carbon_factor * (1.2 if payload.market_demand == "High" else 0.9), 2)
            
            # Calibrate disease risk based on humidity and previous crop
            risk = "Low"
            if payload.humidity > 80:
                risk = "High" if crop_name in ["Rice", "Tomato", "Potato"] else "Medium"
            elif payload.previous_crop == crop_name:
                risk = "High"  # crop rotation warning
                
            recs.append(CropDetail(
                rank=rank,
                crop=crop_name,
                confidence=round(float(confidence), 3),
                expected_yield=yield_est,
                growing_duration=meta["duration"],
                estimated_profit=profit_est,
                water_requirement=meta["water"],
                seed_requirement=meta["seeds"],
                fertilizer_schedule=meta["fertilizer"],
                harvest_time=meta["harvest"],
                disease_risk=risk,
                major_diseases=meta["diseases"],
                insurance_plan=meta["insurance"],
                subsidy_info=meta["subsidy"]
            ))
            rank += 1
            if rank > 10:  # limit to top 10 as requested
                break
                
        # Store in DB for audit trail
        db_rec = CropRecommendation(
            nitrogen=payload.nitrogen,
            phosphorus=payload.phosphorus,
            potassium=payload.potassium,
            ph=payload.soil_ph,
            temperature=payload.temperature,
            humidity=payload.humidity,
            rainfall=payload.rainfall,
            season=payload.season,
            soil_type=payload.soil_type,
            recommended_crops=json.loads(json.dumps([r.dict() for r in recs]))
        )
        db.add(db_rec)
        db.commit()
        
        return CropRecOutputSchema(status="success", recommendations=recs)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Crop recommendation failure: {str(e)}")
