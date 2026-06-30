from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db

# Import Routers
from app.routers import (
    crop_rec, 
    disease, 
    irrigation, 
    market, 
    weather, 
    satellite, 
    chatbot, 
    iot,
    dashboard
)

# Initialize DB tables
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to AgriVerse AI Enterprise Decision Support API System",
        "version": "1.0.0"
    }

# Register Routers
app.include_router(crop_rec.router, prefix=f"{settings.API_V1_STR}/crop-recommendation", tags=["Crop Recommendation"])
app.include_router(disease.router, prefix=f"{settings.API_V1_STR}/disease-detection", tags=["Disease Detection"])
app.include_router(irrigation.router, prefix=f"{settings.API_V1_STR}/irrigation", tags=["Smart Irrigation"])
app.include_router(market.router, prefix=f"{settings.API_V1_STR}/market-price", tags=["Market Price Forecasting"])
app.include_router(weather.router, prefix=f"{settings.API_V1_STR}/weather", tags=["Weather Intelligence"])
app.include_router(satellite.router, prefix=f"{settings.API_V1_STR}/satellite", tags=["Satellite Analytics"])
app.include_router(chatbot.router, prefix=f"{settings.API_V1_STR}/chatbot", tags=["AI Agricultural Chatbot"])
app.include_router(iot.router, prefix=f"{settings.API_V1_STR}/iot", tags=["IoT Telemetry"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Farm Dashboard"])
