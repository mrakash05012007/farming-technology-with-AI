from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
from app.config import settings

# Determine DB Engine
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Users Table
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    role = Column(String, default="Farmer")  # Farmer, Agricultural Officer, Scientist, Researcher, Government Officer, etc.
    language = Column(String, default="English")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farms = relationship("Farm", back_populates="owner")

# Farms Table
class Farm(Base):
    __tablename__ = "farms"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    area = Column(Float, nullable=False)  # in acres
    soil_type = Column(String, nullable=True)  # Alluvial, Black, Red, Laterite, etc.
    soil_texture = Column(String, nullable=True)
    soil_color = Column(String, nullable=True)
    state = Column(String, nullable=False)
    district = Column(String, nullable=False)
    taluk = Column(String, nullable=True)
    village = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="farms")
    telemetry = relationship("TelemetryData", back_populates="farm")

# Telemetry Data Table (IoT)
class TelemetryData(Base):
    __tablename__ = "telemetry_data"
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"))
    device_id = Column(String, nullable=False)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    soil_moisture = Column(Float, nullable=True)
    rainfall = Column(Float, nullable=True)
    water_flow_rate = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    farm = relationship("Farm", back_populates="telemetry")

# Crop Recommendation History Table
class CropRecommendation(Base):
    __tablename__ = "crop_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, nullable=True)
    nitrogen = Column(Float)
    phosphorus = Column(Float)
    potassium = Column(Float)
    ph = Column(Float)
    temperature = Column(Float)
    humidity = Column(Float)
    rainfall = Column(Float)
    season = Column(String)
    soil_type = Column(String)
    recommended_crops = Column(JSON)  # Store top 10 recommended crops as JSON list
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# Disease Detection History Table
class DiseaseDetection(Base):
    __tablename__ = "disease_detections"
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, nullable=True)
    crop_type = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    disease_name = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # Low, Medium, High
    confidence = Column(Float, nullable=False)
    affected_percentage = Column(Float, nullable=False)
    symptoms = Column(Text, nullable=True)
    causes = Column(Text, nullable=True)
    organic_treatment = Column(Text, nullable=True)
    chemical_treatment = Column(Text, nullable=True)
    pesticides = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# Market Price History / Prediction Table
class MarketPrice(Base):
    __tablename__ = "market_prices"
    id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String, nullable=False)
    market_name = Column(String, nullable=False)
    state = Column(String, nullable=False)
    price_today = Column(Float, nullable=False)
    price_forecast = Column(JSON, nullable=True)  # Store 7-day, 30-day forecast as JSON
    date = Column(DateTime, default=datetime.datetime.utcnow)

# Expense Tracker Table
class FarmExpense(Base):
    __tablename__ = "farm_expenses"
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, nullable=False)
    category = Column(String, nullable=False)  # Seeds, Fertilizer, Water, Labor, Rent, Pesticides
    amount = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(String, nullable=True)

# Chat History Table
class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    role = Column(String, nullable=False)  # user, assistant
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# Init DB Helper
def init_db():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        # Ignore if tables are already created or being created concurrently
        print(f"Database initialization status: {e}")

